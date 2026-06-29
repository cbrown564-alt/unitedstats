"use client";

import Link from "next/link";
import { useCallback, useRef, useState, type ReactNode } from "react";
import type { GreatNight } from "@/lib/greatNights";

/** A shuffle-bag: hands back indices in a random order with no repeat until the
 *  pool is spent, refilling without the current pick so the seam never stutters.
 *  Shared shape with SurpriseReveal — the wanderer's re-roll, applied to nights. */
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
 * The first-contact spark (CONTEXT.md §6): the front door *is* the gate, and its
 * whole job is to fire the nostalgic jolt in the first seconds. So the home page
 * opens on a single served match-night — a real night, chosen for you, rendered
 * with enough texture to land whether you lived it, forgot it, or never saw it —
 * the thing a live-score app structurally can't show.
 *
 * The night is the whole plate; `See the night` carries you into its full record.
 * `another night` deals a fresh one from the curated pool *in place*, so serendipity
 * costs one tap and no navigation. The steer (passed as children) sits beneath for
 * the reader who arrives with a name rather than a mood.
 *
 * Progressive enhancement, mirroring SurpriseReveal: the server renders
 * `nights[seed]`, so a shared link or a no-JS visit still shows a real night with
 * a working door; the re-roll is the client layer, and the keyed swap respects the
 * global reduced-motion rule.
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

  return (
    <section>
      {/* The floodlit plate — the shared front-door atmosphere (pitch-line grid, a
          single red floodlight wash, deep shadow) with the night hung inside it. */}
      <Link
        href={night.href}
        className="group relative block overflow-hidden rounded-xl border border-line bg-panel shadow-[0_22px_44px_rgb(0_0_0_/0.22)] transition-colors hover:border-devil/60 focus-ring"
      >
        <div className="hero-grid pointer-events-none absolute inset-0 opacity-60" aria-hidden />
        <div
          className="pointer-events-none absolute -right-24 -top-28 h-72 w-2/3 rounded-full opacity-[0.12] blur-3xl"
          style={{ backgroundColor: "var(--color-devil)" }}
          aria-hidden
        />

        <div key={night.id} className="surprise-in relative p-5 sm:p-8">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-devil-bright">
            {night.live && <LivePulse />}
            {night.eyebrow}
          </p>

          <p className="stat-num mt-4 text-lg font-semibold text-ink-dim sm:text-xl">{night.year}</p>

          <h1 className="display mt-1 text-4xl leading-[0.97] text-balance max-w-3xl sm:text-5xl">
            United <span className={`stat-num ${night.tone}`}>{night.score}</span>{" "}
            <span className="text-ink">{night.opponent}</span>
          </h1>

          <p className="mt-3 text-sm text-ink-dim sm:text-base">{night.meta}</p>

          {night.line && (
            <p className="mt-4 max-w-2xl text-pretty text-base leading-7 text-ink sm:text-lg">{night.line}</p>
          )}

          <span className="mt-7 inline-flex items-center gap-1.5 text-sm font-semibold text-devil-bright">
            {night.cta}
            <span aria-hidden className="transition-transform duration-200 group-hover:translate-x-0.5">→</span>
          </span>
        </div>
      </Link>

      {/* The re-roll — another night for the wanderer, one tap, no navigation.
          Outside the plate so the plate stays one clean door. */}
      <div className="mt-4">
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
    </section>
  );
}
