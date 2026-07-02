import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  managerById,
  managerMatches,
  managerSeasonRecords,
  managerSeasonSummaries,
  managerCupLastResults,
  managerTenures,
  managerTransferSummary,
  managerTransfers,
  managersIndex,
} from "@/lib/queries";
import {
  longestStreak,
  managerResultSequence,
  managerSplits,
  notableMatches,
  streakResults,
} from "@/lib/trails";
import { MatchArchive } from "@/components/MatchArchive";
import { ResultSpine } from "@/components/charts/ResultSpine";
import { NotableMatches } from "@/components/NotableMatches";
import { RunCallouts, type Run } from "@/components/RunCallouts";
import { WdlBar } from "@/components/WdlBar";
import { IdentityPlate, type SpanSegment } from "@/components/IdentityPlate";
import { DetailBreadcrumb } from "@/components/DetailBreadcrumb";
import { DetailSectionTabs } from "@/components/mobile/DetailSectionTabs";
import { PlayerPortrait } from "@/components/PlayerPortrait";
import { SectionHead } from "@/components/SectionHead";
import { CoverageNote } from "@/components/CoverageNote";
import { EvidenceLink } from "@/components/EvidenceLink";
import { ManagerCompetitionsPanel } from "@/components/manager/ManagerCompetitionsPanel";
import { ManagerHonoursPanel } from "@/components/ManagerHonoursPanel";
import { ManagerSeasonHighlights } from "@/components/manager/ManagerSeasonHighlights";
import { ManagerSeasonLedger } from "@/components/manager/ManagerSeasonLedger";
import { TransferArchive } from "@/components/TransferArchive";
import { StatTile } from "@/components/PageHeader";
import { InspectableTimeSeriesChartLazy as InspectableTimeSeriesChart } from "@/components/charts/lazy";
import { managerTrophyHaul, managerBestSeason, majorHonoursCaption, splitManagerTrophyHaul } from "@/lib/compare";
import {
  enrichManagerSeasons,
  peakPpgSeasons,
  peakWinRateSeasons,
  seasonSpanAnchor,
} from "@/lib/managerSeasonHighlights";
import { fmtDate, fmtFee, fmtNum, pct } from "@/lib/format";
import { getDb } from "@/lib/db";
import { queryString } from "@/lib/url";
import { sampleStaticIds } from "@/lib/static-build";

// Sampled SSG (see lib/static-build): preview builds prerender a subset, so
// non-sampled ids render on demand; full builds prerender every id, leaving only
// missing ids to fall through to notFound(). Must be a static literal for Next.
export const dynamicParams = true;

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const m = managerById(id);
  if (!m) return {};
  const title = `${m.name}`;
  const description = `${m.name} — Manchester United managerial record. ${fmtNum(m.p)} matches managed: ${pct(m.w, m.p)} win rate.`;
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
  return sampleStaticIds(managersIndex().map((m) => m.id)).map((id) => ({ id }));
}

/** Date → a fractional year ("1999-08-01" → 1999.58) for placing span bands. */
const dnum = (date: string | null | undefined) => {
  if (!date) return null;
  const y = Number(date.slice(0, 4));
  const mo = Number(date.slice(5, 7)) || 1;
  return Number.isFinite(y) ? y + (mo - 1) / 12 : null;
};

export default async function ManagerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const m = managerById(id);
  if (!m) notFound();
  const tenures = managerTenures(id);

  const total = m.p;
  const allMatches = managerMatches(id);
  const market = managerTransferSummary(id);
  const transfers = managerTransfers(id);
  const haul = managerTrophyHaul(id);
  const { major: majorHaul, majorTotal, minorTotal } = splitManagerTrophyHaul(haul);
  const bySeason = enrichManagerSeasons(managerSeasonRecords(id));
  const seasonSummaries = managerSeasonSummaries(id);
  const cupResults = new Map(
    managerCupLastResults(id).map((r) => [`${r.season}:${r.competition_id}`, r.last_outcome]),
  );
  const winPeakSeasons = peakWinRateSeasons(bySeason);
  const ppgPeakSeasons = peakPpgSeasons(bySeason);
  const tenureYears = `${m.first?.slice(0, 4)}–${tenures.some((t) => !t.date_to) ? "present" : m.last?.slice(0, 4)}`;

  const comps = getDb()
    .prepare(
      `SELECT c.id, c.name, c.type, COUNT(*) p, SUM(m.result='W') w, SUM(m.result='D') d, SUM(m.result='L') l
       FROM matches m JOIN competitions c ON c.id = m.competition_id
       WHERE m.manager_id = ? GROUP BY c.id ORDER BY p DESC`,
    )
    .all(id) as { id: string; name: string; type: string; p: number; w: number; d: number; l: number }[];

  const splits = managerSplits(id);
  const bendRows: [label: string, rec: typeof splits.home][] = [
    ["Home", splits.home],
    ["Away", splits.away],
    ["League", splits.league],
    ["Domestic cup", splits.domesticCup],
    ["European cup", splits.europeanCup],
  ];
  const liveSplits = bendRows.filter(([, r]) => r.p > 0);
  const splitPMax = Math.max(1, ...liveSplits.map(([, r]) => r.p));
  const splitGroups: [label: string, rows: typeof bendRows][] = [
    ["Home and away", bendRows.slice(0, 2)],
    ["By competition", bendRows.slice(2)],
  ];

  const sequence = managerResultSequence(id);
  const winning = longestStreak(sequence, "winning");
  const unbeaten = longestStreak(sequence, "unbeaten");
  const runs: Run[] = [
    winning && winning.length >= 3
      ? {
          n: winning.length,
          label: "wins in a row",
          tone: "text-gold",
          from: winning.from,
          to: winning.to,
          kind: "winning",
          results: streakResults(sequence, winning, "winning"),
        }
      : null,
    unbeaten && unbeaten.length >= 3 && (!winning || unbeaten.length > winning.length)
      ? {
          n: unbeaten.length,
          label: "unbeaten",
          tone: "text-win",
          from: unbeaten.from,
          to: unbeaten.to,
          kind: "unbeaten",
          results: streakResults(sequence, unbeaten, "unbeaten"),
        }
      : null,
  ].filter((r): r is Run => r != null);

  const notable = notableMatches(sequence, [{ streak: unbeaten, noun: "unbeaten run" }]);

  const y0 = Math.min(...[dnum(m.first), ...tenures.map((t) => dnum(t.date_from))].filter((n): n is number => n != null));
  const y1 = Math.max(...[dnum(m.last), ...tenures.map((t) => dnum(t.date_to) ?? dnum(m.last))].filter((n): n is number => n != null));
  const span = Math.max(0.5, y1 - y0);
  const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
  const tenureBands: SpanSegment[] = tenures
    .map((t): SpanSegment | null => {
      const a = dnum(t.date_from);
      const b = dnum(t.date_to) ?? y1;
      if (a == null) return null;
      return {
        from: clamp01((a - y0) / span),
        to: clamp01((b - y0) / span),
        title: majorHonoursCaption(majorHaul.categories) ?? t.note ?? undefined,
      };
    })
    .filter((s): s is SpanSegment => s != null);
  const majorHonoursLine = majorHonoursCaption(majorHaul.categories);
  const tenureCaption = tenures
    .map((t) => {
      const dates = `${fmtDate(t.date_from)}–${t.date_to ? fmtDate(t.date_to) : "present"}`;
      return majorHonoursLine ? `${dates} (${majorHonoursLine})` : dates;
    })
    .join(" · ");

  const bestSeason = managerBestSeason(id, haul);
  const bestSeasonAnchor = bestSeason ? seasonSpanAnchor(bestSeason.season) : null;
  const bestSeasonAt =
    bestSeasonAnchor != null ? clamp01((bestSeasonAnchor - y0) / span) : null;
  const bestSeasonTitle = bestSeason
    ? bestSeason.reason === "trophies"
      ? `Best season: ${fmtNum(bestSeason.trophies)} major ${bestSeason.trophies === 1 ? "trophy" : "trophies"} in ${bestSeason.season}`
      : `Best season: ${fmtNum(bestSeason.leaguePoints)} league points in ${bestSeason.season}`
    : null;

  const overallWinPct = total > 0 ? (m.w / total) * 100 : 0;
  const hasTransfers = transfers.length > 0 || Boolean(market && (market.signings > 0 || market.departures > 0));

  const tabs = [
    {
      id: "overview",
      label: "Overview",
      content: (
        <div className="space-y-8">
          {(majorHaul.total > 0 || runs.length > 0) && (
            <section className="grid gap-6 lg:grid-cols-2">
              {majorHaul.total > 0 && (
                <div>
                  <SectionHead title="Trophy cabinet" aside="major honours in charge" />
                  <ManagerHonoursPanel haul={majorHaul} />
                </div>
              )}
              {runs.length > 0 && (
                <div>
                  <SectionHead title="Longest runs" aside="under this manager" />
                  <RunCallouts runs={runs} empty="" />
                </div>
              )}
            </section>
          )}

          <section>
            <SectionHead title="Match splits" aside="venue · competition" />
            <div className="space-y-5 rounded-xl border border-line bg-panel p-4 sm:p-5">
              {splitGroups.map(([groupLabel, rows], gi) => {
                const live = rows.filter(([, r]) => r.p > 0);
                if (live.length === 0) return null;
                return (
                  <div key={groupLabel} className={gi > 0 ? "space-y-3 border-t border-line/60 pt-4" : "space-y-3"}>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-faint">
                      {groupLabel}
                    </p>
                    {live.map(([label, r]) => (
                      <div key={label}>
                        <div className="mb-1.5 flex justify-between text-sm">
                          <span className="text-ink-dim">{label}</span>
                          <span className="stat-num text-xs text-ink-faint">
                            <span className="text-ink">{pct(r.w, r.p)}</span> W
                          </span>
                        </div>
                        <WdlBar
                          w={r.w}
                          d={r.d}
                          l={r.l}
                          size="md"
                          showLabels
                          volume={{ fraction: Math.sqrt(r.p / splitPMax), games: r.p }}
                        />
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      ),
    },
    {
      id: "seasons",
      label: "Seasons",
      content: (
        <div className="space-y-8">
          {bySeason.length > 0 ? (
            <section id="seasons" className="space-y-6">
              {bySeason.length > 1 && (
                <div className="rounded-xl border border-line bg-panel p-4 sm:p-5">
                  <h2 className="display mb-3 text-xl">Win rate by season</h2>
                  <InspectableTimeSeriesChart
                    data={bySeason.map((s) => ({
                      x: Number(s.season.slice(0, 4)),
                      y: s.winPct,
                      label: s.season,
                      valueLabel: `${pct(s.w, s.p)} won`,
                      meta: `${fmtNum(s.p)} matches · ${s.ppg.toFixed(2)} ppg`,
                      href: `/seasons/${s.season}`,
                    }))}
                    height={220}
                    stroke="var(--color-win)"
                    fill="rgb(34 197 94 / 0.12)"
                    baseline={overallWinPct}
                    baselineLabel={`Career ${overallWinPct.toFixed(0)}%`}
                    yDomain={[0, 100]}
                    yTickSuffix="%"
                    chartLabel={`${m.name} win rate by season`}
                    xTicks={[
                      Number(bySeason[0]!.season.slice(0, 4)),
                      Number(bySeason[bySeason.length - 1]!.season.slice(0, 4)),
                    ].map((year) => ({ x: year, label: String(year) }))}
                  />
                </div>
              )}

              <div className="space-y-3">
                <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                  <h2 className="display text-xl">Season by season</h2>
                  <span className="stat-num text-xs text-ink-dim">
                    {fmtNum(bySeason.length)} recorded seasons · {fmtNum(total)} matches
                  </span>
                </div>
                <p className="text-xs text-ink-dim">
                  Points per game restated in modern three-points terms.
                </p>
                <ManagerSeasonHighlights winPeaks={winPeakSeasons} ppgPeaks={ppgPeakSeasons} />
                <ManagerSeasonLedger
                  summaries={seasonSummaries}
                  cupResults={cupResults}
                  managerId={id}
                  managerName={m.name}
                />
              </div>
            </section>
          ) : (
            <p className="rounded-lg border border-line bg-panel px-4 py-6 text-center text-sm text-ink-dim">
              No season-stamped matches yet.
            </p>
          )}
        </div>
      ),
    },
    ...(comps.length > 0
      ? [
          {
            id: "competitions",
            label: "Competitions",
            content: (
              <section>
                <SectionHead
                  title="By competition"
                  aside={`${fmtNum(comps.length)} competitions · ${fmtNum(total)} matches`}
                />
                <ManagerCompetitionsPanel competitions={comps} managerId={id} />
                <p className="mt-3 text-xs text-ink-faint">
                  Every row links to the match archive filtered to that competition under {m.name}.
                </p>
              </section>
            ),
          },
        ]
      : []),
    {
      id: "matches",
      label: "Matches",
      content: (
        <section>
          <SectionHead title="Matches" aside={`${fmtNum(total)} managed`} />
          {notable.length > 0 && <NotableMatches matches={notable} className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3" />}
          {sequence.length >= 20 && (
            <div className="mb-4 rounded-xl border border-line bg-panel p-4 sm:p-5">
              <ResultSpine
                matches={sequence}
                markers={notable.map((m) => ({ id: m.id, label: m.reason }))}
                subject={m.name}
              />
              <p className="mt-2 text-[11px] leading-4 text-ink-faint">
                Every match in order — wins above the line, losses below, bar height the goal margin.
                Gold pips mark the standout matches above.
              </p>
            </div>
          )}
          <div className="mb-3 flex justify-end">
            <EvidenceLink href={`/matches?manager=${id}`} label="Filter these in the match browser →" />
          </div>
          <MatchArchive
            matches={allMatches}
            accentResult
            hrefForSeason={(season) => `/matches${queryString({ manager: id, season })}`}
          />
        </section>
      ),
    },
    ...(hasTransfers
      ? [
          {
            id: "transfers",
            label: "Transfers",
            content: (
              <section className="space-y-6">
                {market && (market.signings > 0 || market.departures > 0) && (
                  <div>
                    <SectionHead title="In the market" aside="known fees, during the tenure" />
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      <StatTile
                        label="Net spend"
                        value={market.net >= 0 ? fmtFee(market.net) : `+${fmtFee(-market.net)}`}
                        detail={market.net >= 0 ? undefined : "net gain"}
                        tone={market.net >= 0 ? "red" : "default"}
                      />
                      <StatTile label="Spent" value={fmtFee(market.spend)} detail={`${fmtNum(market.signings)} signings`} tone="red" />
                      <StatTile label="Received" value={fmtFee(market.received)} detail={`${fmtNum(market.departures)} departures`} tone="gold" />
                      <StatTile label="Transfers" value={fmtNum(market.signings + market.departures)} detail="signings and departures" />
                    </div>
                    <p className="mt-2 text-xs text-ink-faint">
                      Fees for arrivals and departures dated within the tenure, known fees only.{" "}
                      <Link href="/transfers" className="text-devil-bright hover:underline">
                        All transfers →
                      </Link>
                    </p>
                  </div>
                )}
                <div>
                  <SectionHead title="Season by season" aside="every window, newest first" />
                  {transfers.length > 0 ? (
                    <TransferArchive transfers={transfers} />
                  ) : (
                    <p className="rounded-lg border border-line bg-panel px-4 py-6 text-center text-sm text-ink-dim">
                      No dated transfers during this tenure.
                    </p>
                  )}
                  {transfers.length > 0 && (
                    <p className="mt-3 text-xs text-ink-faint">
                      Latest window open by default. Net spend counts known fees only — use the toggle for academy,
                      releases and retirements.
                    </p>
                  )}
                </div>
              </section>
            ),
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-10">
      <DetailBreadcrumb
        segments={[
          { label: "Managers", href: "/managers" },
          { label: m.name },
        ]}
      />
      <div className="space-y-4">
        <IdentityPlate
          eyebrow={m.role ?? "Manager"}
          share={{ path: `/manager/${m.id}`, title: `${m.name} — Manchester United record` }}
          leading={<PlayerPortrait name={m.name} src={m.thumb_url ?? m.image_url} size="lg" />}
          title={m.name}
          subtitle={
            <>
              {m.nationality && <span>{m.nationality}</span>}
              {m.nationality && <span aria-hidden className="text-ink-faint">·</span>}
              <span>{tenureYears}</span>
            </>
          }
          record={m}
          secondary={[
            ...(majorTotal > 0
              ? [{ value: majorTotal, label: majorTotal === 1 ? "major trophy" : "major trophies", tone: "text-gold" }]
              : []),
            ...(minorTotal > 0
              ? [{ value: minorTotal, label: minorTotal === 1 ? "minor trophy" : "minor trophies", detail: "shields & world" }]
              : []),
          ]}
          span={{
            leftLabel: "Took charge",
            left: <span className="stat-num text-ink">{m.first?.slice(0, 4)}</span>,
            rightLabel: tenures.some((t) => !t.date_to) ? "Present" : "Last match",
            right: <span className="stat-num text-ink">{m.last?.slice(0, 4)}</span>,
            segments: tenureBands,
            caption: tenureCaption,
            peakSeason:
              bestSeason && bestSeasonAt != null && bestSeasonTitle
                ? { season: bestSeason.season, at: bestSeasonAt, title: bestSeasonTitle }
                : undefined,
          }}
        />

        <DetailSectionTabs
          defaultTab="overview"
          ariaLabel="Manager sections"
          idPrefix="manager"
          tabs={tabs}
        />
      </div>

      <ManagerDataCoverage
        managerId={id}
        seasonCount={bySeason.length}
        matchCount={total}
        hasHonours={majorTotal > 0}
        hasMinorHonours={minorTotal > 0}
        hasTransfers={hasTransfers}
        hasMarket={Boolean(market && (market.signings > 0 || market.departures > 0))}
      />

      <p className="text-sm">
        <Link href="/managers" className="text-devil-bright hover:underline focus-ring">← All managers</Link>
      </p>
    </div>
  );
}

function ManagerDataCoverage({
  managerId,
  seasonCount,
  matchCount,
  hasHonours,
  hasMinorHonours,
  hasTransfers,
  hasMarket,
}: {
  managerId: string;
  seasonCount: number;
  matchCount: number;
  hasHonours: boolean;
  hasMinorHonours: boolean;
  hasTransfers: boolean;
  hasMarket: boolean;
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
          Season rows and splits below are drawn from match coverage we can evidence.
        </p>

        {seasonCount > 0 && (
          <CoverageNote
            className="!mt-0"
            slice="season ledger under this manager"
            coverage={`${fmtNum(seasonCount)} seasons with stamped matches from ${fmtNum(matchCount)} total managed. League finish is the club campaign; W/D/L and cup lanes are matches under this manager only.`}
          />
        )}

        <CoverageNote
          className="!mt-0"
          slice="venue and competition splits"
          coverage="every match managed, cut by home/away and by competition type; the Competitions tab lists each named competition with its own W/D/L bar."
        />

        {hasHonours && (
          <CoverageNote
            className="!mt-0"
            slice="major honours won in charge"
            coverage="league titles and knockout cups (FA Cup, League Cup, European finals); league titles attribute to the manager of the last league match of the title season; cups to the winning-final manager."
          />
        )}

        {hasMinorHonours && (
          <CoverageNote
            className="!mt-0"
            slice="minor honours"
            coverage="Charity/Community Shields, UEFA Super Cup, and world-club finals — counted separately from the major total in the hero."
          />
        )}

        {hasTransfers && (
          <CoverageNote
            className="!mt-0"
            slice="transfers during the tenure"
            coverage={
              hasMarket
                ? "fees for arrivals and departures dated within tenure dates; known fees only — undisclosed fees carry no figure."
                : "transfers dated within tenure dates; fee totals count known amounts only."
            }
            evidenceHref="/transfers"
            evidenceLabel="Full transfer archive →"
          />
        )}

        <CoverageNote
          className="!mt-0"
          slice="match archive and result spine"
          coverage="every competitive match under this manager, all competitions, newest-first in the Matches tab."
          evidenceHref={`/matches?manager=${managerId}`}
          evidenceLabel="Match browser →"
        />
      </div>
    </details>
  );
}
