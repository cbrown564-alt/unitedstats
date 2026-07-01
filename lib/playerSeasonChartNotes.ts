import { getDb } from "@/lib/db";
import { fmtSeasonShort } from "@/lib/format";

/** First season of the curated assists lane; before it, assists are unrecorded. */
const ASSISTS_RECORDED_FROM = "1987-88";

const GOAL_COVERAGE_THRESHOLD = 0.99;

let limitedGoalSeasonsCache: string[] | null = null;

/** Canonical seasons before {@link ASSISTS_RECORDED_FROM} where United scorers are missing on ≥1% of scoring matches. */
export function seasonsWithLimitedGoalScorerCoverage(): string[] {
  if (limitedGoalSeasonsCache) return limitedGoalSeasonsCache;
  const rows = getDb()
    .prepare(
      `SELECT m.season,
              COUNT(*) scored_matches,
              SUM(CASE WHEN EXISTS (
                SELECT 1 FROM match_events e
                WHERE e.match_id = m.id AND e.player_side = 'united'
                  AND e.type IN ('goal','pen-goal') AND e.player_id IS NOT NULL
              ) THEN 1 ELSE 0 END) with_scorers
       FROM matches m
       WHERE m.gf > 0 AND m.season < ?
       GROUP BY m.season`,
    )
    .all(ASSISTS_RECORDED_FROM) as { season: string; scored_matches: number; with_scorers: number }[];
  limitedGoalSeasonsCache = rows
    .filter((r) => r.scored_matches > 0 && r.with_scorers / r.scored_matches < GOAL_COVERAGE_THRESHOLD)
    .map((r) => r.season);
  return limitedGoalSeasonsCache;
}

function nextSeason(season: string): string {
  const y = Number(season.slice(0, 4)) + 1;
  return `${y}-${String(y + 1).slice(2)}`;
}

export function mergeSeasonRanges(seasons: string[]): { from: string; to: string }[] {
  if (!seasons.length) return [];
  const sorted = [...seasons].sort();
  const ranges: { from: string; to: string }[] = [];
  let from = sorted[0];
  let to = sorted[0];
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === nextSeason(to)) to = sorted[i];
    else {
      ranges.push({ from, to });
      from = to = sorted[i];
    }
  }
  ranges.push({ from, to });
  return ranges;
}

function formatSeasonRange({ from, to }: { from: string; to: string }): string {
  const a = fmtSeasonShort(from);
  const b = fmtSeasonShort(to);
  return from === to ? a : `${a}–${b}`;
}

/** True when none of the player's seasons fall in eras with <99% goalscorer attribution. */
export function playerHasFullGoalScorerCoverage(playerSeasons: string[]): boolean {
  if (!playerSeasons.length) return true;
  const limited = new Set(seasonsWithLimitedGoalScorerCoverage());
  return !playerSeasons.some((s) => limited.has(s));
}

/**
 * Contextual footnotes for the goals-and-assists-by-season chart. Modern careers
 * (debuts from 87/88) need no inline caveats — the page-level data coverage block
 * carries the detail.
 */
export function playerSeasonChartFootnotes(playerSeasons: string[]): string[] {
  if (!playerSeasons.length) return [];
  const sorted = [...playerSeasons].sort();
  if (sorted[0]! >= ASSISTS_RECORDED_FROM) return [];

  const notes: string[] = [];

  if (sorted.some((s) => s < ASSISTS_RECORDED_FROM)) {
    notes.push(`Assists first recorded from ${fmtSeasonShort(ASSISTS_RECORDED_FROM)} onwards.`);
  }

  const limited = new Set(seasonsWithLimitedGoalScorerCoverage());
  const overlap = sorted.filter((s) => limited.has(s));
  if (overlap.length) {
    const ranges = mergeSeasonRanges(overlap).map(formatSeasonRange).join(", ");
    notes.push(`Limited coverage of goals during seasons ${ranges}.`);
  }

  return notes;
}
