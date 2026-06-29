"use client";

import Link from "next/link";
import { useCallback, useRef, useState, type ReactNode } from "react";
import type { GreatNight } from "@/lib/greatNights";

/** A shuffle-bag: hands back indices in a random order with no repeat until the
 *  pool is spent, refilling without the current pick so the seam never stutters. */
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

function LivePulse() {
  return (
    <span className="relative flex h-1.5 w-1.5" aria-hidden>
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-devil-bright/70" />
      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-devil-bright" />
    </span>
  );
}

/**
 * The first-contact spark (CONTEXT.md §6): the front door *is* the gate, so it is
 * built like nothing else on the site — not a panel among panels, but one floodlit
 * stage. A single served match-night fills it, told story-first so it lands whether
 * you lived it, forgot it, or never saw it.
 *
 * The composition is the signature: the brand's Red Thread runs down the left as a
 * luminous spine and holds the night at its knot; the story line is the large,
 * editorial lead; the scoreline is a quiet two-tier caption; and the year looms as
 * a ghosted monument — the shorthand a fan reaches for ("the '99"). No card, no
 * grid, no metric tiles. The plate bleeds to the page edges and sits flush under
 * the header; everything quiet so the one bright thing is the night.
 *
 * Progressive enhancement, mirroring SurpriseReveal: the server renders
 * `nights[seed]`, so a shared link or a no-JS visit shows a real night with a
 * working door; `another night` is the client layer, and the keyed swap respects
 * the global reduced-motion rule.
 */
export function TonightHero({
  nights,
  seed,
  children,
}: {
  nights: GreatNight[];
  seed: number;
  children?: ReactNode;
}) {
  const [index, setIndex] = useState(seed);
  const bag = useRef<number[]>([]);

  const again = useCallback(() => {
    if (nights.length <= 1) return;
    setIndex((cur) => drawNext(bag.current, nights.length, cur));
  }, [nights.length]);

  const night = nights[index];
  if (!night) return null;

  const matchup = (
    <>
      <span className="text-ink-dim">United</span>{" "}
      <span className={`stat-num font-semibold ${night.tone}`}>{night.score}</span>{" "}
      <span className="text-ink">{night.opponent}</span>
    </>
  );

  return (
    <div>
      {/* The stage. Bleeds past the column to the page edges and pulls flush under
          the header (cancelling the main padding) so it reads as a floodlit field,
          not a card on a page. */}
      <Link
        href={night.href}
        aria-label={`${night.line ?? `United ${night.score} ${night.opponent}`} — see the match`}
        className="group relative -mx-4 -mt-8 block overflow-hidden bg-pitch focus-ring sm:-mx-6 sm:-mt-10"
      >
        {/* Floodlight from above, a red wash by the thread, and a vignette that
            sinks the edges to black — the light does the atmosphere, not a texture. */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(115%_75%_at_50%_-12%,rgba(255,238,210,0.11),transparent_55%)]" aria-hidden />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_60%_at_14%_24%,rgba(216,33,13,0.16),transparent_60%)]" aria-hidden />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(125%_120%_at_50%_42%,transparent_45%,rgba(0,0,0,0.6))]" aria-hidden />

        {/* The year, a ghosted monument bleeding off the right — the shorthand a fan
            reaches for, present without competing. */}
        <span
          className="stat-num pointer-events-none absolute -right-6 top-1/2 -translate-y-1/2 select-none font-bold leading-none text-win/[0.05] text-[9rem] sm:text-[16rem] lg:text-[20rem]"
          aria-hidden
        >
          {night.year}
        </span>

        {/* The Red Thread — a luminous spine down the left, brightest at the knot
            that holds the night, bleeding off the top and foot of the stage. */}
        <div
          className="pointer-events-none absolute inset-y-0 left-8 w-px bg-[linear-gradient(to_bottom,transparent,rgb(255_59_31_/0.65)_42%,rgb(255_59_31_/0.65)_58%,transparent)] sm:left-14"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute left-8 top-1/2 h-48 w-1 -translate-x-1/2 -translate-y-1/2 bg-devil-bright/40 blur-md sm:left-14"
          aria-hidden
        />
        <span
          className="pointer-events-none absolute left-8 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold shadow-[0_0_24px_6px_rgb(245_197_24_/0.45)] sm:left-14"
          aria-hidden
        />

        {/* The night, hung off the thread. */}
        <div
          key={night.id}
          className="surprise-in relative flex min-h-[30rem] flex-col justify-center py-16 pl-16 pr-6 sm:min-h-[40rem] sm:pl-28 sm:pr-12"
        >
          <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.32em] text-devil-bright">
            {night.live && <LivePulse />}
            {night.eyebrow}
          </p>

          {night.line ? (
            <>
              <p className="mt-6 max-w-2xl text-balance text-[2rem] font-semibold leading-[1.08] tracking-tight text-ink sm:text-5xl sm:leading-[1.05] lg:text-6xl">
                {night.line}
              </p>
              <p className="mt-7 text-lg text-ink-dim sm:mt-9 sm:text-xl">{matchup}</p>
              <p className="mt-1.5 text-sm text-ink-faint">{night.meta}</p>
            </>
          ) : (
            <>
              <p className="mt-6 max-w-3xl text-balance text-4xl font-semibold leading-[1.04] tracking-tight sm:text-6xl lg:text-7xl">
                {matchup}
              </p>
              <p className="mt-5 text-sm text-ink-faint sm:text-base">{night.meta}</p>
            </>
          )}

          <span className="mt-10 inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-devil-bright sm:mt-12">
            {night.cta}
            <span aria-hidden className="transition-transform duration-200 group-hover:translate-x-1">→</span>
          </span>
        </div>
      </Link>

      {/* The re-roll — another night for the wanderer, one tap, no navigation. */}
      <div className="mt-6">
        <button
          type="button"
          onClick={again}
          className="group inline-flex items-center gap-2 rounded-full border border-line bg-panel-2 px-5 py-2.5 text-sm font-semibold text-ink shadow-[0_8px_20px_rgb(0_0_0_/0.25)] transition-colors hover:border-devil/60 hover:bg-panel focus-ring"
        >
          <span
            aria-hidden
            className="text-base text-devil-bright transition-transform duration-300 group-hover:rotate-180 group-active:rotate-180 motion-reduce:transition-none"
          >
            ↻
          </span>
          Another night
        </button>
      </div>

      {/* The steer — for the reader who arrives with a name, not a mood. */}
      {children && <div className="mt-6">{children}</div>}
    </div>
  );
}
