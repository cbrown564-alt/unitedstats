import type { Metadata } from "@/src/rt/metadata";
import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MatchFlow } from "@/components/MatchFlow";
import { JourneyChapterNav } from "@/components/journey/JourneyChapterNav";
import { JourneySourceLink, JourneyThreadAnchor } from "@/components/journey/JourneyBeat";
import { ThreadOfNights } from "@/components/journey/ThreadOfNights";
import type { MatchReceipt } from "@/lib/journey";
import { goalMinute, resolveNight, type ResolvedNight } from "@/lib/nightCopy";
import { threadNights, type Motif } from "@/lib/threadOfNights";
import { RecordGlyph } from "@/components/glyphs/RecordGlyph";

export const metadata: Metadata = {
  title: "Journey — a thread of nights",
  description: "Ten surprising Manchester United matches, from the first FA Cup to Amad at 120 minutes.",
  robots: { index: false, follow: false },
};

/** The opening's three moments: a scorer on a night, with the minute read from the record. */
const OPENING_MOMENTS = [
  { key: "first-cup", name: "Turnbull" },
  { key: "everton-110", name: "Whiteside" },
  { key: "liverpool-120", name: "Amad" },
];

const MOTIF_BACKGROUNDS: Record<Motif, string> = {
  single: "radial-gradient(34% 70% at 24% 58%, rgba(245,197,24,0.09), transparent 72%), linear-gradient(115deg, rgba(255,255,255,0.035), transparent 35%)",
  comeback: "linear-gradient(128deg, rgba(48,45,42,0.36) 0 42%, rgba(145,24,13,0.22) 62%, rgba(255,59,31,0.08) 100%)",
  torrent: "repeating-linear-gradient(90deg, rgba(255,255,255,0.035) 0 1px, transparent 1px 8.5%), radial-gradient(62% 100% at 50% 50%, rgba(255,59,31,0.13), transparent 75%)",
  cut: "linear-gradient(104deg, rgba(255,255,255,0.035) 0 72%, transparent 72.3%), linear-gradient(180deg, transparent, rgba(0,0,0,0.28))",
  paired: "linear-gradient(90deg, rgba(255,255,255,0.04) 0 49.7%, rgba(245,197,24,0.14) 49.8% 50.2%, rgba(255,59,31,0.06) 50.3%)",
  late: "radial-gradient(20% 82% at 91% 52%, rgba(245,197,24,0.13), transparent 76%), linear-gradient(90deg, transparent 0 72%, rgba(255,59,31,0.06))",
  shock: "linear-gradient(164deg, transparent 0 52%, rgba(0,0,0,0.42) 52.2%), radial-gradient(48% 90% at 82% 55%, rgba(255,255,255,0.055), transparent 70%)",
  reversal: "linear-gradient(145deg, rgba(0,0,0,0.34) 0 46%, rgba(255,59,31,0.13) 46.3% 100%)",
  memory: "radial-gradient(44% 100% at 78% 54%, rgba(245,197,24,0.095), transparent 72%), linear-gradient(120deg, rgba(255,255,255,0.03), transparent 48%)",
  flare: "radial-gradient(23% 86% at 94% 55%, rgba(245,197,24,0.17), transparent 72%), linear-gradient(90deg, transparent 45%, rgba(255,59,31,0.1))",
};

function motifBackground(motif: Motif): string {
  return MOTIF_BACKGROUNDS[motif];
}

function ReceiptFlow({
  receipt,
  detail,
  motif,
  label,
  sequence,
  focusPlayerIds,
}: {
  receipt: MatchReceipt;
  detail: string;
  motif: Motif;
  label: string;
  sequence: number;
  focusPlayerIds?: readonly string[];
}) {
  return (
    <article className="relative overflow-hidden bg-[#0d0b0a]/95 px-5 py-7 shadow-[inset_0_1px_rgb(255_255_255_/_0.055),inset_0_-1px_rgb(0_0_0_/_0.55)] sm:px-7 sm:py-8">
      <span className="pointer-events-none absolute inset-0 opacity-90" style={{ backgroundImage: motifBackground(motif) }} aria-hidden />
      <span className="pointer-events-none absolute inset-0 opacity-[0.09] [background-image:repeating-linear-gradient(0deg,transparent_0,transparent_3px,rgba(255,255,255,0.08)_4px)]" aria-hidden />
      <span className="pointer-events-none absolute -bottom-9 right-2 stat-num text-9xl font-bold leading-none text-devil-bright/[0.045]" aria-hidden>
        {receipt.score.replace(/[^0-9]/g, "")}
      </span>
      <div className="relative mb-6 flex items-center justify-between border-b border-white/[0.08] pb-3 text-[9px] font-semibold uppercase tracking-[0.2em] text-ink-faint">
        <span>The turning point</span>
        <span className="stat-num">Night {String(sequence).padStart(2, "0")}</span>
      </div>
      <div className="relative flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 text-xs">
        <span className="stat-num font-bold text-ink">{receipt.date}</span>
        <span className="text-ink-dim">v {receipt.opponent}</span>
        <span className="stat-num font-semibold text-gold">{receipt.score}</span>
      </div>
      <p className="relative mt-1 text-[10px] font-medium uppercase tracking-[0.16em] text-ink-faint">{detail} · {label}</p>
      <div className="relative mt-9">
        <MatchFlow
          unitedGoals={receipt.unitedGoals}
          opponentGoals={receipt.opponentGoals}
          aet={receipt.aet}
          focusPlayerIds={focusPlayerIds}
        />
      </div>
    </article>
  );
}

function NightStation({
  night,
  index,
  title,
  detail,
  treatment,
  memory,
  children,
}: {
  night: { key: string; id: string; side: "left" | "right" };
  index: number;
  title: ReactNode;
  detail: string;
  treatment: { label: string; motif: Motif };
  memory?: { src: string; position: string };
  children: ReactNode;
}) {
  const onLeft = night.side === "left";
  const featured = ["torrent", "reversal", "late", "flare"].includes(treatment.motif);
  const sectionAtmosphere: Record<Motif, string> = {
    single: "radial-gradient(52% 58% at 18% 52%, rgba(245,197,24,0.06), transparent 72%)",
    comeback: "radial-gradient(58% 70% at 82% 52%, rgba(255,59,31,0.1), transparent 72%)",
    torrent: "radial-gradient(76% 62% at 28% 52%, rgba(255,59,31,0.17), transparent 70%)",
    cut: "linear-gradient(164deg, transparent 0 52%, rgba(0,0,0,0.22) 52.2%)",
    paired: "radial-gradient(65% 66% at 72% 52%, rgba(245,197,24,0.07), transparent 72%)",
    late: "radial-gradient(34% 72% at 88% 55%, rgba(245,197,24,0.11), transparent 75%)",
    shock: "radial-gradient(62% 64% at 18% 54%, rgba(0,0,0,0.32), transparent 74%)",
    reversal: "linear-gradient(145deg, rgba(0,0,0,0.2) 0 48%, rgba(255,59,31,0.09) 48.3% 100%)",
    memory: "radial-gradient(58% 64% at 78% 52%, rgba(245,197,24,0.07), transparent 72%)",
    flare: "radial-gradient(42% 68% at 88% 54%, rgba(255,105,72,0.16), transparent 74%)",
  };
  return (
    <section
      data-thread-anchor={night.key}
      data-night-motif={treatment.motif}
      className={`relative flex items-center px-5 py-16 sm:px-8 lg:px-[6vw] ${featured ? "min-h-[50rem] sm:min-h-[56rem]" : "min-h-[38rem] sm:min-h-[44rem]"}`}
      style={{ backgroundImage: sectionAtmosphere[treatment.motif] }}
    >
      {memory && (
        <div
          className={`pointer-events-none absolute inset-y-0 hidden w-[43vw] max-w-[42rem] overflow-hidden opacity-30 lg:block ${onLeft ? "right-0 [mask-image:linear-gradient(to_left,#000_12%,rgba(0,0,0,0.84)_60%,transparent_100%)]" : "left-0 [mask-image:linear-gradient(to_right,#000_12%,rgba(0,0,0,0.84)_60%,transparent_100%)]"}`}
          aria-hidden
        >
          <Image src={memory.src} alt="" fill sizes="43vw" className="object-cover grayscale contrast-125" style={{ objectPosition: memory.position }} />
          <span className={`absolute inset-0 bg-[linear-gradient(to_bottom,rgba(13,11,10,0.56),transparent_32%,rgba(13,11,10,0.86))] ${onLeft ? "bg-devil/30 mix-blend-color" : "bg-gold/20 mix-blend-color"}`} />
        </div>
      )}
      <div className={`relative w-full pl-16 sm:pl-20 ${onLeft ? "lg:mr-auto lg:pl-0" : "lg:ml-auto lg:pl-0"} ${featured ? "lg:max-w-[70%]" : "lg:max-w-[62%]"}`}>
        <span
          className={`pointer-events-none absolute -top-16 select-none stat-num text-[8rem] font-bold leading-none text-ink/[0.035] sm:text-[10rem] ${onLeft ? "left-8 lg:-left-8" : "left-8 lg:-right-8 lg:left-auto"}`}
          aria-hidden
        >
          {String(index).padStart(2, "0")}
        </span>
        <p className="relative text-[11px] font-semibold uppercase tracking-[0.27em] text-devil-bright">
          {night.id.slice(0, 4)} · {treatment.label}
        </p>
        <h2 className="relative mt-5 text-balance text-[2.2rem] font-semibold leading-[1.02] tracking-tight text-ink sm:text-5xl">{title}</h2>
        <p className="relative mt-4 max-w-xl text-pretty text-sm leading-6 text-ink-dim sm:text-base">{detail}</p>
        <div
          data-thread-stitch={night.key}
          className="relative mt-9 border border-white/[0.11] bg-[#0d0b0a]/80 p-1 shadow-[0_24px_64px_rgb(0_0_0_/_0.2)] [clip-path:polygon(0_0,calc(100%_-_13px)_0,100%_13px,100%_100%,13px_100%,0_calc(100%_-_13px))]"
        >
          {children}
          <div className="relative border-t border-white/[0.08] bg-black/15 px-5 py-4 sm:px-7">
            <JourneySourceLink href={`/match/${night.id}`} label="See every goal and the final score" />
          </div>
        </div>
      </div>
    </section>
  );
}

/** One night block, laid out: its headline, copy and receipts (an earlier one first, with its own link). */
function Station({ night, index }: { night: ResolvedNight; index: number }) {
  const own = night.receipts[night.receipts.length - 1];
  const flow = (r: (typeof night.receipts)[number]) => (
    <ReceiptFlow
      receipt={r.receipt}
      detail={r.caption}
      motif={night.motif}
      label={r.label}
      sequence={index}
      focusPlayerIds={r === own ? night.focusPlayerIds : undefined}
    />
  );
  return (
    <NightStation
      night={night}
      index={index}
      treatment={{ label: night.label, motif: night.motif }}
      memory={night.memory}
      title={<>{night.title} <JourneyThreadAnchor>{night.titleAnchor}</JourneyThreadAnchor></>}
      detail={night.detail}
    >
      {night.receipts.length === 1 ? (
        flow(own)
      ) : (
        <div className="grid gap-5">
          {night.receipts.slice(0, -1).map((r) => (
            <div key={r.receipt.id}>
              {flow(r)}
              <div className="mt-4"><JourneySourceLink href={`/match/${r.receipt.id}`} label={r.link_label ?? "Open the match"} /></div>
            </div>
          ))}
          {flow(own)}
        </div>
      )}
    </NightStation>
  );
}

/**
 * Journey chapter 5 — a deliberately smaller prototype of the eventual stitched
 * journey. A single filament descends from 1886 to now, spinning into ten
 * defining matches and then returning to the living archive. The stations are
 * the story's night blocks in EmDash; the opening and the close stay here.
 */
export default function ThreadOfNightsJourneyPage() {
  const nights = threadNights().map(resolveNight);
  if (nights.length === 0) notFound();
  const moments = OPENING_MOMENTS.flatMap(({ key, name }) => {
    const night = nights.find((n) => n.key === key);
    const minute = night && goalMinute(night.id, name);
    return minute ? [{ name, minute }] : [];
  });

  return (
    <ThreadOfNights knots={nights.map(({ key, side }) => ({ id: key, side }))}>
      <header className="relative flex min-h-dvh flex-col justify-center px-7 pb-24 pt-20 sm:px-12 lg:px-[11vw]">
        <div className="max-w-4xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-devil-bright">Red Thread / 05</p>
          <h1 className="mt-7 max-w-3xl text-balance text-[3.35rem] font-semibold leading-[0.92] tracking-tight text-ink sm:text-7xl lg:text-[6.5rem]">
            Ten nights. <span className="text-devil-bright">One club.</span>
          </h1>
          <p className="mt-7 max-w-2xl text-pretty text-base leading-7 text-ink-dim sm:text-lg">
            A hundred and fifteen years of United, told through the moments that still make a fan stop and remember.
          </p>
          <p className="stat-num mt-8 flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold text-ink-dim sm:text-base" aria-label="Three moments on the thread">
            {moments.map((m, i) => (
              <span key={m.name}><span className={i === moments.length - 1 ? "text-devil-bright" : "text-gold"}>{m.minute}</span> {m.name}</span>
            ))}
          </p>
        </div>
        <div className="mt-20 flex max-w-4xl items-center justify-between text-[10px] font-semibold uppercase tracking-[0.24em] text-ink-faint">
          <span>1886</span>
          <span data-thread-origin>follow the thread ↓</span>
          <span>now</span>
        </div>
      </header>

      {nights.map((night, i) => (
        <Station key={night.key} night={night} index={i + 1} />
      ))}

      <section className="relative flex min-h-[72vh] items-center px-7 py-24 sm:px-12 lg:px-[11vw]">
        <div className="max-w-3xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-devil-bright">Now</p>
          <h2 className="mt-5 text-balance text-5xl font-semibold leading-[0.98] tracking-tight text-ink sm:text-7xl">
            Ten nights. <JourneyThreadAnchor>There is always another one.</JourneyThreadAnchor>
          </h2>
          <p className="mt-6 max-w-xl text-pretty text-base leading-7 text-ink-dim">
            Start with another night you might have forgotten, or trace every match from the beginning.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link href="/surprise" className="inline-flex items-center gap-2 rounded-full border border-devil-bright/60 bg-devil/15 px-6 py-3 text-sm font-semibold text-ink shadow-[0_0_30px_-6px_rgba(255,59,31,0.6)] transition hover:border-devil-bright hover:bg-devil/25 focus-ring cord-host"><RecordGlyph id="tangle" size={18} className="cd-lit" />Pull another night →</Link>
            <Link href="/matches" className="inline-flex items-center gap-2 rounded-full border border-line bg-panel/60 px-6 py-3 text-sm font-semibold text-ink-dim transition hover:border-gold/70 hover:text-gold focus-ring">Every match →</Link>
          </div>
          <JourneyChapterNav current="/stories/a-thread-of-nights" />
        </div>
      </section>
    </ThreadOfNights>
  );
}
