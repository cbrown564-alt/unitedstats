"use client";

import { useCallback, useEffect, useState, type ComponentType } from "react";
import { preloadSearchCommand } from "@/lib/preloadChunks";
import { scheduleIdle } from "@/lib/scheduleIdle";
import { ACTIVATE_SIDEBAR_SEARCH_EVENT } from "@/lib/search/slashShortcut";

type SearchCommandProps = {
  autoFocusKey?: boolean;
  autoFocusOnMount?: boolean;
  compact?: boolean;
  placeholder?: string;
  onNavigate?: () => void;
  onDismiss?: () => void;
  inputClassName?: string;
  dropdownClassName?: string;
};

type SearchCommandComponent = ComponentType<SearchCommandProps>;

type SidebarSearchProps = {
  collapsed?: boolean;
};

const SIDEBAR_SEARCH_LABEL = "Search…";

function SearchGlyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <circle cx="11" cy="11" r="7" />
      <line x1="16.5" y1="16.5" x2="21" y2="21" />
    </svg>
  );
}

/**
 * Persistent search in the site chrome so the power-search spine stays reachable
 * on every route, not only the homepage hero.
 */
export function SidebarSearch({ collapsed = false }: SidebarSearchProps) {
  const [desktopActive, setDesktopActive] = useState(false);
  const [desktopActivating, setDesktopActivating] = useState(false);
  const [searchCommand, setSearchCommand] = useState<SearchCommandComponent | null>(null);

  const ensureSearchCommand = useCallback(async () => {
    const mod = await preloadSearchCommand();
    const Comp = mod.SearchCommand;
    setSearchCommand(() => Comp);
    return Comp;
  }, []);

  useEffect(() => {
    return scheduleIdle(() => {
      void ensureSearchCommand();
    });
  }, [ensureSearchCommand]);

  const activateDesktop = useCallback(() => {
    setDesktopActive(true);
    if (searchCommand) return;
    setDesktopActivating(true);
    void ensureSearchCommand().finally(() => setDesktopActivating(false));
  }, [ensureSearchCommand, searchCommand]);

  const deactivateDesktop = useCallback(() => {
    setDesktopActive(false);
  }, []);

  useEffect(() => {
    const onActivate = () => activateDesktop();
    window.addEventListener(ACTIVATE_SIDEBAR_SEARCH_EVENT, onActivate);
    return () => window.removeEventListener(ACTIVATE_SIDEBAR_SEARCH_EVENT, onActivate);
  }, [activateDesktop]);

  const DesktopSearch = searchCommand;

  if (collapsed) {
    if (desktopActive) {
      return DesktopSearch ? (
        <DesktopSearch
          compact
          autoFocusKey={false}
          autoFocusOnMount
          placeholder={SIDEBAR_SEARCH_LABEL}
          inputClassName="site-sidebar-search-input"
          dropdownClassName="site-sidebar-search-panel"
          onNavigate={deactivateDesktop}
          onDismiss={deactivateDesktop}
        />
      ) : (
        <div className="site-sidebar-search-input site-sidebar-search-input--loading" aria-busy="true">
          <span className="site-sidebar-search-trigger-icon">
            <SearchGlyph />
          </span>
        </div>
      );
    }

    return (
      <button
        type="button"
        aria-label="Search"
        aria-busy={desktopActivating}
        title="Search (press /)"
        data-tooltip="Search"
        onClick={activateDesktop}
        className="site-sidebar-search-trigger site-sidebar-search-trigger--icon"
        onPointerEnter={() => preloadSearchCommand()}
      >
        <span className="site-sidebar-search-trigger-icon">
          <SearchGlyph />
        </span>
      </button>
    );
  }

  return (
    <div className="site-sidebar-search-slot">
      {desktopActive ? (
        DesktopSearch ? (
          <DesktopSearch
            compact
            autoFocusKey={false}
            autoFocusOnMount
            placeholder={SIDEBAR_SEARCH_LABEL}
            inputClassName="site-sidebar-search-input"
            dropdownClassName="site-sidebar-search-panel"
            onNavigate={deactivateDesktop}
            onDismiss={deactivateDesktop}
          />
        ) : (
          <div className="site-sidebar-search-input site-sidebar-search-input--loading" aria-busy="true">
            <span className="site-sidebar-search-trigger-icon">
              <SearchGlyph />
            </span>
            <span className="site-sidebar-search-trigger-text">{SIDEBAR_SEARCH_LABEL}</span>
          </div>
        )
      ) : (
        <button
          type="button"
          aria-label="Search"
          aria-busy={desktopActivating}
          onClick={activateDesktop}
          className="site-sidebar-search-trigger"
          onPointerEnter={() => preloadSearchCommand()}
        >
          <span className="site-sidebar-search-trigger-icon">
            <SearchGlyph />
          </span>
          <span className="site-sidebar-search-trigger-text">{SIDEBAR_SEARCH_LABEL}</span>
          <kbd className="site-sidebar-kbd" aria-hidden>
            /
          </kbd>
        </button>
      )}
    </div>
  );
}
