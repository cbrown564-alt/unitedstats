"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

const NAV = [
  ["Questions", "/questions"],
  ["Matches", "/matches"],
  ["Seasons", "/seasons"],
  ["Players", "/players"],
  ["Managers", "/managers"],
  ["Opponents", "/opponents"],
  ["Analytics", "/analytics"],
  ["Data", "/data"],
] as const;

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

// SSR has no layout box, so fall back to useEffect on the server to avoid the
// hydration warning useLayoutEffect emits there.
const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

export function MainNav() {
  const pathname = usePathname();
  const scrollerRef = useRef<HTMLElement>(null);
  const activeRef = useRef<HTMLAnchorElement>(null);
  // Which edges have more content hidden past them — drives the fade overlays so
  // the rail reads as scrollable from whichever side still has routes.
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
        {NAV.map(([label, href]) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              ref={active ? activeRef : undefined}
              href={href}
              aria-current={active ? "page" : undefined}
              className={[
                "rounded-md px-2.5 py-1.5 whitespace-nowrap transition-colors",
                "focus-ring",
                active
                  ? "bg-panel-2 text-ink shadow-[inset_0_0_0_1px_var(--color-line)]"
                  : "text-ink-dim hover:bg-panel-2/75 hover:text-ink",
              ].join(" ")}
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
