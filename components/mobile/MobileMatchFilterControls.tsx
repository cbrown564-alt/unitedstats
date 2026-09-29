"use client";

import { Suspense, useId, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { MatchFilterSheet } from "@/components/matches/MatchFilterSheet";
import { useMatchesCatalog } from "@/components/matches/MatchesCatalogContext";
import { buildMatchesPageViewFromCatalog } from "@/lib/matches/buildCatalogView";
import { UtilGlyph } from "@/components/glyphs/UtilGlyph";

const IGNORE_PARAMS = new Set(["page", "sort"]);

function countFilterParams(searchParams: URLSearchParams): number {
  let count = 0;
  searchParams.forEach((value, key) => {
    if (!IGNORE_PARAMS.has(key) && value) count += 1;
  });
  return count;
}

type MobileMatchFilterControlsProps = {
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
};

function MobileMatchFilterControlsInner({ open, onOpen, onClose }: MobileMatchFilterControlsProps) {
  const titleId = useId();
  const searchParams = useSearchParams();
  const params = useMemo(
    () => Object.fromEntries(searchParams.entries()),
    [searchParams],
  );
  const filterCount = countFilterParams(searchParams);
  const catalog = useMatchesCatalog();
  const view = catalog ? buildMatchesPageViewFromCatalog(params, catalog) : null;

  return (
    <>
      <button
        type="button"
        onClick={onOpen}
        aria-label={filterCount > 0 ? `Filters, ${filterCount} active` : "Filters"}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={[
          "mobile-pill-btn mobile-pill-btn--filters tap-target focus-ring",
          filterCount > 0 ? "mobile-pill-btn--filters-active" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <UtilGlyph id="filter" />
        {filterCount > 0 && (
          <span className="mobile-pill-badge stat-num" aria-hidden>
            {filterCount}
          </span>
        )}
      </button>

      <MatchFilterSheet
        open={open}
        onClose={onClose}
        titleId={titleId}
        filterCount={view?.chips.length ?? filterCount}
        params={view?.params ?? params}
        chips={view?.chips ?? []}
        total={view?.total ?? 0}
        matchHref={view?.matchHref}
        seasons={view?.seasons ?? []}
        decadeBuckets={view?.decades}
        loading={open && !view}
      />
    </>
  );
}

export function MobileMatchFilterControls(props: MobileMatchFilterControlsProps) {
  return (
    <Suspense
      fallback={
        <button
          type="button"
          aria-label="Filters"
          className="mobile-pill-btn mobile-pill-btn--filters tap-target focus-ring"
          disabled
        >
          <UtilGlyph id="filter" />
        </button>
      }
    >
      <MobileMatchFilterControlsInner {...props} />
    </Suspense>
  );
}
