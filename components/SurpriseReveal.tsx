"use client";

import Link from "next/link";
import { useCallback, useRef, useState } from "react";
import type { SurpriseFact, SurpriseTone } from "@/lib/surprise";

const FIGURE_TONE: Record<SurpriseTone, string> = {
  devil: "text-devil-bright",
  gold: "text-gold",
  win: "text-win",
};

// The floodlight behind the figure, tinted to the fact's result palette so a win
// glows yellow, a record gold, a defeat red — the stadium light, not a gradient.
const GLOW_TONE: Record<SurpriseTone, string> = {
  devil: "var(--color-devil-bright)",
  gold: "var(--color-gold)",
  win: "var(--color-win)",
};

/** A shuffle-bag: hands back indices in a random order with no repeat until the
 *  whole pool is spent, so a run of pulls feels deep and never stutters on the
 *  same fact twice. Refills excluding the current pick so the seam never repeats. */
function drawNext(bag: number[], len: number, current: number): number {
  if (bag.length === 0) {
    const fresh = Array.from({ length: len }, (_, i) => i).filter((i) => i !== current);
    for (let i = fresh.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [fresh[i], fresh[j]] = [fresh[j], fresh[i]];
    }
    bag.push(...fresh);
  }
  return bag.pop() ?? current;
}

/**
 * The wanderer's slot machine (Phase 18.3), made delightful: the brand's red
 * thread descends into a floodlit stage and a single curated fact hangs from its
 * knot — "pull the thread at random" rendered literally. "Surprise me again"
 * drops a fresh fact down the same thread *in place*, so "one surprising fact,
 * then another" is one tap with no navigation; the door carries the reader to the
 * full receipt.
 *
 * Progressive enhancement: the server renders `facts[seed]`, so a shared link or
 * a no-JS visit still shows a real fact with a working door; the re-roll is the
 * client layer. The reveal is keyed by fact id and the global reduced-motion rule
 * collapses its travel to an instant swap.
 */
export function SurpriseReveal({ facts, seed }: { facts: SurpriseFact[]; seed: number }) {
  const [index, setIndex] = useState(seed);
  const [pulls, setPulls] = useState(1);
  const bag = useRef<number[]>([]);

  const again = useCallback(() => {
    if (facts.length <= 1) return;
    setIndex((cur) => drawNext(bag.current, facts.length, cur));
    setPulls((n) => n + 1);
  }, [facts.length]);

  const fact = facts[index];
  if (!fact) return null;

  return (
    <div className="flex flex-col items-center">
      {/* The stage: a floodlit plate (pitch grid + a tone-tinted glow) so the fact
          has a place, not a void. The red thread runs down the centre with the
          fact as the bead tied to its knot. */}
      <div className="relative flex min-h-[26rem] w-full max-w-2xl flex-col items-center justify-center overflow-hidden rounded-2xl border border-line bg-panel px-6 py-12 text-center shadow-[0_22px_44px_rgb(0_0_0_/0.22)] sm:px-12">
        <div className="hero-grid pointer-events-none absolute inset-0 opacity-50" aria-hidden />
        <div
          className="pointer-events-none absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-[0.16] blur-3xl transition-colors duration-500"
          style={{ backgroundColor: GLOW_TONE[fact.tone] }}
          aria-hidden
        />

        {/* The thread descends from the top edge into the knot. */}
        <span
          className="pointer-events-none absolute left-1/2 top-0 h-16 w-px -translate-x-1/2 bg-[linear-gradient(to_bottom,transparent,var(--color-devil))]"
          aria-hidden
        />
        <span
          className="pointer-events-none absolute left-1/2 top-[3.75rem] h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-devil-bright shadow-[0_0_0_4px_rgb(216_33_13_/0.18)]"
          aria-hidden
        />

        {/* The bead: the fact, re-dealt on every pull. */}
        <div key={fact.id} className="surprise-in relative">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-devil-bright/80">
            {fact.eyebrow}
          </p>
          <p className={`stat-num display mt-5 text-6xl font-semibold leading-[0.92] sm:text-8xl ${FIGURE_TONE[fact.tone]}`}>
            {fact.figure}
          </p>
          <p className="mx-auto mt-5 max-w-md text-pretty text-base leading-7 text-ink-dim">
            {fact.line}
          </p>
          <Link
            href={fact.href}
            className="mt-8 inline-flex items-center gap-1.5 rounded-full border border-devil/50 bg-devil/10 px-5 py-2 text-sm font-semibold text-devil-bright transition-colors hover:border-devil hover:bg-devil/20 focus-ring"
          >
            {fact.cta}
            <span aria-hidden>→</span>
          </Link>
        </div>

        {/* The thread frays out at the foot — the tail you keep pulling. */}
        <span
          className="pointer-events-none absolute bottom-0 left-1/2 h-12 w-px -translate-x-1/2 bg-[linear-gradient(to_bottom,var(--color-devil),transparent)]"
          aria-hidden
        />
      </div>

      {/* The lever. The whole point of the surface: another pull, instantly. */}
      <button
        type="button"
        onClick={again}
        className="group mt-7 inline-flex items-center gap-2.5 rounded-full border border-line bg-panel-2 px-6 py-3 text-sm font-semibold text-ink shadow-[0_8px_20px_rgb(0_0_0_/0.25)] transition-colors hover:border-devil/60 hover:bg-panel focus-ring"
      >
        <span aria-hidden className="text-base text-devil-bright transition-transform duration-300 group-hover:rotate-180 group-active:rotate-180 motion-reduce:transition-none">
          ↻
        </span>
        Another answer
      </button>

      <p className="mt-3 text-xs text-ink-faint" aria-live="polite">
        {pulls === 1
          ? "Every find links to the matches behind it."
          : `${pulls} answers opened — there's always another.`}
      </p>
    </div>
  );
}
