"use client";

import {
  BottomSheet,
  BottomSheetBody,
  BottomSheetHeader,
} from "@/components/mobile/BottomSheet";
import { MatchFilterBarWithCounts } from "@/components/MatchFilterBarWithCounts";
import type { DecadeBucket } from "@/components/matches/FilterZones";
import { fmtNum } from "@/lib/format";

export type MatchFilterSheetProps = {
  open: boolean;
  onClose: () => void;
  titleId: string;
  filterCount: number;
  params: Record<string, string | undefined>;
  chips: { key: string; label: string }[];
  total: number;
  matchHref?: string;
  seasons: string[];
  decadeBuckets?: DecadeBucket[];
  loading?: boolean;
};

/** Full match facet palette in a bottom sheet (mobile pill + narrow shell). */
export function MatchFilterSheet({
  open,
  onClose,
  titleId,
  filterCount,
  params,
  chips,
  total,
  matchHref,
  seasons,
  decadeBuckets,
  loading = false,
}: MatchFilterSheetProps) {
  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      ariaLabel="Match filters"
      titleId={titleId}
      panelClassName="mobile-sheet-panel--filters"
    >
      <BottomSheetHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p id={titleId} className="display text-lg leading-tight">
              Filters
            </p>
            <p className="mt-1 text-xs text-ink-faint">
              {filterCount > 0 ? (
                <>
                  <span className="stat-num">{filterCount}</span> active ·{" "}
                </>
              ) : null}
              <span className="stat-num">{fmtNum(total)}</span> matches
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-md px-2.5 py-1.5 text-sm font-semibold text-devil-bright transition-colors hover:text-ink focus-ring"
          >
            Done
          </button>
        </div>
      </BottomSheetHeader>

      <BottomSheetBody>
        {loading ? (
          <p className="px-1 py-8 text-center text-sm text-ink-faint motion-safe:animate-pulse">
            Loading filters…
          </p>
        ) : (
          <MatchFilterBarWithCounts
            embedded
            params={params}
            chips={chips}
            total={total}
            matchHref={matchHref}
            seasons={seasons}
            decadeBuckets={decadeBuckets}
          />
        )}
      </BottomSheetBody>
    </BottomSheet>
  );
}
