import Link from "next/link";
import {
  bogeyOpponents, cupGoalShareBaseline, cupSpecialists, goalMinuteRidge,
  iconicLateWinners, lateGoalShareByDecade, leadHeldAtHome,
  managerBounce, oldTraffordByDecade, timedGoalCounts,
} from "@/lib/trails";
import { getMeta, ownGoalScorers, ownGoalSummary, topScorers } from "@/lib/queries";
import { awayFootprint, travelBySeason, travelCoverage, MANCHESTER } from "@/lib/spatial";
import { BRITAIN_LAND, EUROPE_LAND } from "@/lib/geo/land";
import { InspectableBarChartLazy as InspectableBarChart } from "@/components/charts/lazy";
import { LeadHeldDotplot, type LeadDot } from "@/components/charts/LeadHeldDotplot";
import { InspectableTimeSeriesChartLazy as InspectableTimeSeriesChart } from "@/components/charts/lazy";
import { MinuteRidge } from "@/components/charts/MinuteRidge";
import { SlopeCompare } from "@/components/charts/SlopeCompare";
import { BounceComparisonTable } from "@/components/manager/BounceComparisonTable";
import { GeoScatter } from "@/components/GeoScatter";
import { MatchList } from "@/components/MatchList";
import { CupLeanBar } from "@/components/charts/CupLeanBar";
import { WdlBar } from "@/components/WdlBar";
import { ClubBadge } from "@/components/ClubBadge";
import { PlayerPortrait } from "@/components/PlayerPortrait";
import { EvidenceLink } from "@/components/EvidenceLink";
import { fmtDate, fmtNum, pct } from "@/lib/format";

const BRITAIN: [number, number, number, number] = [49.8, 56.3, -7.6, 2.3];
const EUROPE: [number, number, number, number] = [34, 61.5, -11, 36];

export const metadata = { title: "Questions" };

const QUESTION_NAV: [id: string, label: string][] = [
  ["late-goals", "Late goals"],
  ["bogey-sides", "Bogey teams"],
  ["manager-bounce", "Manager bounce"],
  ["fortress", "Fortress OT"],
  ["cup-specialists", "Cup specialists"],
  ["own-goals", "Own goals"],
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
  // Title, finding, and footnotes fill the panel width and wrap responsively by
  // viewport, matching the evidence below them rather than capping at a narrow
  // measure that leaves a dead band on the right. Each module's children own
  // their own internal rhythm.
  return (
    <section id={id} className="border border-line rounded-lg bg-panel p-5 sm:p-6 scroll-mt-28 space-y-5">
      <header>
        <h2 className="display text-2xl text-balance">{question}</h2>
        <p className="text-sm text-ink-dim mt-1 text-pretty">{finding}</p>
      </header>
      <div className="space-y-5">{children}</div>
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
  const ridge = goalMinuteRidge();
  const timed = timedGoalCounts();
  const winners = iconicLateWinners();
  const bogeys = bogeyOpponents(20, 10);
  const bounce = managerBounce();
  const otDecades = oldTraffordByDecade();
  const otRecord = otDecades.reduce((a, d) => ({ p: a.p + d.p, w: a.w + d.w }), { p: 0, w: 0 });
  const specialists = cupSpecialists(25, 10);
  const cupBaseline = cupGoalShareBaseline();
  const topCupLean = specialists[0];

  // Fortress, stated as a rule: lead at half-time at Old Trafford and you don't lose.
  const leadHeld = leadHeldAtHome();
  // Closest calls — games where the lead was surrendered, ranked by how near defeat
  // came (deepest second-half deficit, then biggest scoreline), shown chronologically.
  const leadDraws = leadHeld.games.filter((g) => g.result === "D");
  const leadFellBehind = leadHeld.games.filter((g) => g.worst < 0).length; // led, trailed after the break, rescued
  // Closest calls — the surrendered leads, ranked by how near defeat came (deepest
  // second-half deficit, then biggest scoreline), shown chronologically.
  const closeCalls = [...leadDraws]
    .sort((a, b) => a.worst - b.worst || b.ga - a.ga || b.date.localeCompare(a.date))
    .slice(0, 5)
    .sort((a, b) => a.date.localeCompare(b.date));
  const closeCallRank = new Map(closeCalls.map((g, i) => [g.id, i + 1]));
  const leadDots: LeadDot[] = leadHeld.games.map((g) => ({
    result: g.result as LeadDot["result"],
    surrendered: g.result === "D",
    rank: closeCallRank.get(g.id),
    title: `${fmtDate(g.date)} — ${g.result === "W" ? `won ${g.gf}–${g.ga}` : `drew ${g.gf}–${g.ga}`} v ${g.opponent_name}${
      g.worst < 0 ? " (fell behind, rescued)" : g.result === "D" ? " (lead surrendered)" : ""
    }`,
  }));

  // "Own Goal" as a scorer — opponents netting into their own goal in United's favour.
  const ogSummary = ownGoalSummary();
  const ogScorers = ownGoalScorers();
  const ogRepeat = ogScorers.filter((s) => s.n > 1);
  const ogRank = topScorers(12).findIndex((p) => p.player_id === "own-goal") + 1;

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
  const bounceUp = bounce.filter((b) => b.first10.w > b.prev10.w).length;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="display text-3xl">Questions</h1>
        <p className="text-sm text-ink-dim mt-1 text-pretty">
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
        finding={`Of ${fmtNum(overallLateShare.timed)} goals with a recorded minute, ${pct(overallLateShare.late, overallLateShare.timed)} came after the 85th minute — roughly double an even spread. The decade bars show whether "Fergie time" is an era or a habit.`}
        slice="United goals (including penalties and own goals for) with a recorded minute, bucketed by decade; the late share counts goals from the 86th minute on, stoppage time included. Decades with fewer than 20 timed goals are hidden."
        coverage={`${fmtNum(timed.timed)} of ${fmtNum(timed.total)} recorded United goals carry a minute; minute data is densest from the 1990s onward, so early decades lean on smaller samples.`}
      >
        <div>
          <h3 className="text-sm font-medium mb-2 text-ink-dim">Across the 90 — when United&apos;s goals actually land</h3>
          <MinuteRidge bins={ridge.bins} lateFrom={85} />
          <p className="text-xs text-ink-faint mt-1">
            United goals by 5-minute window; the closing five minutes (plus stoppage, folded into the final bar) are
            shaded red. The dashed line is an even spread across the match.
          </p>
        </div>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-stretch">
          <div className="flex flex-col">
            <h3 className="text-sm font-medium mb-2 text-ink-dim">Is it an era, or a habit? Late share by decade</h3>
            <div className="min-h-40 flex-1">
              <InspectableBarChart
                data={lateByDecade.map((d) => ({
                  label: d.decade,
                  tickLabel: d.decade.slice(2),
                  value: Math.round((1000 * d.late) / d.timed) / 10,
                  valueLabel: `${(Math.round((1000 * d.late) / d.timed) / 10).toFixed(1)}% late`,
                  meta: `${fmtNum(d.late)} of ${fmtNum(d.timed)} timed goals`,
                  href: `/matches?from=${d.decade.slice(0, 4)}&to=${Number(d.decade.slice(0, 4)) + 9}`,
                }))}
                fill
                color="var(--color-gold)"
                chartLabel="Manchester United late goal share by decade"
                yTickSuffix="%"
                baseline={{ value: 100 / 18, label: "even spread 5.6%" }}
              />
            </div>
            <p className="text-xs text-ink-faint mt-1">
              Percent of timed goals scored after the 85th minute, by decade. Dashed line is an even spread across the match.
            </p>
          </div>
          <div className="flex flex-col">
            <h3 className="text-sm font-medium mb-2 text-ink-dim">The late show — six United sealed at the death</h3>
            <p className="text-xs text-ink-dim mb-3">
              Iconic one-goal wins decided by a United goal after the 85th minute — from Bruce against Sheffield
              Wednesday to the Treble night in Barcelona.
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
                  <div className="mb-1 flex items-center justify-between gap-3">
                    <Link href={`/opponent/${o.id}`} className="flex min-w-0 items-center gap-2 font-medium hover:text-devil-bright">
                      <ClubBadge id={o.id} name={o.name} />
                      <span className="truncate">{o.name}</span>
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
        <EvidenceLink href="/search" label="Search every head-to-head →" />
      </Module>

      <Module
        id="manager-bounce"
        question="Is the new-manager bounce real?"
        finding={`${bounceUp} of ${bounce.length} United managers won more of their first ten matches than the club managed in the ten before they arrived. Each line runs from the old form (hollow) to the new manager's start (solid) — the upward red lines are the real bounces.`}
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
                  <div key={b.id} className="grid grid-cols-[9.5rem_1fr_2.25rem] items-center gap-3 sm:grid-cols-[12rem_1fr_2.5rem]">
                    <Link href={`/manager/${b.id}`} title={b.name} className="flex min-w-0 items-center gap-2 text-sm hover:text-devil-bright">
                      <PlayerPortrait name={b.name} src={b.thumb_url ?? b.image_url} size="xs" />
                      <span className="truncate">{b.name}</span>
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
            <BounceComparisonTable bounce={bounce} />
          </div>
        </details>
        <EvidenceLink href="/managers" label="Every manager's full record →" />
      </Module>

      <Module
        id="fortress"
        question="How much of a fortress is Old Trafford?"
        finding={`Take a lead into half-time at Old Trafford and the record says you do not lose it. Across the ${fmtNum(leadHeld.games.length)} home league games we can place where United led at the break, ${leadHeld.from.slice(0, 4)}–${leadHeld.to.slice(0, 4)}, they won ${fmtNum(leadHeld.w)}, drew ${fmtNum(leadHeld.d)}, and lost none.`}
        slice="Old Trafford home league games where United led at half-time, the half-time score reconstructed from minute-stamped goal events. Restricted to matches whose goals all carry a minute, so it is the verifiable part of the record rather than a single continuous run."
        coverage={`Half-time scores only reconstruct where every goal has a recorded minute, so these ${fmtNum(leadHeld.games.length)} games are a sample, not a sequence. Opta, working from complete half-time data, puts the current unbeaten run at 400 home league games led at half-time — W365 D35 — back to August 1984.`}
      >
        <div className="grid items-stretch gap-3 sm:grid-cols-[auto_1fr]">
          <div className="rounded-lg border border-line bg-panel-2 px-6 py-4 text-center">
            <div className="stat-num text-5xl font-semibold leading-none text-win">0</div>
            <div className="mx-auto mt-1.5 max-w-28 text-[11px] uppercase tracking-wider text-ink-faint">
              defeats in {fmtNum(leadHeld.games.length)} games led at the break
            </div>
          </div>
          <div className="flex items-center text-sm text-ink-dim sm:px-2">
            <span>
              <span className="text-ink">Won {fmtNum(leadHeld.w)}, drawn {fmtNum(leadHeld.d)}, lost none.</span>{" "}
              The lead was let slip to a draw {fmtNum(leadHeld.d)} times, and only {leadFellBehind === 1 ? "once" : `${fmtNum(leadFellBehind)} times`} did
              United actually fall behind after the interval and still rescue the game. Opta dates the run unbeaten to 400 such
              games, back to August 1984.
            </span>
          </div>
        </div>

        <div>
          <h3 className="mb-2 text-sm font-medium text-ink-dim">Every home league game United led at half-time — oldest first</h3>
          <div className="mb-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-ink-faint">
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: "var(--color-win)" }} /> won
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-full border-2 bg-pitch" style={{ borderColor: "var(--color-gold)" }} /> lead surrendered — drew
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-full opacity-30" style={{ background: "var(--color-loss)" }} /> a defeat would sit here — there are none
            </span>
          </div>
          <LeadHeldDotplot dots={leadDots} fromLabel={leadHeld.from.slice(0, 4)} toLabel={leadHeld.to.slice(0, 4)} />
          <p className="text-xs text-ink-faint mt-1">
            Each dot is one home league game United led at half-time; the numbered dots are the closest calls below.
          </p>
        </div>

        {closeCalls.length > 0 && (
          <div>
            <h3 className="mb-2 text-sm font-medium text-ink-dim">Closest calls — the leads United nearly let slip</h3>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {closeCalls.map((g) => (
                <Link
                  key={g.id}
                  href={`/match/${g.id}`}
                  className="group rounded-lg border border-line bg-panel px-4 py-3 transition-colors hover:border-devil/60"
                >
                  <div className="mb-1 flex items-center justify-between">
                    <span className="stat-num flex h-5 w-5 items-center justify-center rounded-full border border-line text-[11px] text-ink-dim">
                      {closeCallRank.get(g.id)}
                    </span>
                    <span className={`text-[10px] uppercase tracking-wide ${g.worst < 0 ? "text-devil-bright" : "text-gold"}`}>
                      {g.worst < 0 ? "fell behind" : "lead surrendered"}
                    </span>
                  </div>
                  <div className="truncate font-medium group-hover:text-devil-bright">{g.opponent_name}</div>
                  <div className="stat-num mt-0.5 text-xs text-ink-dim">
                    Led {g.htf}–{g.hta} at HT · finished {g.gf}–{g.ga}
                  </div>
                  <div className="stat-num mt-0.5 text-[11px] text-ink-faint">{fmtDate(g.date)} · {g.season}</div>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div>
          <h3 className="mb-2 text-sm font-medium text-ink-dim">
            The fortress over time — home win rate by decade ({pct(otRecord.w, otRecord.p)} won all-time)
          </h3>
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
        finding={`United score just ${pct(cupBaseline.cup, cupBaseline.total)} of their goals in cups — FA Cup, League Cup, Europe, and the one-off finals. These ten scorers all more than double that, ${topCupLean.name} most of all at ${(cupBaseline.share ? (topCupLean.cup_goals / topCupLean.total) / cupBaseline.share : 0).toFixed(1)}× the club rate.`}
        slice="Goals (excluding own goals) per player split league v cup by competition type, minimum 25 recorded goals, ranked by cup share. The multiplier is each player's cup share over the club-wide cup share."
        coverage={`Scorer attribution exists for ${fmtNum(Number(meta.matches_with_scorers))} of ${fmtNum(Number(meta.matches))} matches, weighted toward the post-war era — pre-war specialists may be under-counted.`}
      >
        <div className="grid items-stretch gap-3 sm:grid-cols-[auto_1fr]">
          <div className="rounded-lg border border-line bg-panel-2 px-6 py-4 text-center">
            <div className="stat-num text-5xl font-semibold leading-none text-gold">{pct(cupBaseline.cup, cupBaseline.total)}</div>
            <div className="mx-auto mt-1.5 max-w-32 text-[11px] uppercase tracking-wider text-ink-faint">
              of all United goals come on cup nights
            </div>
          </div>
          <div className="flex items-center text-sm text-ink-dim sm:px-2">
            <span>
              Of {fmtNum(cupBaseline.total)} recorded goals, just {fmtNum(cupBaseline.cup)} landed in a cup. So a scorer
              who hits the same rate is ordinary; the players below cleared{" "}
              <span className="text-gold">double the club&apos;s {pct(cupBaseline.cup, cupBaseline.total)}</span> — they truly saved their goals for cup nights.
            </span>
          </div>
        </div>

        <div>
          <div className="mb-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-ink-faint">
            <span className="flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 rounded-sm bg-gold" /> cup goals</span>
            <span className="flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: "var(--color-panel-2)" }} /> league goals</span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-3 w-0.5 bg-devil-bright" /> club rate {pct(cupBaseline.cup, cupBaseline.total)}
            </span>
            <span className="ml-auto stat-num">× club rate →</span>
          </div>
          <CupLeanBar rows={specialists} baseline={cupBaseline.share} />
        </div>
        <EvidenceLink href="/matches?type=cup" label="Every cup match →" />
      </Module>

      <Module
        id="own-goals"
        question="Is &ldquo;Own Goal&rdquo; one of United&apos;s top scorers?"
        finding={`Treat every own goal an opponent has turned into United's net as one scorer and the answer is yes: ${fmtNum(ogSummary.total)} of them${ogRank ? `, the ${ogRank === 5 ? "fifth" : `#${ogRank}`}-most in the club's history` : ""} — and spread so thin across ${fmtNum(ogSummary.scorers)} different players that no one has done it more than ${ogRepeat[0]?.n ?? 1} times.`}
        slice="Own goals credited to United (an opponent scoring into his own net), all official competitions, gathered under the synthetic scorer 'Own Goal'. The leaderboard counts only own goals with a recorded scorer."
        coverage={`${fmtNum(ogSummary.named)} of ${fmtNum(ogSummary.total)} own goals carry a named scorer; the remaining ${fmtNum(ogSummary.unknown)}, mostly pre-war, were recorded only as "own goal".`}
      >
        <div className="grid items-stretch gap-3 sm:grid-cols-[auto_1fr]">
          <Link
            href="/player/own-goal"
            className="group flex flex-col justify-center rounded-lg border border-line bg-panel-2 px-5 py-4 transition-colors hover:border-devil/60"
          >
            <div className="stat-num text-4xl font-semibold leading-none text-devil-bright">{fmtNum(ogSummary.total)}</div>
            <div className="mt-1.5 text-[11px] uppercase tracking-wider text-ink-faint group-hover:text-ink-dim">
              own goals for United{ogRank ? ` · #${ogRank} all-time` : ""}
            </div>
          </Link>
          <div className="flex items-center text-sm text-ink-dim sm:px-2">
            Gifted by {fmtNum(ogSummary.scorers)} different opposition players between {fmtDate(ogSummary.first)} and{" "}
            {fmtDate(ogSummary.last)} — more than United legends like George Best managed in open play. &ldquo;Own
            Goal&rdquo; sits among the club&apos;s leading scorers precisely because it belongs to no one.
          </div>
        </div>
        {ogRepeat.length > 0 && (
          <div>
            <h3 className="mb-2 text-sm font-medium text-ink-dim">The only repeat benefactors — twice apiece</h3>
            <div className="space-y-1">
              {ogRepeat.map((s) => (
                <div
                  key={s.name}
                  className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-md px-3 py-2 odd:bg-panel-2/40"
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <PlayerPortrait name={s.name} src={s.thumb_url ?? s.image_url} size="xs" />
                    <div className="min-w-0">
                      <span className="font-medium">{s.name}</span>
                      <Link href={`/opponent/${s.recent_opponent_id}`} className="ml-2 text-xs text-ink-faint hover:text-devil-bright">
                        {s.recent_opponent}
                      </Link>
                    </div>
                  </div>
                  <span className="stat-num whitespace-nowrap text-xs text-ink-faint">
                    <span className="text-devil-bright">{s.n}</span> own goals · last{" "}
                    <Link href={`/match/${s.recent_match_id}`} className="hover:text-devil-bright">{s.last.slice(0, 4)}</Link>
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
        <EvidenceLink href="/player/own-goal" label="Every own goal for United →" />
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
        <Link href="/search" className="text-devil-bright hover:underline">opponent</Link>.
      </p>
    </div>
  );
}
