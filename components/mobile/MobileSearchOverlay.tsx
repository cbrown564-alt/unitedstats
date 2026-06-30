"use client";

import { useEffect } from "react";
import { SEARCH_PLACEHOLDER } from "@/lib/search/examples";
import { useAnimatedOverlay } from "@/components/mobile/useAnimatedOverlay";
import { useBodyScrollLock } from "@/components/mobile/useBodyScrollLock";

type SearchCommandComponent = typeof import("@/components/SearchCommand").SearchCommand;

type MobileSearchOverlayProps = {
  open: boolean;
  onClose: () => void;
  SearchCommand: SearchCommandComponent | null;
  loading: boolean;
};

const EXIT_MS = 280;

export function MobileSearchOverlay({ open, onClose, SearchCommand, loading }: MobileSearchOverlayProps) {
  const { mounted, closing, onExitComplete } = useAnimatedOverlay(open, EXIT_MS);

  useBodyScrollLock(mounted && !closing);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, open]);

  if (!mounted) return null;

  const rootClass = closing ? "mobile-search-root--closing" : "mobile-search-root--open";
  const panelClass = closing ? "mobile-search-panel--closing" : "mobile-search-panel--open";

  return (
    <div className={`mobile-search-root ${rootClass}`} role="dialog" aria-modal="true" aria-label="Search">
      <button type="button" aria-label="Close search" className="mobile-sheet-backdrop" onClick={onClose} />

      <div className={`mobile-search-panel ${panelClass}`} onAnimationEnd={closing ? onExitComplete : undefined}>
        <div className="mobile-search-header">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-devil-bright">Search</p>
          <button
            type="button"
            onClick={onClose}
            className="mobile-search-close tap-target focus-ring"
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
