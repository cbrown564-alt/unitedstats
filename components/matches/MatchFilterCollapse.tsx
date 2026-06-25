"use client";

import { useEffect, useState } from "react";
import { MatchFilterBarWithCounts } from "@/components/MatchFilterBarWithCounts";
import type { DecadeBucket } from "@/components/matches/FilterZones";
import type { FacetOptions } from "@/lib/matchFacets";

function Chevron({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 12 12" aria-hidden className={className}>
      <path
        d="m2.5 4.5 3.5 3.5 3.5-3.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Collapsible filter palette below the matches search bar. Closed on a clean
 * slice; opens by default when the URL already carries filters.
 */
export function MatchFilterCollapse({
  defaultOpen,
  filterCount,
  params,
  chips,
  chipCounts,
  options,
  total,
  matchHref,
  seasons,
  decadeBuckets,
}: {
  defaultOpen: boolean;
  filterCount: number;
  params: Record<string, string | undefined>;
  chips: { key: string; label: string }[];
  chipCounts: Record<string, number>;
  options: FacetOptions;
  total: number;
  matchHref?: string;
  seasons: string[];
  decadeBuckets?: DecadeBucket[];
}) {
  const [open, setOpen] = useState(defaultOpen);

  // Open when navigation applies filters; still allow manual collapse.
  useEffect(() => {
    if (defaultOpen) setOpen(true);
  }, [defaultOpen]);

  return (
    <details
      className="group/filters mt-4"
      open={open}
      onToggle={(e) => setOpen(e.currentTarget.open)}
    >
      <summary className="flex cursor-pointer select-none list-none items-center gap-2 border-t border-line/70 py-3 text-[13px] text-ink-dim transition-colors hover:text-ink-faint focus-ring [&::-webkit-details-marker]:hidden">
        <Chevron className="h-3 w-3 shrink-0 -rotate-90 text-devil-bright/80 transition-transform duration-200 group-open/filters:rotate-0" />
        <span>Filters</span>
        {filterCount > 0 && (
          <span className="stat-num ml-auto text-[11px] text-ink-faint">
            {filterCount} active
          </span>
        )}
      </summary>
      <div className="pt-4">
        <MatchFilterBarWithCounts
          embedded
          params={params}
          chips={chips}
          chipCounts={chipCounts}
          options={options}
          total={total}
          matchHref={matchHref}
          seasons={seasons}
          decadeBuckets={decadeBuckets}
        />
      </div>
    </details>
  );
}
