"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";

// The full section rail, in reading order: the headline discovery surface
// (Discover — the three-strip discovery home that subsumes the old Questions index,
// Phase 11.5; the /explore route is kept as a technical contract), the spine
// (Matches/Seasons), the people entries (Players/Managers), and the secondary
// surfaces (Opponents/Analytics/Transfers/Data). With the section count trimmed
// these all fit inline at desktop widths, so the old "More" overflow menu is gone
// — every section earns a one-click slot. Compare lives inside the /explore Asking
// strip rather than as its own nav entry.
//
// Below `lg` the inline rail can't fit, so we don't show a stub of it: a single
// menu button opens a sheet listing every section. That beats a horizontal-scroll
// rail where six of nine sections sit off-screen with no hint they exist.
const SECTIONS = [
  ["Discover", "/explore"],
  ["Matches", "/matches"],
  ["Seasons", "/seasons"],
  ["Players", "/players"],
  ["Managers", "/managers"],
  ["Opponents", "/opponents"],
  ["Analytics", "/analytics"],
  ["Transfers", "/transfers"],
  ["Data", "/data"],
] as const;

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

// The active tab is marked by a red thread underline rather than a filled chip:
// the brand spine, carried into wayfinding. The underline is always in the DOM
// and fades via opacity so it reads as the thread arriving at the current
// section, echoing the answer spine's transition. (`relative` anchors the
// `after` line; `left/right-2.5` insets it under the label, clear of the
// rounded corners so it stays a flat segment.)
const threadUnderline =
  "after:pointer-events-none after:absolute after:bottom-[3px] after:h-[2px] after:rounded-full after:bg-devil-bright after:transition-opacity after:content-['']";

const tabClass = (active: boolean) =>
  [
    "tap-target relative rounded-md px-2.5 py-1.5 whitespace-nowrap transition-colors focus-ring",
    threadUnderline,
    "after:left-2.5 after:right-2.5",
    active ? "text-ink after:opacity-100" : "text-ink-dim hover:bg-panel-2/75 hover:text-ink after:opacity-0",
  ].join(" ");

// SSR has no layout box, so fall back to useEffect on the server to avoid the
// hydration warning useLayoutEffect emits there.
const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

export function MainNav() {
  const pathname = usePathname();

  return (
    <div className="flex min-w-0 flex-1 items-center gap-1">
      {/* The inline rail only appears at lg+, the one width where all nine
          sections fit without scrolling. */}
      <div className="hidden min-w-0 flex-1 lg:block">
        <SectionRail pathname={pathname} />
      </div>
      {/* Below lg: a couple of pinned quick tabs plus a menu button opening a
          sheet of every section. Remount on route change so the menu resets to
          closed after a followed link without a setState-in-effect. */}
      <div className="flex min-w-0 flex-1 items-center gap-1 lg:hidden">
        <MobileQuickTabs pathname={pathname} />
        <MobileMenu key={pathname} pathname={pathname} />
      </div>
    </div>
  );
}

// Always-visible mobile entries. Discover and Matches are pinned — the front
// door and the spine — so the two most-used surfaces stay one tap away without
// opening the menu. When you're somewhere else, that section rides along as a
// third "rotating" tab so the rail reflects where you are (and gives a one-tap
// way back to it). Everything else lives in the menu sheet.
const MOBILE_PINNED = SECTIONS.slice(0, 2);

// Slightly tighter padding than the desktop rail so three tabs plus the two icon
// buttons clear the chrome on a ~400px phone.
const quickTabClass = (active: boolean) =>
  [
    "tap-target relative rounded-md px-2 py-1.5 whitespace-nowrap transition-colors focus-ring",
    threadUnderline,
    "after:left-2 after:right-2",
    active ? "text-ink after:opacity-100" : "text-ink-dim hover:bg-panel-2/75 hover:text-ink after:opacity-0",
  ].join(" ");

function MobileQuickTabs({ pathname }: { pathname: string }) {
  const active = SECTIONS.find(([, href]) => isActive(pathname, href));
  const rotating = active && !MOBILE_PINNED.some(([, href]) => href === active[1]) ? active : null;

  return (
    <nav aria-label="Quick navigation" className="flex min-w-0 items-center gap-1 text-sm">
      {MOBILE_PINNED.map(([label, href]) => {
        const active = isActive(pathname, href);
        return (
          <Link key={href} href={href} aria-current={active ? "page" : undefined} className={quickTabClass(active)}>
            {label}
          </Link>
        );
      })}
      {/* The rotating tab is always in the DOM (so SSR and the client agree) but
          hidden below ~400px, where a third tab would collide with the icons.
          Narrower phones fall back to the two pinned tabs; the active section is
          still in the menu sheet, highlighted. */}
      {rotating && (
        <Link
          href={rotating[1]}
          aria-current="page"
          className={[quickTabClass(true), "hidden min-[400px]:block"].join(" ")}
        >
          {rotating[0]}
        </Link>
      )}
    </nav>
  );
}

function SectionRail({ pathname }: { pathname: string }) {
  const scrollerRef = useRef<HTMLElement>(null);
  const activeRef = useRef<HTMLAnchorElement>(null);
  // Which edges have more content hidden past them — drives the fade overlays so
  // the rail reads as scrollable from whichever side still has routes. The full
  // nine sections fit at lg+, so this normally stays quiet; it's a safety net for
  // browser zoom or large text settings that push the rail past its box.
  const [overflow, setOverflow] = useState({ start: false, end: false });

  const measure = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setOverflow({ start: el.scrollLeft > 1, end: el.scrollLeft < max - 1 });
  }, []);

  // Keep the current page's tab in view, then measure which edges overflow.
  useIsomorphicLayoutEffect(() => {
    activeRef.current?.scrollIntoView({ inline: "center", block: "nearest" });
    measure();
  }, [pathname, measure]);

  useEffect(() => {
    const onResize = () => measure();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [measure]);

  return (
    <div className="relative min-w-0 flex-1">
      <nav
        ref={scrollerRef}
        aria-label="Primary navigation"
        onScroll={measure}
        className="scrollbar-none flex gap-1 overflow-x-auto text-sm"
      >
        {SECTIONS.map(([label, href]) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              ref={active ? activeRef : undefined}
              href={href}
              aria-current={active ? "page" : undefined}
              className={tabClass(active)}
            >
              {label}
            </Link>
          );
        })}
      </nav>
      <div
        aria-hidden
        className={[
          "pointer-events-none absolute inset-y-0 left-0 w-7 bg-gradient-to-r from-pitch to-transparent transition-opacity",
          overflow.start ? "opacity-100" : "opacity-0",
        ].join(" ")}
      />
      <div
        aria-hidden
        className={[
          "pointer-events-none absolute inset-y-0 right-0 w-7 bg-gradient-to-l from-pitch to-transparent transition-opacity",
          overflow.end ? "opacity-100" : "opacity-0",
        ].join(" ")}
      />
    </div>
  );
}

function MobileMenu({ pathname }: { pathname: string }) {
  const [open, setOpen] = useState(false);
  // Not `relative`: the panel below is a DOM child (so outside-click detection
  // via contains() works) but anchors to the header's relative box so it can span
  // the full viewport width — the same trick HeaderSearch's panel uses.
  const wrapperRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!wrapperRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={wrapperRef} className="ml-auto shrink-0 lg:hidden">
      <button
        ref={buttonRef}
        type="button"
        aria-label="Sections"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
        className="grid h-9 w-9 place-items-center rounded-md border border-line bg-panel text-ink-dim transition-colors hover:text-ink focus-ring"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          {open ? (
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

      {open && (
        <div
          id={panelId}
          className="absolute inset-x-0 top-full border-b border-line bg-pitch px-4 py-3 shadow-lg shadow-black/40 sm:px-6"
        >
          <nav aria-label="Primary navigation" className="grid grid-cols-2 gap-1.5 text-sm sm:grid-cols-3">
            {SECTIONS.map(([label, href]) => {
              const active = isActive(pathname, href);
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? "page" : undefined}
                  onClick={() => setOpen(false)}
                  className={[
                    "tap-target rounded-md border px-3 py-2.5 transition-colors focus-ring",
                    // Vertical list: the thread reads as a left red edge (the
                    // established inset-spine motif) rather than an underline.
                    active
                      ? "border-line bg-panel-2 text-ink shadow-[inset_3px_0_0_0_var(--color-devil-bright)]"
                      : "border-transparent text-ink-dim hover:bg-panel-2/75 hover:text-ink",
                  ].join(" ")}
                >
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </div>
  );
}
