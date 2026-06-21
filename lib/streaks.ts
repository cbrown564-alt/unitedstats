import { getDb } from "./db";

/**
 * Club-wide run (streak) detection over the canonical match record.
 *
 * Runs are first-class, evidence-linked findings: the longest stretches of
 * consecutive *official* matches that share a property — unbeaten, winning,
 * scored-in, or kept-a-clean-sheet. Everything here reads off one date-ordered
 * official sequence (friendlies and wartime excluded, exactly as the club-records
 * lane does), so a friendly thrashing or a wartime glut can't pad a run.
 *
 * Each run carries the match that *ended* it (the next official match after the
 * run), so the surface can show what finally broke the record rather than just a
 * number. An ongoing run has no ender and is flagged `ongoing` instead.
 */

export type StreakKind = "unbeaten" | "winning" | "scoring" | "cleansheet";

interface SeqRow {
  id: string;
  date: string;
  season: string;
  venue: string;
  result: "W" | "D" | "L";
  gf: number;
  ga: number;
  opponent_name: string;
  competition_name: string;
}

/** The match that broke a run, kept light — enough to link it and read its scoreline. */
interface RunEnder {
  id: string;
  date: string;
  season: string;
  venue: string;
  result: "W" | "D" | "L";
  gf: number;
  ga: number;
  opponent_name: string;
  competition_name: string;
}

export interface ClubRun {
  length: number;
  from: string;
  to: string;
  fromSeason: string;
  toSeason: string;
  /** The next official match after the run — what ended it. Null if still current. */
  ender: RunEnder | null;
  ongoing: boolean;
}

const PREDICATES: Record<StreakKind, (r: SeqRow) => boolean> = {
  unbeaten: (r) => r.result !== "L",
  winning: (r) => r.result === "W",
  scoring: (r) => r.gf > 0,
  cleansheet: (r) => r.ga === 0,
};

let cachedSequence: SeqRow[] | null = null;

/** The official match sequence, oldest first — the spine every run reads from. */
function officialSequence(): SeqRow[] {
  if (cachedSequence) return cachedSequence;
  cachedSequence = getDb()
    .prepare(
      `SELECT m.id, m.date, m.season, m.venue, m.result, m.gf, m.ga,
              m.opponent_name, c.name AS competition_name
       FROM matches m JOIN competitions c ON c.id = m.competition_id
       WHERE c.type != 'unofficial'
       ORDER BY m.date, m.id`,
    )
    .all() as SeqRow[];
  return cachedSequence;
}

function enderOf(seq: SeqRow[], endIdx: number): RunEnder | null {
  const next = seq[endIdx + 1];
  if (!next) return null;
  const { id, date, season, venue, result, gf, ga, opponent_name, competition_name } = next;
  return { id, date, season, venue, result, gf, ga, opponent_name, competition_name };
}

/**
 * The top `limit` runs of one kind, longest first then earliest. Scans the
 * date-ordered official sequence once, collecting every maximal run where the
 * predicate holds; a break in the predicate (or the end of the record) closes a
 * run. Runs below `minLength` are dropped as noise.
 */
export function topRuns(kind: StreakKind, limit = 5, minLength = 3): ClubRun[] {
  const seq = officialSequence();
  const holds = PREDICATES[kind];
  const spans: { start: number; end: number }[] = [];
  let start = -1;
  for (let i = 0; i < seq.length; i++) {
    if (holds(seq[i])) {
      if (start < 0) start = i;
    } else if (start >= 0) {
      spans.push({ start, end: i - 1 });
      start = -1;
    }
  }
  if (start >= 0) spans.push({ start, end: seq.length - 1 });

  return spans
    .map((s) => ({ ...s, length: s.end - s.start + 1 }))
    .filter((s) => s.length >= minLength)
    .sort((a, b) => b.length - a.length || a.start - b.start)
    .slice(0, limit)
    .map((s) => {
      const first = seq[s.start];
      const last = seq[s.end];
      return {
        length: s.length,
        from: first.date,
        to: last.date,
        fromSeason: first.season,
        toSeason: last.season,
        ender: enderOf(seq, s.end),
        ongoing: s.end === seq.length - 1,
      };
    });
}

export interface ClubStreaks {
  unbeaten: ClubRun[];
  winning: ClubRun[];
  scoring: ClubRun[];
  cleansheet: ClubRun[];
}

/** Top runs across all four kinds, for the runs module. */
export function clubStreaks(limit = 5): ClubStreaks {
  return {
    unbeaten: topRuns("unbeaten", limit),
    winning: topRuns("winning", limit),
    scoring: topRuns("scoring", limit),
    cleansheet: topRuns("cleansheet", limit),
  };
}
