"use client";

import Image from "next/image";
import { useState } from "react";
import type { ReactNode } from "react";

type Direction = "signal" | "poster" | "archive";

const DIRECTIONS: Array<{
  id: Direction;
  number: string;
  name: string;
  premise: string;
  tradeoff: string;
}> = [
  {
    id: "signal",
    number: "01",
    name: "Answer signal",
    premise: "Keep the evidence object as the hero. The card answers the question before the click.",
    tradeoff: "Most legible and easiest to roll into the existing renderer; the media is supporting evidence.",
  },
  {
    id: "poster",
    number: "02",
    name: "Match-night poster",
    premise: "Let the rich media carry the emotional entry point, then pin a hard statistic over it.",
    tradeoff: "Most memorable in a feed; needs careful image selection and contrast testing per card.",
  },
  {
    id: "archive",
    number: "03",
    name: "Archive cover",
    premise: "Treat every shared link like a small piece of club ephemera: date, place, finding, provenance.",
    tradeoff: "Most distinctive editorially; the type system has less room for long dynamic titles.",
  },
];

function Brand({ inverse = false }: { inverse?: boolean }) {
  return (
    <span className={`font-semibold tracking-[0.18em] ${inverse ? "text-[#f1ebe4]" : "text-[#171311]"}`}>
      <span className="text-[#ef3b22]">RED</span> THREAD
    </span>
  );
}

function MiniBars() {
  const bars = [38, 53, 29, 68, 44, 84, 57, 76, 92, 63, 100, 72, 88, 61];
  return (
    <div className="flex h-20 items-end gap-1.5 border-b border-white/20 pb-0.5">
      {bars.map((height, i) => (
        <span
          key={i}
          className={`flex-1 rounded-t-[2px] ${i > 8 ? "bg-[#ffd94a]" : "bg-[#ff3b1f]/50"}`}
          style={{ height: `${height}%` }}
        />
      ))}
    </div>
  );
}

function CardFrame({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`relative aspect-[1200/630] w-full overflow-hidden ${className}`}>
      {children}
    </div>
  );
}

function SignalCard() {
  return (
    <CardFrame className="bg-[#0c0b0a] text-[#f3ede8]">
      <div className="hero-grid pointer-events-none absolute inset-0 opacity-40" aria-hidden />
      <div className="absolute inset-y-0 left-0 w-2 bg-[#ff3b1f]" />
      <div className="relative flex h-full flex-col justify-between p-[5.3%_6%]">
        <div className="flex items-center gap-4 text-[clamp(0.55rem,1.55vw,1.1rem)]">
          <Brand inverse />
          <span className="text-[#a89c94]">TESTED AGAINST THE RECORD</span>
          <span className="ml-auto font-mono text-[#6f645d]">1986 — 2026</span>
        </div>

        <div className="grid grid-cols-[1.13fr_0.87fr] items-end gap-[5%]">
          <div>
            <p className="mb-3 text-[clamp(0.58rem,1.5vw,1rem)] font-semibold uppercase tracking-[0.2em] text-[#ff3b1f]">
              A question with a number behind it
            </p>
            <h2 className="max-w-[14ch] text-[clamp(1.4rem,4.5vw,3.6rem)] font-extrabold leading-[0.97] tracking-[-0.045em]">
              Did United really win late?
            </h2>
            <div className="mt-5 flex items-baseline gap-3">
              <span className="font-mono text-[clamp(1.6rem,4.8vw,3.9rem)] text-[#ffd94a]">18.4%</span>
              <span className="max-w-[14rem] text-[clamp(0.55rem,1.5vw,1rem)] leading-tight text-[#a89c94]">
                of goals arrived after 75′ in the Ferguson era
              </span>
            </div>
          </div>
          <div className="pb-1">
            <MiniBars />
            <div className="mt-2 flex justify-between font-mono text-[clamp(0.45rem,1.05vw,0.75rem)] text-[#6f645d]">
              <span>1960</span><span>1986</span><span>2013</span>
            </div>
          </div>
        </div>

        <div className="flex gap-2 text-[clamp(0.5rem,1.2vw,0.82rem)] text-[#a89c94]">
          {['6,800+ matches', 'coverage shown', 'open dataset'].map((label) => (
            <span key={label} className="border border-[#2c2522] bg-[#161312] px-3 py-1.5">
              {label}
            </span>
          ))}
        </div>
      </div>
    </CardFrame>
  );
}

function PosterCard() {
  return (
    <CardFrame className="bg-[#13100e] text-[#f4eee7]">
      <Image
        src="/media/journey/old-trafford.webp"
        alt="Old Trafford under the floodlights"
        fill
        sizes="(max-width: 900px) 100vw, 900px"
        className="object-cover opacity-80"
        priority
      />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(12,11,10,0.98)_0%,rgba(12,11,10,0.7)_43%,rgba(12,11,10,0.15)_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(12,11,10,0.85),transparent_48%)]" />
      <div className="relative flex h-full flex-col justify-between p-[5.3%_6%]">
        <div className="flex items-center justify-between text-[clamp(0.55rem,1.55vw,1.1rem)]">
          <Brand inverse />
          <span className="border border-[#f3ede8]/30 px-3 py-1 font-mono text-[#ffd94a]">OG / 02</span>
        </div>
        <div className="max-w-[58%]">
          <p className="mb-3 text-[clamp(0.58rem,1.5vw,1rem)] font-semibold uppercase tracking-[0.2em] text-[#ffd94a]">
            A night in the record
          </p>
          <h2 className="text-[clamp(1.6rem,5.4vw,4.35rem)] font-extrabold leading-[0.91] tracking-[-0.055em]">
            The noise stops. The pattern stays.
          </h2>
          <p className="mt-4 max-w-[23rem] text-[clamp(0.62rem,1.6vw,1.05rem)] leading-snug text-[#d6cbc2]">
            Every match since 1886, with the finding and the evidence in the frame.
          </p>
        </div>
        <div className="flex items-end justify-between gap-4">
          <span className="font-mono text-[clamp(1.1rem,3vw,2.4rem)] text-[#ffd94a]">6,800+</span>
          <span className="text-right text-[clamp(0.5rem,1.25vw,0.82rem)] uppercase tracking-[0.16em] text-[#d6cbc2]">
            matches<br />open evidence
          </span>
        </div>
      </div>
      <div className="absolute bottom-0 right-0 h-2 w-[38%] bg-[#ff3b1f]" />
    </CardFrame>
  );
}

function ArchiveCard() {
  return (
    <CardFrame className="bg-[#e8e0d5] text-[#161312]">
      <div className="absolute inset-0 opacity-25 [background-image:linear-gradient(#73685f_1px,transparent_1px),linear-gradient(90deg,#73685f_1px,transparent_1px)] [background-size:5.5%_100%,100%_100%]" />
      <div className="absolute inset-y-0 right-0 w-[34%] bg-[#1b1715]" />
      <div className="absolute right-[6%] top-[16%] h-[48%] w-[22%] overflow-hidden opacity-80 grayscale">
        <Image
          src="/media/journey/camp-nou.webp"
          alt="A historic European night"
          fill
          sizes="220px"
          className="object-cover mix-blend-luminosity"
        />
      </div>
      <div className="relative flex h-full flex-col justify-between p-[5.3%_6%]">
        <div className="flex items-start justify-between text-[clamp(0.55rem,1.55vw,1.1rem)]">
          <Brand />
          <span className="font-mono text-[#73685f]">FIELD NOTE 001 / 1886—NOW</span>
        </div>
        <div className="max-w-[62%]">
          <p className="mb-4 font-mono text-[clamp(0.58rem,1.5vw,1rem)] text-[#c13a26]">MANCHESTER UNITED / THE FULL LEDGER</p>
          <h2 className="max-w-[11ch] text-[clamp(1.7rem,5.3vw,4.25rem)] font-extrabold uppercase leading-[0.88] tracking-[-0.06em]">
            History, with receipts.
          </h2>
          <div className="mt-5 h-px w-[75%] bg-[#161312]/30" />
          <p className="mt-4 max-w-[22rem] text-[clamp(0.62rem,1.55vw,1rem)] leading-snug text-[#554b44]">
            Ask a question. Get the answer. Follow every match back to the source.
          </p>
        </div>
        <div className="flex items-end justify-between pr-[31%]">
          <span className="font-mono text-[clamp(1.1rem,3vw,2.4rem)] text-[#c13a26]">1886—</span>
          <span className="text-right text-[clamp(0.5rem,1.25vw,0.82rem)] uppercase tracking-[0.16em] text-[#73685f]">
            sourced<br />match by match
          </span>
        </div>
      </div>
      <div className="absolute bottom-0 left-0 h-2 w-[66%] bg-[#c13a26]" />
    </CardFrame>
  );
}

function CardForDirection({ direction }: { direction: Direction }) {
  if (direction === "poster") return <PosterCard />;
  if (direction === "archive") return <ArchiveCard />;
  return <SignalCard />;
}

export function OgDesignLab() {
  const [focus, setFocus] = useState<Direction | "all">("all");

  return (
    <main className="space-y-8 pb-16">
      <header className="border-b border-line pb-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-devil-bright">
              Dev · OpenGraph design lab
            </p>
            <h1 className="display text-3xl sm:text-4xl">Make the share image feel like UnitedStats.</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-dim">
              Three intentionally different directions for a 1200 × 630 share card. They use the
              current palette, real archive imagery, and the same promise: the link should carry a
              useful piece of the record before anyone opens it.
            </p>
          </div>
          <div className="flex shrink-0 gap-1 rounded-lg border border-line bg-panel p-1 text-xs">
            <button
              type="button"
              onClick={() => setFocus("all")}
              aria-pressed={focus === "all"}
              className={`rounded-md px-3 py-2 ${focus === "all" ? "bg-panel-2 text-ink" : "text-ink-dim"}`}
            >
              Compare all
            </button>
            {DIRECTIONS.map((direction) => (
              <button
                key={direction.id}
                type="button"
                onClick={() => setFocus(direction.id)}
                aria-pressed={focus === direction.id}
                className={`rounded-md px-3 py-2 ${focus === direction.id ? "bg-panel-2 text-ink" : "text-ink-dim"}`}
              >
                {direction.number}
              </button>
            ))}
          </div>
        </div>
      </header>

      <section className={`grid gap-7 ${focus === "all" ? "lg:grid-cols-3" : "max-w-5xl"}`}>
        {DIRECTIONS.filter((direction) => focus === "all" || direction.id === focus).map((direction) => (
          <article key={direction.id} className="space-y-4">
            <div>
              <div className="flex items-baseline gap-3">
                <span className="font-mono text-xs text-devil-bright">{direction.number}</span>
                <h2 className="display text-xl">{direction.name}</h2>
              </div>
              <p className="mt-2 text-sm leading-5 text-ink-dim">{direction.premise}</p>
            </div>
            <div className="overflow-hidden rounded-xl border border-line shadow-[0_16px_40px_rgb(0_0_0_/0.22)]">
              <CardForDirection direction={direction.id} />
            </div>
            <p className="border-l-2 border-line pl-3 text-xs leading-5 text-ink-faint">
              <span className="text-ink-dim">Tradeoff:</span> {direction.tradeoff}
            </p>
          </article>
        ))}
      </section>

      <aside className="grid gap-4 border-t border-line pt-6 text-sm lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-devil-bright">Recommendation to test first</p>
          <h2 className="display mt-2 text-2xl">Start with the poster. Borrow the signal.</h2>
        </div>
        <p className="max-w-2xl leading-6 text-ink-dim">
          The image-led treatment is the clearest step-change from the current plain cards, while
          the answer signal is the strongest ingredient to preserve: one finding, one figure, one
          readable shape. The likely production direction is a poster frame with a data inset, not
          a full-bleed photo that asks the reader to infer the point.
        </p>
      </aside>
    </main>
  );
}
