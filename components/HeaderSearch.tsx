"use client";

import { useCallback, useEffect, useState, type ComponentType } from "react";
import { preloadSearchCommand } from "@/lib/preloadChunks";
import { scheduleIdle } from "@/lib/scheduleIdle";

type SearchCommandProps = {
  autoFocusKey?: boolean;
  autoFocusOnMount?: boolean;
  compact?: boolean;
  placeholder?: string;
  onNavigate?: () => void;
};

type SearchCommandComponent = ComponentType<SearchCommandProps>;

/**
 * Persistent search in the global header so the power-search spine stays
 * reachable on every route, not only the homepage hero.
 *
 *  - Desktop (sm+): a compact always-visible input that also owns the "/" shortcut.
 *  - Mobile: a search icon that toggles a full-width input row under the header.
 */
export function HeaderSearch() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopActive, setDesktopActive] = useState(false);
  const [desktopActivating, setDesktopActivating] = useState(false);
  const [mobileActivating, setMobileActivating] = useState(false);
  const [searchCommand, setSearchCommand] = useState<SearchCommandComponent | null>(null);

  const ensureSearchCommand = useCallback(async () => {
    const mod = await preloadSearchCommand();
    const Comp = mod.SearchCommand;
    setSearchCommand(() => Comp);
    return Comp;
  }, []);

  useEffect(() => {
    return scheduleIdle(() => {
      void preloadSearchCommand();
    });
  }, []);

  const activateDesktop = useCallback(() => {
    setDesktopActive(true);
    if (searchCommand) return;
    setDesktopActivating(true);
    void ensureSearchCommand().finally(() => setDesktopActivating(false));
  }, [ensureSearchCommand, searchCommand]);

  useEffect(() => {
    if (desktopActive) return;
    const onKey = (e: KeyboardEvent) => {
      const tag = document.activeElement?.tagName;
      if (e.key === "/" && tag !== "INPUT" && tag !== "SELECT" && tag !== "TEXTAREA") {
        e.preventDefault();
        activateDesktop();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [desktopActive, activateDesktop]);

  const openMobile = useCallback(() => {
    const opening = !mobileOpen;
    setMobileOpen(opening);
    if (opening && !searchCommand) {
      setMobileActivating(true);
      void ensureSearchCommand().finally(() => setMobileActivating(false));
    }
  }, [ensureSearchCommand, mobileOpen, searchCommand]);

  const DesktopSearch = searchCommand;
  const MobileSearch = searchCommand;

  return (
    <>
      <div
        className="hidden w-44 shrink-0 sm:block md:w-52"
        onPointerEnter={() => preloadSearchCommand()}
      >
        {desktopActive && DesktopSearch ? (
          <DesktopSearch compact autoFocusOnMount />
        ) : (
          <SearchShell activating={desktopActivating} onActivate={activateDesktop} />
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
          {MobileSearch ? (
            <MobileSearch
              compact
              autoFocusKey={false}
              autoFocusOnMount
              placeholder="Search names, seasons, questions…"
              onNavigate={() => setMobileOpen(false)}
            />
          ) : (
            <SearchShell activating={mobileActivating} />
          )}
        </div>
      )}
    </>
  );
}

function SearchShell({
  activating = false,
  onActivate,
}: {
  activating?: boolean;
  onActivate?: () => void;
}) {
  return (
    <div className="relative">
      <input
        type="search"
        readOnly
        tabIndex={0}
        aria-label="Search players, opponents, seasons, managers, stadiums, and shaped questions"
        aria-busy={activating}
        placeholder={activating ? "Loading search…" : "Search..."}
        onFocus={onActivate}
        onPointerDown={onActivate}
        className={`w-full cursor-text rounded-md border bg-panel px-3 py-1.5 text-sm placeholder:text-ink-faint focus:outline-none ${
          activating
            ? "border-devil pr-9 ring-2 ring-devil/30"
            : "border-line focus:border-devil"
        }`}
      />
      {activating && (
        <span
          className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-faint"
          aria-hidden
        >
          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="3"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v3a5 5 0 00-5 5H4z"
            />
          </svg>
        </span>
      )}
    </div>
  );
}
