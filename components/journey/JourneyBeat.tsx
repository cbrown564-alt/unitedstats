"use client";

import Link from "next/link";
import { type ReactNode } from "react";

type Props = {
  /** 1-based beat number, ghosted behind the section. */
  step: number;
  headline: ReactNode;
  sub: ReactNode;
  children: ReactNode;
  /** Optional pointer into the living product surface this beat reuses. */
  source?: ReactNode;
  /** Chapters alternate their editorial weight instead of repeating one centred stack. */
  align?: "left" | "right" | "center";
  className?: string;
};

/** A filament knot and quiet link — provenance without breaking the stage register. */
export function JourneySourceLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="group inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.16em] text-ink-faint transition hover:text-gold focus-ring"
    >
      <span className="h-1 w-1 shrink-0 rounded-full bg-devil-bright/35 transition group-hover:bg-gold/70" aria-hidden />
      <span>{label}</span>
      <span className="opacity-50 transition group-hover:translate-x-0.5 group-hover:opacity-90" aria-hidden>
        →
      </span>
    </Link>
  );
}

/** An authored fact anchor. Native text decoration keeps the mark attached to
 * its phrase at every viewport and with every font load, without asking the
 * journey thread to perform another structural job below the opening morph. */
export function JourneyThreadAnchor({ children }: { children: ReactNode }) {
  return <span className="journey-thread-anchor">{children}</span>;
}

/**
 * One station on the journey below the opening morph. The reused app graphic is
 * the payload; the atmospheric dressing (floodlight, beat number and headline)
 * sits *around* it, never on it — so the beat reads in TonightHero's register
 * rather than as a dashboard panel. The scroll-driven opener is the route's one
 * substantial animation; these stations are deliberately present in the document
 * from first paint, so a fast scroll, print/save, or deep link never produces an
 * empty run of thread. Headlines can mark one authored phrase — the exact fact
 * the following graphic proves — without asking the opening's filament to
 * repeat as a connector between every section.
 */
export function JourneyBeat({
  step,
  headline,
  sub,
  children,
  source,
  align = "center",
  className = "",
}: Props) {
  const alignment =
    align === "left"
      ? "items-start text-left"
      : align === "right"
        ? "items-end text-right"
        : "items-center text-center";
  const headingWidth = align === "center" ? "max-w-3xl" : "max-w-2xl";

  return (
    <section
      className={`relative flex flex-col items-center px-5 py-10 sm:py-12 lg:py-14 ${className}`}
    >
      <div
        className={`flex w-full flex-col ${alignment}`}
      >
        <div className={`relative flex w-full flex-col ${alignment}`}>
          <span
            aria-hidden
            className={`pointer-events-none absolute -top-14 select-none stat-num text-[8rem] font-bold leading-none text-ink/[0.035] sm:-top-20 sm:text-[11rem] ${
              align === "left" ? "-left-3" : align === "right" ? "-right-3" : "left-1/2 -translate-x-1/2"
            }`}
          >
            0{step}
          </span>
          <h2 className={`relative mt-5 ${headingWidth} text-balance text-[2rem] font-semibold leading-[1.02] tracking-tight text-ink sm:text-5xl lg:text-[3.35rem]`}>
            {headline}
          </h2>
          <p className="relative mt-4 max-w-xl text-balance text-sm leading-6 text-ink-dim sm:text-base">{sub}</p>
          {source && <div className="relative mt-5">{source}</div>}
        </div>

        {/* The reused graphic has room to become the scene, rather than a tiny
            dashboard attachment under the chapter heading. */}
        <div className="mt-12 w-full sm:mt-16">{children}</div>
      </div>
    </section>
  );
}
