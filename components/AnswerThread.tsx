"use client";

import { useEffect, useState } from "react";

export type ThreadStation = { id: string; label: string; node: React.ReactNode; /** Collapse behind a disclosure on mobile — methodology / coverage appendix. */ mobileAppendix?: boolean };

/**
 * The answer page as a thread: each stage of the argument — answer, evidence,
 * definition, coverage, and finally the matches behind it — is a station on a
 * continuous red spine running down the left. The spine fills red to the station
 * nearest the top as you scroll and terminates at the matches, so the brand
 * promise ("follow the red thread to every match behind the answer") is the
 * literal structure of the page, not chrome bolted beside it.
 *
 * The station content is server-rendered (charts, prose) and threaded through as
 * `node`; only the active-station tracking is client-side. Active = the last
 * station whose top has crossed the header line, with a bottom guard so the
 * final footnotes — which can sit too low to reach the line — still complete the
 * thread once the page is scrolled to its end.
 */
export function AnswerThread({ stations }: { stations: ThreadStation[] }) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const OFFSET = 96; // clears the sticky site header (~56px) plus breathing room
    const items = stations
      .map((s, i) => ({ i, el: document.getElementById(s.id) }))
      .filter((x): x is { i: number; el: HTMLElement } => x.el != null);
    if (items.length === 0) return;

    let raf = 0;
    const compute = () => {
      raf = 0;
      let idx = 0;
      for (const { i, el } of items) {
        if (el.getBoundingClientRect().top - OFFSET <= 0) idx = i;
      }
      if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 4) {
        idx = items[items.length - 1].i;
      }
      setActive(idx);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(compute);
    };
    compute();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [stations]);

  return (
    <ol>
      {stations.map((s, i) => {
        const isLast = i === stations.length - 1;
        const reached = i <= active;
        const passed = i < active;
        return (
          <li
            key={s.id}
            id={s.id}
            className="grid scroll-mt-24 grid-cols-[1.25rem_minmax(0,1fr)] gap-x-3 sm:grid-cols-[1.5rem_minmax(0,1fr)] sm:gap-x-4"
          >
            <div className="flex flex-col items-center" aria-hidden>
              <span
                className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full transition-colors duration-500 ${
                  reached ? "bg-devil-bright" : "border border-ink-faint bg-pitch"
                } ${i === active ? "ring-4 ring-devil-bright/20" : ""}`}
              />
              {!isLast && (
                // On phones the connector runs unbroken from the dot so the
                // stations read as one continuous thread; the desktop keeps the
                // small beaded gaps (sm:my-1.5) that suit the wider layout.
                <span
                  className={`my-0 w-px flex-1 transition-colors duration-500 sm:my-1.5 ${passed ? "bg-devil-bright" : "bg-line"}`}
                />
              )}
            </div>
            {/* Tighter inter-station runs on mobile keep the thread from
                stretching into long empty stops on a tall, narrow screen. */}
            <div className={`min-w-0 ${isLast ? "pb-1" : "pb-8 sm:pb-12"}`}>
              <p
                className={`mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] transition-colors ${
                  i === active ? "text-ink" : reached ? "text-ink-dim" : "text-ink-faint"
                }`}
              >
                {s.label}
              </p>
              {s.mobileAppendix ? (
                <>
                  <details className="sm:hidden">
                    <summary className="cursor-pointer text-sm text-ink-dim hover:text-ink focus-ring">
                      Show {s.label.toLowerCase()}
                    </summary>
                    <div className="mt-3">{s.node}</div>
                  </details>
                  <div className="hidden sm:block">{s.node}</div>
                </>
              ) : (
                s.node
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
