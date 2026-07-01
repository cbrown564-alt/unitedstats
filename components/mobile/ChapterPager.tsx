"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

export type Chapter = {
  id: string;
  /** Short kicker above the title — act number, proof label, etc. */
  kicker?: string;
  title: string;
  /** One-line dek under the title. */
  dek?: ReactNode;
  content: ReactNode;
};

/**
 * Mobile analytics chapters — one question per viewport-height slide, horizontal
 * scroll-snap between chapters. Below `sm`, the pager; at `sm+` the same
 * chapters stack vertically with normal page rhythm.
 */
export function ChapterPager({
  chapters,
  label,
}: {
  chapters: Chapter[];
  label: string;
}) {
  const ref = useRef<HTMLUListElement>(null);
  const [active, setActive] = useState(0);

  const measure = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const slides = [...el.querySelectorAll<HTMLElement>("[data-chapter-slide]")];
    if (slides.length === 0) return;
    const mid = el.clientWidth / 2;
    let best = 0;
    let bestDist = Infinity;
    slides.forEach((slide, i) => {
      const r = slide.getBoundingClientRect();
      const center = r.left + r.width / 2 - el.getBoundingClientRect().left;
      const dist = Math.abs(center - mid);
      if (dist < bestDist) {
        bestDist = dist;
        best = i;
      }
    });
    setActive(best);
  }, []);

  useEffect(() => {
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [measure, chapters.length]);

  const scrollTo = (index: number) => {
    const el = ref.current;
    if (!el) return;
    const slide = el.querySelectorAll("[data-chapter-slide]")[index] as HTMLElement | undefined;
    slide?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  };

  if (chapters.length === 0) return null;

  return (
    <div className="chapter-pager sm:hidden">
        <ul
          ref={ref}
          aria-label={label}
          onScroll={measure}
          className="chapter-pager__track scrollbar-none flex snap-x snap-mandatory overflow-x-auto"
        >
          {chapters.map((ch) => (
            <li
              key={ch.id}
              data-chapter-slide
              className="chapter-pager__slide w-full shrink-0 snap-center"
            >
              <article className="chapter-pager__panel flex min-h-[var(--chapter-panel-min-h)] flex-col px-4 pb-4">
                <header className="chapter-pager__header shrink-0 pb-3">
                  {ch.kicker && (
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-devil-bright">
                      {ch.kicker}
                    </p>
                  )}
                  <h2 className="display text-xl leading-tight">{ch.title}</h2>
                  {ch.dek && <p className="mt-1.5 text-sm leading-6 text-ink-dim">{ch.dek}</p>}
                </header>
                <div className="chapter-pager__body min-h-0 flex-1">{ch.content}</div>
              </article>
            </li>
          ))}
        </ul>

        {chapters.length > 1 && (
          <div
            className="chapter-pager__dots flex items-center justify-center gap-2 px-4 pb-2"
            role="tablist"
            aria-label={`${label} — chapter`}
          >
            {chapters.map((ch, i) => (
              <button
                key={ch.id}
                type="button"
                role="tab"
                aria-selected={i === active}
                aria-label={`${ch.title}${i === active ? ", current" : ""}`}
                onClick={() => scrollTo(i)}
                className={`chapter-pager__dot h-2 rounded-full transition-all focus-ring ${
                  i === active ? "w-5 bg-devil-bright" : "w-2 bg-ink-faint/50"
                }`}
              />
            ))}
          </div>
        )}
        <p className="px-4 pb-2 text-center text-[11px] text-ink-faint">Swipe for the next chapter</p>
    </div>
  );
}
