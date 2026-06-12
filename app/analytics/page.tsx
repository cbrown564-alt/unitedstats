import Link from "next/link";
import {
  eloSeries, seasonAggregates, biggestWins, heaviestDefeats, highestAttendances,
  venueRecord, goalMinuteHistogram, stadiumsWithRecords, eventCoverage, getMeta,
  lineupCoverage, topAssistPartnerships, coverageOverview,
} from "@/lib/queries";
import { AreaChart, Bars } from "@/components/charts";
import { MatchList } from "@/components/MatchList";
import { fmtNum, pct, venueLabel } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Analytics" };

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
  const minuteLabels = ["1–15", "16–30", "31–45", "46–60", "61–75", "76–90"];

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
      <header>
        <h1 className="display text-3xl">Analytics</h1>
        <p className="text-sm text-ink-dim mt-1 max-w-2xl">
          The numbers behind {fmtNum(Number(meta.matches))} matches — strength ratings, eras, records,
          crowds, and goal patterns.
        </p>
      </header>

      {/* Elo */}
      <section>
        <h2 className="display text-xl mb-3">Elo rating, {meta.first_match?.slice(0, 4)}–today</h2>
        <div className="border border-line rounded-lg bg-panel p-4">
          <AreaChart
            points={elo.map((e) => ({ x: Date.parse(e.date), y: e.elo }))}
            baseline={1500}
            height={260}
            labels={[1900, 1920, 1940, 1960, 1980, 2000, 2020].map((y) => ({
              x: Date.parse(`${y}-01-01`),
              text: String(y),
            }))}
          />
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
            Closed-universe Elo: opponents are rated only on their matches against United, K varies by
            competition and goal margin, home advantage worth 60 points. Pre-match win expectancy from this
            rating drives the “favourites” line on every match page.
          </p>
        </div>
      </section>

      {/* season trends */}
      <section className="grid lg:grid-cols-2 gap-8">
        <div>
          <h2 className="display text-xl mb-3">Win rate by season</h2>
          <div className="border border-line rounded-lg bg-panel p-4">
            <AreaChart
              points={seasons.map((s) => ({ x: Number(s.season.slice(0, 4)), y: s.win_pct }))}
              baseline={50}
              height={200}
              stroke="var(--color-win)"
              fill="rgb(62 207 106 / 0.10)"
              labels={[1900, 1930, 1960, 1990, 2020].map((y) => ({ x: y, text: String(y) }))}
            />
          </div>
        </div>
        <div>
          <h2 className="display text-xl mb-3">Average home attendance</h2>
          <div className="border border-line rounded-lg bg-panel p-4">
            <AreaChart
              points={seasons.filter((s) => s.avg_att).map((s) => ({ x: Number(s.season.slice(0, 4)), y: s.avg_att! }))}
              height={200}
              stroke="var(--color-gold)"
              fill="rgb(245 197 24 / 0.08)"
              labels={[1900, 1930, 1960, 1990, 2020].map((y) => ({ x: y, text: String(y) }))}
            />
            <p className="text-xs text-ink-faint mt-2">
              From recorded attendances; sparse before the 1920s.
            </p>
          </div>
        </div>
      </section>

      {/* goals per season + decades */}
      <section className="grid lg:grid-cols-2 gap-8">
        <div>
          <h2 className="display text-xl mb-3">Goals scored per season</h2>
          <div className="border border-line rounded-lg bg-panel p-4">
            <Bars
              data={seasons.map((s) => ({ label: s.season.slice(0, 4), value: s.gf }))}
              labelEvery={20}
              height={200}
            />
          </div>
        </div>
        <div>
          <h2 className="display text-xl mb-3">Win rate by decade</h2>
          <div className="border border-line rounded-lg bg-panel p-4">
            <Bars
              data={[...decades.entries()].map(([dec, v]) => ({
                label: dec.slice(2),
                value: Math.round((100 * v.w) / (v.p || 1)),
              }))}
              height={200}
              color="var(--color-win)"
            />
            <p className="text-xs text-ink-faint mt-1">Percent of matches won, all competitions.</p>
          </div>
        </div>
      </section>

      {/* goal minutes + venue split */}
      <section className="grid lg:grid-cols-2 gap-8">
        {minuteHist.length > 0 && (
          <div>
            <h2 className="display text-xl mb-3">When United score</h2>
            <div className="border border-line rounded-lg bg-panel p-4">
              <Bars
                data={minuteHist.map((b) => ({ label: minuteLabels[Number(b.bucket)] ?? b.bucket, value: b.n }))}
                height={180}
                color="var(--color-gold)"
              />
              <p className="text-xs text-ink-faint mt-1">Goals with recorded minutes, by 15-minute window.</p>
            </div>
          </div>
        )}
        <div>
          <h2 className="display text-xl mb-3">Home, away, neutral</h2>
          <div className="space-y-3">
            {venues.map((v) => (
              <div key={v.venue} className="border border-line rounded-lg bg-panel px-4 py-3">
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="font-medium">{venueLabel(v.venue)}</span>
                  <span className="stat-num text-xs text-ink-faint">
                    {fmtNum(v.p)} P · {v.w}–{v.d}–{v.l} · {pct(v.w, v.p)} W
                  </span>
                </div>
                <div className="flex h-1.5 rounded-full overflow-hidden bg-panel-2">
                  <div className="bg-win" style={{ width: `${(100 * v.w) / v.p}%` }} />
                  <div className="bg-draw/60" style={{ width: `${(100 * v.d) / v.p}%` }} />
                  <div className="bg-loss" style={{ width: `${(100 * v.l) / v.p}%` }} />
                </div>
              </div>
            ))}
          </div>
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

      {/* records */}
      <section className="grid lg:grid-cols-2 gap-8">
        <div>
          <h2 className="display text-xl mb-3">Biggest wins</h2>
          <MatchList matches={wins} showSeason />
        </div>
        <div>
          <h2 className="display text-xl mb-3">Heaviest defeats</h2>
          <MatchList matches={defeats} showSeason />
        </div>
      </section>

      <section>
        <h2 className="display text-xl mb-3">Biggest crowds</h2>
        <MatchList matches={crowds} showSeason />
        <p className="text-xs text-ink-faint mt-2">
          The 1948 FA Cup semi-final v Derby County, played at Hillsborough, and wartime-era cup ties drew some
          of the largest crowds in English club history.
        </p>
      </section>

      {/* coverage ledger */}
      <section>
        <h2 className="display text-xl mb-3">Data depth ledger</h2>
        <div className="border border-line rounded-lg bg-panel p-4">
          <div className="grid grid-cols-7 sm:grid-cols-14 gap-1">
            {coverage.map((c) => {
              const f = c.matches ? c.withEvents / c.matches : 0;
              return (
                <div key={c.decade} className="text-center">
                  <div
                    className="h-16 rounded relative overflow-hidden bg-panel-2"
                    title={`${c.decade}: scorer data for ${c.withEvents}/${c.matches} matches`}
                  >
                    <div
                      className="absolute bottom-0 left-0 right-0 bg-devil"
                      style={{ height: `${Math.round(100 * f)}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-ink-faint mt-1 stat-num">{c.decade.slice(2)}</div>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-ink-faint mt-3 max-w-2xl">
            Share of matches per decade with recorded goal events. Results are complete for every decade;
            scorer and lineup depth grows continuously — this ledger is the honest picture of how far the
            excavation has gotten.
            {" "}Complete scorer rows: <span className="stat-num">{fmtNum(overview.completeScorers)}</span>
            {" "}of <span className="stat-num">{fmtNum(overview.matches)}</span>.
            {" "}
            <Link href="/data" className="text-devil-bright hover:underline">Source and correction guide</Link>.
          </p>
        </div>
      </section>

      <section className="grid lg:grid-cols-2 gap-8">
        <div>
          <h2 className="display text-xl mb-3">Lineup coverage</h2>
          <div className="border border-line rounded-lg bg-panel p-4">
            <div className="grid grid-cols-7 sm:grid-cols-14 gap-1">
              {lineups.map((c) => {
                const f = c.matches ? c.withLineups / c.matches : 0;
                return (
                  <div key={c.decade} className="text-center">
                    <div
                      className="h-16 rounded relative overflow-hidden bg-panel-2"
                      title={`${c.decade}: lineups for ${c.withLineups}/${c.matches} matches`}
                    >
                      <div
                        className="absolute bottom-0 left-0 right-0 bg-gold"
                        style={{ height: `${Math.round(100 * f)}%` }}
                      />
                    </div>
                    <div className="text-[10px] text-ink-faint mt-1 stat-num">{c.decade.slice(2)}</div>
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-ink-faint mt-3">
              {fmtNum(Number(meta.matches_with_lineups ?? 0))} matches have full United lineups,
              covering {fmtNum(Number(meta.lineup_entries ?? 0))} player appearances.
            </p>
          </div>
        </div>

        <div>
          <h2 className="display text-xl mb-3">Assist partnerships</h2>
          <div className="border border-line rounded-lg bg-panel p-4">
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
                source in the checked-in dataset records enough assists to rank partnerships yet.
              </p>
            )}
            <p className="text-xs text-ink-faint mt-3">
              Built from goal events that include an assist player.
            </p>
          </div>
        </div>
      </section>

      <p className="text-sm text-ink-dim">
        Want a specific cut? Every match is filterable in the{" "}
        <Link href="/matches" className="text-devil-bright hover:underline">match browser</Link>.
      </p>
    </div>
  );
}
