import { getDb } from "./db";
import { cachedQuery } from "./queryCache";
import { MATCH_SELECT, type MatchRow } from "./queries";
import { scoreline, scoreNote, fmtRound, resultTone, fmtDate, venuePrefix } from "./format";
import { CANONICAL_FAME } from "./curatedNights";
import type { RediscoveryPrompt } from "./rediscovery-prompt";

export { CANONICAL_FAME };
export type { RediscoveryPrompt } from "./rediscovery-prompt";

/** The living-memory band — not last season, not pre-1960 folklore. */
const FADED_MIN_YEARS = 5;
const FADED_MAX_YEARS = 30;

/** Minimum charge to enter the rediscovery pool — keeps the roll honest. */
const MIN_CHARGE = 80;

/** Rivalries a fan argues about — charge multiplier territory. */
const RIVAL_OPPONENTS = new Set([
  "liverpool",
  "manchester-city",
  "arsenal",
  "leeds-united",
  "chelsea",
]);

/**
 * Nights everyone already knows — Treble final, Camp Nou, etc. They are not
 * "forgotten" and must not dominate the engine (Phase 3a fadedness exclusion).
 */
// CANONICAL_FAME imported from ./curatedNights

/** Freighted matches that must never surface cold (Busby Babes' final fortnight). */
const EXCLUDED = new Set([
  "1958-01-14-red-star-belgrade-h",
  "1958-01-18-bolton-wanderers-h",
  "1958-02-01-arsenal-a",
  "1958-02-05-red-star-belgrade-a",
]);

export interface RediscoveryOpts {
  /** Bias rolls into the reader's own living memory ("following since ___"). */
  sinceYear?: number | null;
  /** UTC anchor for fadedness — defaults to now. */
  now?: Date;
  /** Exclude these match ids (e.g. the night's already on screen). */
  exclude?: Set<string>;
}

export interface ScoredNight {
  match: MatchRow;
  charge: number;
  fadedness: number;
  era: number;
  total: number;
  reason: string;
}

function isFinal(round: string | null): boolean {
  return !!round && /final/i.test(round) && !/semi|quarter/i.test(round);
}

function isKnockoutRound(round: string | null): boolean {
  const r = (round ?? "").toLowerCase();
  return /round of|quarter|semi|final/.test(r);
}

function matchYear(iso: string): number {
  return Number(iso.slice(0, 4));
}

function fadednessFactor(m: MatchRow, now: Date): number {
  if (CANONICAL_FAME.has(m.id)) return 0;
  const age = now.getUTCFullYear() - matchYear(m.date);
  let factor = 0;
  if (age < FADED_MIN_YEARS) factor = 0.25;
  else if (age > FADED_MAX_YEARS) factor = 0.15;
  else if (age >= 8 && age <= 20) factor = 1;
  else if (age >= 5 && age < 8) factor = 0.75;
  else factor = 0.6;

  // Domestic cup final wins are remembered — dampen so knockout exits surface.
  const round = m.round ?? "";
  if (factor > 0 && isFinal(round) && m.result === "W" && (m.competition_type === "domestic-cup" || m.competition_type === "league-cup")) {
    factor *= 0.55;
  }

  // European knockout exits are the nostalgia sweet spot (the 2015 Europa class).
  if (factor > 0 && m.competition_type === "european" && m.result !== "W" && isKnockoutRound(round)) {
    factor *= 1.15;
  }

  return factor;
}

function eraFactor(m: MatchRow, sinceYear: number | null | undefined): number {
  if (!sinceYear) return 1;
  const y = matchYear(m.date);
  if (y >= sinceYear) return 1.45;
  if (y >= sinceYear - 5) return 1.1;
  return 0.75;
}

interface StoppageIndex {
  count: number;
  lastMinute: number;
}

function stoppageIndex(): Map<string, StoppageIndex> {
  return cachedQuery("rediscovery:stoppage", 300_000, () => {
    const rows = getDb()
      .prepare(
        `SELECT match_id, minute, added_time FROM match_events
         WHERE type IN ('goal','pen-goal','own-goal-for')
         ORDER BY match_id, COALESCE(minute, 999), seq`,
      )
      .all() as { match_id: string; minute: number | null; added_time: number | null }[];
    const map = new Map<string, StoppageIndex>();
    for (const r of rows) {
      const minute = r.minute ?? 0;
      if (minute < 88) continue;
      const cur = map.get(r.match_id) ?? { count: 0, lastMinute: 0 };
      cur.count++;
      cur.lastMinute = Math.max(cur.lastMinute, minute + (r.added_time ?? 0));
      map.set(r.match_id, cur);
    }
    return map;
  });
}

function attendanceP90(): number {
  return cachedQuery("rediscovery:attendance-p90", 300_000, () => {
    const row = getDb()
      .prepare(
        `SELECT attendance FROM matches WHERE attendance IS NOT NULL ORDER BY attendance DESC LIMIT 1 OFFSET 50`,
      )
      .get() as { attendance: number } | undefined;
    return row?.attendance ?? 70_000;
  });
}

/** Charge from signals the record already holds — reuse the same predicates as
 *  greatNights, comebacks, and late-goal modules where they exist. */
export function matchCharge(m: MatchRow, stoppage: StoppageIndex | undefined): { charge: number; reason: string } {
  let charge = 0;
  const reasons: string[] = [];
  const round = m.round ?? "";
  const roundLower = round.toLowerCase();
  const margin = Math.abs(m.gf - m.ga);
  const stoppageGoals = stoppage?.count ?? 0;
  const lastStoppage = stoppage?.lastMinute ?? 0;

  if (isFinal(round)) {
    charge += m.result === "W" ? 280 : 320;
    reasons.push(m.result === "W" ? "a final won" : "a final lost");
  } else if (/semi/.test(roundLower)) {
    charge += 200;
    reasons.push("a semi-final");
  } else if (isKnockoutRound(round)) {
    charge += 160;
    if (m.competition_type === "european" && m.result !== "W") {
      charge += 120;
      reasons.push("a European knockout exit");
    } else {
      reasons.push("a knockout tie");
    }
  }

  if (m.competition_type === "european" && m.result === "L" && isKnockoutRound(round)) {
    charge += 90;
    if (!reasons.some((r) => r.includes("European"))) reasons.push("knocked out of Europe");
  }

  if (RIVAL_OPPONENTS.has(m.opponent_id)) {
    charge += 100;
    reasons.push(`against ${m.opponent_name}`);
  }

  if (m.result === "W" && m.ht_gf != null && m.ht_ga != null && m.ht_ga - m.ht_gf >= 2) {
    charge += 180;
    reasons.push("two down at half-time, then won");
  }
  if (m.result === "L" && m.ht_gf != null && m.ht_ga != null && m.ht_gf - m.ht_ga >= 2) {
    charge += 160;
    reasons.push("led at half-time, then lost");
  }

  if (m.result === "W" && stoppageGoals >= 2) {
    charge += 150;
    reasons.push("two goals in stoppage time");
  } else if (m.result === "W" && stoppageGoals === 1 && lastStoppage >= 88 && margin <= 1) {
    charge += 120;
    reasons.push("a stoppage-time winner");
  }

  if (margin >= 4) {
    charge += margin * 12;
    reasons.push(margin >= 6 ? "a rout" : "a heavy scoreline");
  }

  const crowdFloor = attendanceP90();
  if (m.attendance != null && m.attendance >= crowdFloor) {
    charge += 50;
    reasons.push("a packed ground");
  }

  if (m.aet || m.pen_gf != null) {
    charge += 70;
    reasons.push("extra time or penalties");
  }

  const reason = reasons.length > 0 ? reasons[0] : "a charged night";
  return { charge, reason };
}

function allMatches(): MatchRow[] {
  return cachedQuery("rediscovery:matches", 300_000, () => {
    return getDb()
      .prepare(
        `${MATCH_SELECT}
         WHERE c.type != 'unofficial'
         ORDER BY m.date`,
      )
      .all() as MatchRow[];
  });
}

function scoreMatch(m: MatchRow, stoppageMap: Map<string, StoppageIndex>, opts: RediscoveryOpts): ScoredNight | null {
  if (EXCLUDED.has(m.id) || opts.exclude?.has(m.id)) return null;
  const { charge, reason } = matchCharge(m, stoppageMap.get(m.id));
  if (charge < MIN_CHARGE) return null;
  const now = opts.now ?? new Date();
  const fadedness = fadednessFactor(m, now);
  if (fadedness <= 0) return null;
  const era = eraFactor(m, opts.sinceYear);
  const total = charge * fadedness * era;
  return { match: m, charge, fadedness, era, total, reason };
}

export function scorePool(matches: MatchRow[], opts: RediscoveryOpts = {}): ScoredNight[] {
  const stoppageMap = stoppageIndex();
  const scored: ScoredNight[] = [];
  for (const m of matches) {
    const s = scoreMatch(m, stoppageMap, opts);
    if (s) scored.push(s);
  }
  return scored.sort((a, b) => b.total - a.total || b.charge - a.charge || b.match.date.localeCompare(a.match.date));
}

/** Deterministic day-of-year seed — matches the served-night rotation. */
function dayOfYear(d: Date): number {
  const start = Date.UTC(d.getUTCFullYear(), 0, 0);
  const today = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  return Math.floor((today - start) / 86_400_000);
}

export function buildPrompt(night: ScoredNight): RediscoveryPrompt {
  const m = night.match;
  const metaParts = [m.competition_name, fmtRound(m.round), m.stadium_name].filter(Boolean) as string[];
  const venue = venuePrefix(m.venue);
  const line = `${venue} ${m.opponent_name} — ${night.reason}`;
  return {
    id: m.id,
    href: `/match/${m.id}`,
    prompt: "Do you remember…?",
    reason: night.reason === "a charged night"
      ? night.reason
      : `${night.reason.charAt(0).toUpperCase()}${night.reason.slice(1)}`,
    line,
    year: m.date.slice(0, 4),
    score: scoreline(m.gf, m.ga),
    scoreSuffix: scoreNote(m.pen_gf != null ? [m.pen_gf, m.pen_ga] : null, !!m.aet),
    opponent: m.opponent_name,
    tone: resultTone(m.outcome),
    meta: metaParts.join(" · "),
    dateLine: `${fmtDate(m.date)} · ${m.competition_name}`,
    total: night.total,
  };
}

/** The global rediscovery pool — every faded, charged night in the archive. */
export function rediscoveryPool(opts: RediscoveryOpts = {}): ScoredNight[] {
  const key = `rediscovery:pool:${opts.sinceYear ?? "all"}:${opts.now?.toISOString().slice(0, 10) ?? "now"}`;
  return cachedQuery(key, 300_000, () => scorePool(allMatches(), opts));
}

/** Top N engine picks for re-roll walks — seeded rotation, not behavioural. */
export function rediscoveryRollPool(limit = 48, opts: RediscoveryOpts = {}): RediscoveryPrompt[] {
  const now = opts.now ?? new Date();
  const pool = rediscoveryPool({ ...opts, now });
  const start = dayOfYear(now) % Math.max(1, pool.length);
  const out: RediscoveryPrompt[] = [];
  for (let i = 0; i < Math.min(limit, pool.length); i++) {
    const night = pool[(start + i) % pool.length];
    if (night) out.push(buildPrompt(night));
  }
  return out;
}

function entityMatches(scope: "season" | "opponent" | "player", id: string): MatchRow[] {
  if (scope === "season") {
    return getDb()
      .prepare(
        `${MATCH_SELECT}
         WHERE m.season = ? AND c.type != 'unofficial'
         ORDER BY m.date`,
      )
      .all(id) as MatchRow[];
  }
  if (scope === "opponent") {
    return getDb()
      .prepare(
        `${MATCH_SELECT}
         WHERE m.opponent_id = ? AND c.type != 'unofficial'
         ORDER BY m.date`,
      )
      .all(id) as MatchRow[];
  }
  return getDb()
    .prepare(
      `SELECT DISTINCT m.*, c.name AS competition_name, c.type AS competition_type,
              s.name AS stadium_name, s.city AS stadium_city, s.country AS stadium_country,
              mg.name AS manager_name
       FROM matches m
       JOIN competitions c ON c.id = m.competition_id
       JOIN match_lineups l ON l.match_id = m.id
       LEFT JOIN stadiums s ON s.id = m.stadium_id
       LEFT JOIN managers mg ON mg.id = m.manager_id
       WHERE l.player_id = ? AND l.player_side = 'united' AND l.bench = 0 AND c.type != 'unofficial'
       ORDER BY m.date`,
    )
    .all(id) as MatchRow[];
}

function playerSpecificReason(playerId: string, pick: MatchRow, appearances: MatchRow[]): string | null {
  const first = appearances[0];
  if (first?.id === pick.id) return "United debut";

  const contribution = getDb()
    .prepare(
      `SELECT
         SUM(CASE WHEN player_id = ? AND player_side = 'united'
                       AND type IN ('goal','pen-goal') THEN 1 ELSE 0 END) goals,
         SUM(CASE WHEN assist_player_id = ? AND assist_side = 'united'
                       AND type IN ('goal','pen-goal','own-goal-for') THEN 1 ELSE 0 END) assists
       FROM match_events
       WHERE match_id = ?`,
    )
    .get(playerId, playerId, pick.id) as { goals: number; assists: number };

  if (contribution.goals >= 3) return "A hat-trick";
  if (contribution.goals > 0 && contribution.assists > 0) return "A goal and an assist";
  if (contribution.goals > 0) return contribution.goals === 2 ? "Two goals" : "A goal";
  if (contribution.assists > 0) return contribution.assists === 1 ? "An assist" : `${contribution.assists} assists`;
  return null;
}

/** Highest-charge faded night from an entity's history — the entity-page rail. */
export function rediscoveryForEntity(
  scope: "season" | "opponent" | "player",
  id: string,
  opts: RediscoveryOpts = {},
): RediscoveryPrompt | null {
  const matches = entityMatches(scope, id);
  if (matches.length < 3) return null;
  const pool = scorePool(matches, opts);
  const pick = pool[0];
  if (!pick || pick.reason === "a charged night") return null;
  const prompt = buildPrompt(pick);
  if (scope === "player") {
    prompt.reason = playerSpecificReason(id, pick.match, matches) ?? prompt.reason;
  }
  return prompt;
}

/** Parse "following since" from a URL param — guardrailed to plausible years. */
export function parseSinceYear(raw: string | string[] | undefined | null): number | null {
  const v = Array.isArray(raw) ? raw[0] : raw;
  if (!v) return null;
  const y = Number(v);
  const now = new Date().getUTCFullYear();
  if (!Number.isInteger(y) || y < 1960 || y > now) return null;
  return y;
}
