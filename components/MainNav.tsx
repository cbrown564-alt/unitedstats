"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";

// Primary rail: the spine (Matches/Seasons), the headline discovery surface
// (Explore — the three-strip discovery home that subsumes the old Questions index,
// Phase 11.5), and the top people entries (Players/Managers). These earn a
// one-click slot. Everything else lives behind "More" — see the Phase 9
// follow-up in docs/ROADMAP.md (nav IA).
const PRIMARY = [
  ["Explore", "/explore"],
  ["Matches", "/matches"],
  ["Seasons", "/seasons"],
  ["Players", "/players"],
  ["Managers", "/managers"],
] as const;

// Overflow: lower-traffic and provisional surfaces. Compare now lives inside the
// /explore Asking strip rather than as its own nav entry; Opponents, Analytics,
// Transfers, and Data are reachable but secondary.
const OVERFLOW = [
  ["Opponents", "/opponents"],
  ["Analytics", "/analytics"],
  ["Transfers", "/transfers"],
  ["Data", "/data"],
] as const;

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

const tabClass = (active: boolean) =>
  [
    "tap-target rounded-md px-2.5 py-1.5 whitespace-nowrap transition-colors focus-ring",
    active
      ? "bg-panel-2 text-ink shadow-[inset_0_0_0_1px_var(--color-line)]"
      : "text-ink-dim hover:bg-panel-2/75 hover:text-ink",
  ].join(" ");

// SSR has no layout box, so fall back to useEffect on the server to avoid the
// hydration warning useLayoutEffect emits there.
const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

export function MainNav() {
  const pathname = usePathname();

  return (
    <div className="flex min-w-0 flex-1 items-center gap-1">
      <PrimaryRail pathname={pathname} />
      {/* Remount on route change so the menu resets to closed after navigation
          (a followed link, or navigation from anywhere else) without a
          setState-in-effect. */}
      <MoreMenu key={pathname} pathname={pathname} />
    </div>
  );
}

function PrimaryRail({ pathname }: { pathname: string }) {
  const scrollerRef = useRef<HTMLElement>(null);
  const activeRef = useRef<HTMLAnchorElement>(null);
  // Which edges have more content hidden past them — drives the fade overlays so
  // the rail reads as scrollable from whichever side still has routes. With the
  // rail trimmed to five tabs this rarely triggers on desktop, but it keeps the
  // narrow-screen fallback honest.
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
        {PRIMARY.map(([label, href]) => {
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

function MoreMenu({ pathname }: { pathname: string }) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();
  const overflowActive = OVERFLOW.some(([, href]) => isActive(pathname, href));

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
    <div ref={wrapperRef} className="relative shrink-0">
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
        className={[tabClass(overflowActive && !open), "inline-flex items-center gap-1 text-sm"].join(" ")}
      >
        More
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          aria-hidden
          className={["transition-transform", open ? "rotate-180" : ""].join(" ")}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div
          id={panelId}
          className="absolute right-0 top-full z-50 mt-2 min-w-44 rounded-md border border-line bg-panel p-1 text-sm shadow-lg shadow-black/40"
        >
          {OVERFLOW.map(([label, href]) => {
            const active = isActive(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                onClick={() => setOpen(false)}
                className={[
                  "tap-target block rounded px-2.5 py-1.5 whitespace-nowrap transition-colors focus-ring",
                  active
                    ? "bg-panel-2 text-ink shadow-[inset_0_0_0_1px_var(--color-line)]"
                    : "text-ink-dim hover:bg-panel-2 hover:text-ink",
                ].join(" ")}
              >
                {label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
