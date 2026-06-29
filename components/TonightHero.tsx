"use client";

import Link from "next/link";
import { useCallback, useRef, useState, type ReactNode } from "react";
import type { GreatNight, GoalMark } from "@/lib/greatNights";

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

/** The shape of the night: United's goals as marks on a 0→full-time clock, with a
 *  half-time tick for reference. Stoppage-time goals glow gold and bunch at the
 *  right, so a night won at the death reads before a single word is. */
function GoalShape({ marks }: { marks: GoalMark[] }) {
  const stoppage = marks.filter((m) => m.stoppage);
  return (
    <div>
      <div className="relative h-3">
        <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-line" aria-hidden />
        {/* Half-time, at the midpoint of regulation. */}
        <div className="absolute top-1/2 h-1.5 w-px -translate-x-1/2 -translate-y-1/2 bg-line" style={{ left: "46%" }} aria-hidden />
        {marks.map((m, i) => (
          <span
            key={i}
            className={`absolute top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full ${
              m.stoppage ? "bg-gold shadow-[0_0_8px_1px_rgb(245_197_24_/0.6)]" : "bg-devil-bright"
            }`}
            style={{ left: `${m.pos * 100}%` }}
          />
        ))}
      </div>
      <div className="mt-1.5 flex justify-between text-[10px] uppercase tracking-[0.14em] text-ink-faint">
        <span>United goals</span>
        {stoppage.length > 0 && (
          <span className="stat-num normal-case tracking-normal text-gold/80">
            {stoppage.map((m) => m.label).join(", ")}
          </span>
        )}
      </div>
    </div>
  );
}

/** Where the night falls on the whole thread of the club's history — a bead of
 *  gold light on the red line, so the spark is anchored to the foundation below. */
function ThreadMarker({ year, era }: { year: number; era: { first: number; last: number } }) {
  const span = Math.max(1, era.last - era.first);
  const pos = Math.min(1, Math.max(0, (year - era.first) / span));
  return (
    <div>
      <div className="relative h-2.5">
        <div
          className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-[linear-gradient(to_right,transparent,rgb(216_33_13_/0.55),transparent)]"
          aria-hidden
        />
        <span
          className="absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold shadow-[0_0_10px_2px_rgb(245_197_24_/0.5)]"
          style={{ left: `${pos * 100}%` }}
          aria-hidden
        />
      </div>
      <div className="mt-1 flex justify-between text-[10px] stat-num text-ink-faint">
        <span>{era.first}</span>
        <span>{era.last}</span>
      </div>
    </div>
  );
}

/**
 * The first-contact spark (CONTEXT.md §6): the front door *is* the gate, and its
 * whole job is to fire the nostalgic jolt in the first seconds. So the home page
 * opens on a single served match-night — a real night, chosen for you, told
 * story-first so it lands whether you lived it, forgot it, or never saw it.
 *
 * The story line leads; the scoreline is the proof beneath it. Under that, two
 * quiet objects deepen the night without a word: the *shape of the night* (United's
 * goals on the match clock) and *where it falls* on the whole thread of the club's
 * history — tying the spark to the foundation beat below. The plate is the door;
 * `another night` deals a fresh one in place; the steer (children) is for the
 * reader who arrives with a name, not a mood.
 *
 * Progressive enhancement, mirroring SurpriseReveal: the server renders
 * `nights[seed]`, so a shared link or a no-JS visit shows a real night with a
 * working door; the re-roll is the client layer, and the keyed swap respects the
 * global reduced-motion rule.
 */
export function TonightHero({
  nights,
  seed,
  era,
  children,
}: {
  nights: GreatNight[];
  seed: number;
  era: { first: number; last: number };
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

  const storyLeads = !!night.line;
  const scoreline = (
    <>
      United <span className={`stat-num ${night.tone}`}>{night.score}</span>{" "}
      <span className="text-ink">{night.opponent}</span>
    </>
  );

  return (
    <section>
      {/* The floodlit plate, deepened for the occasion: the pitch-line grid, a red
          floodlight wash, a soft gold pool behind the year, and a grounding shadow
          rising from the foot. The night is the whole door. */}
      <Link
        href={night.href}
        className="group relative flex min-h-[22rem] flex-col overflow-hidden rounded-xl border border-line bg-panel shadow-[0_22px_44px_rgb(0_0_0_/0.22)] transition-colors hover:border-devil/60 focus-ring sm:min-h-[26rem]"
      >
        <div className="hero-grid pointer-events-none absolute inset-0 opacity-50" aria-hidden />
        <div
          className="pointer-events-none absolute -right-24 -top-28 h-72 w-2/3 rounded-full opacity-[0.12] blur-3xl"
          style={{ backgroundColor: "var(--color-devil)" }}
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full opacity-[0.10] blur-3xl"
          style={{ backgroundColor: "var(--color-gold)" }}
          aria-hidden
        />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-[linear-gradient(to_top,var(--color-pitch),transparent)] opacity-70" aria-hidden />

        <div className="relative flex flex-1 flex-col p-6 sm:p-9">
          <div className="flex items-start justify-between gap-4">
            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-devil-bright">
              {night.live && <LivePulse />}
              {night.eyebrow}
            </p>
            <span className="stat-num text-2xl font-semibold leading-none text-gold sm:text-3xl">{night.year}</span>
          </div>

          {/* The emotional lead — the story, told big; the scoreline is the proof
              beneath. A night with no authored line leads on the scoreline itself. */}
          <div key={night.id} className="surprise-in mt-6 flex flex-1 flex-col">
            {storyLeads ? (
              <>
                <p className="max-w-3xl text-balance text-2xl font-semibold leading-snug text-ink sm:text-[2.6rem] sm:leading-[1.12]">
                  {night.line}
                </p>
                <p className="mt-4 text-sm text-ink-dim sm:text-base">
                  {scoreline} <span className="text-ink-faint">· {night.meta}</span>
                </p>
              </>
            ) : (
              <>
                <h1 className="display max-w-3xl text-4xl leading-[0.97] text-balance sm:text-5xl">{scoreline}</h1>
                <p className="mt-4 text-sm text-ink-dim sm:text-base">{night.meta}</p>
              </>
            )}

            {/* The quiet deepening, pushed to the foot of the plate. */}
            <div className="mt-auto grid gap-5 pt-9 sm:max-w-xl">
              {night.marks.length > 0 && <GoalShape marks={night.marks} />}
              <ThreadMarker year={Number(night.year)} era={era} />
            </div>
          </div>

          <span className="mt-7 inline-flex items-center gap-1.5 text-sm font-semibold text-devil-bright">
            {night.cta}
            <span aria-hidden className="transition-transform duration-200 group-hover:translate-x-0.5">→</span>
          </span>
        </div>
      </Link>

      {/* The re-roll — another night for the wanderer, one tap, no navigation. */}
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
