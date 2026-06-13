"use client";

import { useState } from "react";
import { SearchCommand } from "./SearchCommand";

/**
 * Persistent search in the global header so the power-search spine stays
 * reachable on every route, not only the homepage hero.
 *
 *  - Desktop (sm+): a compact always-visible input that also owns the "/" shortcut.
 *  - Mobile: a search icon that toggles a full-width input row under the header.
 */
export function HeaderSearch() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <div className="hidden w-48 shrink-0 sm:block md:w-60 lg:w-72">
        <SearchCommand compact />
      </div>

      <button
        type="button"
        aria-label="Search"
        aria-expanded={mobileOpen}
        onClick={() => setMobileOpen((v) => !v)}
        className="grid h-9 w-9 shrink-0 place-items-center rounded-md border border-line bg-panel text-ink-dim transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-devil-bright sm:hidden"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <circle cx="11" cy="11" r="7" />
          <line x1="16.5" y1="16.5" x2="21" y2="21" />
        </svg>
      </button>

      {mobileOpen && (
        <div className="absolute inset-x-0 top-full border-b border-line bg-pitch/95 px-4 py-2 backdrop-blur sm:hidden">
          <SearchCommand
            compact
            autoFocusKey={false}
            autoFocusOnMount
            placeholder="Search names, seasons, questions…"
            onNavigate={() => setMobileOpen(false)}
          />
        </div>
      )}
    </>
  );
}
