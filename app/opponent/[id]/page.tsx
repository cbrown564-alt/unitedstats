import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { opponentById, opponentMatches, opponentsIndex } from "@/lib/queries";
import {
  longestStreak, notableMatches, opponentCupRecord, opponentResultSequence, opponentVenueSplits,
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
import { TrailLink } from "@/components/PageHeader";
import { WdlBar, WdlRecord } from "@/components/WdlBar";
import { CoverageNote } from "@/components/CoverageNote";
import { EvidenceLink } from "@/components/EvidenceLink";
import { SectionHead } from "@/components/SectionHead";
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
  const unbeaten = longestStreak(sequence, "unbeaten");
  const winless = longestStreak(sequence, "winless");
  const accent = clubColor(id, o.name).bg;
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

  // Standout matches: United's biggest win and heaviest defeat in the fixture,
  // plus the matches that ended the longest unbeaten and winless runs either way.
  const notable = notableMatches(sequence, [
    { streak: unbeaten, noun: "unbeaten run" },
    { streak: winless, noun: "run without a win" },
  ]);

  return (
    <div className="space-y-8">
      <DetailBreadcrumb segments={[{ label: o.name }]} />
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
        }}
      />

      <DetailSectionTabs
        defaultTab="fixture"
        ariaLabel="Head-to-head sections"
        idPrefix="opponent"
        tabs={[
          {
            id: "fixture",
            label: "Fixture",
            content: (
              <section className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-1">
                  <SectionHead title="Home and away" aside="all competitions" />
                  <div className="space-y-3 rounded-xl border border-line bg-panel p-4 sm:p-5">
                    {venues.map((v) => (
                      <div key={v.venue}>
                        <div className="mb-1.5 flex justify-between text-sm">
                          <span className="text-ink-dim">{venueLabel(v.venue)}</span>
                          <span className="stat-num text-xs text-ink-faint">
                            {fmtNum(v.p)} P · <span className="text-ink">{pct(v.w, v.p)}</span> W
                          </span>
                        </div>
                        <WdlBar w={v.w} d={v.d} l={v.l} />
                      </div>
                    ))}
                    <CoverageNote
                      slice="every meeting in this fixture, split by venue; all competitions."
                      evidenceHref={`/matches?opponent=${id}&venue=A`}
                      evidenceLabel="Away meetings only →"
                    />
                  </div>
                </div>

                <div className="lg:col-span-1">
                  <SectionHead title="Cup meetings" aside="knockouts only" />
                  {cup.p > 0 ? (
                    <div className="rounded-xl border border-line bg-panel p-4 sm:p-5">
                      <div className="flex items-baseline gap-2">
                        <span className="stat-num text-3xl font-semibold text-win">{pct(cup.w, cup.p)}</span>
                        <span className="text-sm text-ink-dim">won</span>
                      </div>
                      <p className="stat-num mt-1.5 text-xs text-ink-faint">
                        <WdlRecord w={cup.w} d={cup.d} l={cup.l} /> from {fmtNum(cup.p)} cup tie{cup.p === 1 ? "" : "s"}
                        {cup.first ? ` · ${cup.first.slice(0, 4)}–${cup.last?.slice(0, 4)}` : ""}
                      </p>
                      <CoverageNote
                        slice="knockout ties only — domestic and European cups."
                        evidenceHref={`/matches?opponent=${id}&type=cup`}
                        evidenceLabel="Show the cup ties →"
                      />
                    </div>
                  ) : (
                    <p className="rounded-xl border border-line bg-panel px-4 py-5 text-sm text-ink-faint">
                      League meetings only — no cup tie on record.
                    </p>
                  )}
                </div>

                <div className="lg:col-span-1">
                  <SectionHead title="Longest runs" aside="this fixture" />
                  <RunCallouts runs={runs} empty="No run of 3+ meetings either way." />
                  <CoverageNote slice="consecutive meetings in this fixture, all competitions." />
                </div>
              </section>
            ),
          },
          {
            id: "meetings",
            label: "Meetings",
            content: (
              <section>
                <SectionHead title="All meetings" aside={`${fmtNum(total)} on record`} />
                {notable.length > 0 && <NotableMatches matches={notable} className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3" />}
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
                <CoverageNote slice={`every recorded United v ${o.name} fixture, all competitions`} />
              </section>
            ),
          },
          {
            id: "trails",
            label: "Trails",
            content: (
              <section>
                <SectionHead title="Related trails" />
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <TrailLink href={`/matches?opponent=${id}&venue=A`} title="Away record">
                    Every meeting at their ground, where bogey records usually live.
                  </TrailLink>
                  {cup.p > 0 && (
                    <TrailLink href={`/matches?opponent=${id}&type=cup`} title="Cup ties">
                      The {cup.p} knockout meeting{cup.p === 1 ? "" : "s"} between the sides.
                    </TrailLink>
                  )}
                  <TrailLink href="/search" title="Search opponents">
                    Find any head-to-head in the record — search by club name.
                  </TrailLink>
                </div>
              </section>
            ),
          },
        ]}
      />
    </div>
  );
}
