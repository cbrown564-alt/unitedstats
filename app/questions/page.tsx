import Link from "next/link";
import {
  bogeyOpponents, cupSpecialists, europeanWeekEffect, goalMinuteRidge, homeMatchesAtOldTrafford,
  lateGoalShareByDecade, lateWinners, leagueMatchesAfterEuropean, longestStreak,
  managerBounce, oldTraffordByDecade, timedGoalCounts,
} from "@/lib/trails";
import { getMeta } from "@/lib/queries";
import { awayFootprint, travelBySeason, travelCoverage, MANCHESTER } from "@/lib/spatial";
import { BRITAIN_LAND, EUROPE_LAND } from "@/lib/geo/land";
import { InspectableBarChart } from "@/components/charts/InspectableBarChart";
import { InspectableTimeSeriesChart } from "@/components/charts/InspectableTimeSeriesChart";
import { MinuteRidge } from "@/components/charts/MinuteRidge";
import { SlopeCompare } from "@/components/charts/SlopeCompare";
import { DataTable } from "@/components/DataTable";
import { GeoScatter } from "@/components/GeoScatter";
import { MatchList } from "@/components/MatchList";
import { SplitBar } from "@/components/charts/SplitBar";
import { WdlBar, WdlRecord } from "@/components/WdlBar";
import { EvidenceLink } from "@/components/EvidenceLink";
import { fmtDate, fmtNum, pct } from "@/lib/format";

const BRITAIN: [number, number, number, number] = [49.8, 56.3, -7.6, 2.3];
const EUROPE: [number, number, number, number] = [34, 61.5, -11, 36];

export const dynamic = "force-dynamic";
export const metadata = { title: "Questions" };

const QUESTION_NAV: [id: string, label: string][] = [
  ["late-goals", "Late goals"],
  ["bogey-sides", "Bogey teams"],
  ["european-weeks", "European weeks"],
  ["manager-bounce", "Manager bounce"],
  ["fortress", "Fortress OT"],
  ["cup-specialists", "Cup specialists"],
  ["away-days", "Away days"],
];

function Module({
  id, question, finding, children, slice, coverage,
}: {
  id: string;
  question: string;
  finding: string;
  children: React.ReactNode;
  slice: string;
  /**
   * Graded: omit where the facet is complete for this cut. A present coverage
   * line should always carry real counts or a real limitation; its absence
   * means the underlying results are whole.
   */
  coverage?: string;
}) {
  // Prose stays at a readable measure (~65–75ch); the evidence fills the box so
  // charts, ladders, and maps use the full width instead of leaving a dead band
  // on the right. Each module's children own their own internal rhythm.
  return (
    <section id={id} className="border border-line rounded-lg bg-panel p-5 sm:p-6 scroll-mt-28 space-y-5">
      <header className="max-w-2xl">
        <h2 className="display text-2xl">{question}</h2>
        <p className="text-sm text-ink-dim mt-1">{finding}</p>
      </header>
      <div className="space-y-5">{children}</div>
      <footer className="max-w-2xl text-xs text-ink-faint space-y-1 border-t border-line pt-3">
        <p><span className="text-ink-dim">Slice:</span> {slice}</p>
        {coverage && <p><span className="text-ink-dim">Coverage:</span> {coverage}</p>}
      </footer>
    </section>
  );
}

export default function QuestionsPage() {
  const meta = getMeta();
  const lateByDecade = lateGoalShareByDecade();
  const ridge = goalMinuteRidge();
  const timed = timedGoalCounts();
  const winners = lateWinners(6);
  const bogeys = bogeyOpponents(20, 10);
  const euro = europeanWeekEffect();
  const euroSample = leagueMatchesAfterEuropean(6);
  const bounce = managerBounce();
  const otDecades = oldTraffordByDecade();
  const otRecord = otDecades.reduce((a, d) => ({ p: a.p + d.p, w: a.w + d.w }), { p: 0, w: 0 });
  const otUnbeaten = longestStreak(homeMatchesAtOldTrafford(), "unbeaten");
  const specialists = cupSpecialists(25, 10);

  // Away-days geography (folded in from the former /analytics/travel surface).
  const footprint = awayFootprint();
  const travelSeasons = travelBySeason();
  const travelCov = travelCoverage();
  const domestic = footprint.filter((v) => v.european === 0);
  const european = footprint.filter((v) => v.european > 0);
  const farthest = [...footprint].sort((a, b) => b.km - a.km)[0];

  const overallLateShare = lateByDecade.reduce(
    (a, d) => ({ timed: a.timed + d.timed, late: a.late + d.late }),
    { timed: 0, late: 0 },
  );
  const euroDelta =
    euro.afterEuro.p && euro.baseline.p
      ? (100 * euro.afterEuro.w) / euro.afterEuro.p - (100 * euro.baseline.w) / euro.baseline.p
      : 0;
  const bounceUp = bounce.filter((b) => b.first10.w > b.prev10.w).length;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="display text-3xl">Questions</h1>
        <p className="text-sm text-ink-dim mt-1 max-w-2xl">
          Myths fans repeat, tested against the canonical record. Each module states the slice it is
          computed from, the coverage behind it, and a route to the matches that produced it — the
          conclusion is yours to draw.
        </p>
      </header>

      <nav
        aria-label="Jump to a question"
        className="sticky top-14 z-30 -mx-4 border-b border-line bg-pitch/95 px-4 py-2 backdrop-blur sm:-mx-6 sm:px-6"
      >
        <ul className="scrollbar-none flex gap-2 overflow-x-auto text-xs">
          {QUESTION_NAV.map(([id, label]) => (
            <li key={id}>
              <a
                href={`#${id}`}
                className="inline-block whitespace-nowrap rounded-md border border-line px-2.5 py-1 text-ink-dim transition-colors hover:border-devil/60 hover:text-ink focus-ring"
              >
                {label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <Module
        id="late-goals"
        question="Do United really score late?"
        finding={`Of ${fmtNum(overallLateShare.timed)} goals with a recorded minute, ${pct(overallLateShare.late, overallLateShare.timed)} arrived in the final 15 minutes. The decade bars, read against the even-share line, show whether "Fergie time" is an era or a habit.`}
        slice="United goals (including penalties and own goals for) with a recorded minute ≤ 90, bucketed by decade; decades with fewer than 20 timed goals are hidden."
        coverage={`${fmtNum(timed.timed)} of ${fmtNum(timed.total)} recorded United goals carry a minute; minute data is densest from the 1990s onward, so early decades lean on smaller samples.`}
      >
        <div>
          <h3 className="text-sm font-medium mb-2 text-ink-dim">Across the 90 — when United&apos;s goals actually land</h3>
          <MinuteRidge bins={ridge} />
          <p className="text-xs text-ink-faint mt-1">
            United goals by 5-minute window; the closing 15 minutes are shaded red and stoppage time folds into the
            final bar. The dashed line is an even spread across the match.
          </p>
        </div>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-start">
          <div>
            <h3 className="text-sm font-medium mb-2 text-ink-dim">Is it an era, or a habit? Late share by decade</h3>
            <InspectableBarChart
              data={lateByDecade.map((d) => ({
                label: d.decade,
                tickLabel: d.decade.slice(2),
                value: Math.round((1000 * d.late) / d.timed) / 10,
                valueLabel: `${(Math.round((1000 * d.late) / d.timed) / 10).toFixed(1)}% late`,
                meta: `${fmtNum(d.late)} of ${fmtNum(d.timed)} timed goals`,
                href: `/matches?from=${d.decade.slice(0, 4)}&to=${Number(d.decade.slice(0, 4)) + 9}`,
              }))}
              height={180}
              color="var(--color-gold)"
              chartLabel="Manchester United late goal share by decade"
              yTickSuffix="%"
              baseline={{ value: 100 / 6, label: "even share 16.7%" }}
            />
            <p className="text-xs text-ink-faint mt-1">
              Percent of timed goals scored minute 76–90, by decade. Dashed line is an even sixth of the match.
            </p>
          </div>
          <div className="lg:pt-6">
            <h3 className="text-sm font-medium mb-2 text-ink-dim">Sealed at the death</h3>
            <p className="text-xs text-ink-dim mb-3">
              One-goal wins decided by a United goal in the 85th minute or later — the matches the ridge is built on.
            </p>
            <MatchList matches={winners} showSeason />
          </div>
        </div>
        <EvidenceLink href="/matches" label="Browse every match →" />
      </Module>

      <Module
        id="bogey-sides"
        question="Which sides are the real bogey teams?"
        finding="The opponents United beat least often, among sides met at least 20 times in official competition. Low win rates against fellow giants are expected; the surprises are further down the table."
        slice="All official competitions, minimum 20 meetings, ranked by win rate ascending. Away columns show whether the problem travels."
      >
        <div className="space-y-1">
          {bogeys.map((o, i) => {
            const worst = i < 3; // the genuine bogey sides lead the ladder
            return (
              <div
                key={o.id}
                className={`grid grid-cols-[3rem_minmax(0,1fr)] items-center gap-x-4 rounded-md py-2 pr-1 sm:grid-cols-[3.5rem_minmax(0,1fr)] ${
                  worst ? "border-l-2 border-devil bg-devil/5 pl-3" : "pl-3"
                }`}
              >
                <div className="text-right leading-none">
                  <div className={`stat-num text-lg font-semibold ${worst ? "text-devil-bright" : "text-ink"}`}>
                    {pct(o.w, o.p)}
                  </div>
                  <div className="mt-0.5 text-[10px] uppercase tracking-wide text-ink-faint">win</div>
                </div>
                <div className="min-w-0">
                  <div className="mb-1 flex items-baseline justify-between gap-3">
                    <Link href={`/opponent/${o.id}`} className="truncate font-medium hover:text-devil-bright">
                      {o.name}
                    </Link>
                    <span className="stat-num whitespace-nowrap text-[11px] text-ink-faint">
                      {o.p} met · away {o.away_p ? pct(o.away_w, o.away_p) : "—"}
                    </span>
                  </div>
                  <WdlBar w={o.w} d={o.d} l={o.l} />
                </div>
              </div>
            );
          })}
        </div>
        <EvidenceLink href="/opponents" label="Every head-to-head record →" />
      </Module>

      <Module
        id="european-weeks"
        question="Does Europe cost points at the weekend?"
        finding={`Do midweek trips to Europe drag on the weekend? The two splits below set league form within four days of a European tie against the rest of those same seasons — a ${euroDelta >= 0 ? "gain" : "drop"} of ${Math.abs(euroDelta).toFixed(1)} points of win rate.`}
        slice={`League matches in seasons with European football (1956– ), split by whether a European tie fell 1–4 days before; baseline is the remaining league matches of those same seasons (${fmtNum(euro.baseline.p)} matches).`}
      >
        <div className="rounded-lg border border-line bg-panel-2 p-5">
          <div className="mb-2 flex items-baseline justify-between gap-4">
            <span className="text-xs uppercase tracking-wider text-ink-faint">League win rate — after Europe vs the rest</span>
            <span
              className="stat-num text-sm font-semibold"
              style={{ color: euroDelta >= 0 ? "var(--color-win)" : "var(--color-loss)" }}
            >
              {euroDelta >= 0 ? "+" : "−"}{Math.abs(euroDelta).toFixed(1)} pts
            </span>
          </div>
          <SlopeCompare
            from={{ value: (100 * euro.baseline.w) / (euro.baseline.p || 1), label: "Other weeks" }}
            to={{ value: (100 * euro.afterEuro.w) / (euro.afterEuro.p || 1), label: "After Europe" }}
            min={0}
            max={100}
            format={(v) => `${v.toFixed(1)}%`}
            showValues
          />
          <div className="mt-1 flex justify-between stat-num text-[10px] text-ink-faint">
            <span>0%</span>
            <span>100%</span>
          </div>
          <div className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <div className="mb-1 flex items-center gap-2 text-xs">
                <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: euroDelta >= 0 ? "var(--color-win)" : "var(--color-loss)" }} />
                <span className="text-ink-dim">1–4 days after a European tie</span>
              </div>
              <div className="stat-num text-xs text-ink-faint">
                <WdlRecord w={euro.afterEuro.w} d={euro.afterEuro.d} l={euro.afterEuro.l} /> in {fmtNum(euro.afterEuro.p)} matches
              </div>
              <WdlBar w={euro.afterEuro.w} d={euro.afterEuro.d} l={euro.afterEuro.l} className="mt-2" />
            </div>
            <div>
              <div className="mb-1 flex items-center gap-2 text-xs">
                <span className="inline-block h-2.5 w-2.5 rounded-full border-2 bg-pitch" style={{ borderColor: "var(--color-ink-faint)" }} />
                <span className="text-ink-dim">Other league weeks, same seasons</span>
              </div>
              <div className="stat-num text-xs text-ink-faint">
                <WdlRecord w={euro.baseline.w} d={euro.baseline.d} l={euro.baseline.l} /> in {fmtNum(euro.baseline.p)} matches
              </div>
              <WdlBar w={euro.baseline.w} d={euro.baseline.d} l={euro.baseline.l} className="mt-2" />
            </div>
          </div>
        </div>
        <div>
          <h3 className="text-sm font-medium mb-2 text-ink-dim">Most recent league matches in a European week</h3>
          <MatchList matches={euroSample} showSeason />
        </div>
        <EvidenceLink href="/matches?type=european" label="All European matches →" />
      </Module>

      <Module
        id="manager-bounce"
        question="Is the new-manager bounce real?"
        finding={`${bounceUp} of ${bounce.length} United managers won more of their first ten matches than the club managed in the ten before they arrived. Each line runs from the old form (hollow) to the new manager's start (solid) — the upward green lines are the real bounces.`}
        slice="Each manager's first 10 matches in charge versus the club's previous 10 matches (any manager), all competitions; managers with fewer than 10 matches, and the first manager on record, are excluded."
      >
        <div>
          <div className="mb-3 flex items-center justify-between text-[11px] text-ink-faint">
            <span className="flex items-center gap-3">
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-2.5 w-2.5 rounded-full border-2 bg-pitch" style={{ borderColor: "var(--color-ink-faint)" }} />
                wins in the previous 10
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-2.5 w-2.5 rounded-full bg-win" />
                in the first 10
              </span>
            </span>
            <span className="stat-num">0–10 wins →</span>
          </div>
          <div className="space-y-1">
            {[...bounce]
              .sort((a, b) => b.first10.w - b.prev10.w - (a.first10.w - a.prev10.w))
              .map((b) => {
                const swing = b.first10.w - b.prev10.w;
                return (
                  <div key={b.id} className="grid grid-cols-[7.5rem_1fr_2.25rem] items-center gap-3 sm:grid-cols-[10rem_1fr_2.5rem]">
                    <Link href={`/manager/${b.id}`} title={b.name} className="truncate text-sm hover:text-devil-bright">
                      {b.name}
                    </Link>
                    <SlopeCompare compact from={{ value: b.prev10.w }} to={{ value: b.first10.w }} min={0} max={10} />
                    <span
                      className={`stat-num text-right text-sm font-semibold ${swing > 0 ? "text-win" : swing < 0 ? "text-loss" : "text-ink-faint"}`}
                    >
                      {swing > 0 ? `+${swing}` : swing}
                    </span>
                  </div>
                );
              })}
          </div>
        </div>
        <details className="group">
          <summary className="cursor-pointer text-xs text-ink-dim hover:text-ink focus-ring">
            Show the full comparison table
          </summary>
          <div className="mt-3">
        <DataTable
          caption="New-manager bounce comparison"
          rows={bounce}
          rowKey={(b) => b.id}
          density="compact"
          columns={[
            {
              label: "Manager",
              key: "manager",
              render: (b) => (
                <Link href={`/manager/${b.id}`} className="font-medium hover:text-devil-bright">
                  {b.name}
                </Link>
              ),
            },
            {
              label: "From",
              key: "from",
              className: "text-xs text-ink-faint",
              render: (b) => fmtDate(b.first_date),
            },
            {
              label: "Prev 10",
              key: "prev",
              numeric: true,
              className: "text-ink-dim",
              render: (b) => `${b.prev10.w}W ${b.prev10.d}D ${b.prev10.l}L`,
            },
            {
              label: "First 10",
              key: "first",
              numeric: true,
              render: (b) => `${b.first10.w}W ${b.first10.d}D ${b.first10.l}L`,
            },
            {
              label: "Swing",
              key: "swing",
              numeric: true,
              render: (b) => {
                const delta = b.first10.w - b.prev10.w;
                return (
                  <span className={delta > 0 ? "text-win" : delta < 0 ? "text-loss" : "text-ink-faint"}>
                    {delta > 0 ? `+${delta}` : delta}
                  </span>
                );
              },
            },
          ]}
        />
          </div>
        </details>
        <EvidenceLink href="/managers" label="Every manager's full record →" />
      </Module>

      <Module
        id="fortress"
        question="How much of a fortress is Old Trafford?"
        finding={
          otUnbeaten
            ? `The longest unbeaten home run at Old Trafford is ${otUnbeaten.length} matches, ${fmtDate(otUnbeaten.from)} to ${fmtDate(otUnbeaten.to)}. The decade bars show when the fortress held and when it didn't.`
            : "Home record at Old Trafford by decade."
        }
        slice="Home matches played at Old Trafford only (1910– ), all competitions; Maine Road years and neutral venues are excluded. The unbeaten run counts consecutive home matches without defeat."
      >
        {otUnbeaten && (
          <div className="grid items-stretch gap-3 sm:grid-cols-[auto_auto_1fr]">
            <div className="rounded-lg border border-line bg-panel-2 px-5 py-4">
              <div className="stat-num text-4xl font-semibold leading-none text-win">{otUnbeaten.length}</div>
              <div className="mt-1.5 text-[11px] uppercase tracking-wider text-ink-faint">home games unbeaten</div>
            </div>
            <div className="rounded-lg border border-line bg-panel-2 px-5 py-4">
              <div className="stat-num text-4xl font-semibold leading-none">{pct(otRecord.w, otRecord.p)}</div>
              <div className="mt-1.5 text-[11px] uppercase tracking-wider text-ink-faint">won, all-time</div>
            </div>
            <div className="flex items-center text-sm text-ink-dim sm:px-2">
              The longest run without a home defeat ran from {fmtDate(otUnbeaten.from)} to {fmtDate(otUnbeaten.to)} —
              {" "}{fmtNum(otRecord.w)} of {fmtNum(otRecord.p)} Old Trafford matches won across the decades below.
            </div>
          </div>
        )}
        <div>
          <h3 className="mb-2 text-sm font-medium text-ink-dim">When the fortress held — home win rate by decade</h3>
          <InspectableBarChart
            data={otDecades.map((d) => ({
              label: d.decade,
              tickLabel: d.decade.slice(0, 4),
              value: Math.round((100 * d.w) / (d.p || 1)),
              valueLabel: `${Math.round((100 * d.w) / (d.p || 1))}% won`,
              meta: `${fmtNum(d.p)} home matches, ${fmtNum(d.w)} wins`,
              href: `/matches?venue=H&from=${d.decade.slice(0, 4)}&to=${Number(d.decade.slice(0, 4)) + 9}`,
            }))}
            height={180}
            color="var(--color-win)"
            chartLabel="Manchester United Old Trafford win rate by decade"
            yTickSuffix="%"
            baseline={{ value: 50, label: "half won" }}
          />
          <p className="text-xs text-ink-faint mt-1">Percent of Old Trafford home matches won, by decade.</p>
        </div>
        <EvidenceLink href="/matches?venue=H" label="Every home match →" />
      </Module>

      <Module
        id="cup-specialists"
        question="Who saved their goals for cup nights?"
        finding="Players whose recorded goals lean most toward cup competition — FA Cup, League Cup, Europe, and the one-off finals — among scorers with at least 25 recorded goals."
        slice="Goals (excluding own goals) per player split league v cup by competition type, minimum 25 recorded goals, ranked by cup share."
        coverage={`Scorer attribution exists for ${fmtNum(Number(meta.matches_with_scorers))} of ${fmtNum(Number(meta.matches))} matches, weighted toward the post-war era — pre-war specialists may be under-counted.`}
      >
        <div>
          <div className="mb-2 flex items-center gap-4 text-[11px] text-ink-faint">
            <span className="flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 rounded-sm bg-gold" /> cup goals</span>
            <span className="flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: "var(--color-ink-faint)" }} /> league goals</span>
            <span className="ml-auto stat-num">cup share →</span>
          </div>
          <div className="space-y-1.5 text-sm">
            {specialists.map((p) => (
              <div
                key={p.player_id}
                className="grid grid-cols-[8.5rem_minmax(0,1fr)_3rem] items-center gap-3 sm:grid-cols-[11rem_minmax(0,1fr)_3.5rem]"
              >
                <Link href={`/player/${p.player_id}`} title={p.name} className="truncate font-medium hover:text-devil-bright">
                  {p.name}
                </Link>
                <SplitBar
                  segments={[
                    { value: p.cup_goals, color: "var(--color-gold)", label: `${p.cup_goals} cup` },
                    { value: p.league_goals, color: "var(--color-ink-faint)", label: `${p.league_goals}`, textColor: "var(--color-pitch)" },
                  ]}
                />
                <span className="stat-num text-right font-semibold text-gold">{pct(p.cup_goals, p.total)}</span>
              </div>
            ))}
          </div>
        </div>
        <EvidenceLink href="/matches?type=cup" label="Every cup match →" />
      </Module>

      <Module
        id="away-days"
        question="How far do away days take United?"
        finding={`Across ${fmtNum(travelCov.covered)} mapped away matches, the trips run from short Lancashire hops to ${fmtNum(Math.round(farthest.km))} km at ${farthest.name}. Season travel steps up with the First Division's southern spread and European football from 1956.`}
        slice={`official away matches; one-way distance from Manchester to each opponent's home town, city level. Average trip per season, ${travelSeasons[0]?.season}–${travelSeasons[travelSeasons.length - 1]?.season}.`}
        coverage={`opponent home towns are mapped for ${fmtNum(travelCov.covered)} of ${fmtNum(travelCov.total)} official away matches.`}
      >
        <div className="grid lg:grid-cols-2 gap-4">
          <div>
            <h3 className="text-sm font-medium mb-2 text-ink-dim">
              The league footprint · {domestic.length} grounds
            </h3>
            <GeoScatter
              points={domestic.map((v) => ({ lat: v.lat, lng: v.lng, label: v.name, value: v.p }))}
              origin={{ ...MANCHESTER, label: "Manchester" }}
              bounds={BRITAIN}
              land={BRITAIN_LAND}
              labelTop={6}
            />
          </div>
          <div>
            <h3 className="text-sm font-medium mb-2 text-ink-dim">
              European nights · {european.length} clubs
            </h3>
            <GeoScatter
              points={european.map((v) => ({ lat: v.lat, lng: v.lng, label: v.name, value: v.p }))}
              origin={{ ...MANCHESTER, label: "Manchester" }}
              bounds={EUROPE}
              land={EUROPE_LAND}
              labelTop={8}
              dotColor="var(--color-gold)"
            />
          </div>
        </div>
        <div>
          <h3 className="text-sm font-medium mb-2 text-ink-dim">Average away trip per season</h3>
          <InspectableTimeSeriesChart
            data={travelSeasons.map((s) => ({
              x: Number(s.season.slice(0, 4)),
              y: Math.round(s.avgKm),
              label: s.season,
              valueLabel: `${fmtNum(Math.round(s.avgKm))} km average`,
              meta: `${fmtNum(s.trips)} away trips, ${fmtNum(Math.round(s.maxKm))} km longest`,
            }))}
            height={200}
            chartLabel="Manchester United average away trip distance by season"
            valueLabel="Average away trip"
            xTicks={[1900, 1930, 1960, 1990, 2020].map((year) => ({ x: year, label: String(year) }))}
          />
        </div>
        <EvidenceLink href="/matches?venue=A" label="Every away match →" />
      </Module>

      <p className="text-sm text-ink-dim">
        Have a question these don&apos;t answer? Slice the full record in the{" "}
        <Link href="/matches" className="text-devil-bright hover:underline">match browser</Link> or
        start from a{" "}
        <Link href="/players" className="text-devil-bright hover:underline">player</Link>,{" "}
        <Link href="/managers" className="text-devil-bright hover:underline">manager</Link>, or{" "}
        <Link href="/opponents" className="text-devil-bright hover:underline">opponent</Link>.
      </p>
    </div>
  );
}
