"use client";

import { Suspense, useEffect, useId, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { MatchFilterSheet } from "@/components/matches/MatchFilterSheet";
import type { MatchPageView } from "@/lib/matchPageView";

const IGNORE_PARAMS = new Set(["page", "sort"]);

function FilterIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M4 6h16M7 12h10M10 18h4" strokeLinecap="round" />
    </svg>
  );
}

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
  const [view, setView] = useState<MatchPageView | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    const ac = new AbortController();
    setLoading(true);
    const qs = searchParams.toString();
    fetch(`/api/v1/matches/view${qs ? `?${qs}` : ""}`, { signal: ac.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`matches view ${res.status}`);
        return res.json() as Promise<{ data: MatchPageView }>;
      })
      .then((json) => {
        if (!ac.signal.aborted) {
          setView(json.data);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        if (!ac.signal.aborted) setLoading(false);
      });
    return () => ac.abort();
  }, [open, searchParams]);

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
        <FilterIcon />
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
        loading={open && loading && !view}
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
          <FilterIcon />
        </button>
      }
    >
      <MobileMatchFilterControlsInner {...props} />
    </Suspense>
  );
}
