import Link from "next/link";
import {
  eloSeries, seasonAggregates, stadiumsWithRecords, getMeta,
  topAssistPartnerships, coverageOverview, managersIndex,
} from "@/lib/queries";
import { calibration, oddsFor, ratedOpponents, simulateLeagueSeason, HOME_ADVANTAGE } from "@/lib/predict";
import { ChartPanel } from "@/components/ChartPanel";
import { CoverageNote } from "@/components/CoverageNote";
import { DataTable } from "@/components/DataTable";
import { EloRatingChart } from "@/components/charts/EloRatingChart";
import { InspectableBarChart } from "@/components/charts/InspectableBarChart";
import { InspectableTimeSeriesChart } from "@/components/charts/InspectableTimeSeriesChart";
import { PageHeader, StatTile, TrailLink } from "@/components/PageHeader";
import { fmtNum, pct, venueLabel } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Analytics" };

/** Quiet chapter divider that groups the chart panels into readable bands. */
function Band({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-devil-bright">{label}</span>
      <span aria-hidden className="h-px flex-1 bg-line" />
    </div>
  );
}

function Pct({ value }: { value: number }) {
  return <span className="stat-num">{(100 * value).toFixed(0)}%</span>;
}

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ opponent?: string; venue?: string }>;
}) {
  const sp = await searchParams;
  const elo = eloSeries();
  const seasons = seasonAggregates();
  const grounds = stadiumsWithRecords();
  const partnerships = topAssistPartnerships(12);
  const meta = getMeta();
  const overview = coverageOverview();

  // Prospective half of the strength signal: what the same Elo projects forward.
  const opponents = ratedOpponents();
  const opponentId = sp.opponent && opponents.some((o) => o.id === sp.opponent) ? sp.opponent : "liverpool";
  const venue = sp.venue === "A" || sp.venue === "N" ? sp.venue : "H";
  const odds = oddsFor(opponentId, venue);
  const sim = simulateLeagueSeason();
  const buckets = calibration();
  const totalRated = buckets.reduce((a, b) => a + b.p, 0);

  const currentElo = elo.length ? Math.round(elo[elo.length - 1].elo) : 1500;
  const peak = elo.reduce((a, b) => (b.elo > a.elo ? b : a), elo[0]);
  const trough = elo.reduce((a, b) => (b.elo < a.elo ? b : a), elo[0]);
  const yearTicks = [1900, 1930, 1960, 1990, 2020].map((year) => ({ x: year, label: String(year) }));

  // Managerial eras shade the Elo timeline; bands tile from each manager's first
  // match to the next, and only long tenures (250+ matches) carry a label.
  const managers = managersIndex().filter((m) => m.first && m.p > 0);
  const lastEloDate = elo.length ? elo[elo.length - 1].date : null;
  const managerEras = managers.map((m, i) => ({
    from: m.first!,
    to: managers[i + 1]?.first ?? lastEloDate ?? m.last!,
    label: m.p >= 250 ? m.name.split(" ").pop() : undefined,
  }));

  return (
    <div className="space-y-12">
      <PageHeader
        eyebrow="Strength layer"
        title="Analytics"
        aside={
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-line bg-line sm:min-w-96">
            <StatTile label="Matches" value={fmtNum(Number(meta.matches))} tone="red" />
            <StatTile label="Current Elo" value={currentElo} />
            <StatTile label="Peak Elo" value={Math.round(peak.elo)} tone="green" />
            <StatTile label="Scorer rows" value={fmtNum(overview.completeScorers)} />
          </div>
        }
      >
        The strength layer: the Elo record behind United, what it projects forward, and the long-run
        trends. Records and coverage live in the match browser and the data ledger — they link out
        from here rather than being restated.
      </PageHeader>

      {/* Elo — the canonical home of the strength signal */}
      <section>
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-devil-bright">Rating signal</p>
            <h2 className="display text-xl">Elo rating, {meta.first_match?.slice(0, 4)}-today</h2>
          </div>
          <Link href="/matches" className="text-sm text-devil-bright hover:underline">Open match browser</Link>
        </div>
        <div className="border border-line rounded-lg bg-panel p-4">
          <EloRatingChart points={elo} height={260} eras={managerEras} />
          <div className="grid grid-cols-3 gap-px bg-line border border-line rounded-lg overflow-hidden mt-4 text-sm max-w-xl">
            <div className="bg-panel-2 px-3 py-2">
              <div className="stat-num text-lg font-semibold">{currentElo}</div>
              <div className="text-[11px] text-ink-faint uppercase tracking-wider">Current</div>
            </div>
            <div className="bg-panel-2 px-3 py-2">
              <div className="stat-num text-lg font-semibold text-win">{Math.round(peak.elo)}</div>
              <div className="text-[11px] text-ink-faint uppercase tracking-wider">Peak · {peak.date.slice(0, 7)}</div>
            </div>
            <div className="bg-panel-2 px-3 py-2">
              <div className="stat-num text-lg font-semibold text-loss">{Math.round(trough.elo)}</div>
              <div className="text-[11px] text-ink-faint uppercase tracking-wider">Low · {trough.date.slice(0, 7)}</div>
            </div>
          </div>
          <p className="text-xs text-ink-faint mt-3 max-w-2xl">
            <span className="text-ink-dim">Slice:</span> every competitive match, closed-universe Elo —
            opponents are rated only on their matches against United, K varies by competition and goal
            margin, home advantage worth 60 points. Shaded bands mark managerial eras, with the
            longest-serving managers labelled, so rises and falls can be read against who was in charge.
            Pre-match win expectancy from this rating drives the favourites line on every match page; open
            any match from the{" "}
            <Link href="/matches" className="text-devil-bright hover:underline">browser</Link> to see the
            rating move.
          </p>
        </div>
      </section>

      {/* Prospective half: the same Elo projected forward. */}
      <section>
        <div className="mb-3">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-devil-bright">What the ratings project</p>
          <h2 className="display text-xl">A hypothetical next meeting</h2>
        </div>
        <div className="border border-line rounded-lg bg-panel p-4">
          <form method="GET" action="/analytics" className="flex flex-wrap items-end gap-3 text-sm">
            <label className="flex flex-col gap-1">
              <span className="text-xs text-ink-faint uppercase tracking-wider">Opponent</span>
              <select name="opponent" defaultValue={opponentId} className="control">
                {opponents.map((o) => (
                  <option key={o.id} value={o.id}>{o.name}</option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-ink-faint uppercase tracking-wider">Venue</span>
              <select name="venue" defaultValue={venue} className="control">
                <option value="H">Home</option>
                <option value="A">Away</option>
                <option value="N">Neutral</option>
              </select>
            </label>
            <button
              type="submit"
              className="min-h-[2.375rem] rounded-md bg-devil px-4 py-2 font-semibold text-ink transition-colors hover:bg-devil-bright focus-ring"
            >
              Work it out
            </button>
          </form>

          {odds && (
            <div className="mt-5">
              <p className="text-sm text-ink-dim mb-3">
                United v <span className="text-ink font-medium">{odds.opponentName}</span>,{" "}
                {venueLabel(venue).toLowerCase()}, at today&apos;s ratings:
              </p>
              <div className="grid grid-cols-3 gap-px bg-line border border-line rounded-lg overflow-hidden max-w-xl text-center">
                <div className="bg-panel-2 px-3 py-3">
                  <div className="stat-num text-2xl font-semibold text-win">{(100 * odds.pW).toFixed(0)}%</div>
                  <div className="text-[11px] text-ink-faint uppercase tracking-wider">United win</div>
                </div>
                <div className="bg-panel-2 px-3 py-3">
                  <div className="stat-num text-2xl font-semibold text-draw">{(100 * odds.pD).toFixed(0)}%</div>
                  <div className="text-[11px] text-ink-faint uppercase tracking-wider">Draw</div>
                </div>
                <div className="bg-panel-2 px-3 py-3">
                  <div className="stat-num text-2xl font-semibold text-loss">{(100 * odds.pL).toFixed(0)}%</div>
                  <div className="text-[11px] text-ink-faint uppercase tracking-wider">{odds.opponentName} win</div>
                </div>
              </div>
              <CoverageNote
                slice={`United ${Math.round(odds.unitedElo)} v ${odds.opponentName} ${Math.round(odds.opponentElo)} (closed-universe Elo, ${venueLabel(venue).toLowerCase()} worth ${venue === "N" ? 0 : HOME_ADVANTAGE} points), expectancy ${(100 * odds.expected).toFixed(0)}%, split using the ${fmtNum(odds.sample)} historical matches in that expectancy band.`}
                evidenceHref={`/matches?opponent=${opponentId}`}
                evidenceLabel={`All ${fmtNum(odds.meetings)} rated meetings →`}
              >
                {odds.opponentName}&apos;s rating moves only when they play United; it was last
                updated {odds.lastMet}. Treat long-dormant opponents accordingly.
              </CoverageNote>
            </div>
          )}
        </div>
      </section>

      {sim && (
        <section>
          <ChartPanel
            title={`Replaying ${sim.season} from the ratings`}
            slice={`each of the ${sim.matches} ${sim.competitionName} matches redrawn ${fmtNum(sim.runs)} times from its pre-match win expectancy, 3 points for a win. This describes points totals, not table positions.`}
            note={
              <>
                The ratings expected about {sim.meanPoints.toFixed(0)} points (90% of replays
                landed between {sim.p5} and {sim.p95}); the real side took{" "}
                <span className="text-gold stat-num">{sim.actualPoints}</span>, a total only{" "}
                {pct(Math.round(sim.shareAbove * sim.runs), sim.runs)} of replays beat. Open the{" "}
                <Link href={`/seasons/${sim.season}`} className="text-devil-bright hover:underline">
                  season
                </Link>{" "}
                to see which results did it.
              </>
            }
          >
            <InspectableBarChart
              data={sim.distribution.map((d) => ({
                label: String(d.points),
                value: d.share * 100,
                valueLabel: `${(100 * d.share).toFixed(1)}% of replays`,
                meta: `${fmtNum(Math.round(d.share * sim.runs))} of ${fmtNum(sim.runs)} simulations`,
              }))}
              labelEvery={5}
              height={190}
              highlightLabel={String(sim.actualPoints)}
              chartLabel={`${sim.season} replayed points distribution`}
              yTickSuffix="%"
            />
          </ChartPanel>
        </section>
      )}

      <section>
        <h2 className="display text-xl mb-3">Where the probabilities come from</h2>
        <DataTable
          columns={[
            { label: "Pre-match expectancy", render: (b: (typeof buckets)[number]) => `${(100 * b.lo).toFixed(0)}–${(100 * b.hi).toFixed(0)}%` },
            { label: "Matches", numeric: true, render: (b) => fmtNum(b.p) },
            { label: "Won", numeric: true, render: (b) => <Pct value={b.w / b.p} /> },
            { label: "Drawn", numeric: true, render: (b) => <Pct value={b.d / b.p} /> },
            { label: "Lost", numeric: true, render: (b) => <Pct value={b.l / b.p} /> },
          ]}
          rows={buckets}
          rowKey={(b) => String(b.lo)}
        />
        <CoverageNote
          slice={`all ${fmtNum(totalRated)} rated matches since 1886, grouped by the Elo win expectancy United carried into them.`}
        >
          Elo folds draws into one number, so the W/D/L split is read straight from history: when
          the ratings said 60–70%, United actually won half and drew a quarter. That observed split
          is what the widget above applies. The expectancy itself is on every match page.
        </CoverageNote>
      </section>

      <Band label="Trends over time" />

      {/* season trends */}
      <section className="grid lg:grid-cols-2 gap-8">
        <ChartPanel
          title="Win rate by season"
          note={
            <>
              <span className="text-ink-dim">Slice:</span> all competitions per season; the dashed line is
              50%. Troughs mark the relegation seasons and the early 1930s; the plateau is the Ferguson era.{" "}
              <Link href="/seasons" className="text-devil-bright hover:underline">Season by season →</Link>
            </>
          }
        >
          <InspectableTimeSeriesChart
            data={seasons.map((s) => ({
              x: Number(s.season.slice(0, 4)),
              y: s.win_pct,
              label: s.season,
              valueLabel: `${s.win_pct.toFixed(1)}% won`,
              meta: `${fmtNum(s.p)} matches, ${s.w} wins`,
            }))}
            baseline={50}
            height={200}
            stroke="var(--color-win)"
            fill="rgb(62 207 106 / 0.10)"
            baselineLabel="50%"
            chartLabel="Manchester United win rate by season"
            valueLabel="Win rate"
            xTicks={yearTicks}
            yTickSuffix="%"
            yDomain={[0, 100]}
          />
        </ChartPanel>
        <ChartPanel
          title="Average home attendance"
          note={
            <>
              <span className="text-ink-dim">Slice:</span> mean of recorded home attendances per season.
              <span className="text-ink-dim"> Coverage:</span> sparse before the 1920s — early points lean
              on few matches. The post-war boom and the 1990s expansion of Old Trafford are the two big climbs.
            </>
          }
        >
          <InspectableTimeSeriesChart
            data={seasons.filter((s) => s.avg_att).map((s) => ({
              x: Number(s.season.slice(0, 4)),
              y: s.avg_att!,
              label: s.season,
              valueLabel: `${fmtNum(s.avg_att!)} average`,
              meta: `${fmtNum(s.p)} matches in all competitions`,
            }))}
            height={200}
            stroke="var(--color-gold)"
            fill="rgb(245 197 24 / 0.08)"
            chartLabel="Manchester United average home attendance by season"
            valueLabel="Average attendance"
            xTicks={yearTicks}
          />
        </ChartPanel>
      </section>

      {/* goals per season */}
      <section>
        <ChartPanel
          title="Goals scored per season"
          note={
            <>
              <span className="text-ink-dim">Slice:</span> goals scored, all competitions — taller wartime-adjacent
              seasons partly reflect longer cup runs. Pull any decade&apos;s matches with the year filters in the{" "}
              <Link href="/matches" className="text-devil-bright hover:underline">match browser</Link>.{" "}
              <Link href="/seasons" className="text-devil-bright hover:underline">Season detail →</Link>
            </>
          }
        >
          <InspectableBarChart
            data={seasons.map((s) => ({
              label: s.season.slice(0, 4),
              value: s.gf,
              valueLabel: `${fmtNum(s.gf)} goals`,
              meta: `${s.season}, ${fmtNum(s.p)} matches`,
              href: `/seasons/${s.season}`,
            }))}
            labelEvery={20}
            height={200}
            chartLabel="Manchester United goals scored per season"
          />
        </ChartPanel>
      </section>

      <Band label="Grounds" />

      <section>
        <h2 className="display text-xl mb-3">Grounds United have called home (and the big neutral stages)</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2 text-sm">
          {grounds.map((g) => (
            <div key={g.id} className="border border-line rounded-lg bg-panel px-4 py-3">
              <div className="font-medium">{g.name}</div>
              <div className="text-xs text-ink-faint">{g.city}</div>
              <div className="stat-num text-xs text-ink-dim mt-1.5">
                {fmtNum(g.p)} matches · {pct(g.w, g.p)} won · {g.first.slice(0, 4)}–{g.last.slice(0, 4)}
              </div>
            </div>
          ))}
        </div>
      </section>

      <Band label="Records" />

      {/* Records are sorts of The Record — link into the browser, never restate it. */}
      <section className="grid gap-3 sm:grid-cols-3">
        <TrailLink href="/matches?sort=margin" title="Biggest wins">
          United&apos;s record victories, ranked by goal margin in the match browser.
        </TrailLink>
        <TrailLink href="/matches?sort=defeat" title="Heaviest defeats">
          The worst results on record, ranked by losing margin.
        </TrailLink>
        <TrailLink href="/matches?sort=attendance" title="Biggest crowds">
          The best-attended matches, ranked by recorded attendance.
        </TrailLink>
      </section>

      <Band label="Data coverage" />

      {/* Coverage is owned by /data — link out rather than re-render the ledger. */}
      <section className="grid gap-3 sm:grid-cols-2">
        <TrailLink href="/data" title="Scorer & lineup ledger">
          Results are complete for every decade; scorer depth reaches{" "}
          {fmtNum(overview.completeScorers)} of {fmtNum(overview.matches)} matches and grows continuously.
          See coverage by decade and how to fill the gaps.
        </TrailLink>
        <TrailLink href="/data" title="Lineup coverage">
          {fmtNum(Number(meta.matches_with_lineups ?? 0))} matches carry full United lineups, covering{" "}
          {fmtNum(Number(meta.lineup_entries ?? 0))} player appearances. Track depth and corrections.
        </TrailLink>
      </section>

      {/* Assist partnerships — canonical home of the assist-link cut. */}
      <section>
        <ChartPanel
          title="Assist partnerships"
          note="Built from goal events that record an assist. Assist data exists only from 2012-13 onward (transfermarkt-datasets); no open source records United assists before then, so earlier seasons are blank by source limitation, not omission."
        >
          {partnerships.length > 0 ? (
            <div className="space-y-2 text-sm">
              {partnerships.map((row) => (
                <div key={`${row.assister_id}-${row.scorer_id}`} className="flex items-center gap-2">
                  <Link href={`/player/${row.assister_id}`} className="font-medium hover:text-devil-bright">
                    {row.assister_name}
                  </Link>
                  <span className="text-ink-faint">→</span>
                  <Link href={`/player/${row.scorer_id}`} className="font-medium hover:text-devil-bright flex-1">
                    {row.scorer_name}
                  </Link>
                  <span className="stat-num text-devil-bright">{row.goals}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-ink-dim">
              Assist fields are wired through the canonical data, database, and player pages; no current
              source in the checked-in dataset records assists for these matches.
            </p>
          )}
        </ChartPanel>
      </section>

      <p className="text-sm text-ink-dim">
        Want a specific cut? Every match is filterable in the{" "}
        <Link href="/matches" className="text-devil-bright hover:underline">match browser</Link>.
      </p>
    </div>
  );
}
