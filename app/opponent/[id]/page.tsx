import Link from "next/link";
import { notFound } from "next/navigation";
import { opponentById, opponentMatches, opponentsIndex } from "@/lib/queries";
import {
  longestStreak, notableMatches, opponentCupRecord, opponentResultSequence, opponentVenueSplits,
} from "@/lib/trails";
import { oddsFor } from "@/lib/predict";
import { clubColor } from "@/lib/clubColors";
import { ClubBadge } from "@/components/ClubBadge";
import { IdentityPlate } from "@/components/IdentityPlate";
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

export const dynamicParams = false;

export function generateStaticParams() {
  return opponentsIndex().map((o) => ({ id: o.id }));
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
  const oddsHome = oddsFor(id, "H");
  const oddsAway = oddsFor(id, "A");
  const oddsPanels =
    oddsHome && oddsAway
      ? [
          { label: "At home", odds: oddsHome },
          { label: "Away", odds: oddsAway },
        ]
      : [];
  const accent = clubColor(id, o.name).bg;
  const runs = [
    unbeaten && unbeaten.length >= 3
      ? { n: unbeaten.length, label: "unbeaten", tone: "text-win", from: unbeaten.from, to: unbeaten.to }
      : null,
    winless && winless.length >= 3
      ? { n: winless.length, label: "without a win", tone: "text-loss", from: winless.from, to: winless.to }
      : null,
  ].filter(Boolean) as Run[];

  // Standout matches: United's biggest win and heaviest defeat in the fixture,
  // plus the matches that ended the longest unbeaten and winless runs either way.
  const notable = notableMatches(sequence, [
    { streak: unbeaten, noun: "unbeaten run" },
    { streak: winless, noun: "run without a win" },
  ]);

  return (
    <div className="space-y-8">
      <IdentityPlate
        eyebrow="Head to head"
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

      <section className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <SectionHead title="Home and away" aside="all competitions" />
          <div className="space-y-3 rounded-xl border border-line bg-panel p-4 sm:p-5">
            {venues.map((v) => (
              <div key={v.venue}>
                <div className="flex justify-between text-sm mb-1.5">
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
                slice="knockout ties only — domestic & European cups."
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
          <CoverageNote slice="consecutive meetings in this fixture, all competitions.">
            A gap of any other result breaks the run.
          </CoverageNote>
        </div>
      </section>

      {oddsPanels.length > 0 && (
        <section>
          <SectionHead title="If they met tomorrow" aside="closed-universe Elo" />
          <div className="grid sm:grid-cols-2 gap-3 max-w-2xl">
            {oddsPanels.map(({ label, odds }) => (
              <div key={label} className="border border-line rounded-lg bg-panel px-4 py-3">
                <div className="text-xs text-ink-faint uppercase tracking-wider mb-1">{label}</div>
                <div className="stat-num text-lg font-semibold">
                  <span className="text-win">{(100 * odds.pW).toFixed(0)}%</span>
                  <span className="text-ink-faint text-sm"> W · </span>
                  <span className="text-draw">{(100 * odds.pD).toFixed(0)}%</span>
                  <span className="text-ink-faint text-sm"> D · </span>
                  <span className="text-loss">{(100 * odds.pL).toFixed(0)}%</span>
                  <span className="text-ink-faint text-sm"> L</span>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-ink-faint mt-2 max-w-2xl">
            Closed-universe Elo at today&apos;s ratings, split by the historical record at that
            expectancy; {o.name}&apos;s rating last moved when the sides last met ({o.last}).{" "}
            <Link href={`/analytics?opponent=${id}`} className="text-devil-bright hover:underline">
              How this is computed →
            </Link>
          </p>
        </section>
      )}

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
        <CoverageNote
          slice="every recorded United v opponent fixture, all competitions"
          coverage={`${fmtNum(total)} meetings, ${o.first?.slice(0, 4)}–${o.last?.slice(0, 4)}, season by season; pre-merge name changes are folded into one opponent where known.`}
        />
      </section>

      <section>
        <SectionHead title="Keep exploring" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <TrailLink href={`/matches?opponent=${id}&venue=A`} title="Away record">
            Every meeting at their ground, where bogey records usually live.
          </TrailLink>
          {cup.p > 0 && (
            <TrailLink href={`/matches?opponent=${id}&type=cup`} title="Cup ties">
              The {cup.p} knockout meeting{cup.p === 1 ? "" : "s"} between the sides.
            </TrailLink>
          )}
          <TrailLink href="/opponents" title="All opponents">
            Compare this head-to-head against every other side United have faced.
          </TrailLink>
        </div>
      </section>
    </div>
  );
}
