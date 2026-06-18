"use client";

import { useEffect, useRef, useState } from "react";
import { fmtNum } from "@/lib/format";

export type JumpChip = {
  /** Stable key. */
  key: string;
  /** Chip face — a season ("1970-71"), period ("1965–69") or decade ("1960s"). */
  label: string;
  /** Season id this chip jumps to (newest season in its span). */
  anchor: string;
  /** Matches under the chip's span — shown as the quiet sub-figure. */
  n: number;
  /** Every season id this chip covers, for the scrollspy → active mapping. */
  seasons: string[];
};

const base =
  "shrink-0 rounded-md border px-2.5 py-1 text-center transition-colors focus-ring";
const idle = "border-line bg-panel text-ink-dim hover:border-devil/50 hover:bg-panel-2 hover:text-ink";
const on = "border-devil bg-devil/15 text-ink";

/**
 * The interactive half of {@link ArchiveJumpRail}: a horizontally-scrolling chip
 * rail that (a) can pin under the site header while you read the archive and
 * (b) tracks the season nearest the top via an IntersectionObserver, lighting the
 * matching chip and keeping it in view. Only the small derived chip list crosses
 * the server→client boundary — never the match rows themselves.
 */
export function JumpRail({
  chips,
  label,
  idPrefix,
  sticky = false,
}: {
  chips: JumpChip[];
  label: string;
  idPrefix: string;
  sticky?: boolean;
}) {
  const [active, setActive] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const chipRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const didMount = useRef(false);

  // Scrollspy: light the chip whose span owns the season currently nearest the
  // top, accounting for the sticky header (+ rail) eating the first ~120px.
  useEffect(() => {
    const idToChip = new Map<string, number>();
    chips.forEach((c, i) => c.seasons.forEach((s) => idToChip.set(`${idPrefix}-${s}`, i)));
    const els = [...idToChip.keys()]
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el != null);
    if (els.length === 0) return;

    const visible = new Set<HTMLElement>();
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) visible.add(e.target as HTMLElement);
          else visible.delete(e.target as HTMLElement);
        }
        let best: HTMLElement | null = null;
        let top = Infinity;
        visible.forEach((el) => {
          const t = el.getBoundingClientRect().top;
          if (t < top) {
            top = t;
            best = el;
          }
        });
        if (best) {
          const idx = idToChip.get((best as HTMLElement).id);
          if (idx != null) setActive(idx);
        }
      },
      { rootMargin: "-120px 0px -55% 0px", threshold: 0 },
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [chips, idPrefix]);

  // Keep the active chip in view inside the rail — scroll the rail only, never
  // the page (no scrollIntoView, which would yank the viewport vertically).
  useEffect(() => {
    if (!didMount.current) {
      didMount.current = true;
      return;
    }
    const rail = scrollRef.current;
    const chip = chipRefs.current[active];
    if (!rail || !chip) return;
    const rr = rail.getBoundingClientRect();
    const cr = chip.getBoundingClientRect();
    const delta = cr.left - rr.left - (rail.clientWidth - chip.clientWidth) / 2;
    rail.scrollBy({ left: delta, behavior: "smooth" });
  }, [active]);

  return (
    <nav
      aria-label={label}
      className={
        sticky
          ? "sticky top-14 z-30 -mx-4 border-y border-line bg-pitch/95 px-4 py-2 backdrop-blur sm:-mx-6 sm:px-6"
          : ""
      }
    >
      <div className="flex items-center gap-3">
        <span className="hidden shrink-0 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-faint sm:block">
          {label}
        </span>
        <div
          ref={scrollRef}
          className="scrollbar-none flex min-w-0 flex-1 gap-1.5 overflow-x-auto py-0.5 [mask-image:linear-gradient(to_right,transparent,#000_1rem,#000_calc(100%-1rem),transparent)]"
        >
          {chips.map((c, i) => {
            const isOn = i === active;
            return (
              <a
                key={c.key}
                ref={(el) => {
                  chipRefs.current[i] = el;
                }}
                href={`#${idPrefix}-${c.anchor}`}
                aria-current={isOn ? "true" : undefined}
                className={`${base} ${isOn ? on : idle}`}
              >
                <span className="stat-num block text-xs font-semibold leading-tight">{c.label}</span>
                <span
                  className={`stat-num block text-[10px] leading-tight ${isOn ? "text-devil-bright" : "text-ink-faint"}`}
                >
                  {fmtNum(c.n)}
                </span>
              </a>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
