import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  opponentById,
  opponentMatches,
  opponentSeasonRecords,
  opponentsIndex,
} from "@/lib/queries";
import {
  longestStreak,
  notableMatches,
  opponentCupRecord,
  opponentResultSequence,
  opponentVenueSplits,
  streakResults,
} from "@/lib/trails";
import { clubColor } from "@/lib/clubColors";
import { ClubBadge } from "@/components/ClubBadge";
import { IdentityPlate } from "@/components/IdentityPlate";
import { DetailBreadcrumb } from "@/components/DetailBreadcrumb";
import { DetailSectionTabs } from "@/components/mobile/DetailSectionTabs";
import { RunCallouts, type Run } from "@/components/RunCallouts";
import { MatchArchive } from "@/components/MatchArchive";
import { ResultSpine } from "@/components/charts/ResultSpine";
import { NotableMatches } from "@/components/NotableMatches";
import { WdlBar } from "@/components/WdlBar";
import { GoalDiff } from "@/components/GoalDiff";
import { CoverageNote } from "@/components/CoverageNote";
import { EvidenceLink } from "@/components/EvidenceLink";
import { SectionHead } from "@/components/SectionHead";
import {
  enrichOpponentSeasons,
  opponentBestSeason,
  seasonSpanAnchor,
} from "@/lib/opponentSeasonHighlights";
import { fmtNum, pct, venueLabel } from "@/lib/format";
import { queryString } from "@/lib/url";
import { sampleStaticIds } from "@/lib/static-build";

// Sampled SSG (see lib/static-build): preview builds prerender a subset, so
// non-sampled ids render on demand; full builds prerender every id, leaving only
// missing ids to fall through to notFound(). Must be a static literal for Next.
export const dynamicParams = true;

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const o = opponentById(id);
  if (!o) return {};
  const title = `United v ${o.name}`;
  const description = `Manchester United’s head-to-head record against ${o.name}. ${fmtNum(o.p)} meetings since ${o.first?.slice(0, 4)}: ${pct(o.w, o.p)} wins.`;
  return {
    title,
    description,
    openGraph: {
      title: `${title} · Red Thread`,
      description,
    },
  };
}

export function generateStaticParams() {
  return sampleStaticIds(opponentsIndex().map((o) => o.id)).map((id) => ({ id }));
}

export default async function OpponentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const o = opponentById(id);
  if (!o) notFound();
  const total = o.p;
  const allMatches = opponentMatches(id);
  const venues = opponentVenueSplits(id);
  const cup = opponentCupRecord(id);
  const sequence = opponentResultSequence(id);
  const bySeason = enrichOpponentSeasons(opponentSeasonRecords(id));
  const unbeaten = longestStreak(sequence, "unbeaten");
  const winless = longestStreak(sequence, "winless");
  const accent = clubColor(id, o.name).bg;

  const venuePMax = Math.max(1, ...venues.map((v) => v.p));

  const runs = [
    unbeaten && unbeaten.length >= 3
      ? {
          n: unbeaten.length,
          label: "unbeaten",
          tone: "text-win",
          from: unbeaten.from,
          to: unbeaten.to,
          kind: "unbeaten" as const,
          results: streakResults(sequence, unbeaten, "unbeaten"),
        }
      : null,
    winless && winless.length >= 3
      ? {
          n: winless.length,
          label: "without a win",
          tone: "text-loss",
          from: winless.from,
          to: winless.to,
          kind: "winless" as const,
          results: streakResults(sequence, winless, "winless"),
        }
      : null,
  ].filter((r): r is Run => r != null);

  const notable = notableMatches(sequence, [
    { streak: unbeaten, noun: "unbeaten run" },
    { streak: winless, noun: "run without a win" },
  ]);

  const y0 = Number(o.first?.slice(0, 4));
  const y1 = Number(o.last?.slice(0, 4));
  const span = Math.max(0.5, y1 - y0);
  const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
  const bestSeason = opponentBestSeason(bySeason);
  const bestSeasonAnchor = bestSeason ? seasonSpanAnchor(bestSeason.season) : null;
  const bestSeasonAt =
    bestSeasonAnchor != null && Number.isFinite(y0) ? clamp01((bestSeasonAnchor - y0) / span) : null;
  const bestSeasonTitle = bestSeason
    ? `Best season: ${pct(bestSeason.w, bestSeason.p)} won in ${bestSeason.season} (${fmtNum(bestSeason.p)} meetings)`
    : null;

  return (
    <div className="space-y-10">
      <DetailBreadcrumb
        segments={[
          { label: "Opponents", href: "/search?kind=opponent" },
          { label: o.name },
        ]}
      />
      <div className="space-y-4">
        <IdentityPlate
          eyebrow="Head to head"
          share={{ path: `/opponent/${id}`, title: `Manchester United v ${o.name} — head-to-head record` }}
          leading={<ClubBadge id={id} name={o.name} size="lg" />}
          title={`United v ${o.name}`}
          subtitle={
            <>
              {o.country && <span>{o.country}</span>}
              {o.country && <span aria-hidden className="text-ink-faint">·</span>}
              <span>first met {o.first?.slice(0, 4)}</span>
            </>
          }
          record={o}
          accent={accent}
          span={{
            leftLabel: "First met",
            left: <span className="stat-num text-ink">{o.first?.slice(0, 4)}</span>,
            rightLabel: "Last met",
            right: <span className="stat-num text-ink">{o.last?.slice(0, 4)}</span>,
            caption: `Every meeting between the sides, ${o.first?.slice(0, 4)}–${o.last?.slice(0, 4)}.`,
            peakSeason:
              bestSeason && bestSeasonAt != null && bestSeasonTitle
                ? { season: bestSeason.season, at: bestSeasonAt, title: bestSeasonTitle }
                : undefined,
          }}
        />

        <DetailSectionTabs
          defaultTab="overview"
          ariaLabel="Head-to-head sections"
          idPrefix="opponent"
          tabs={[
            {
              id: "overview",
              label: "Overview",
              content: (
                <div className="space-y-8">
                  <section className="grid gap-6 lg:grid-cols-2">
                    <div>
                      <SectionHead title="Home and away" aside="all competitions" />
                      <div className="space-y-3 rounded-xl border border-line bg-panel p-4 sm:p-5">
                        {venues.map((v) => (
                          <div key={v.venue}>
                            <div className="mb-1.5 flex justify-between text-sm">
                              <span className="text-ink-dim">{venueLabel(v.venue)}</span>
                              <span className="stat-num text-xs text-ink-faint">
                                <span className="text-ink">{pct(v.w, v.p)}</span> W
                              </span>
                            </div>
                            <WdlBar
                              w={v.w}
                              d={v.d}
                              l={v.l}
                              size="md"
                              showLabels
                              volume={{ fraction: Math.sqrt(v.p / venuePMax), games: v.p }}
                            />
                          </div>
                        ))}
                        <CoverageNote
                          className="!mt-0"
                          slice="every meeting in this fixture, split by venue; all competitions."
                          evidenceHref={`/matches?opponent=${id}&venue=A`}
                          evidenceLabel="Away meetings only →"
                        />
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div>
                        <SectionHead title="Cup meetings" aside="knockouts only" />
                        {cup.p > 0 ? (
                          <div className="rounded-xl border border-line bg-panel p-4 sm:p-5">
                            <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
                              <div className="leading-none">
                                <div className="flex items-baseline gap-2">
                                  <span className="stat-num text-4xl font-semibold text-win">{pct(cup.w, cup.p)}</span>
                                  <span className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-faint">won</span>
                                </div>
                                <p className="stat-num mt-1.5 text-xs text-ink-faint">
                                  {fmtNum(cup.p)} cup tie{cup.p === 1 ? "" : "s"}
                                  {cup.first ? ` · ${cup.first.slice(0, 4)}–${cup.last?.slice(0, 4)}` : ""}
                                </p>
                              </div>
                              <GoalDiff gf={cup.gf} ga={cup.ga} played={cup.p} />
                            </div>
                            <div className="mt-5">
                              <WdlBar w={cup.w} d={cup.d} l={cup.l} size="md" showLabels />
                            </div>
                            <div className="mt-4 border-t border-line/60 pt-3">
                              <CoverageNote
                                className="!mt-0"
                                slice="knockout ties only — domestic and European cups."
                                evidenceHref={`/matches?opponent=${id}&type=cup`}
                                evidenceLabel="Show the cup ties →"
                              />
                            </div>
                          </div>
                        ) : (
                          <p className="rounded-xl border border-line bg-panel px-4 py-5 text-sm text-ink-faint">
                            League meetings only — no cup tie on record.
                          </p>
                        )}
                      </div>

                      {runs.length > 0 && (
                        <div>
                          <SectionHead title="Longest runs" aside="this fixture" />
                          <RunCallouts runs={runs} empty="" />
                          <CoverageNote className="!mt-0" slice="consecutive meetings in this fixture, all competitions." />
                        </div>
                      )}
                    </div>
                  </section>
                </div>
              ),
            },
            {
              id: "matches",
              label: "Matches",
              content: (
                <section>
                  <SectionHead title="Matches" aside={`${fmtNum(total)} on record`} />
                  {notable.length > 0 && (
                    <NotableMatches matches={notable} className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3" />
                  )}
                  {sequence.length >= 20 && (
                    <div className="mb-4 rounded-xl border border-line bg-panel p-4 sm:p-5">
                      <ResultSpine
                        matches={sequence}
                        markers={notable.map((m) => ({ id: m.id, label: m.reason }))}
                        subject={`United v ${o.name}`}
                      />
                      <p className="mt-2 text-[11px] leading-4 text-ink-faint">
                        Every meeting in order — United wins above the line, defeats below, bar height the goal margin.
                        Gold pips mark the standout matches above.
                      </p>
                    </div>
                  )}
                  <div className="mb-3 flex justify-end">
                    <EvidenceLink href={`/matches?opponent=${id}`} label="Filter these in the match browser →" />
                  </div>
                  <MatchArchive
                    matches={allMatches}
                    accentResult
                    hrefForSeason={(season) => `/matches${queryString({ opponent: id, season })}`}
                  />
                </section>
              ),
            },
          ]}
        />
      </div>

      <OpponentDataCoverage
        opponentId={id}
        opponentName={o.name}
        matchCount={total}
        hasCupMeetings={cup.p > 0}
      />

      <p className="text-sm">
        <Link href="/search?kind=opponent" className="text-devil-bright hover:underline focus-ring">
          ← All opponents
        </Link>
      </p>
    </div>
  );
}

function OpponentDataCoverage({
  opponentId,
  opponentName,
  matchCount,
  hasCupMeetings,
}: {
  opponentId: string;
  opponentName: string;
  matchCount: number;
  hasCupMeetings: boolean;
}) {
  return (
    <details className="group rounded-xl border border-line bg-panel">
      <summary className="flex cursor-pointer list-none items-baseline justify-between gap-3 px-4 py-3 sm:px-5">
        <span className="text-sm font-medium text-ink-dim">Data coverage</span>
        <span className="stat-num text-xs text-ink-faint">
          <span className="text-devil-bright group-open:hidden">show</span>
          <span className="hidden text-devil-bright group-open:inline">hide</span>
        </span>
      </summary>
      <div className="space-y-3 border-t border-line px-4 pb-4 pt-3 sm:px-5 sm:pb-5">
        <p className="text-xs text-ink-dim">
          <span className="font-medium text-ink">Club record</span> — verified competitive W/D/L in the hero plate.
          Splits below are drawn from every recorded meeting against {opponentName} ({fmtNum(matchCount)} total).
        </p>

        <CoverageNote
          className="!mt-0"
          slice="venue splits"
          coverage="every meeting against this opponent, cut by home, away, and neutral."
          evidenceHref={`/matches?opponent=${opponentId}&venue=A`}
          evidenceLabel="Away meetings →"
        />

        {hasCupMeetings && (
          <CoverageNote
            className="!mt-0"
            slice="cup meetings"
            coverage="knockout ties only — domestic and European cups, excluding league fixtures."
            evidenceHref={`/matches?opponent=${opponentId}&type=cup`}
            evidenceLabel="Cup ties →"
          />
        )}

        <CoverageNote
          className="!mt-0"
          slice="match archive and result spine"
          coverage={`every competitive meeting against ${opponentName}, all competitions, newest-first in the Matches tab.`}
          evidenceHref={`/matches?opponent=${opponentId}`}
          evidenceLabel="Match browser →"
        />
      </div>
    </details>
  );
}
