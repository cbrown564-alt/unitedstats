"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { preloadSearchCommand } from "@/lib/preloadChunks";
import { scheduleIdle } from "@/lib/scheduleIdle";
import { mobileNavLabel } from "@/lib/navSections";
import { MobileNavSheet } from "@/components/mobile/MobileNavSheet";
import { MobileSearchOverlay } from "@/components/mobile/MobileSearchOverlay";

type SearchCommandComponent = typeof import("@/components/SearchCommand").SearchCommand;

function HomeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M4 10.5 12 4l8 6.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6 9.5V20h12V9.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function MobileBottomNav() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [SearchCommand, setSearchCommand] = useState<SearchCommandComponent | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
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

  const closeMenu = () => setMenuOpen(false);
  const openMenu = () => {
    setSearchOpen(false);
    setMenuOpen(true);
  };
  const openSearch = () => {
    setMenuOpen(false);
    setSearchOpen(true);
    if (SearchCommand) return;
    setSearchLoading(true);
    void ensureSearch().finally(() => setSearchLoading(false));
  };

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
              className="mobile-pill-btn mobile-pill-btn--home focus-ring"
            >
              <HomeIcon />
            </Link>
          )}

          <button
            type="button"
            onClick={openMenu}
            aria-expanded={menuOpen}
            className="mobile-pill-section focus-ring"
          >
            <span className="mobile-pill-section-label">{sectionLabel}</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          <button
            type="button"
            aria-label="Search"
            aria-expanded={searchOpen}
            onClick={openSearch}
            className="mobile-pill-btn focus-ring"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <circle cx="11" cy="11" r="7" />
              <line x1="16.5" y1="16.5" x2="21" y2="21" />
            </svg>
          </button>

          <button
            type="button"
            aria-label="Open menu"
            aria-expanded={menuOpen}
            onClick={() => (menuOpen ? closeMenu() : openMenu())}
            className="mobile-pill-btn mobile-pill-btn--menu focus-ring"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              {menuOpen ? (
                <>
                  <line x1="6" y1="6" x2="18" y2="18" />
                  <line x1="18" y1="6" x2="6" y2="18" />
                </>
              ) : (
                <>
                  <line x1="3.5" y1="7" x2="20.5" y2="7" />
                  <line x1="3.5" y1="12" x2="20.5" y2="12" />
                  <line x1="3.5" y1="17" x2="20.5" y2="17" />
                </>
              )}
            </svg>
          </button>
        </div>
      </nav>

      <MobileNavSheet open={menuOpen} onClose={closeMenu} />
      <MobileSearchOverlay
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        SearchCommand={SearchCommand}
        loading={searchLoading}
      />
    </>
  );
}
