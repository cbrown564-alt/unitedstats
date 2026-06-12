"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

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

export function MainNav() {
  const pathname = usePathname();

  return (
    <div className="relative min-w-0 flex-1">
      <nav
        aria-label="Primary navigation"
        className="scrollbar-none flex gap-1 overflow-x-auto pr-5 text-sm"
      >
        {NAV.map(([label, href]) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={[
                "rounded-md px-2.5 py-1.5 whitespace-nowrap transition-colors",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-devil-bright",
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
        className="pointer-events-none absolute inset-y-0 right-0 w-7 bg-gradient-to-l from-pitch to-transparent"
      />
    </div>
  );
}
