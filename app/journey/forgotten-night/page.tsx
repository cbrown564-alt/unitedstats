import type { Metadata } from "next";
import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MatchFlow } from "@/components/MatchFlow";
import { JourneyChapterNav } from "@/components/journey/JourneyChapterNav";
import { JourneySourceLink, JourneyThreadAnchor } from "@/components/journey/JourneyBeat";
import { ThreadOfNights } from "@/components/journey/ThreadOfNights";
import { THREAD_OF_NIGHTS, matchReceipt, type MatchReceipt } from "@/lib/journey";
import { familyName } from "@/lib/names";
import type { EventRow } from "@/lib/queries";

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
  night: Night;
  index: number;
  title: ReactNode;
  detail: string;
  treatment: { label: string; motif: Motif };
  memory?: { src: string; position?: string };
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
          <Image src={memory.src} alt="" fill sizes="43vw" className={`object-cover grayscale contrast-125 ${memory.position ?? "object-[50%_25%]"}`} />
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

/**
 * Journey chapter 5 — a deliberately smaller prototype of the eventual stitched
 * journey. A single filament descends from 1886 to now, spinning into ten
 * defining matches and then returning to the living archive.
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
            Ten nights. <span className="text-devil-bright">One club.</span>
          </h1>
          <p className="mt-7 max-w-2xl text-pretty text-base leading-7 text-ink-dim sm:text-lg">
            A hundred and fifteen years of United, told through the moments that still make a fan stop and remember.
          </p>
          <p className="stat-num mt-8 flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold text-ink-dim sm:text-base" aria-label="Three moments on the thread">
            <span><span className="text-gold">82′</span> Turnbull</span>
            <span><span className="text-gold">110′</span> Whiteside</span>
            <span><span className="text-devil-bright">120′</span> Amad</span>
          </p>
        </div>
        <div className="mt-20 flex max-w-4xl items-center justify-between text-[10px] font-semibold uppercase tracking-[0.24em] text-ink-faint">
          <span>1886</span>
          <span data-thread-origin>follow the thread ↓</span>
          <span>now</span>
        </div>
      </header>

      <NightStation
        night={night("first-cup")}
        index={1}
        treatment={NIGHT_TREATMENTS["first-cup"]}
        memory={{ src: "/media/players/sandy-turnbull.webp", position: "object-[50%_30%]" }}
        title={<>The first Cup came down to <JourneyThreadAnchor>one goal.</JourneyThreadAnchor></>}
        detail={`${goalPhrase(firstCupTurnbull)} settled it. Bristol City never found a way back.`}
      >
        <ReceiptFlow receipt={firstCup} detail="FA Cup final · Crystal Palace" motif="single" label="The first Cup" sequence={1} focusPlayerIds={firstCupTurnbull?.player_id ? [firstCupTurnbull.player_id] : undefined} />
      </NightStation>

      <NightStation
        night={night("blackpool")}
        index={2}
        treatment={NIGHT_TREATMENTS.blackpool}
        title={<>Blackpool led twice. <JourneyThreadAnchor>United won 4–2.</JourneyThreadAnchor></>}
        detail={`${blackpool.opponentGoals.map(goalPhrase).join(". ")}. ${goalPhrase(blackpoolRowley)} began the fightback; ${goalPhrase(blackpoolAnderson)} made sure of it.`}
      >
        <ReceiptFlow receipt={blackpool} detail="FA Cup final · Wembley" motif="comeback" label="The lead changed hands" sequence={2} focusPlayerIds={blackpoolRowley?.player_id ? [blackpoolRowley.player_id] : undefined} />
      </NightStation>

      <NightStation
        night={night("chelsea-eleven")}
        index={3}
        treatment={NIGHT_TREATMENTS["chelsea-eleven"]}
        memory={{ src: "/media/players/dennis-viollet.webp", position: "object-[50%_22%]" }}
        title={<>Chelsea 5. <JourneyThreadAnchor>United 6.</JourneyThreadAnchor></>}
        detail={`An eleven-goal blur at Stamford Bridge. ${scorer(viollet)} struck three times; ${scorer(taylor)} added two more.`}
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
        title={<>The cup final replay, <JourneyThreadAnchor>4–0.</JourneyThreadAnchor></>}
        detail={`${brightonFinal.score} in the first final. Five days later, Robson scored twice, with Whiteside and Mühren completing the answer.`}
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
        memory={{ src: "/media/players/norman-whiteside.webp", position: "object-[50%_20%]" }}
        title={<>No goal until <JourneyThreadAnchor>110′.</JourneyThreadAnchor></>}
        detail={`${goalPhrase(whiteside)}. One clean finish after 110 minutes of deadlock against Everton.`}
      >
        <ReceiptFlow receipt={everton} detail="FA Cup final · Wembley · extra time" motif="late" label="The wait" sequence={6} focusPlayerIds={whiteside?.player_id ? [whiteside.player_id] : undefined} />
      </NightStation>

      <NightStation
        night={night("york-shock")}
        index={7}
        treatment={NIGHT_TREATMENTS["york-shock"]}
        title={<>York scored three <JourneyThreadAnchor>at Old Trafford.</JourneyThreadAnchor></>}
        detail={`${goalPhrase(yorkBarnes)} twice, then ${goalPhrase(yorkBarras)}. Old Trafford had no answer.`}
      >
        <ReceiptFlow receipt={york} detail="League Cup · second round, first leg" motif="shock" label="The shock" sequence={7} />
      </NightStation>

      <NightStation
        night={night("spurs-five")}
        index={8}
        treatment={NIGHT_TREATMENTS["spurs-five"]}
        memory={{ src: "/media/journey/beckham-white-hart-lane.jpg", position: "object-[50%_50%]" }}
        title={<>Three down at half-time. <JourneyThreadAnchor>Five up at full-time.</JourneyThreadAnchor></>}
        detail={`${spurs.opponentGoals.length} Tottenham goals before the interval. Then ${spurs.unitedGoals.length} from United, from 46′ to 87′.`}
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
        memory={{ src: "/media/players/amad-diallo.webp", position: "object-[50%_22%]" }}
        title={<>Amad. <JourneyThreadAnchor>120′.</JourneyThreadAnchor></>}
        detail={`${liverpool.score} after extra time. ${goalPhrase(amad)} sent Old Trafford into the night.`}
      >
        <ReceiptFlow receipt={liverpool} detail="FA Cup quarter-final · Old Trafford · extra time" motif="flare" label="The final flare" sequence={10} focusPlayerIds={amad?.player_id ? [amad.player_id] : undefined} />
      </NightStation>

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
            <Link href="/surprise" className="inline-flex items-center gap-2 rounded-full border border-devil-bright/60 bg-devil/15 px-6 py-3 text-sm font-semibold text-ink shadow-[0_0_30px_-6px_rgba(255,59,31,0.6)] transition hover:border-devil-bright hover:bg-devil/25 focus-ring">Pull another night →</Link>
            <Link href="/matches" className="inline-flex items-center gap-2 rounded-full border border-line bg-panel/60 px-6 py-3 text-sm font-semibold text-ink-dim transition hover:border-gold/70 hover:text-gold focus-ring">Every match →</Link>
          </div>
          <JourneyChapterNav current="/stories/a-thread-of-nights" />
        </div>
      </section>
    </ThreadOfNights>
  );
}
