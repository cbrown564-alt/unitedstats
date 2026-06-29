import { SearchCommand } from "@/components/SearchCommand";
import { MatchFilterCollapse } from "@/components/matches/MatchFilterCollapse";
import type { DecadeBucket } from "@/components/matches/FilterZones";

/**
 * Search plus facet chips for narrowing the match archive. The filter palette
 * expands inline below the chip row so it is never clipped by the deck.
 */
export function MatchControlDeck({
  params,
  chips,
  total,
  matchHref,
  seasons,
  decadeBuckets,
  defaultFiltersOpen,
}: {
  params: Record<string, string | undefined>;
  chips: { key: string; label: string }[];
  total: number;
  matchHref?: string;
  seasons: string[];
  decadeBuckets?: DecadeBucket[];
  /** Expand the filter panel on load when the slice already has constraints. */
  defaultFiltersOpen: boolean;
}) {
  return (
    <section
      id="match-filters"
      aria-label="Narrow the match archive"
      className="scroll-mt-20 rounded-xl border border-line bg-panel shadow-[inset_0_1px_0_rgb(255_255_255_/_0.04),0_18px_36px_-22px_rgb(0_0_0_/_0.75)]"
    >
      <div className="p-4 sm:p-5">
        <SearchCommand forMatches fullWidth autoFocusKey={false} />
        <MatchFilterCollapse
          defaultOpen={defaultFiltersOpen}
          filterCount={chips.length}
          params={params}
          chips={chips}
          total={total}
          matchHref={matchHref}
          seasons={seasons}
          decadeBuckets={decadeBuckets}
        />
      </div>
    </section>
  );
}
