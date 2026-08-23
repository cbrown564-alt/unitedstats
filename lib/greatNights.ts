import { matchById, eventsForMatch, type MatchRow } from "./queries";
import { onThisDay, monthDayLabel } from "./onThisDay";
import { clubRecords } from "./trails";
import { getDb } from "./db";
import { scoreline, scoreNote, fmtRound, resultTone } from "./format";
import { CURATED_NIGHTS } from "./curatedNights";
import {
  dayOfYear,
  monthDayOfDate,
  type GreatNight,
  type HomepageNightCatalog,
} from "./greatNightSelect";

export type { GreatNight, HomepageNightCatalog } from "./greatNightSelect";

// TEMP (front-door design iteration): pin one night so the hero treatment can be
// judged on the flagship rather than whatever falls today. Set to null to ship —
// the served night then resolves normally (on-this-day, else the rotating pool).
const PINNED_ID: string | null = null;

// The match-winner portraits we have are modern (often post-career / management
// era) — anachronistic to the night, and a wrong-era face reads worse than none
// (see docs/HOMEPAGE.md, the imagery problem). Off until we have period-correct or
// match-moment imagery; the hero falls back to the ghosted-year monument.
const USE_WINNER_PORTRAIT = false;

/**
 * The first-contact spark (CONTEXT.md §6): a single *served* match-night that
 * fires before the visitor acts — a real night, rendered with enough texture to
 * land even on someone who never saw it. Two-tier selection keeps a spark on the
 * screen every load:
 *
 *   1. **On this day** — if the day's most significant match clears a spectacle
 *      floor (a final/semi, a European night, a rout, late drama, a comeback), it
 *      leads, framed to the calendar — the thing a live-score app structurally
 *      can't show.
 *   2. **A great United night** — otherwise the lead is dealt from CURATED_NIGHTS,
 *      a hand-trimmed pool of canonical nights, each guaranteed to land.
 *
 * The re-roll (`↻ another night`) always walks the curated pool. Selection is
 * deterministic (day-of-year), never behavioural — the static guardrail holds, so
 * a shared link or a no-JS visit shows the same night the server picked.
 *
 * Two voices supply the supporting line, by where it can honestly come from:
 *   - **stakes** — one authored Floodlit-Guide line per curated night (the lens).
 *   - **texture** — derived from the record (stoppage-time goals, a half-time
 *     deficit) for an on-this-day night that has no authored line. Instrument
 *     voice; fires only where goal-minute / half-time data exists.
 */
function isFinal(round: string | null): boolean {
  return !!round && /final/i.test(round) && !/semi|quarter/i.test(round);
}

/** A goal that counts for United — open play, a penalty, or an opponent's own
 *  goal — matching the canonical set used on the match page. Note an own goal
 *  carries `player_side = 'opponent'`, so we filter on type, never on side. */
const UNITED_GOAL_TYPES = ["goal", "pen-goal", "own-goal-for"] as const;
const isUnitedGoal = (type: string) => (UNITED_GOAL_TYPES as readonly string[]).includes(type);

/** Recorded United goal minutes for a match, in order — for late-drama texture. */
function unitedGoalMinutes(id: string): { minute: number | null; added_time: number | null }[] {
  return getDb()
    .prepare(
      `SELECT minute, added_time FROM match_events
       WHERE match_id = ? AND type IN ('goal','pen-goal','own-goal-for')
       ORDER BY COALESCE(minute, 999), seq`,
    )
    .all(id) as { minute: number | null; added_time: number | null }[];
}

const NUM_WORD = ["", "One", "Two", "Three", "Four", "Five", "Six"];
const numWord = (n: number): string => NUM_WORD[n] ?? String(n);

/**
 * Matches that must never be served cold as a "great night". The Busby Babes'
 * final fortnight: the two Red Star Belgrade legs (the team's last European tie,
 * the return flight from which crashed at Munich on 6 February 1958), the 5–4 at
 * Highbury (their last league match), and the 7–2 over Bolton inside that window —
 * each freighted enough that a context-free serendipity spark would land wrong.
 * The Babes belong in an authored frame, not the slot machine.
 */
const EXCLUDED = new Set([
  "1958-01-14-red-star-belgrade-h",
  "1958-01-18-bolton-wanderers-h",
  "1958-02-01-arsenal-a",
  "1958-02-05-red-star-belgrade-a",
]);

/**
 * A spark must not open on a defeat or a freighted match, and must carry
 * *intrinsic* drama — drama that lands whoever the opponent was: a final or semi,
 * a half-time deficit overturned, or goals in stoppage time. A big margin is
 * deliberately *not* a qualifier: a rout's spark value depends entirely on the
 * opponent (8–2 Arsenal yes, 5–0 Burton no), which can't be judged cheaply or
 * honestly — so notable routs belong in the curated pool, vouched for by hand,
 * not gambled onto the whole first screen.
 */
function qualifiesAsLead(m: MatchRow): boolean {
  if (m.outcome === "L" || EXCLUDED.has(m.id)) return false;
  const round = (m.round ?? "").toLowerCase();
  if (isFinal(m.round) || /semi/.test(round)) return true;
  if (m.outcome === "W" && m.ht_ga != null && m.ht_gf != null && m.ht_ga - m.ht_gf >= 2) return true; // comeback
  const stoppage = unitedGoalMinutes(m.id).filter((g) => (g.minute ?? 0) >= 90);
  return m.outcome === "W" && stoppage.length >= 2;
}

type Goal = { minute: number | null; added_time: number | null };

/** The derived supporting line for a night with no authored stake — the half-time
 *  deficit if there was one, else stoppage-time goals. Null when neither applies. */
function texture(m: MatchRow, goals: Goal[]): string | null {
  if (m.outcome === "W" && m.ht_ga != null && m.ht_gf != null && m.ht_ga - m.ht_gf >= 2) {
    return `${numWord(m.ht_ga - m.ht_gf)} down at half-time.`;
  }
  if (m.outcome !== "W") return null;
  const stoppage = goals.filter((g) => (g.minute ?? 0) >= 90);
  if (stoppage.length >= 2) return `${numWord(stoppage.length)} goals in stoppage time.`;
  const last = goals[goals.length - 1]?.minute ?? 0;
  if (stoppage.length === 1 && last >= 88 && Math.abs(m.gf - m.ga) <= 1) return "A stoppage-time winner.";
  return null;
}

/** Minute label for a goal — "90+3'", "67'", or "" when unrecorded. */
function minuteText(minute: number | null, added: number | null): string {
  if (minute == null) return "";
  return added ? `${minute}+${added}'` : `${minute}'`;
}

/** The match-winner's portrait (the last United scorer with a *locally cached*
 *  image) — the face that carries the night. Local path only, so next/image needs
 *  no remote-domain config. Null when no cached scorer image exists. */
function winnerImage(playerId: string, name: string): { src: string; name: string } | null {
  const row = getDb()
    .prepare("SELECT local_path AS src FROM player_media WHERE player_id = ?")
    .get(playerId) as { src: string | null } | undefined;
  return row?.src ? { src: row.src, name } : null;
}

/** Build the served-night object from a match row. One events query feeds the
 *  texture line, the scorer list, and the match-winner's portrait. */
function build(m: MatchRow, framing: GreatNight["framing"], stakes: string | null, live: boolean): GreatNight {
  const metaParts = [m.competition_name, fmtRound(m.round), m.stadium_name].filter(Boolean) as string[];
  const goals = eventsForMatch(m.id).filter((e) => isUnitedGoal(e.type));
  const scorers = goals.map((e) => ({ name: e.player_display_name ?? "—", minute: minuteText(e.minute, e.added_time) }));
  const winner = [...goals].reverse().find((e) => e.player_id);
  // The night's shape for the thread monument: every United goal on the match
  // clock, the last flagged as the knot. Only when every goal's minute is on
  // record — otherwise empty, and the hero falls back to the ghosted year.
  const timeline =
    goals.length > 0 && goals.every((e) => e.minute != null)
      ? goals.map((e, i) => ({
          clock: (e.minute as number) + (e.added_time ?? 0),
          label: minuteText(e.minute, e.added_time),
          name: e.player_display_name ?? "—",
          winner: i === goals.length - 1,
        }))
      : [];
  return {
    id: m.id,
    href: `/match/${m.id}`,
    framing,
    live,
    eyebrow: framing === "on-this-day" ? `On this day · ${monthDayLabel(monthDayOf(m.date))}` : "A piece of United history",
    year: m.date.slice(0, 4),
    score: scoreline(m.gf, m.ga),
    scoreSuffix: scoreNote(m.pen_gf != null ? [m.pen_gf, m.pen_ga] : null, !!m.aet),
    opponent: m.opponent_name,
    tone: resultTone(m.outcome),
    meta: metaParts.join(" · "),
    line: stakes ?? texture(m, goals.map((e) => ({ minute: e.minute, added_time: e.added_time }))),
    scorers,
    timeline,
    image: USE_WINNER_PORTRAIT && winner?.player_id ? winnerImage(winner.player_id, winner.player_display_name ?? "") : null,
    cta: "Explore the full match",
  };
}

/** "MM-DD" key for a date — matches the on-this-day routing. */
function monthDayOf(iso: string): string {
  return iso.slice(5, 10);
}
/**
 * The day's served night and the pool the re-roll walks. `seed` indexes the night
 * to open on; `nights[seed]` is the on-this-day lead when one qualifies, otherwise
 * a deterministic pick from the curated pool.
 */
export function greatNights(
  now = new Date(),
  opts: { pin?: string | null } = {},
): { nights: GreatNight[]; seed: number } {
  const pin = opts.pin === undefined ? PINNED_ID : opts.pin;
  const stakeById = new Map(CURATED_NIGHTS.map((c) => [c.id, c.stakes]));

  // The curated pool, resolved against the live record (an unknown id is dropped).
  const pool: GreatNight[] = CURATED_NIGHTS.map((c) => {
    const m = matchById(c.id);
    return m ? build(m, "great-night", c.stakes, false) : null;
  }).filter((n): n is GreatNight => n !== null);

  // TEMP: pin one night to the front so the hero treatment is judged on the
  // flagship. Remove (set PINNED_ID = null) to ship. Tests pass `{ pin: null }`.
  if (pin) {
    const i = pool.findIndex((n) => n.id === pin);
    if (i >= 0) return { nights: [pool[i], ...pool.slice(0, i), ...pool.slice(i + 1)], seed: 0 };
  }

  // The day's lead, in priority order:
  //   1. A curated night on its own anniversary — hand-vouched, so it earns the
  //      on-this-day lead whatever its scoreline (the spectacle floor only gates
  //      the un-curated serendipity path). Checked against the pool's own dates,
  //      not onThisDay's single pick, so the 4–3 derby lights up on its day even
  //      when a bigger match elsewhere in history shares the date.
  //   2. Otherwise the day's most significant match, if it clears the floor.
  const todayKey = monthDayOfDate(now);
  const curatedTodayId = CURATED_NIGHTS.find((c) => monthDayOf(c.id) === todayKey)?.id;
  let leadRow: MatchRow | undefined;
  if (curatedTodayId) {
    leadRow = matchById(curatedTodayId);
  } else {
    const otdId = onThisDay(todayKey).lead?.id;
    const row = otdId ? matchById(otdId) : undefined;
    if (row && qualifiesAsLead(row)) leadRow = row;
  }

  if (leadRow) {
    const row = leadRow; // a const, so narrowing survives into the closure below
    const poolIndex = pool.findIndex((n) => n.id === row.id);
    if (poolIndex >= 0) {
      // The day's match is itself a curated night — reframe it in place and open there.
      pool[poolIndex] = build(row, "on-this-day", stakeById.get(row.id) ?? null, true);
      return { nights: pool, seed: poolIndex };
    }
    const lead = build(row, "on-this-day", stakeById.get(row.id) ?? null, true);
    return { nights: [lead, ...pool], seed: 0 };
  }

  if (pool.length > 0) {
    return { nights: pool, seed: dayOfYear(now) % pool.length };
  }

  // Last-ditch resilience — the curated pool should never fail to resolve, but the
  // hero must always have a night. Fall back to the club's biggest win.
  const big = clubRecords().biggestWin;
  if (big) {
    const m = matchById(big.id);
    if (m) return { nights: [build(m, "great-night", null, false)], seed: 0 };
  }
  return { nights: [], seed: 0 };
}

let homepageCatalogCache: HomepageNightCatalog | null = null;

/** Build-time catalog so the homepage can re-pick today's night in the browser. */
export function homepageNightCatalog(): HomepageNightCatalog {
  if (homepageCatalogCache) return homepageCatalogCache;
  const pool: GreatNight[] = CURATED_NIGHTS.map((curated) => {
    const match = matchById(curated.id);
    return match ? build(match, "great-night", curated.stakes, false) : null;
  }).filter((night): night is GreatNight => night !== null);

  const leadByMonthDay: Record<string, GreatNight> = {};
  for (let month = 1; month <= 12; month++) {
    for (let day = 1; day <= 31; day++) {
      const probe = new Date(Date.UTC(2001, month - 1, day));
      if (probe.getUTCMonth() !== month - 1 || probe.getUTCDate() !== day) continue;
      const key = `${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const curated = CURATED_NIGHTS.find((entry) => monthDayOf(entry.id) === key);
      if (curated) {
        const row = matchById(curated.id);
        if (row) leadByMonthDay[key] = build(row, "on-this-day", curated.stakes, true);
        continue;
      }
      const onThisDayId = onThisDay(key).lead?.id;
      const row = onThisDayId ? matchById(onThisDayId) : undefined;
      if (row && qualifiesAsLead(row)) leadByMonthDay[key] = build(row, "on-this-day", null, true);
    }
  }
  homepageCatalogCache = { pool, leadByMonthDay };
  return homepageCatalogCache;
}
