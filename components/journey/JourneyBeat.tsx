"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

type Props = {
  /** 1-based station number, shown on the thread knot. */
  step: number;
  eyebrow: string;
  headline: string;
  sub: ReactNode;
  children: ReactNode;
  /** The climax beat pulls the gold accent; others stay red. */
  gold?: boolean;
  /** Draw the connecting thread running up into this beat (all but the first). */
  connect?: boolean;
};

/**
 * One station on the journey below the opening morph. The reused app graphic is
 * the payload; the atmospheric dressing (floodlight, eyebrow, headline, the thread
 * knot) sits *around* it, never on it — so the beat reads in TonightHero's register
 * rather than as a dashboard panel. Content rises in as the beat scrolls into view;
 * the thread knot ties the station to the continuous filament. Honours
 * prefers-reduced-motion: everything lands immediately, no travel.
 */
export function JourneyBeat({ step, eyebrow, headline, sub, children, gold = false, connect = true }: Props) {
  const ref = useRef<HTMLElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShown(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setShown(true);
            io.disconnect();
            break;
          }
        }
      },
      { rootMargin: "0px 0px -18% 0px", threshold: 0.15 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const accent = gold ? "rgb(245 197 24)" : "rgb(255 90 50)";

  return (
    <section
      ref={ref}
      className="relative flex flex-col items-center px-5 py-16 text-center sm:py-24"
    >
      {/* The connective thread: a short filament running up from the previous beat
          into this station's knot, so the journey reads as one continuous thread. */}
      {connect && (
        <span
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-0 h-14 w-px -translate-x-1/2 sm:h-20"
          style={{ background: "linear-gradient(to bottom, transparent, rgba(255,90,50,0.5))" }}
        />
      )}
      <span
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-14 -translate-x-1/2 sm:top-20"
        style={{
          transform: "translate(-50%, -50%)",
          width: 9,
          height: 9,
          borderRadius: 9999,
          background: accent,
          boxShadow: `0 0 14px 2px ${accent}`,
        }}
      />

      <div
        className="flex w-full flex-col items-center transition-all duration-700 ease-out"
        style={{
          opacity: shown ? 1 : 0,
          transform: shown ? "none" : "translateY(22px)",
        }}
      >
        <p
          className="mt-6 text-[11px] font-semibold uppercase tracking-[0.32em]"
          style={{ color: gold ? "rgb(245 197 24)" : "var(--color-devil-bright)" }}
        >
          {eyebrow}
        </p>
        <h2 className="mt-4 max-w-2xl text-balance text-[1.7rem] font-semibold leading-[1.08] tracking-tight text-ink sm:text-4xl">
          {headline}
        </h2>
        <p className="mt-3 max-w-xl text-balance text-sm text-ink-dim sm:text-base">{sub}</p>

        {/* The reused graphic — framed by light, not a border. */}
        <div className="mt-10 w-full">{children}</div>
      </div>
    </section>
  );
}
