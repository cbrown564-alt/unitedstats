import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FortressSpinoff } from "@/components/journey/FortressSpinoff";
import { ThreeCracks, crackGoalClock, type ThreeCrackNight } from "@/components/journey/ThreeCracks";
import { JourneyBeat, JourneySourceLink, JourneyThreadAnchor } from "@/components/journey/JourneyBeat";
import { JourneyChapterNav } from "@/components/journey/JourneyChapterNav";
import { MatchFlow } from "@/components/MatchFlow";
import { LeadHeldDotplot, type LeadDot } from "@/components/charts/LeadHeldDotplot";
import {
  fortressRun,
  fortressShortOpponent,
  matchReceipt,
  trailingBoard,
  type MatchReceipt,
  type TrailingBoard,
} from "@/lib/journey";
import { leadHeldAtHome } from "@/lib/trails";
import { familyName } from "@/lib/names";
import { scoreline } from "@/lib/format";

export const revalidate = 86400;
export const metadata: Metadata = {
  title: "Journey — Fortress OT",
  description:
    "Old Trafford: led at half-time since May 1984 — fallen behind only three times, never lost.",
  robots: { index: false, follow: false },
};

const MONTHS_FULL = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** "2025-12-15" → "15 Dec". */
function dayMonthShort(iso: string): string {
  return `${Number(iso.slice(8, 10))} ${MONTHS_FULL[Number(iso.slice(5, 7)) - 1].slice(0, 3)}`;
}

function fmtNum(n: number): string {
  return n.toLocaleString("en-GB");
}

/**
 * One crack or hinge night with the real /match flow. Lever C: when United
 * trailed, a quiet board sits above the flow — the score before the rescue
 * (or the defeat). Final score stays muted in the header.
 */
function NightCard({
  receipt,
  heading,
  trailing,
}: {
  receipt: MatchReceipt;
  heading: string;
  trailing?: TrailingBoard | null;
}) {
  return (
    <div className="flex flex-col">
      <div className="flex items-baseline justify-center gap-3">
        <span className="stat-num text-lg font-bold text-ink">{dayMonthShort(receipt.date)}</span>
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
        <MatchFlow
          unitedGoals={receipt.unitedGoals}
          opponentGoals={receipt.opponentGoals}
          aet={receipt.aet}
        />
      </div>
    </div>
  );
}

/**
 * Story chapter 3 — Fortress OT as a place spin-off (docs/JOURNEY.md §4c),
 * rendered from /stories/fortress-ot; the legacy /journey/fortress path redirects.
 * Discovery arc: pocket + OT monument → three cracks → Bournemouth night →
 * Ipswich hinge → door with the living wall into home matches.
 */
export default function FortressJourneyPage() {
  const run = fortressRun();
  if (!run || run.cracks.length !== 3) notFound();

  const bournemouth = matchReceipt(run.cracks[2].id);
  const ipswich = matchReceipt(run.lastLoss.id);
  if (!bournemouth || !ipswich) notFound();

  const lh = leadHeldAtHome();
  const closeRanks = new Map(run.cracks.map((c, i) => [c.id, i + 1]));
  const leadDots: LeadDot[] = lh.games.map((g) => {
    const outcome =
      g.result === "W" ? `won ${g.gf}–${g.ga}` : g.result === "L" ? `lost ${g.gf}–${g.ga}` : `drew ${g.gf}–${g.ga}`;
    const note =
      g.result === "L" ? " (lead lost)" : g.worst < 0 ? " (fell behind, rescued)" : g.result === "D" ? " (lead surrendered)" : "";
    return {
      result: g.result as LeadDot["result"],
      surrendered: g.result === "D",
      rank: closeRanks.get(g.id),
      title: `${g.date} — ${outcome} v ${g.opponent_name}${note}`,
    };
  });

  const hingeYear = Number(run.lastLoss.date.slice(0, 4));
  const crackNights: ThreeCrackNight[] = run.cracks.map((c) => {
    const receipt = matchReceipt(c.id);
    const goals = receipt
      ? [
          ...receipt.unitedGoals
            .filter((g) => g.minute != null)
            .map((g) => ({
              clock: crackGoalClock(g.minute as number, g.added_time),
              minute: g.minute as number,
              added: g.added_time,
              delta: 1 as const,
              name: g.player_display_name ?? g.player_name ?? "",
            })),
          ...receipt.opponentGoals
            .filter((g) => g.minute != null)
            .map((g) => ({
              clock: crackGoalClock(g.minute as number, g.added_time),
              minute: g.minute as number,
              added: g.added_time,
              delta: -1 as const,
              name: g.player_display_name ?? g.player_name ?? "",
            })),
        ]
      : [];
    return { ...c, goals };
  });

  const crackSub = run.cracks
    .map((c) => `${fortressShortOpponent(c.opponent)} ${c.ft}`)
    .join(". ");

  const bourneBoard = trailingBoard(bournemouth);
  // The opponent goal that first put United behind after the break (not a leveller).
  let united = 0;
  let opponent = 0;
  let deficitScorer: string | null = null;
  let deficitMinute: number | null = null;
  const bourneEvents = [
    ...bournemouth.unitedGoals
      .filter((g) => g.minute != null)
      .map((g) => ({ minute: g.minute as number, delta: 1 as const, name: g.player_display_name ?? g.player_name ?? "" })),
    ...bournemouth.opponentGoals
      .filter((g) => g.minute != null)
      .map((g) => ({ minute: g.minute as number, delta: -1 as const, name: g.player_display_name ?? g.player_name ?? "" })),
  ].sort((a, b) => a.minute - b.minute);
  for (const e of bourneEvents) {
    if (e.delta === 1) united += 1;
    else opponent += 1;
    if (united < opponent && deficitScorer == null) {
      deficitScorer = e.name;
      deficitMinute = e.minute;
    }
  }
  const bourneSub =
    deficitScorer != null && deficitMinute != null
      ? `Half-time ${run.cracks[2].ht}. ${familyName(deficitScorer)} put ${fortressShortOpponent(bournemouth.opponent)} ahead on ${deficitMinute} — then ${bournemouth.score}.`
      : `Half-time ${run.cracks[2].ht}. Fell behind, drew ${bournemouth.score}.`;

  // Ipswich: Hughes scored first; the lead was lost late.
  const ipswichUnited = ipswich.unitedGoals[0];
  const ipswichWinner = ipswich.opponentGoals[ipswich.opponentGoals.length - 1];
  const ipswichSub =
    ipswichUnited?.minute != null && ipswichWinner?.minute != null
      ? `${familyName(ipswichUnited.player_display_name ?? "")} ${ipswichUnited.minute}′. ${familyName(ipswichWinner.player_display_name ?? "")} ${ipswichWinner.minute}′. ${scoreline(run.lastLoss.gf, run.lastLoss.ga)}.`
      : `Led ${scoreline(run.lastLoss.htf, run.lastLoss.hta)} at the break. Lost ${scoreline(run.lastLoss.gf, run.lastLoss.ga)}.`;

  const bourneMonth = MONTHS_FULL[Number(bournemouth.date.slice(5, 7)) - 1];
  const bourneYear = bournemouth.date.slice(0, 4);

  return (
    <>
      <FortressSpinoff
        hingeYear={hingeYear}
        runGames={run.games}
        cracks={crackNights.map((c) => ({
          id: c.id,
          date: c.date,
          label: fortressShortOpponent(c.opponent),
        }))}
        axisEndYear={new Date().getFullYear()}
        monumentSrc="/media/journey/old-trafford.webp"
        monumentObjectPosition="48% 38%"
      />

      <div className="journey-floodlit full-bleed-viewport relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_60%_at_50%_0%,rgba(255,238,210,0.06),transparent_45%)]"
          aria-hidden
        />
        <div className="relative mx-auto w-full max-w-6xl px-4 sm:px-8">
          {/* Beat 1 — three cracks */}
          <JourneyBeat
            step={1}
            headline={
              <>
                In four decades, fallen behind{" "}
                <JourneyThreadAnchor>only three times.</JourneyThreadAnchor>
              </>
            }
            sub={`${crackSub}. All drew.`}
            source={
              <JourneySourceLink href="/matches?venue=H" label="Every home match" />
            }
            align="left"
          >
            <div className="journey-figure-bleed relative overflow-hidden bg-pitch bg-[radial-gradient(72%_125%_at_50%_100%,rgba(216,33,13,0.14),transparent_70%)] py-14 sm:py-20">
              {/* Fine grain — floodlit ledger texture without a second visual system. */}
              <div
                className="pointer-events-none absolute inset-0 opacity-[0.14] mix-blend-overlay"
                style={{
                  backgroundImage:
                    "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.55'/%3E%3C/svg%3E\")",
                }}
                aria-hidden
              />
              <span
                className="pointer-events-none absolute bottom-0 right-[8%] stat-num text-[9rem] font-bold leading-none text-devil-bright/[0.06] sm:right-[10%] sm:text-[12rem]"
                aria-hidden
              >
                3
              </span>
              <div className="relative mx-auto w-full max-w-3xl px-5 sm:px-10">
                <ThreeCracks cracks={crackNights} />
              </div>
            </div>
          </JourneyBeat>

          {/* Beat 2 — one night: Bournemouth */}
          <JourneyBeat
            step={2}
            headline={
              <>
                {bourneMonth} {bourneYear}:{" "}
                <JourneyThreadAnchor>fell behind, drew 4–4.</JourneyThreadAnchor>
              </>
            }
            sub={bourneSub}
            source={
              <JourneySourceLink
                href={`/match/${bournemouth.id}`}
                label={`${dayMonthShort(bournemouth.date)} · ${fortressShortOpponent(bournemouth.opponent)}`}
              />
            }
            align="left"
          >
            <div className="journey-figure-bleed relative overflow-hidden bg-pitch bg-[radial-gradient(80%_70%_at_50%_8%,rgba(216,33,13,0.13),transparent_70%)] py-10 sm:py-16">
              <span
                className="pointer-events-none absolute right-[8%] top-0 stat-num text-8xl font-bold text-ink/[0.035] sm:right-[10%] sm:text-[10rem]"
                aria-hidden
              >
                4–4
              </span>
              <div className="relative mx-auto w-full max-w-5xl px-5 sm:px-10">
                <NightCard
                  receipt={bournemouth}
                  heading="Premier League — Old Trafford"
                  trailing={bourneBoard}
                />
              </div>
            </div>
          </JourneyBeat>

          {/* Beat 3 — the hinge: Ipswich 1984 */}
          <JourneyBeat
            step={3}
            headline={
              <>
                May {hingeYear}: the last time the lead was{" "}
                <JourneyThreadAnchor>actually lost.</JourneyThreadAnchor>
              </>
            }
            sub={ipswichSub}
            source={
              <JourneySourceLink
                href={`/match/${ipswich.id}`}
                label={`${dayMonthShort(ipswich.date)} · ${fortressShortOpponent(ipswich.opponent)}`}
              />
            }
            align="center"
          >
            <div className="journey-figure-bleed relative overflow-hidden bg-pitch bg-[radial-gradient(80%_70%_at_50%_8%,rgba(111,159,224,0.13),transparent_70%)] py-10 sm:py-16">
              <span
                className="pointer-events-none absolute right-[6%] top-0 stat-num text-8xl font-bold text-ink/[0.035] sm:text-[10rem]"
                aria-hidden
              >
                84
              </span>
              <div className="relative mx-auto w-full max-w-5xl px-5 sm:px-10">
                <NightCard
                  receipt={ipswich}
                  heading="First Division — Old Trafford"
                  trailing={trailingBoard(ipswich)}
                />
              </div>
            </div>
          </JourneyBeat>

          {/* Beat 4 — door: stack + living wall */}
          <JourneyBeat
            step={4}
            headline={
              <>
                Three cracks.{" "}
                <JourneyThreadAnchor>Zero defeats.</JourneyThreadAnchor>
              </>
            }
            sub={`${fmtNum(run.games)} verifiable home league games led at half-time since Ipswich. Now walk every home night.`}
            className="min-h-[65vh] justify-center"
          >
            <div className="flex w-full flex-col items-center gap-8 pb-16">
              {/* Full-width wrapper so the bleed breakout isn't double-offset by
                  items-center on a 100dvw child (that clipped the legend left). */}
              <div className="w-full min-w-0">
                <div className="journey-figure-bleed relative overflow-hidden bg-pitch bg-[radial-gradient(72%_125%_at_50%_100%,rgba(216,33,13,0.12),transparent_70%)] py-10 sm:py-12">
                  <div className="mx-auto w-full max-w-4xl px-5 sm:px-10">
                    <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-ink-dim">
                      <span className="flex items-center gap-1.5">
                        <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: "var(--color-win)" }} />{" "}
                        won
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span
                          className="inline-block h-2.5 w-2.5 rounded-full border-2 bg-pitch"
                          style={{ borderColor: "var(--color-gold)" }}
                        />{" "}
                        lead surrendered — drew
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: "var(--color-loss)" }} />{" "}
                        lead lost — last in {hingeYear}
                      </span>
                    </div>
                    <LeadHeldDotplot
                      dots={leadDots}
                      fromLabel={lh.from.slice(0, 4)}
                      toLabel={lh.to.slice(0, 4)}
                    />
                    <p className="mt-2 text-xs text-ink-dim">
                      Every dot is a home league game United led at half-time — the numbered halos are the three cracks.
                    </p>
                  </div>
                </div>
              </div>

              <Link
                href="/matches?venue=H"
                className="inline-flex items-center gap-2 rounded-full border border-devil-bright/60 bg-devil/15 px-6 py-3 text-sm font-semibold text-ink shadow-[0_0_30px_-6px_rgba(255,59,31,0.6)] transition hover:border-devil-bright hover:bg-devil/25 focus-ring"
              >
                Every home match →
              </Link>
              <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-medium uppercase tracking-[0.18em] text-ink-faint">
                {run.cracks.map((c) => (
                  <Link key={c.id} href={`/match/${c.id}`} className="transition hover:text-gold focus-ring">
                    {dayMonthShort(c.date)} · {fortressShortOpponent(c.opponent)} →
                  </Link>
                ))}
                <Link href={`/match/${ipswich.id}`} className="transition hover:text-gold focus-ring">
                  {dayMonthShort(ipswich.date)} · Ipswich →
                </Link>
              </div>
              <Link
                href="/questions/fortress"
                className="text-xs font-medium uppercase tracking-[0.16em] text-ink-faint transition hover:text-gold focus-ring"
              >
                The full answer →
              </Link>
              <JourneyChapterNav current="/stories/fortress-ot" />
            </div>
          </JourneyBeat>
        </div>
      </div>
    </>
  );
}
