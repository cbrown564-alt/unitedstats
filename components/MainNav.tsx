"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { NAV_SECTIONS, isNavActive } from "@/lib/navSections";

// SSR has no layout box, so fall back to useEffect on the server to avoid the
// hydration warning useLayoutEffect emits there.
const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

const threadUnderline =
  "after:pointer-events-none after:absolute after:bottom-[3px] after:h-[2px] after:rounded-full after:bg-devil-bright after:transition-opacity after:content-['']";

const tabClass = (active: boolean) =>
  [
    "tap-target relative rounded-md px-2.5 py-1.5 whitespace-nowrap transition-colors focus-ring",
    threadUnderline,
    "after:left-2.5 after:right-2.5",
    active ? "text-ink after:opacity-100" : "text-ink-dim hover:bg-panel-2/75 hover:text-ink after:opacity-0",
  ].join(" ");

/** Desktop primary navigation rail (lg+). Mobile uses the floating bottom pill. */
export function MainNav() {
  const pathname = usePathname();

  return (
    <div className="flex min-w-0 flex-1 items-center gap-1">
      <div className="hidden min-w-0 flex-1 lg:block">
        <SectionRail pathname={pathname} />
      </div>
    </div>
  );
}

function SectionRail({ pathname }: { pathname: string }) {
  const scrollerRef = useRef<HTMLElement>(null);
  const activeRef = useRef<HTMLAnchorElement>(null);
  const [overflow, setOverflow] = useState({ start: false, end: false });

  const measure = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setOverflow({ start: el.scrollLeft > 1, end: el.scrollLeft < max - 1 });
  }, []);

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
        {NAV_SECTIONS.map(([label, href]) => {
          const active = isNavActive(pathname, href);
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
