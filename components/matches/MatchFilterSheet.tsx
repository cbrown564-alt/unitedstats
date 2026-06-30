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
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p id={titleId} className="display text-xl leading-tight">
              Filters
            </p>
            <p className="mt-2 text-sm leading-relaxed text-ink-dim">
              {filterCount > 0 ? (
                <>
                  <span className="stat-num font-medium text-ink">{filterCount}</span> active ·{" "}
                </>
              ) : null}
              <span className="stat-num">{fmtNum(total)}</span> matches in this slice
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg px-3 py-2 text-sm font-semibold text-devil-bright transition-colors hover:bg-devil/10 hover:text-ink focus-ring"
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
            sheetLayout
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
