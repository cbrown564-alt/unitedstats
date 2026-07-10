"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

function clamp01(t: number): number {
  return Math.min(1, Math.max(0, t));
}

/**
 * The shared skeleton of a journey opening stage (RhymeMorph, TrebleSpinoff):
 *
 * - **Chrome-off while mounted.** Journey routes hand the whole screen to the
 *   stage. Root layout's path-gated `beforeInteractive` script sets
 *   `data-chrome="off"` before first paint on hard loads; this layout effect
 *   covers client-side navigation into the route and clears the attribute on
 *   the way out. Navigating between two journey chapters is safe: React runs
 *   the outgoing stage's cleanup before the incoming stage's effect, so the
 *   attribute lands set.
 * - **Reduced motion.** Tracks `prefers-reduced-motion`; stages skip to their
 *   landed composition when it's on.
 * - **Scroll owns time.** Progress 0→1 across the runway element (sticky-stage
 *   pattern), rAF-throttled, driving every phase window in the stage.
 */
export function useJourneyStage() {
  const runwayRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [reduced, setReduced] = useState(false);

  useLayoutEffect(() => {
    document.documentElement.dataset.chrome = "off";
    return () => {
      delete document.documentElement.dataset.chrome;
    };
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduced(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    if (reduced) return;
    const el = runwayRef.current;
    if (!el) return;

    let raf = 0;
    const compute = () => {
      raf = 0;
      const rect = el.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      if (total <= 0) {
        setProgress(1);
        return;
      }
      setProgress(clamp01(-rect.top / total));
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
  }, [reduced]);

  return { runwayRef, progress, reduced };
}
