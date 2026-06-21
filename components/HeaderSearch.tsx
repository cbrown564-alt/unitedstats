"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

type SearchCommandProps = {
  autoFocusKey?: boolean;
  autoFocusOnMount?: boolean;
  compact?: boolean;
  placeholder?: string;
  onNavigate?: () => void;
};

const SearchCommand = dynamic<SearchCommandProps>(
  () => import("./SearchCommand").then((mod) => mod.SearchCommand),
  {
    ssr: false,
    loading: () => <SearchShell muted />,
  },
);

/**
 * Persistent search in the global header so the power-search spine stays
 * reachable on every route, not only the homepage hero.
 *
 *  - Desktop (sm+): a compact always-visible input that also owns the "/" shortcut.
 *  - Mobile: a search icon that toggles a full-width input row under the header.
 */
export function HeaderSearch() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopReady, setDesktopReady] = useState(false);
  const [mobileReady, setMobileReady] = useState(false);

  useEffect(() => {
    if (desktopReady) return;
    const onKey = (e: KeyboardEvent) => {
      const tag = document.activeElement?.tagName;
      if (e.key === "/" && tag !== "INPUT" && tag !== "SELECT" && tag !== "TEXTAREA") {
        e.preventDefault();
        setDesktopReady(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [desktopReady]);

  const openMobile = () => {
    setMobileOpen((v) => {
      const next = !v;
      if (next) setMobileReady(true);
      return next;
    });
  };

  return (
    <>
      <div className="hidden w-48 shrink-0 sm:block md:w-60 lg:w-72">
        {desktopReady ? (
          <SearchCommand compact autoFocusOnMount />
        ) : (
          <SearchShell onActivate={() => setDesktopReady(true)} />
        )}
      </div>

      <button
        type="button"
        aria-label="Search"
        aria-expanded={mobileOpen}
        onClick={openMobile}
        className="grid h-9 w-9 shrink-0 place-items-center rounded-md border border-line bg-panel text-ink-dim transition-colors hover:text-ink focus-ring sm:hidden"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <circle cx="11" cy="11" r="7" />
          <line x1="16.5" y1="16.5" x2="21" y2="21" />
        </svg>
      </button>

      {mobileOpen && (
        <div className="absolute inset-x-0 top-full border-b border-line bg-pitch/95 px-4 py-2 backdrop-blur sm:hidden">
          {mobileReady ? (
            <SearchCommand
              compact
              autoFocusKey={false}
              autoFocusOnMount
              placeholder="Search names, seasons, questions…"
              onNavigate={() => setMobileOpen(false)}
            />
          ) : (
            <SearchShell onActivate={() => setMobileReady(true)} />
          )}
        </div>
      )}
    </>
  );
}

function SearchShell({
  muted = false,
  onActivate,
}: {
  muted?: boolean;
  onActivate?: () => void;
}) {
  return (
    <input
      type="search"
      readOnly
      tabIndex={muted ? -1 : 0}
      aria-label="Search players, opponents, seasons, managers, stadiums, and shaped questions"
      placeholder="Search..."
      onFocus={onActivate}
      onPointerDown={onActivate}
      className="w-full cursor-text rounded-md border border-line bg-panel px-3 py-1.5 text-sm placeholder:text-ink-faint focus:border-devil focus:outline-none"
    />
  );
}
