import { getDb } from "./db";

/**
 * Predictive layer on top of the closed-universe Elo in elo_history.
 *
 * Elo expectancy folds draws into a single number, so win/draw/loss
 * probabilities come from calibration: bucket all 6,000+ rated matches by
 * pre-match expectancy and use the observed W/D/L split in each bucket.
 * Empirical, evidence-linked, and honest about its closed-universe scope —
 * opponents are rated only on their matches against United.
 */

export const HOME_ADVANTAGE = 60;

export interface CalibrationBucket {
  /** Expectancy range [lo, hi). */
  lo: number;
  hi: number;
  p: number;
  w: number;
  d: number;
  l: number;
}

let calibrationCache: CalibrationBucket[] | null = null;

/** Observed W/D/L by pre-match expectancy decile, all rated matches. */
export function calibration(): CalibrationBucket[] {
  if (calibrationCache) return calibrationCache;
  const rows = getDb()
    .prepare(
      `SELECT CAST(MIN(e.expected * 10, 9) AS INTEGER) bucket,
              COUNT(*) p, SUM(m.result='W') w, SUM(m.result='D') d, SUM(m.result='L') l
       FROM elo_history e JOIN matches m ON m.id = e.match_id
       GROUP BY bucket ORDER BY bucket`,
    )
    .all() as { bucket: number; p: number; w: number; d: number; l: number }[];
  calibrationCache = rows.map((r) => ({
    lo: r.bucket / 10,
    hi: (r.bucket + 1) / 10,
    p: r.p,
    w: r.w,
    d: r.d,
    l: r.l,
  }));
  return calibrationCache;
}

export interface Probabilities {
  pW: number;
  pD: number;
  pL: number;
  /** Matches in the calibration bucket these probabilities come from. */
  sample: number;
}

/** Map an Elo expectancy to W/D/L probabilities via the empirical calibration. */
export function probabilitiesFor(expected: number): Probabilities {
  const buckets = calibration();
  const idx = Math.min(Math.floor(expected * 10), 9);
  const b = buckets.find((x) => Math.round(x.lo * 10) === idx) ?? buckets[buckets.length - 1];
  return { pW: b.w / b.p, pD: b.d / b.p, pL: b.l / b.p, sample: b.p };
}

export function unitedEloNow(): { elo: number; date: string } {
  return getDb()
    .prepare("SELECT elo_post elo, date FROM elo_history ORDER BY date DESC LIMIT 1")
    .get() as { elo: number; date: string };
}

export interface OpponentRating {
  opponent_id: string;
  name: string;
  elo: number;
  meetings: number;
  last_date: string;
}

/**
 * An opponent's current closed-universe rating: their rating going into the
 * most recent meeting, adjusted by the (zero-sum) exchange from that match.
 */
export function opponentEloNow(opponentId: string): OpponentRating | undefined {
  return getDb()
    .prepare(
      `SELECT m.opponent_id, o.name,
              e.opp_elo_pre - (e.elo_post - e.elo_pre) elo,
              (SELECT COUNT(*) FROM elo_history e2 JOIN matches m2 ON m2.id = e2.match_id
               WHERE m2.opponent_id = m.opponent_id) meetings,
              e.date last_date
       FROM elo_history e JOIN matches m ON m.id = e.match_id
       JOIN opponents o ON o.id = m.opponent_id
       WHERE m.opponent_id = ?
       ORDER BY e.date DESC LIMIT 1`,
    )
    .get(opponentId) as OpponentRating | undefined;
}

/** Opponents with a rating, for the odds-widget select. Rated meetings only. */
export function ratedOpponents(): { id: string; name: string; meetings: number }[] {
  return getDb()
    .prepare(
      `SELECT m.opponent_id id, o.name, COUNT(*) meetings
       FROM elo_history e JOIN matches m ON m.id = e.match_id
       JOIN opponents o ON o.id = m.opponent_id
       GROUP BY m.opponent_id ORDER BY o.name`,
    )
    .all() as { id: string; name: string; meetings: number }[];
}

export interface Odds extends Probabilities {
  expected: number;
  unitedElo: number;
  opponentElo: number;
  opponentName: string;
  meetings: number;
  lastMet: string;
}

/** "What are the odds" for a hypothetical meeting at today's ratings. */
export function oddsFor(opponentId: string, venue: "H" | "A" | "N"): Odds | undefined {
  const opp = opponentEloNow(opponentId);
  if (!opp) return undefined;
  const united = unitedEloNow();
  const home = venue === "H" ? HOME_ADVANTAGE : venue === "A" ? -HOME_ADVANTAGE : 0;
  const expected = 1 / (1 + 10 ** (-(united.elo + home - opp.elo) / 400));
  return {
    ...probabilitiesFor(expected),
    expected,
    unitedElo: united.elo,
    opponentElo: opp.elo,
    opponentName: opp.name,
    meetings: opp.meetings,
    lastMet: opp.last_date,
  };
}

// ---------------------------------------------------------------- season replay

/** Deterministic PRNG so the simulation renders the same on every request. */
function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface SeasonSimulation {
  season: string;
  competitionName: string;
  matches: number;
  actualPoints: number;
  meanPoints: number;
  /** Distribution of simulated points totals: index = points, value = share. */
  distribution: { points: number; share: number }[];
  p5: number;
  p95: number;
  /** Share of simulated seasons that beat the actual points total. */
  shareAbove: number;
  shareBelow: number;
  runs: number;
}

/**
 * Replay a league season from its pre-match win expectancies. Each match is
 * drawn from its calibrated W/D/L probabilities; 3 points for a win. Says
 * how the points total compares with what the ratings expected, not where
 * the league table would have finished.
 */
export function simulateLeagueSeason(season?: string, runs = 10000): SeasonSimulation | undefined {
  const db = getDb();
  const target =
    season ??
    (db
      .prepare(
        `SELECT m.season FROM matches m JOIN competitions c ON c.id = m.competition_id
         WHERE c.type = 'league' ORDER BY m.date DESC LIMIT 1`,
      )
      .get() as { season: string } | undefined)?.season;
  if (!target) return undefined;
  const rows = db
    .prepare(
      `SELECT e.expected, m.result, c.name competition_name
       FROM elo_history e JOIN matches m ON m.id = e.match_id
       JOIN competitions c ON c.id = m.competition_id
       WHERE m.season = ? AND c.type = 'league' ORDER BY m.date`,
    )
    .all(target) as { expected: number; result: "W" | "D" | "L"; competition_name: string }[];
  if (rows.length === 0) return undefined;

  const probs = rows.map((r) => probabilitiesFor(r.expected));
  const actualPoints = rows.reduce(
    (a, r) => a + (r.result === "W" ? 3 : r.result === "D" ? 1 : 0),
    0,
  );
  const maxPoints = rows.length * 3;
  const counts = new Array<number>(maxPoints + 1).fill(0);
  let seed = 0;
  for (const ch of target) seed = (seed * 31 + ch.charCodeAt(0)) | 0;
  const rand = mulberry32(seed);
  let total = 0;
  for (let i = 0; i < runs; i++) {
    let pts = 0;
    for (const p of probs) {
      const u = rand();
      pts += u < p.pW ? 3 : u < p.pW + p.pD ? 1 : 0;
    }
    counts[pts]++;
    total += pts;
  }

  const cumulative: number[] = [];
  let acc = 0;
  for (const c of counts) {
    acc += c;
    cumulative.push(acc);
  }
  const quantile = (q: number) => cumulative.findIndex((c) => c >= q * runs);
  const shareAbove = (runs - cumulative[actualPoints]) / runs;
  const shareBelow = (actualPoints > 0 ? cumulative[actualPoints - 1] : 0) / runs;

  return {
    season: target,
    competitionName: rows[0].competition_name,
    matches: rows.length,
    actualPoints,
    meanPoints: total / runs,
    distribution: counts
      .map((c, points) => ({ points, share: c / runs }))
      .filter((d) => d.share > 0),
    p5: quantile(0.05),
    p95: quantile(0.95),
    shareAbove,
    shareBelow,
    runs,
  };
}
