import { matchById, eventsForMatch, type MatchRow } from "./queries";
import { onThisDay, monthDayLabel } from "./onThisDay";
import { clubRecords } from "./trails";
import { getDb } from "./db";
import { scoreline, fmtRound, resultTone } from "./format";

// TEMP (front-door design iteration): pin one night so the hero treatment can be
// judged on the flagship rather than whatever falls today. Set to null to ship —
// the served night then resolves normally (on-this-day, else the rotating pool).
const PINNED_ID: string | null = "1999-05-26-bayern-munich-n";

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
export interface GreatNight {
  id: string;
  href: string;
  framing: "on-this-day" | "great-night";
  /** True only when the night is literally today's date — drives the live pulse. */
  live: boolean;
  eyebrow: string;
  year: string;
  /** "United 2–1 Bayern Munich" — opponent inline, score toned by `tone`. */
  score: string;
  opponent: string;
  /** Result-coloured class from the *outcome* (a shootout win reads as a win). */
  tone: string;
  /** competition · round? · stadium? — the orienting meta line. */
  meta: string;
  /** The emotional lead: an authored stake, else derived texture, else null (then
   *  the scoreline leads instead). */
  line: string | null;
  /** United's goals as name + minute — who scored, when. The soul of the match. */
  scorers: { name: string; minute: string }[];
  /** The night's own shape for the thread-as-timeline monument: each United goal
   *  placed on the match clock (minute incl. stoppage), the last flagged as the
   *  knot. Empty when goal minutes aren't on record — the hero then falls back to
   *  the ghosted-year monument rather than fake a position. */
  timeline: { clock: number; label: string; name: string; winner: boolean }[];
  /** A face to carry the night: the match-winner's (last United scorer's) portrait,
   *  used as a faded monument. Null when no scorer image is on file. */
  image: { src: string; name: string } | null;
  cta: string;
}

/**
 * The curated pool — the authorship (CONTEXT.md §3, lens-not-loom). Each entry is
 * a real match id plus one earned line in the Floodlit-Guide voice. Bootstrapped
 * from `scripts/bootstrap-great-nights.ts` (significance + late-drama + comebacks)
 * and hand-trimmed. DRAFT — trim the list and sharpen the lines freely; an
 * unknown id is skipped, never fatal.
 */
interface CuratedSpec {
  id: string;
  stakes: string;
}

export const CURATED_NIGHTS: CuratedSpec[] = [
  // — European nights —
  { id: "1968-05-29-benfica-n", stakes: "Ten years after Munich, the first English club to win the European Cup." },
  { id: "1999-05-26-bayern-munich-n", stakes: "Lost in the 90th minute, won in stoppage time — and the Treble with it." },
  { id: "2008-05-21-chelsea-n", stakes: "Settled on penalties in the Moscow rain, a second European Cup." },
  { id: "1991-05-15-barcelona-n", stakes: "Two from Mark Hughes against his old club — Europe, back at last." },
  { id: "2017-05-24-afc-ajax-n", stakes: "The one trophy still missing from the cabinet, finally claimed." },

  // — Finals and silverware —
  { id: "1948-04-24-blackpool-n", stakes: "Matt Busby's first trophy, in one of Wembley's great finals." },
  { id: "1963-05-25-leicester-city-n", stakes: "Silverware again, five years on from Munich." },
  { id: "1977-05-21-liverpool-n", stakes: "The afternoon that denied Liverpool the Treble." },
  { id: "1990-05-17-crystal-palace-n", stakes: "Alex Ferguson's first trophy — the one that saved all the rest." },
  { id: "1994-05-14-chelsea-n", stakes: "The club's first League and FA Cup Double." },
  { id: "1996-05-11-liverpool-n", stakes: "Cantona, late and alone — a second Double in three seasons." },
  { id: "1999-05-22-newcastle-united-n", stakes: "Five days after the league, the second leg of the Treble." },
  { id: "2024-05-25-manchester-city-n", stakes: "A derby final, and the season's one bright day." },

  // — League and cup drama —
  { id: "1993-04-10-sheffield-wednesday-h", stakes: "Two Steve Bruce headers in the closing minutes — a first title in twenty-six years drew near." },
  { id: "1999-04-14-arsenal-n", stakes: "Giggs, from inside his own half, to keep the Treble alive." },
  { id: "1999-05-16-tottenham-hotspur-h", stakes: "Come from behind on the final day to take the title — the Treble's first leg." },
  { id: "2001-09-29-tottenham-hotspur-a", stakes: "Three down at half-time at White Hart Lane, five scored after it." },

  // — Modern nights —
  { id: "2011-08-28-arsenal-h", stakes: "Arsenal on the wrong end of one of Old Trafford's great routs." },
  { id: "2009-09-20-manchester-city-h", stakes: "Michael Owen, deep into stoppage time, to settle a seven-goal derby." },
  { id: "2019-03-06-paris-saint-germain-a", stakes: "Two down from the first leg, through on a penalty in the last minute in Paris." },
  { id: "2013-04-22-aston-villa-h", stakes: "Van Persie's volley, and a twentieth league title — Ferguson's last." },
];

/** Zero-based day index within the UTC year — the deterministic rotation seed,
 *  matching `lib/now.ts` and `lib/entryPoints.ts` so the surfaces turn in step. */
function dayOfYear(d: Date): number {
  const start = Date.UTC(d.getUTCFullYear(), 0, 0);
  const today = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  return Math.floor((today - start) / 86_400_000);
}

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
    score: scoreline(m.gf, m.ga, [m.pen_gf, m.pen_ga], !!m.aet),
    opponent: m.opponent_name,
    tone: resultTone(m.outcome),
    meta: metaParts.join(" · "),
    line: stakes ?? texture(m, goals.map((e) => ({ minute: e.minute, added_time: e.added_time }))),
    scorers,
    timeline,
    image: USE_WINNER_PORTRAIT && winner?.player_id ? winnerImage(winner.player_id, winner.player_display_name ?? "") : null,
    cta: "See the night",
  };
}

/** "MM-DD" key for a date — matches the on-this-day routing. */
function monthDayOf(iso: string): string {
  return iso.slice(5, 10);
}
function monthDayOfDate(d: Date): string {
  return `${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
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
