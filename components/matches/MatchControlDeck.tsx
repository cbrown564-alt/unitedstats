import { SearchCommand } from "@/components/SearchCommand";
import { MatchFilterCollapse } from "@/components/matches/MatchFilterCollapse";
import type { DecadeBucket } from "@/components/matches/FilterZones";

/**
 * Search plus facet chips for narrowing the match archive. The filter palette
 * collapses by default so the match list stays visible; expand to edit filters.
 */
export function MatchControlDeck({
  params,
  chips,
  total,
  matchHref,
  seasons,
  decadeBuckets,
}: {
  params: Record<string, string | undefined>;
  chips: { key: string; label: string }[];
  total: number;
  matchHref?: string;
  seasons: string[];
  decadeBuckets?: DecadeBucket[];
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
