import { getDb } from "./db";

/**
 * Closed-universe Elo in elo_history, read against history — not forward.
 *
 * Elo expectancy folds draws into a single number, so win/draw/loss
 * probabilities come from calibration: bucket all 6,000+ rated matches by
 * pre-match expectancy and use the observed W/D/L split in each bucket. That
 * calibration powers two retrospective checks — the reliability curve (does
 * expectancy come true) and the season replay (how a past season compares with
 * what the ratings expected). There is no forecast: the archive ends at today,
 * so the rating is only ever pointed back at matches that were actually played.
 */

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

interface Probabilities {
  pW: number;
  pD: number;
  pL: number;
  /** Matches in the calibration bucket these probabilities come from. */
  sample: number;
}

/** Map an Elo expectancy to W/D/L probabilities via the empirical calibration. */
function probabilitiesFor(expected: number): Probabilities {
  const buckets = calibration();
  const idx = Math.min(Math.floor(expected * 10), 9);
  const b = buckets.find((x) => Math.round(x.lo * 10) === idx) ?? buckets[buckets.length - 1];
  return { pW: b.w / b.p, pD: b.d / b.p, pL: b.l / b.p, sample: b.p };
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
