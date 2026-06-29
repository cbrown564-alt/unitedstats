"use client";

import Link from "next/link";
import Image from "next/image";
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

/** The goals that made the night — name + minute, the line a fan recites from
 *  memory. Capped so a rout doesn't run off the edge. */
function Scorers({ scorers }: { scorers: GreatNight["scorers"] }) {
  if (scorers.length === 0) return null;
  const shown = scorers.slice(0, 5);
  const extra = scorers.length - shown.length;
  return (
    <p className="mt-3 flex flex-wrap items-baseline gap-x-4 gap-y-1 text-sm sm:text-base">
      {shown.map((s, i) => (
        <span key={i} className="text-ink-dim">
          {s.name}
          {s.minute && <span className="stat-num ml-1.5 text-win">{s.minute}</span>}
        </span>
      ))}
      {extra > 0 && <span className="text-ink-faint">+{extra} more</span>}
    </p>
  );
}

/**
 * The Red Thread, made literal — and made the monument. The luminous spine down
 * the left is read as the match clock: kickoff at the top, full time at the foot.
 * Every United goal is a bead at its real minute and the last is the gold knot, so
 * a late flurry collapses onto the foot and you see the drama as a *shape* before
 * you read a word (1999's two beads jammed at the bottom, the top three-quarters
 * empty). On load the spine wipes in top→foot, the beads pop in scoring order and
 * the knot blooms last — the late winner arrives late.
 *
 * Falls back to the static spine when a night's goal minutes aren't on record; the
 * ghosted-year monument (rendered by the hero) then carries the night instead.
 */
function ThreadTimeline({ timeline }: { timeline: GreatNight["timeline"] }) {
  const SPINE = "left-8 sm:left-14"; // the spine's x, inside the content inset

  if (timeline.length === 0) {
    return (
      <>
        <div className={`pointer-events-none absolute inset-y-0 ${SPINE} w-px bg-[linear-gradient(to_bottom,transparent,rgb(255_59_31_/0.6)_42%,rgb(255_59_31_/0.6)_58%,transparent)]`} aria-hidden />
        <div className={`pointer-events-none absolute top-1/2 ${SPINE} h-48 w-1 -translate-x-1/2 -translate-y-1/2 bg-devil-bright/40 blur-md`} aria-hidden />
        <span className={`pointer-events-none absolute top-1/2 ${SPINE} h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold shadow-[0_0_24px_6px_rgb(245_197_24_/0.45)]`} aria-hidden />
      </>
    );
  }

  // The clock frame: 0' at the top, full time at the foot. The axis runs to 96'
  // (or past the latest goal, for extra time), mapped into a band that leaves the
  // spine bleeding off the top and foot of the stage.
  const TOP = 12;
  const SPAN = 76;
  const axisMax = Math.max(96, ...timeline.map((g) => g.clock + 4));
  const y = (clock: number) => TOP + (clock / axisMax) * SPAN;
  const winnerClock = timeline[timeline.length - 1].clock;

  return (
    <>
      <div className={`thread-line pointer-events-none absolute inset-y-0 ${SPINE} w-px bg-[linear-gradient(to_bottom,transparent,rgb(255_59_31_/0.5)_12%,rgb(255_59_31_/0.5)_88%,transparent)]`} aria-hidden />
      {/* Half-time: the one quiet mark that gives the clock a middle, so a low bead reads as late. */}
      <span className={`pointer-events-none absolute ${SPINE} h-px w-2.5 -translate-x-1/2 bg-ink-faint/25`} style={{ top: `${y(45)}%` }} aria-hidden />
      {/* Light gathered at the goal that settled it, blooming in with the knot. */}
      <span
        className={`thread-bead pointer-events-none absolute ${SPINE} h-20 w-1.5 -translate-x-1/2 -translate-y-1/2 bg-gold/25 blur-md`}
        style={{ top: `${y(winnerClock)}%`, animationDelay: `${360 + (timeline.length - 1) * 150}ms` }}
        aria-hidden
      />
      {timeline.map((g, i) =>
        g.winner ? (
          <span
            key={i}
            className={`thread-knot pointer-events-none absolute ${SPINE} h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold shadow-[0_0_24px_6px_rgb(245_197_24_/0.5)]`}
            style={{ top: `${y(g.clock)}%`, animationDelay: `${360 + i * 150}ms` }}
            aria-hidden
          />
        ) : (
          <span
            key={i}
            className={`thread-bead pointer-events-none absolute ${SPINE} h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-devil-bright shadow-[0_0_10px_2px_rgb(255_59_31_/0.5)]`}
            style={{ top: `${y(g.clock)}%`, animationDelay: `${360 + i * 150}ms` }}
            aria-hidden
          />
        ),
      )}
    </>
  );
}

/**
 * The first-contact spark (CONTEXT.md §6): the front door *is* the gate, so it is
 * built like nothing else on the site — not a panel among panels, but one floodlit
 * stage carrying a single match-night.
 *
 * The composition is the signature: the brand's Red Thread runs down the left as a
 * luminous spine read as the match clock, holding each goal as a bead at its minute
 * and the winner as the knot (see ThreadTimeline); the story line is the editorial
 * lead; and the match itself is given real presence — full scoreline and the
 * goalscorers with their minutes, the line a fan recites from memory. No card, no
 * grid, no metric tiles.
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

  return (
    <div>
      {/* The stage. Bleeds past the column to the page edges and pulls flush under
          the header so it reads as a floodlit field, not a card on a page. */}
      <Link
        href={night.href}
        aria-label={`${night.line ?? `United ${night.score} ${night.opponent}`} — see the match`}
        className="group relative -mx-4 -mt-8 block overflow-hidden bg-pitch focus-ring sm:-mx-6 sm:-mt-10"
      >
        {/* Floodlight from above. */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(115%_75%_at_50%_-12%,rgba(255,238,210,0.10),transparent_55%)]" aria-hidden />

        {/* The match-winner, a faded monument bled off the right and dissolved into
            the dark — a face to carry the night. Masked on the left and foot so the
            portrait's own background (and any club crest) fades out; a devil wash
            duotones it red so it reads as atmosphere, not a stray modern photo.
            Falls back to the ghosted year. */}
        {night.image ? (
          <div
            className="pointer-events-none absolute inset-y-0 right-0 w-[70%] [-webkit-mask-composite:source-in] [mask-composite:intersect] [mask-image:linear-gradient(to_right,transparent,#000_60%),linear-gradient(to_top,transparent_6%,#000_46%)] sm:w-[56%]"
            aria-hidden
          >
            <Image
              src={night.image.src}
              alt=""
              fill
              sizes="(max-width: 640px) 70vw, 48vw"
              className="object-cover object-[center_14%] opacity-[0.2] grayscale contrast-110"
            />
            <div className="absolute inset-0 bg-[linear-gradient(to_left,rgba(216,33,13,0.32),rgba(216,33,13,0.10)_45%,transparent)] mix-blend-overlay" />
          </div>
        ) : (
          <span
            className="stat-num pointer-events-none absolute -right-6 top-1/2 -translate-y-1/2 select-none font-bold leading-none text-win/[0.05] text-[9rem] sm:text-[16rem] lg:text-[20rem]"
            aria-hidden
          >
            {night.year}
          </span>
        )}

        {/* A red wash by the thread and a vignette that sinks the edges to black —
            laid over the portrait so it reads as atmosphere, not a photo. */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_60%_at_14%_24%,rgba(216,33,13,0.18),transparent_60%)]" aria-hidden />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(125%_120%_at_45%_45%,transparent_38%,rgba(0,0,0,0.66))]" aria-hidden />

        {/* The Red Thread, made the monument: the spine read as the match clock,
            every United goal a bead at its minute, the winner the gold knot. Keyed
            by night so the re-roll re-draws the new shape. */}
        <ThreadTimeline key={`thread-${night.id}`} timeline={night.timeline} />

        {/* The night, hung off the thread. */}
        <div
          key={night.id}
          className="surprise-in relative flex min-h-[31rem] flex-col justify-center py-16 pl-16 pr-6 sm:min-h-[42rem] sm:pl-28 sm:pr-12"
        >
          <p className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.32em] text-devil-bright">
            <span className="stat-num text-sm font-bold tracking-normal text-gold">{night.year}</span>
            {night.live && <LivePulse />}
            {night.eyebrow}
          </p>

          {night.line && (
            <p className="mt-6 max-w-2xl text-balance text-[2rem] font-semibold leading-[1.08] tracking-tight text-ink sm:text-5xl sm:leading-[1.05] lg:text-6xl">
              {night.line}
            </p>
          )}

          {/* The match, given presence: the scoreline and the goals behind it. */}
          <div className="mt-8 sm:mt-10">
            <p className="flex flex-wrap items-baseline gap-x-3 text-xl font-medium sm:text-2xl">
              <span className="text-ink">United</span>
              <span className={`stat-num text-3xl font-bold sm:text-4xl ${night.tone}`}>{night.score}</span>
              <span className="text-ink">{night.opponent}</span>
            </p>
            <Scorers scorers={night.scorers} />
            <p className="mt-2.5 text-sm text-ink-faint">{night.meta}</p>
          </div>

          <span className="mt-9 inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-devil-bright sm:mt-11">
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
