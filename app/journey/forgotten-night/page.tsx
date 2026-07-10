import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MatchFlow } from "@/components/MatchFlow";
import { JourneyChapterNav } from "@/components/journey/JourneyChapterNav";
import { JourneySourceLink, JourneyThreadAnchor } from "@/components/journey/JourneyBeat";
import { ThreadOfNights } from "@/components/journey/ThreadOfNights";
import { THREAD_OF_NIGHTS, matchReceipt, type MatchReceipt } from "@/lib/journey";
import { familyName } from "@/lib/names";
import type { EventRow } from "@/lib/queries";

export const revalidate = 86400;
export const metadata: Metadata = {
  title: "Journey — a thread of nights",
  description: "Ten surprising Manchester United matches, from the first FA Cup to Amad at 120 minutes.",
  robots: { index: false, follow: false },
};

const BRIGHTON_FINAL = "1983-05-21-brighton-and-hove-albion-n";

type Night = (typeof THREAD_OF_NIGHTS)[number];
type Motif = "single" | "comeback" | "torrent" | "cut" | "paired" | "late" | "shock" | "reversal" | "memory" | "flare";

const NIGHT_TREATMENTS: Record<Night["key"], { label: string; motif: Motif }> = {
  "first-cup": { label: "The first Cup", motif: "single" },
  blackpool: { label: "The lead changed hands", motif: "comeback" },
  "chelsea-eleven": { label: "The eleven-goal night", motif: "torrent" },
  "southampton-final": { label: "The final lost", motif: "cut" },
  "brighton-replay": { label: "Five days later", motif: "paired" },
  "everton-110": { label: "The wait", motif: "late" },
  "york-shock": { label: "The shock", motif: "shock" },
  "spurs-five": { label: "The reversal", motif: "reversal" },
  "palace-final": { label: "The extra-time answer", motif: "memory" },
  "liverpool-120": { label: "The final flare", motif: "flare" },
};

function motifBackground(motif: Motif): string {
  const motifs: Record<Motif, string> = {
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
  return motifs[motif];
}

function clock(goal: EventRow | undefined): string {
  if (!goal?.minute) return "";
  return `${goal.minute}${goal.added_time ? `+${goal.added_time}` : ""}′`;
}

function scorer(goal: EventRow | undefined): string {
  return familyName(goal?.player_display_name ?? goal?.player_name ?? "");
}

function goalWithName(receipt: MatchReceipt, name: string, opponent = false): EventRow | undefined {
  const goals = opponent ? receipt.opponentGoals : receipt.unitedGoals;
  return goals.find((goal) => (goal.player_display_name ?? goal.player_name ?? "").includes(name));
}

function goalPhrase(goal: EventRow | undefined): string {
  const name = scorer(goal);
  const time = clock(goal);
  return [name, time].filter(Boolean).join(" ");
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
        <span>Match evidence</span>
        <span className="stat-num">RT–{String(sequence).padStart(2, "0")}</span>
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
  children,
}: {
  night: Night;
  index: number;
  title: ReactNode;
  detail: string;
  treatment: { label: string; motif: Motif };
  children: ReactNode;
}) {
  const onLeft = night.side === "left";
  return (
    <section
      data-thread-anchor={night.key}
      className="relative flex min-h-[42rem] items-center px-5 py-16 sm:min-h-[45rem] sm:px-8 lg:px-12"
    >
      <div className={`relative w-full pl-16 sm:pl-20 ${onLeft ? "lg:mr-auto lg:max-w-[48%] lg:pl-0" : "lg:ml-auto lg:max-w-[48%] lg:pl-0"}`}>
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
          <span className={`absolute -left-2 top-10 z-20 h-4 w-4 -translate-y-1/2 rounded-full border border-gold/70 bg-[#160b08] shadow-[0_0_18px_rgb(245_197_24_/_0.38)] ${onLeft ? "lg:-right-2 lg:left-auto" : ""}`} aria-hidden>
            <span className="absolute inset-[4px] rounded-full bg-gold" />
          </span>
          {children}
          <div className="relative border-t border-white/[0.08] bg-black/15 px-5 py-4 sm:px-7">
            <JourneySourceLink href={`/match/${night.id}`} label="Open the full match receipt" />
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * Journey chapter 5 — a deliberately smaller prototype of the eventual stitched
 * journey. A single filament descends from 1886 to now, spinning into ten
 * evidence-backed match receipts and then returning to the living archive.
 */
export default function ThreadOfNightsJourneyPage() {
  const byKey = new Map(
    THREAD_OF_NIGHTS.map((night) => [night.key, matchReceipt(night.id)]),
  );
  const firstCup = byKey.get("first-cup");
  const blackpool = byKey.get("blackpool");
  const chelsea = byKey.get("chelsea-eleven");
  const southampton = byKey.get("southampton-final");
  const brightonReplay = byKey.get("brighton-replay");
  const everton = byKey.get("everton-110");
  const york = byKey.get("york-shock");
  const spurs = byKey.get("spurs-five");
  const palace = byKey.get("palace-final");
  const liverpool = byKey.get("liverpool-120");
  const brightonFinal = matchReceipt(BRIGHTON_FINAL);
  if (!firstCup || !blackpool || !chelsea || !southampton || !brightonReplay || !brightonFinal || !everton || !york || !spurs || !palace || !liverpool) notFound();

  const firstCupTurnbull = goalWithName(firstCup, "Turnbull");
  const blackpoolRowley = goalWithName(blackpool, "Rowley");
  const blackpoolAnderson = goalWithName(blackpool, "Anderson");
  const viollet = goalWithName(chelsea, "Viollet");
  const taylor = goalWithName(chelsea, "Taylor");
  const stokes = goalWithName(southampton, "Stokes", true);
  const whiteside = goalWithName(everton, "Whiteside");
  const yorkBarnes = goalWithName(york, "Barnes", true);
  const yorkBarras = goalWithName(york, "Barras", true);
  const mata = goalWithName(palace, "Mata");
  const lingard = goalWithName(palace, "Lingard");
  const puncheon = goalWithName(palace, "Puncheon", true);
  const amad = goalWithName(liverpool, "Amad");

  const night = (key: Night["key"]) => {
    const found = THREAD_OF_NIGHTS.find((entry) => entry.key === key);
    if (!found) throw new Error(`Missing thread night ${key}`);
    return found;
  };

  return (
    <ThreadOfNights knots={THREAD_OF_NIGHTS.map(({ key, side }) => ({ id: key, side }))}>
      <header className="relative flex min-h-dvh flex-col justify-center px-7 pb-24 pt-20 sm:px-12 lg:px-[11vw]">
        <div className="max-w-4xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-devil-bright">Red Thread / 05</p>
          <h1 className="mt-7 max-w-3xl text-balance text-[3.35rem] font-semibold leading-[0.92] tracking-tight text-ink sm:text-7xl lg:text-[6.5rem]">
            A thread <span className="text-devil-bright">of nights.</span>
          </h1>
          <p className="mt-7 max-w-2xl text-pretty text-base leading-7 text-ink-dim sm:text-lg">
            Ten matches, 115 years apart. Not a greatest-hits list: a path through the record, where each knot opens the night beneath it.
          </p>
        </div>
        <div className="mt-20 flex max-w-4xl items-center justify-between text-[10px] font-semibold uppercase tracking-[0.24em] text-ink-faint">
          <span>1886</span>
          <span>follow the thread ↓</span>
          <span>now</span>
        </div>
      </header>

      <NightStation
        night={night("first-cup")}
        index={1}
        treatment={NIGHT_TREATMENTS["first-cup"]}
        title={<>The first Cup was <JourneyThreadAnchor>one goal.</JourneyThreadAnchor></>}
        detail={`${goalPhrase(firstCupTurnbull)}. Bristol City did not score.`}
      >
        <ReceiptFlow receipt={firstCup} detail="FA Cup final · Crystal Palace" motif="single" label="The first Cup" sequence={1} focusPlayerIds={firstCupTurnbull?.player_id ? [firstCupTurnbull.player_id] : undefined} />
      </NightStation>

      <NightStation
        night={night("blackpool")}
        index={2}
        treatment={NIGHT_TREATMENTS.blackpool}
        title={<>Blackpool led twice. <JourneyThreadAnchor>United won 4–2.</JourneyThreadAnchor></>}
        detail={`${blackpool.opponentGoals.map(goalPhrase).join(". ")}. ${goalPhrase(blackpoolRowley)} started the response; ${goalPhrase(blackpoolAnderson)} finished it.`}
      >
        <ReceiptFlow receipt={blackpool} detail="FA Cup final · Wembley" motif="comeback" label="The lead changed hands" sequence={2} focusPlayerIds={blackpoolRowley?.player_id ? [blackpoolRowley.player_id] : undefined} />
      </NightStation>

      <NightStation
        night={night("chelsea-eleven")}
        index={3}
        treatment={NIGHT_TREATMENTS["chelsea-eleven"]}
        title={<>Chelsea 5. <JourneyThreadAnchor>United 6.</JourneyThreadAnchor></>}
        detail={`Eleven goals at Stamford Bridge. ${scorer(viollet)} scored three; ${scorer(taylor)} scored two.`}
      >
        <ReceiptFlow receipt={chelsea} detail="First Division · Stamford Bridge" motif="torrent" label="The eleven-goal night" sequence={3} focusPlayerIds={[viollet?.player_id, taylor?.player_id].filter((id): id is string => !!id)} />
      </NightStation>

      <NightStation
        night={night("southampton-final")}
        index={4}
        treatment={NIGHT_TREATMENTS["southampton-final"]}
        title={<>The final ended <JourneyThreadAnchor>at 83′.</JourneyThreadAnchor></>}
        detail={`${goalPhrase(stokes)}. The only goal in the 1976 FA Cup final.`}
      >
        <ReceiptFlow receipt={southampton} detail="FA Cup final · Wembley" motif="cut" label="The final lost" sequence={4} />
      </NightStation>

      <NightStation
        night={night("brighton-replay")}
        index={5}
        treatment={NIGHT_TREATMENTS["brighton-replay"]}
        title={<>Five days later, <JourneyThreadAnchor>4–0.</JourneyThreadAnchor></>}
        detail={`${brightonFinal.score} after extra time in the first final. Then Robson twice, Whiteside and Mühren in the replay.`}
      >
        <div className="grid gap-5">
          <div>
            <ReceiptFlow receipt={brightonFinal} detail="21 May · FA Cup final" motif="paired" label="The first ending" sequence={5} />
            <div className="mt-4"><JourneySourceLink href={`/match/${brightonFinal.id}`} label="Open the first final" /></div>
          </div>
          <ReceiptFlow receipt={brightonReplay} detail="26 May · final replay" motif="paired" label="Five days later" sequence={5} />
        </div>
      </NightStation>

      <NightStation
        night={night("everton-110")}
        index={6}
        treatment={NIGHT_TREATMENTS["everton-110"]}
        title={<>No goal until <JourneyThreadAnchor>110′.</JourneyThreadAnchor></>}
        detail={`${goalPhrase(whiteside)}. The only goal in 120 minutes against Everton.`}
      >
        <ReceiptFlow receipt={everton} detail="FA Cup final · Wembley · extra time" motif="late" label="The wait" sequence={6} focusPlayerIds={whiteside?.player_id ? [whiteside.player_id] : undefined} />
      </NightStation>

      <NightStation
        night={night("york-shock")}
        index={7}
        treatment={NIGHT_TREATMENTS["york-shock"]}
        title={<>York scored three <JourneyThreadAnchor>at Old Trafford.</JourneyThreadAnchor></>}
        detail={`${goalPhrase(yorkBarnes)} twice, then ${goalPhrase(yorkBarras)}. No United response knot.`}
      >
        <ReceiptFlow receipt={york} detail="League Cup · second round, first leg" motif="shock" label="The shock" sequence={7} />
      </NightStation>

      <NightStation
        night={night("spurs-five")}
        index={8}
        treatment={NIGHT_TREATMENTS["spurs-five"]}
        title={<>Three down at half-time. <JourneyThreadAnchor>Five up at full-time.</JourneyThreadAnchor></>}
        detail={`${spurs.opponentGoals.length} Tottenham goals before the interval. ${spurs.unitedGoals.length} United goals after it, from 46′ to 87′.`}
      >
        <ReceiptFlow receipt={spurs} detail="Premier League · White Hart Lane" motif="reversal" label="The reversal" sequence={8} />
      </NightStation>

      <NightStation
        night={night("palace-final")}
        index={9}
        treatment={NIGHT_TREATMENTS["palace-final"]}
        title={<>Palace 78. Mata 81. <JourneyThreadAnchor>Lingard 110.</JourneyThreadAnchor></>}
        detail={`${goalPhrase(puncheon)}. ${goalPhrase(mata)}. ${goalPhrase(lingard)}.`}
      >
        <ReceiptFlow receipt={palace} detail="FA Cup final · Wembley · extra time" motif="memory" label="The extra-time answer" sequence={9} focusPlayerIds={lingard?.player_id ? [lingard.player_id] : undefined} />
      </NightStation>

      <NightStation
        night={night("liverpool-120")}
        index={10}
        treatment={NIGHT_TREATMENTS["liverpool-120"]}
        title={<>Amad <JourneyThreadAnchor>at 120′.</JourneyThreadAnchor></>}
        detail={`${liverpool.score} after extra time. ${goalPhrase(amad)} was the final knot.`}
      >
        <ReceiptFlow receipt={liverpool} detail="FA Cup quarter-final · Old Trafford · extra time" motif="flare" label="The final flare" sequence={10} focusPlayerIds={amad?.player_id ? [amad.player_id] : undefined} />
      </NightStation>

      <section className="relative flex min-h-[72vh] items-center px-7 py-24 sm:px-12 lg:px-[11vw]">
        <div className="max-w-3xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-devil-bright">Now</p>
          <h2 className="mt-5 text-balance text-5xl font-semibold leading-[0.98] tracking-tight text-ink sm:text-7xl">
            Ten knots. <JourneyThreadAnchor>The thread keeps going.</JourneyThreadAnchor>
          </h2>
          <p className="mt-6 max-w-xl text-pretty text-base leading-7 text-ink-dim">
            These are ten routes into a living archive. Pull another night, or walk every match from the beginning.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link href="/surprise" className="inline-flex items-center gap-2 rounded-full border border-devil-bright/60 bg-devil/15 px-6 py-3 text-sm font-semibold text-ink shadow-[0_0_30px_-6px_rgba(255,59,31,0.6)] transition hover:border-devil-bright hover:bg-devil/25 focus-ring">Pull another night →</Link>
            <Link href="/matches" className="inline-flex items-center gap-2 rounded-full border border-line bg-panel/60 px-6 py-3 text-sm font-semibold text-ink-dim transition hover:border-gold/70 hover:text-gold focus-ring">Every match →</Link>
          </div>
          <JourneyChapterNav current="/stories/a-thread-of-nights" />
        </div>
      </section>
    </ThreadOfNights>
  );
}
