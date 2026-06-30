"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { MOBILE_SEARCH_PLACEHOLDER } from "@/lib/search/examples";
import { preloadSearchCommand } from "@/lib/preloadChunks";
import { scheduleIdle } from "@/lib/scheduleIdle";
import { mobileNavLabel } from "@/lib/navSections";
import { onMobileSearchOpen } from "@/lib/mobileSearch";
import { MobileNavSheet } from "@/components/mobile/MobileNavSheet";
import { MobileMatchFilterControls } from "@/components/mobile/MobileMatchFilterControls";
import { MobileSearchOverlay } from "@/components/mobile/MobileSearchOverlay";
import { useMobileShellTier } from "@/components/mobile/useMobileShellTier";

type SearchCommandComponent = typeof import("@/components/SearchCommand").SearchCommand;

function HomeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M4 10.5 12 4l8 6.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6 9.5V20h12V9.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <circle cx="11" cy="11" r="7" />
      <line x1="16.5" y1="16.5" x2="21" y2="21" />
    </svg>
  );
}

export function MobileBottomNav() {
  const pathname = usePathname();
  const shellTier = useMobileShellTier();
  const isHome = pathname === "/";
  const isMatchesPage = pathname === "/matches";
  const isPhoneShell = shellTier === "phone";
  const isNarrowShell = shellTier === "narrow";
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [SearchCommand, setSearchCommand] = useState<SearchCommandComponent | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const pillInputRef = useRef<HTMLInputElement>(null);
  const sectionLabel = mobileNavLabel(pathname);

  const ensureSearch = useCallback(async () => {
    const mod = await preloadSearchCommand();
    setSearchCommand(() => mod.SearchCommand);
    return mod.SearchCommand;
  }, []);

  useEffect(() => {
    return scheduleIdle(() => {
      void preloadSearchCommand();
    });
  }, []);

  useEffect(() => {
    if (!isNarrowShell) return;
    if (SearchCommand) return;
    setSearchLoading(true);
    void ensureSearch().finally(() => setSearchLoading(false));
  }, [SearchCommand, ensureSearch, isNarrowShell]);

  const closeMenu = () => setMenuOpen(false);
  const openMenu = () => {
    setSearchOpen(false);
    setFiltersOpen(false);
    pillInputRef.current?.blur();
    setMenuOpen(true);
  };

  const closeFilters = () => setFiltersOpen(false);
  const openFilters = () => {
    setMenuOpen(false);
    setSearchOpen(false);
    pillInputRef.current?.blur();
    setFiltersOpen(true);
  };

  const focusPillSearch = useCallback(() => {
    pillInputRef.current?.focus();
  }, []);

  const openSearch = useCallback(() => {
    setMenuOpen(false);
    setFiltersOpen(false);
    if (isNarrowShell) {
      if (SearchCommand) {
        focusPillSearch();
        return;
      }
      setSearchLoading(true);
      void ensureSearch().finally(() => {
        setSearchLoading(false);
        focusPillSearch();
      });
      return;
    }
    setSearchOpen(true);
    if (SearchCommand) return;
    setSearchLoading(true);
    void ensureSearch().finally(() => setSearchLoading(false));
  }, [SearchCommand, ensureSearch, focusPillSearch, isNarrowShell]);

  useEffect(() => onMobileSearchOpen(openSearch), [openSearch]);

  const closeSearch = useCallback(() => setSearchOpen(false), []);

  return (
    <>
      <nav
        aria-label="Mobile navigation"
        className="mobile-bottom-nav"
      >
        <div className="mobile-bottom-pill">
          {!isHome && (
            <Link
              href="/"
              aria-label="Home"
              className="mobile-pill-btn mobile-pill-btn--home tap-target focus-ring"
            >
              <HomeIcon />
            </Link>
          )}

          <button
            type="button"
            onClick={openMenu}
            aria-expanded={menuOpen}
            className="mobile-pill-section tap-target focus-ring"
          >
            <span className="mobile-pill-section-label">{sectionLabel}</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          <div className="mobile-pill-search-icon">
            <button
              type="button"
              aria-label="Search"
              aria-expanded={searchOpen}
              onClick={openSearch}
              className="mobile-pill-btn tap-target focus-ring"
            >
              <SearchIcon />
            </button>
          </div>

          <div className="mobile-pill-search-inline">
            {SearchCommand ? (
              <SearchCommand
                pillSearch
                forMatches={isMatchesPage}
                autoFocusKey={false}
                placeholder={MOBILE_SEARCH_PLACEHOLDER}
                commandInputRef={pillInputRef}
              />
            ) : (
              <input
                type="search"
                readOnly
                aria-busy={searchLoading}
                aria-label="Search the archive"
                placeholder={searchLoading ? "Loading search…" : MOBILE_SEARCH_PLACEHOLDER}
                className="mobile-pill-search-input w-full"
              />
            )}
          </div>

          {isMatchesPage && (
            <MobileMatchFilterControls
              open={filtersOpen}
              onOpen={openFilters}
              onClose={closeFilters}
            />
          )}
        </div>
      </nav>

      <MobileNavSheet open={menuOpen} onClose={closeMenu} />
      {isPhoneShell && (
        <MobileSearchOverlay
          open={searchOpen}
          onClose={closeSearch}
          SearchCommand={SearchCommand}
          loading={searchLoading}
          forMatches={isMatchesPage}
        />
      )}
    </>
  );
}
