"use client";

import { useEffect } from "react";
import { SEARCH_PLACEHOLDER } from "@/lib/search/examples";

type SearchCommandComponent = typeof import("@/components/SearchCommand").SearchCommand;

type MobileSearchOverlayProps = {
  open: boolean;
  onClose: () => void;
  SearchCommand: SearchCommandComponent | null;
  loading: boolean;
};

export function MobileSearchOverlay({ open, onClose, SearchCommand, loading }: MobileSearchOverlayProps) {
  useEffect(() => {
    if (!open) return;
    document.body.classList.add("mobile-sheet-open");
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.classList.remove("mobile-sheet-open");
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose, open]);

  if (!open) return null;

  return (
    <div className="mobile-search-root mobile-search-root--open" role="dialog" aria-modal="true" aria-label="Search">
      <button type="button" aria-label="Close search" className="mobile-sheet-backdrop" onClick={onClose} />

      <div className="mobile-search-panel mobile-search-panel--open">
        <div className="mobile-search-header">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-devil-bright">Search</p>
          <button
            type="button"
            onClick={onClose}
            className="mobile-search-close focus-ring"
            aria-label="Close"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <line x1="6" y1="6" x2="18" y2="18" />
              <line x1="18" y1="6" x2="6" y2="18" />
            </svg>
          </button>
        </div>

        <div className="mobile-search-body">
          {SearchCommand ? (
            <SearchCommand
              compact
              autoFocusKey={false}
              autoFocusOnMount
              placeholder={SEARCH_PLACEHOLDER}
              onNavigate={onClose}
            />
          ) : (
            <div className="relative">
              <input
                type="search"
                readOnly
                aria-busy={loading}
                aria-label="Search players, opponents, seasons, managers, stadiums, and shaped questions"
                placeholder={loading ? "Loading search…" : SEARCH_PLACEHOLDER}
                className="control w-full"
              />
            </div>
          )}
          <p className="mt-2 text-xs text-ink-faint">Players, matches, seasons, shaped questions — anything.</p>
        </div>
      </div>
    </div>
  );
}
