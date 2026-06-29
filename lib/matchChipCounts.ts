import type { MatchFilter } from "@/lib/queries";
import { findMatches } from "@/lib/queries";

/** Count each active chip's constraint in isolation (not combined with other filters). */
export function matchChipCounts(filter: MatchFilter, activeKeys: string[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const key of activeKeys) {
    const value = (filter as Record<string, unknown>)[key];
    if (value === undefined || value === false) continue;
    counts[key] = findMatches({
      [key]: value,
      sort: filter.sort,
      limit: 1,
      offset: 0,
    } as MatchFilter).total;
  }
  return counts;
}
