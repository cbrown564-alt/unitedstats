import Link from "next/link";
import {
  eloSeries, seasonAggregates, biggestWins, heaviestDefeats, highestAttendances,
  venueRecord, goalMinuteHistogram, stadiumsWithRecords, eventCoverage, getMeta,
  lineupCoverage, topAssistPartnerships, coverageOverview, managersIndex,
} from "@/lib/queries";
import { ChartPanel } from "@/components/ChartPanel";
import { EloRatingChart } from "@/components/charts/EloRatingChart";
import { InspectableBarChart } from "@/components/charts/InspectableBarChart";
import { InspectableTimeSeriesChart } from "@/components/charts/InspectableTimeSeriesChart";
import { MatchList } from "@/components/MatchList";
import { PageHeader, StatTile, TrailLink } from "@/components/PageHeader";
import { WdlBar, WdlRecord } from "@/components/WdlBar";
import { fmtNum, pct, venueLabel, GOAL_MINUTE_BUCKETS } from "@/lib/format";

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

export default function AnalyticsPage() {
  const elo = eloSeries();
  const seasons = seasonAggregates();
  const wins = biggestWins(10);
  const defeats = heaviestDefeats(10);
  const crowds = highestAttendances(10);
  const venues = venueRecord();
  const minuteHist = goalMinuteHistogram();
  const grounds = stadiumsWithRecords();
  const coverage = eventCoverage();
  const lineups = lineupCoverage();
  const partnerships = topAssistPartnerships(12);
  const meta = getMeta();
  const overview = coverageOverview();
  const currentElo = elo.length ? Math.round(elo[elo.length - 1].elo) : 1500;
  const peak = elo.reduce((a, b) => (b.elo > a.elo ? b : a), elo[0]);
  const trough = elo.reduce((a, b) => (b.elo < a.elo ? b : a), elo[0]);
  const minuteLabels = GOAL_MINUTE_BUCKETS;
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

  const decades = new Map<string, { p: number; w: number }>();
  for (const s of seasons) {
    const dec = s.season.slice(0, 3) + "0s";
    const cur = decades.get(dec) ?? { p: 0, w: 0 };
    cur.p += s.p;
    cur.w += s.w;
    decades.set(dec, cur);
  }

  return (
    <div className="space-y-12">
      <PageHeader
        eyebrow="Pattern layer"
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
        Strength ratings, eras, records, crowds, and goal patterns. Every serious claim needs a slice,
        coverage note, and a trail back to matches.
      </PageHeader>

      <section className="grid gap-3 lg:grid-cols-3">
        <TrailLink href="/questions" title="Question-led cuts">
          Myth-testing modules for late goals, awkward opponents, and era patterns.
        </TrailLink>
        <TrailLink href="/analytics/odds" title="Predictive ratings">
          Pick an opponent and venue, then compare today&apos;s signal with calibration history.
        </TrailLink>
        <TrailLink href="/analytics/travel" title="Away map">
          Grounds, distance, and travel load across official away fixtures.
        </TrailLink>
      </section>

      {/* Elo */}
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

      {/* goals per season + decades */}
      <section className="grid lg:grid-cols-2 gap-8">
        <ChartPanel
          title="Goals scored per season"
          note={
            <>
              <span className="text-ink-dim">Slice:</span> goals scored, all competitions — taller wartime-adjacent
              seasons partly reflect longer cup runs.{" "}
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
        <ChartPanel
          title="Win rate by decade"
          note={
            <>
              <span className="text-ink-dim">Slice:</span> percent of matches won, all competitions, grouped by
              decade. Pull any decade&apos;s matches with the year filters in the{" "}
              <Link href="/matches" className="text-devil-bright hover:underline">match browser</Link> — e.g.{" "}
              <Link href="/matches?from=1990&to=1999" className="text-devil-bright hover:underline">the 1990s</Link>.
            </>
          }
        >
          <InspectableBarChart
            data={[...decades.entries()].map(([dec, v]) => ({
              label: dec,
              tickLabel: dec.slice(0, 4),
              value: Math.round((100 * v.w) / (v.p || 1)),
              valueLabel: `${Math.round((100 * v.w) / (v.p || 1))}% won`,
              meta: `${fmtNum(v.p)} matches, ${fmtNum(v.w)} wins`,
              href: `/matches?from=${dec.slice(0, 4)}&to=${Number(dec.slice(0, 4)) + 9}`,
            }))}
            height={200}
            color="var(--color-win)"
            chartLabel="Manchester United win rate by decade"
            yTickSuffix="%"
          />
        </ChartPanel>
      </section>

      <Band label="Goals and grounds" />

      {/* goal minutes + venue split */}
      <section className="grid lg:grid-cols-2 gap-8">
        {minuteHist.length > 0 && (
          <ChartPanel
            title="When United score"
            note={
              <>
                <span className="text-ink-dim">Slice:</span> United goals with a recorded minute ≤ 90, by
                15-minute window. The final-window lean is tested decade by decade in{" "}
                <Link href="/questions#late-goals" className="text-devil-bright hover:underline">
                  Do United really score late? →
                </Link>
              </>
            }
          >
            <InspectableBarChart
              data={minuteHist.map((b) => ({
                label: minuteLabels[Number(b.bucket)] ?? b.bucket,
                value: b.n,
                valueLabel: `${fmtNum(b.n)} goals`,
                meta: "Recorded United goals with minutes",
              }))}
              height={180}
              color="var(--color-gold)"
              chartLabel="Manchester United goals by match minute bucket"
            />
          </ChartPanel>
        )}
        <div>
          <h2 className="display text-xl mb-3">Home, away, neutral</h2>
          <div className="space-y-3">
            {venues.map((v) => (
              <Link
                key={v.venue}
                href={`/matches?venue=${v.venue}`}
                className="block border border-line rounded-lg bg-panel px-4 py-3 hover:border-devil/60 transition-colors"
              >
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="font-medium">{venueLabel(v.venue)}</span>
                  <span className="stat-num text-xs text-ink-faint">
                    {fmtNum(v.p)} P · <WdlRecord w={v.w} d={v.d} l={v.l} /> · {pct(v.w, v.p)} W
                  </span>
                </div>
                <WdlBar w={v.w} d={v.d} l={v.l} />
              </Link>
            ))}
          </div>
          <p className="text-xs text-ink-faint mt-2">Each row opens its matches.</p>
        </div>
      </section>

      {/* grounds */}
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

      {/* records */}
      <section className="grid lg:grid-cols-2 gap-8">
        <div>
          <h2 className="display text-xl mb-3">Biggest wins</h2>
          <MatchList matches={wins} showSeason />
          <p className="text-xs text-ink-faint mt-2">
            <span className="text-ink-dim">Slice:</span> ranked by margin, then goals scored, all competitions —
            each row is the evidence.
          </p>
        </div>
        <div>
          <h2 className="display text-xl mb-3">Heaviest defeats</h2>
          <MatchList matches={defeats} showSeason />
          <p className="text-xs text-ink-faint mt-2">
            <span className="text-ink-dim">Slice:</span> ranked by margin conceded, all competitions.
          </p>
        </div>
      </section>

      <section>
        <h2 className="display text-xl mb-3">Biggest crowds</h2>
        <MatchList matches={crowds} showSeason />
        <p className="text-xs text-ink-faint mt-2">
          <span className="text-ink-dim">Slice:</span> matches with a recorded attendance, ranked. The 1948
          FA Cup semi-final v Derby County, played at Hillsborough, and wartime-era cup ties drew some of the
          largest crowds in English club history.
        </p>
      </section>

      <Band label="Data coverage" />

      {/* coverage ledger */}
      <section>
        <ChartPanel
          title="Data depth ledger"
          note={
            <>
              Share of matches per decade with recorded goal events. Results are complete for every decade;
              scorer and lineup depth grows continuously — this ledger is the honest picture of how far the
              excavation has gotten.
              {" "}Complete scorer rows: <span className="stat-num">{fmtNum(overview.completeScorers)}</span>
              {" "}of <span className="stat-num">{fmtNum(overview.matches)}</span>.
              {" "}
              <Link href="/data" className="text-devil-bright hover:underline">Source and correction guide</Link>.
            </>
          }
        >
          <InspectableBarChart
            data={coverage.map((c) => ({
              label: c.decade,
              tickLabel: c.decade.slice(0, 4),
              value: c.matches ? Math.round((1000 * c.withEvents) / c.matches) / 10 : 0,
              valueLabel: pct(c.withEvents, c.matches),
              meta: `${fmtNum(c.withEvents)} of ${fmtNum(c.matches)} matches with scorer data`,
            }))}
            height={170}
            chartLabel="United scorer coverage by decade"
            labelEvery={2}
            yTickSuffix="%"
          />
        </ChartPanel>
      </section>

      <section className="grid lg:grid-cols-2 gap-8">
        <ChartPanel
          title="Lineup coverage"
          note={
            <>
              {fmtNum(Number(meta.matches_with_lineups ?? 0))} matches have full United lineups,
              covering {fmtNum(Number(meta.lineup_entries ?? 0))} player appearances.
            </>
          }
        >
          <InspectableBarChart
            data={lineups.map((c) => ({
              label: c.decade,
              tickLabel: c.decade.slice(0, 4),
              value: c.matches ? Math.round((1000 * c.withLineups) / c.matches) / 10 : 0,
              valueLabel: pct(c.withLineups, c.matches),
              meta: `${fmtNum(c.withLineups)} of ${fmtNum(c.matches)} matches with lineups`,
            }))}
            height={160}
            color="var(--color-gold)"
            chartLabel="United lineup coverage by decade"
            labelEvery={2}
            yTickSuffix="%"
          />
        </ChartPanel>

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
