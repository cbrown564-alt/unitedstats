import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FergieTimeLoop } from "@/components/journey/FergieTimeLoop";
import { StoppageEcho, type StoppageEchoNight } from "@/components/journey/StoppageEcho";
import { JourneyBeat, JourneySourceLink, JourneyThreadAnchor } from "@/components/journey/JourneyBeat";
import { JourneyChapterNav } from "@/components/journey/JourneyChapterNav";
import { MatchFlow } from "@/components/MatchFlow";
import { LateGoalScatter } from "@/components/charts/LateGoalScatter";
import { annotatedLateGoals, lateGoalManagerEras, lateGoalScatter } from "@/lib/trails";
import { fergieTimeEchoes, matchReceipt, trailingBoard } from "@/lib/journey";
import { familyName } from "@/lib/names";

export const revalidate = 86400;
export const metadata: Metadata = {
  title: "Journey — Fergie time",
  description: "Three 2–1 comebacks, thirty years apart: the last one came a decade after Ferguson left.",
  robots: { index: false, follow: false },
};

function clockLabel(minute: number, added: number | null): string {
  return added != null && added > 0 ? `${minute}+${added}′` : `${minute}′`;
}

function percent(n: number, total: number): string {
  return `${((100 * n) / total).toFixed(1)}%`;
}

/** A single real match receipt, framed around the score before the late turn. */
function EchoReceipt({ receipt, heading }: { receipt: NonNullable<ReturnType<typeof matchReceipt>>; heading: string }) {
  const trailing = trailingBoard(receipt);
  return (
    <div className="flex flex-col">
      <div className="flex items-baseline justify-center gap-3">
        <span className="stat-num text-lg font-bold text-ink">{receipt.date.slice(0, 4)}</span>
        <span className="text-sm text-ink-dim">v {receipt.opponent}</span>
        <span className="stat-num text-sm text-ink-faint">{receipt.score}</span>
      </div>
      <p className="mt-1 text-center text-[11px] uppercase tracking-[0.16em] text-ink-faint">{heading}</p>
      {trailing && (
        <div className="mt-6 flex flex-col items-center gap-1" aria-label={`Trailing ${trailing.score} ${trailing.when}`}>
          <p className="stat-num text-3xl font-bold tracking-tight text-ink-dim sm:text-4xl">{trailing.score}</p>
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-ink-faint">{trailing.when}</p>
        </div>
      )}
      <div className={trailing ? "mt-5" : "mt-7"}>
        <MatchFlow unitedGoals={receipt.unitedGoals} opponentGoals={receipt.opponentGoals} aet={receipt.aet} />
      </div>
    </div>
  );
}

/**
 * Chapter 4 — a loop across managers (docs/JOURNEY.md §4d). It does not argue
 * that one manager owned a clock: three exact 0–1 → 2–1 receipts recur from
 * 1993 to 2023, then the late-goal record provides the wider, qualified door.
 */
export default function FergieTimeJourneyPage() {
  const echoes = fergieTimeEchoes();
  if (echoes.length !== 3) notFound();
  const original = matchReceipt(echoes[0].id);
  const continued = matchReceipt(echoes[2].id);
  if (!original || !continued) notFound();

  const echoNights: StoppageEchoNight[] = echoes.map((night) => ({
    label: `${night.date.slice(0, 4)} · ${night.opponent}`,
    deficitAt: `${night.deficit.score} ${night.deficit.when}`,
    goals: night.lateGoals.map((goal) => ({
      name: goal.name,
      clock: clockLabel(goal.minute, goal.added),
      absoluteMinute: goal.minute === 90 && goal.added != null ? 90 + goal.added : goal.minute,
    })),
  }));
  const eras = lateGoalManagerEras();
  const ferguson = eras.find((era) => era.label === "Ferguson");
  const since = eras.find((era) => era.label === "Since Ferguson");
  if (!ferguson || !since) notFound();
  const fergLate = ferguson.reg + ferguson.stoppage;
  const sinceLate = since.reg + since.stoppage;
  const originalOpp = original.opponentGoals[0];
  const continuedOpp = continued.opponentGoals[0];
  const originalGoals = echoes[0].lateGoals;
  const continuedGoals = echoes[2].lateGoals;
  const originalSub = originalOpp?.minute != null
    ? `${familyName(originalOpp.player_display_name ?? originalOpp.player_name ?? "Wednesday")}, ${originalOpp.minute}′. ${familyName(originalGoals[0]?.name ?? "Bruce")}, ${clockLabel(originalGoals[0]?.minute ?? 86, originalGoals[0]?.added ?? null)}. ${familyName(originalGoals[1]?.name ?? "Bruce")}, ${clockLabel(originalGoals[1]?.minute ?? 90, originalGoals[1]?.added ?? 6)}.`
    : `${original.score} after two late Bruce goals.`;
  const continuedSub = continuedOpp?.minute != null
    ? `${familyName(continuedOpp.player_display_name ?? continuedOpp.player_name ?? "Brentford")}, ${continuedOpp.minute}′. ${familyName(continuedGoals[0]?.name ?? "McTominay")}, ${clockLabel(continuedGoals[0]?.minute ?? 90, continuedGoals[0]?.added ?? 3)}. ${familyName(continuedGoals[1]?.name ?? "McTominay")}, ${clockLabel(continuedGoals[1]?.minute ?? 90, continuedGoals[1]?.added ?? 7)}.`
    : `${continued.score} after two late McTominay goals.`;

  return (
    <>
      <FergieTimeLoop
        knots={echoes.map((night) => ({
          date: night.date,
          clocks: night.lateGoals.map((goal) => clockLabel(goal.minute, goal.added)).join(" / "),
        }))}
        axisEndYear={new Date().getFullYear()}
      />

      <div className="journey-floodlit full-bleed-viewport relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_60%_at_50%_0%,rgba(255,238,210,0.06),transparent_45%)]" aria-hidden />
        <div className="relative mx-auto w-full max-w-6xl px-4 sm:px-8">
          <JourneyBeat
            step={1}
            headline={<>The last seconds had <JourneyThreadAnchor>the same script.</JourneyThreadAnchor></>}
            sub="0–1. Then level. Then 2–1 — Bruce, Sheringham and Ole, McTominay."
            source={<JourneySourceLink href="/questions/late-goals" label="The late-goal record" />}
            align="left"
          >
            <div className="journey-figure-bleed relative overflow-hidden bg-pitch bg-[radial-gradient(72%_125%_at_50%_100%,rgba(216,33,13,0.14),transparent_70%)] py-14 sm:py-20">
              <span className="pointer-events-none absolute bottom-0 right-[5%] stat-num text-[10rem] font-bold leading-none text-devil-bright/[0.06] sm:text-[13rem]" aria-hidden>90+</span>
              <div className="relative mx-auto w-full max-w-4xl px-4 sm:px-8"><StoppageEcho nights={echoNights} /></div>
            </div>
          </JourneyBeat>

          <JourneyBeat
            step={2}
            headline={<>United were still one goal down at 86′. <JourneyThreadAnchor>Bruce had ten minutes.</JourneyThreadAnchor></>}
            sub={originalSub}
            source={<JourneySourceLink href={`/match/${original.id}`} label="10 Apr · Sheffield Wednesday" />}
            align="right"
          >
            <div className="journey-figure-bleed relative overflow-hidden bg-pitch bg-[radial-gradient(80%_70%_at_50%_8%,rgba(216,33,13,0.13),transparent_70%)] py-10 sm:py-16">
              <span className="pointer-events-none absolute right-[7%] top-0 stat-num text-8xl font-bold text-ink/[0.035] sm:text-[10rem]" aria-hidden>93</span>
              <div className="relative mx-auto w-full max-w-5xl px-5 sm:px-10"><EchoReceipt receipt={original} heading="Premier League — Old Trafford" /></div>
            </div>
          </JourneyBeat>

          <JourneyBeat
            step={3}
            headline={<>United were still one goal down at 90′. <JourneyThreadAnchor>McTominay had seven.</JourneyThreadAnchor></>}
            sub={continuedSub}
            source={<JourneySourceLink href={`/match/${continued.id}`} label="7 Oct · Brentford" />}
            align="center"
          >
            <div className="journey-figure-bleed relative overflow-hidden bg-pitch bg-[radial-gradient(80%_70%_at_50%_8%,rgba(111,159,224,0.13),transparent_70%)] py-10 sm:py-16">
              <span className="pointer-events-none absolute right-[7%] top-0 stat-num text-8xl font-bold text-ink/[0.035] sm:text-[10rem]" aria-hidden>23</span>
              <div className="relative mx-auto w-full max-w-5xl px-5 sm:px-10"><EchoReceipt receipt={continued} heading="Premier League — Old Trafford" /></div>
            </div>
          </JourneyBeat>

          <JourneyBeat
            step={4}
            headline={<>The name left. <JourneyThreadAnchor>The late goals did not.</JourneyThreadAnchor></>}
            sub={`United goals after 85′ with a recorded minute. The final five regulation minutes barely move (${percent(ferguson.reg, ferguson.timed)} to ${percent(since.reg, since.timed)}); the larger change is stoppage time (${percent(ferguson.stoppage, ferguson.timed)} to ${percent(since.stoppage, since.timed)}).`}
            className="min-h-[65vh] justify-center"
          >
            <div className="flex w-full flex-col items-center gap-8 pb-16">
              <div className="w-full min-w-0">
                <div className="journey-figure-bleed relative overflow-hidden bg-pitch bg-[radial-gradient(72%_125%_at_50%_100%,rgba(216,33,13,0.12),transparent_70%)] py-10 sm:py-12">
                  <div className="mx-auto w-full max-w-5xl px-5 sm:px-10">
                    <LateGoalScatter points={lateGoalScatter()} annotated={annotatedLateGoals()} compact />
                    <p className="mt-3 text-xs text-ink-dim">Every dot is a United goal after the 85th with a recorded minute. The three gold knots are this chapter’s loop.</p>
                  </div>
                </div>
              </div>
              <Link href="/matches?goalWindow=late" className="inline-flex items-center gap-2 rounded-full border border-devil-bright/60 bg-devil/15 px-6 py-3 text-sm font-semibold text-ink shadow-[0_0_30px_-6px_rgba(255,59,31,0.6)] transition hover:border-devil-bright hover:bg-devil/25 focus-ring">Every late-goal match →</Link>
              <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-medium uppercase tracking-[0.18em] text-ink-faint">
                {echoes.map((night) => <Link key={night.id} href={`/match/${night.id}`} className="transition hover:text-gold focus-ring">{night.date.slice(0, 4)} · {night.opponent} →</Link>)}
              </div>
              <Link href="/questions/late-goals" className="text-xs font-medium uppercase tracking-[0.16em] text-ink-faint transition hover:text-gold focus-ring">The full answer →</Link>
              <JourneyChapterNav current="/stories/fergie-time" />
            </div>
          </JourneyBeat>
        </div>
      </div>
    </>
  );
}
