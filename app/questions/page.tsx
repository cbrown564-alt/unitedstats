import Link from "next/link";
import {
  bogeyOpponents, cupSpecialists, europeanWeekEffect, homeMatchesAtOldTrafford,
  lateGoalShareByDecade, lateWinners, leagueMatchesAfterEuropean, longestStreak,
  managerBounce, oldTraffordByDecade, timedGoalCounts,
} from "@/lib/trails";
import { getMeta, goalMinuteHistogram } from "@/lib/queries";
import { awayFootprint, travelBySeason, travelCoverage, MANCHESTER } from "@/lib/spatial";
import { InspectableBarChart } from "@/components/charts/InspectableBarChart";
import { InspectableTimeSeriesChart } from "@/components/charts/InspectableTimeSeriesChart";
import { DataTable } from "@/components/DataTable";
import { GeoScatter } from "@/components/GeoScatter";
import { MatchList } from "@/components/MatchList";
import { WdlBar, WdlRecord } from "@/components/WdlBar";
import { EvidenceLink } from "@/components/EvidenceLink";
import { fmtDate, fmtNum, pct, GOAL_MINUTE_BUCKETS } from "@/lib/format";

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
  return (
    <section id={id} className="border border-line rounded-lg bg-panel p-5 sm:p-6 scroll-mt-28 space-y-4">
      <header>
        <h2 className="display text-2xl">{question}</h2>
        <p className="text-sm text-ink-dim mt-1 max-w-2xl">{finding}</p>
      </header>
      {children}
      <footer className="text-xs text-ink-faint space-y-1 border-t border-line pt-3">
        <p><span className="text-ink-dim">Slice:</span> {slice}</p>
        {coverage && <p><span className="text-ink-dim">Coverage:</span> {coverage}</p>}
      </footer>
    </section>
  );
}

export default function QuestionsPage() {
  const meta = getMeta();
  const lateByDecade = lateGoalShareByDecade();
  const minuteHist = goalMinuteHistogram();
  const minuteLabels = GOAL_MINUTE_BUCKETS;
  const timed = timedGoalCounts();
  const winners = lateWinners(8);
  const bogeys = bogeyOpponents(20, 10);
  const euro = europeanWeekEffect();
  const euroSample = leagueMatchesAfterEuropean(6);
  const bounce = managerBounce();
  const otDecades = oldTraffordByDecade();
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
        finding={`Of ${fmtNum(overallLateShare.timed)} goals with a recorded minute, ${pct(overallLateShare.late, overallLateShare.timed)} arrived in the final 15 minutes — a flat sixth of the match would be 16.7%. The decade bars show whether "Fergie time" is an era or a habit.`}
        slice="United goals (including penalties and own goals for) with a recorded minute ≤ 90, bucketed by decade; decades with fewer than 20 timed goals are hidden."
        coverage={`${fmtNum(timed.timed)} of ${fmtNum(timed.total)} recorded United goals carry a minute; minute data is densest from the 1990s onward, so early decades lean on smaller samples.`}
      >
        <div className="max-w-2xl">
          <InspectableBarChart
            data={lateByDecade.map((d) => ({
              label: d.decade,
              tickLabel: d.decade.slice(2),
              value: Math.round((1000 * d.late) / d.timed) / 10,
              valueLabel: `${(Math.round((1000 * d.late) / d.timed) / 10).toFixed(1)}% late`,
              meta: `${fmtNum(d.late)} of ${fmtNum(d.timed)} timed goals`,
              href: `/matches?from=${d.decade.slice(0, 4)}&to=${Number(d.decade.slice(0, 4)) + 9}`,
            }))}
            height={160}
            color="var(--color-gold)"
            chartLabel="Manchester United late goal share by decade"
            yTickSuffix="%"
          />
          <p className="text-xs text-ink-faint mt-1">Percent of timed goals scored minute 76–90, by decade.</p>
        </div>
        {minuteHist.length > 0 && (
          <div className="max-w-2xl">
            <h3 className="text-sm font-medium mb-2 text-ink-dim">When in the match United score</h3>
            <InspectableBarChart
              data={minuteHist.map((b) => ({
                label: minuteLabels[Number(b.bucket)] ?? b.bucket,
                value: b.n,
                valueLabel: `${fmtNum(b.n)} goals`,
                meta: "Recorded United goals with minutes",
              }))}
              height={160}
              color="var(--color-gold)"
              chartLabel="Manchester United goals by match minute bucket"
            />
            <p className="text-xs text-ink-faint mt-1">United goals with a recorded minute ≤ 90, by 15-minute window.</p>
          </div>
        )}
        <div>
          <h3 className="text-sm font-medium mb-2 text-ink-dim">Latest one-goal wins sealed in the 85th minute or later</h3>
          <MatchList matches={winners} showSeason />
        </div>
        <EvidenceLink href="/matches" label="Browse every match →" />
      </Module>

      <Module
        id="bogey-sides"
        question="Which sides are the real bogey teams?"
        finding="The opponents United beat least often, among sides met at least 20 times in official competition. Low win rates against fellow giants are expected; the surprises are further down the table."
        slice="All official competitions, minimum 20 meetings, ranked by win rate ascending. Away columns show whether the problem travels."
      >
        <div className="space-y-3 max-w-3xl">
          {bogeys.map((o) => (
            <div key={o.id}>
              <div className="flex justify-between text-sm mb-1 gap-3">
                <Link href={`/opponent/${o.id}`} className="font-medium hover:text-devil-bright truncate">
                  {o.name}
                </Link>
                <span className="stat-num text-xs text-ink-faint whitespace-nowrap">
                  {o.p} P · {pct(o.w, o.p)} W · away {o.away_w}/{o.away_p}
                </span>
              </div>
              <WdlBar w={o.w} d={o.d} l={o.l} />
            </div>
          ))}
        </div>
        <EvidenceLink href="/opponents" label="Every head-to-head record →" />
      </Module>

      <Module
        id="european-weeks"
        question="Does Europe cost points at the weekend?"
        finding={`League matches played within four days of a European tie: ${pct(euro.afterEuro.w, euro.afterEuro.p)} won, against ${pct(euro.baseline.w, euro.baseline.p)} in other league matches of the same seasons — a ${euroDelta >= 0 ? "gain" : "drop"} of ${Math.abs(euroDelta).toFixed(1)} points of win rate.`}
        slice={`League matches in seasons with European football (1956– ), split by whether a European tie fell 1–4 days before; baseline is the remaining league matches of those same seasons (${fmtNum(euro.baseline.p)} matches).`}
      >
        <div className="grid sm:grid-cols-2 gap-4 max-w-3xl text-sm">
          <div className="border border-line rounded-lg bg-panel-2 px-4 py-3">
            <div className="text-xs uppercase tracking-wider text-ink-faint mb-1">1–4 days after Europe</div>
            <div className="stat-num text-2xl font-semibold">{pct(euro.afterEuro.w, euro.afterEuro.p)}</div>
            <div className="text-xs text-ink-faint stat-num mt-0.5">
              <WdlRecord w={euro.afterEuro.w} d={euro.afterEuro.d} l={euro.afterEuro.l} /> in {fmtNum(euro.afterEuro.p)} matches
            </div>
            <WdlBar w={euro.afterEuro.w} d={euro.afterEuro.d} l={euro.afterEuro.l} className="mt-2" />
          </div>
          <div className="border border-line rounded-lg bg-panel-2 px-4 py-3">
            <div className="text-xs uppercase tracking-wider text-ink-faint mb-1">Other league matches, same seasons</div>
            <div className="stat-num text-2xl font-semibold">{pct(euro.baseline.w, euro.baseline.p)}</div>
            <div className="text-xs text-ink-faint stat-num mt-0.5">
              <WdlRecord w={euro.baseline.w} d={euro.baseline.d} l={euro.baseline.l} /> in {fmtNum(euro.baseline.p)} matches
            </div>
            <WdlBar w={euro.baseline.w} d={euro.baseline.d} l={euro.baseline.l} className="mt-2" />
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
        finding={`${bounceUp} of ${bounce.length} United managers won more of their first ten matches than the club won of the ten before they arrived. The bounce exists for some appointments — and the table shows exactly which.`}
        slice="Each manager's first 10 matches in charge versus the club's previous 10 matches (any manager), all competitions; managers with fewer than 10 matches, and the first manager on record, are excluded."
      >
        <DataTable
          caption="New-manager bounce comparison"
          rows={bounce}
          rowKey={(b) => b.id}
          density="compact"
          className="max-w-3xl"
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
        <div className="max-w-2xl">
          <InspectableBarChart
            data={otDecades.map((d) => ({
              label: d.decade,
              tickLabel: d.decade.slice(0, 4),
              value: Math.round((100 * d.w) / (d.p || 1)),
              valueLabel: `${Math.round((100 * d.w) / (d.p || 1))}% won`,
              meta: `${fmtNum(d.p)} home matches, ${fmtNum(d.w)} wins`,
              href: `/matches?venue=H&from=${d.decade.slice(0, 4)}&to=${Number(d.decade.slice(0, 4)) + 9}`,
            }))}
            height={160}
            color="var(--color-win)"
            chartLabel="Manchester United Old Trafford win rate by decade"
            yTickSuffix="%"
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
        <div className="space-y-2 max-w-2xl text-sm">
          {specialists.map((p) => (
            <div key={p.player_id} className="flex items-center gap-3 border border-line rounded-lg bg-panel-2 px-4 py-2.5">
              <Link href={`/player/${p.player_id}`} className="font-medium hover:text-devil-bright flex-1 truncate">
                {p.name}
              </Link>
              <span className="stat-num text-xs text-ink-faint whitespace-nowrap">
                {p.cup_goals} cup · {p.league_goals} league
              </span>
              <span className="stat-num text-devil-bright w-14 text-right">{pct(p.cup_goals, p.total)}</span>
            </div>
          ))}
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
              labelTop={8}
              dotColor="var(--color-gold)"
            />
          </div>
        </div>
        <div className="max-w-2xl">
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
