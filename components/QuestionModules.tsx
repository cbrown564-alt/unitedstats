import Link from "next/link";
import {
  bogeyOpponents, comebacks, cupGoalShareBaseline, cupSpecialists, goalMinuteRidge,
  iconicLateWinners, lateGoalShareByDecade, leadHeldAtHome,
  managerBounce, oldTraffordByDecade, timedGoalCounts,
} from "@/lib/trails";
import { clubStreaks } from "@/lib/streaks";
import { StreakBoard, type StreakGroup } from "@/components/StreakBoard";
import { getMeta, ownGoalScorers, ownGoalSummary, topScorers } from "@/lib/queries";
import { awayFootprint, travelBySeason, travelCoverage, MANCHESTER } from "@/lib/spatial";
import { BRITAIN_LAND, EUROPE_LAND } from "@/lib/geo/land";
import { InspectableBarChartLazy as InspectableBarChart } from "@/components/charts/lazy";
import { MinuteColumns } from "@/components/charts/MinuteColumns";
import { LeadHeldDotplot, type LeadDot } from "@/components/charts/LeadHeldDotplot";
import { InspectableTimeSeriesChartLazy as InspectableTimeSeriesChart } from "@/components/charts/lazy";
import { SlopeCompare } from "@/components/charts/SlopeCompare";
import { DataTable } from "@/components/DataTable";
import { GeoScatter } from "@/components/GeoScatter";
import { MatchList } from "@/components/MatchList";
import { CupLeanBar } from "@/components/charts/CupLeanBar";
import { WdlBar } from "@/components/WdlBar";
import { ClubBadge } from "@/components/ClubBadge";
import { PlayerPortrait } from "@/components/PlayerPortrait";
import { EvidenceLink } from "@/components/EvidenceLink";
import { ShareCite } from "@/components/ShareCite";
import { questionBySlug } from "@/lib/questions";
import { fmtDate, fmtMonthYear, fmtNum, pct, venuePrefix } from "@/lib/format";

const BRITAIN: [number, number, number, number] = [49.8, 56.3, -7.6, 2.3];
const EUROPE: [number, number, number, number] = [34, 61.5, -11, 36];

/** "index" renders inside the /questions catalogue; "canonical" is the module's own page. */
type ModuleVariant = "index" | "canonical";
type ModuleProps = { variant?: ModuleVariant };

/**
 * Shared answer-page anatomy: a stated question, a finding, the evidence, then
 * the slice/coverage footnotes and a share/cite affordance. The heading is the
 * page `h1` on a module's canonical route and an `h2` within the catalogue,
 * where the page already owns the `h1`.
 */
function Module({
  slug, finding, slice, coverage, variant = "canonical", children,
}: {
  slug: string;
  finding: string;
  slice: string;
  coverage?: string;
  variant?: ModuleVariant;
  children: React.ReactNode;
}) {
  const question = questionBySlug(slug)?.question ?? slug;
  const Heading = variant === "canonical" ? "h1" : "h2";
  return (
    <section id={slug} className="border border-line rounded-lg bg-panel p-5 sm:p-6 scroll-mt-28 space-y-5">
      <header className="flex items-start justify-between gap-4">
        <div>
          <Heading className={`display text-balance ${variant === "canonical" ? "text-3xl" : "text-2xl"}`}>
            {question}
          </Heading>
          <p className="text-sm text-ink-dim mt-1 text-pretty">{finding}</p>
        </div>
        {variant === "index" && (
          <Link
            href={`/questions/${slug}`}
            aria-label={`Open ${question} as its own page`}
            className="shrink-0 rounded-md border border-line px-2 py-1 text-xs text-ink-dim transition-colors hover:border-devil/60 hover:text-ink focus-ring"
          >
            Open ↗
          </Link>
        )}
      </header>
      <div className="space-y-5">{children}</div>
      <footer className="border-t border-line pt-3 flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div className="text-xs text-ink-faint space-y-1 min-w-0">
          <p><span className="text-ink-dim">Slice:</span> {slice}</p>
          {coverage && <p><span className="text-ink-dim">Coverage:</span> {coverage}</p>}
        </div>
        <ShareCite path={`/questions/${slug}`} title={question} />
      </footer>
    </section>
  );
}

function LateGoalsModule({ variant }: ModuleProps) {
  const lateByDecade = lateGoalShareByDecade();
  const ridge = goalMinuteRidge();
  const timed = timedGoalCounts();
  const winners = iconicLateWinners();
  const overallLateShare = lateByDecade.reduce(
    (a, d) => ({ timed: a.timed + d.timed, late: a.late + d.late, reg: a.reg + d.reg, stoppage: a.stoppage + d.stoppage }),
    { timed: 0, late: 0, reg: 0, stoppage: 0 },
  );
  const round1 = (n: number) => Math.round(n * 10) / 10;
  return (
    <Module
      slug="late-goals"
      variant={variant}
      finding={`Yes — and the proof is in regulation, not stoppage time. The last five minutes before the whistle (86–90) hold ${pct(overallLateShare.reg, overallLateShare.timed)} of all United goals, comfortably above the ${pct(5, 90)} an even spread would give. United were scoring late long before anyone gave it a name.`}
      slice="United goals with a recorded minute — penalties and own goals for included — grouped by decade, the post-85th window split into the last five regulation minutes (86–90) and stoppage time (90+, with added time folded into the final minute). Decades with fewer than 20 timed goals are hidden."
      coverage={`${fmtNum(timed.timed)} of ${fmtNum(timed.total)} recorded United goals carry a minute, and that data thins quickly before the 1990s. Stoppage-time goals are only separable where a source marks them "90+" — largely a modern convention — so the stoppage segment reads near zero in the early decades partly because it went unrecorded, not only because added time was shorter.`}
    >
      <div>
        <h3 className="text-sm font-medium mb-2 text-ink-dim">Across the 90 — when United&apos;s goals land</h3>
        <MinuteColumns bins={ridge.bins} stoppage={ridge.stoppage} height={200} />
        <p className="text-xs text-ink-faint mt-1">
          <span className="inline-flex items-center gap-1 align-middle"><span className="inline-block h-2 w-2 rounded-sm" style={{ background: "var(--color-gold)" }} /> goals per 5-minute window</span>
          {" · "}
          <span className="inline-flex items-center gap-1 align-middle"><span className="inline-block h-2 w-2 rounded-sm" style={{ background: "var(--color-devil-bright)" }} /> stoppage time</span>
          . The 86–90 bar already clears an even spread (dashed) — a real edge — and stoppage stacks more on top.
        </p>
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-stretch">
        <div className="flex flex-col">
          <h3 className="text-sm font-medium mb-2 text-ink-dim">The 1990s bang, the 2020s blow-up</h3>
          <div className="min-h-40 flex-1">
            <InspectableBarChart
              data={lateByDecade.map((d) => ({
                label: d.decade,
                tickLabel: d.decade.slice(2),
                value: round1((100 * d.reg) / d.timed),
                value2: round1((100 * d.stoppage) / d.timed),
                valueLabel: `${round1((100 * d.late) / d.timed).toFixed(1)}% after 85'`,
                meta: `${round1((100 * d.reg) / d.timed).toFixed(1)}% last five minutes · ${round1((100 * d.stoppage) / d.timed).toFixed(1)}% stoppage`,
                href: `/matches?from=${d.decade.slice(0, 4)}&to=${Number(d.decade.slice(0, 4)) + 9}`,
              }))}
              fill
              color="var(--color-gold)"
              stack={{ color: "var(--color-devil-bright)" }}
              chartLabel="Manchester United late goal share by decade, split into regulation and stoppage time"
              yTickSuffix="%"
              baseline={{ value: 100 / 18 }}
            />
          </div>
          <p className="text-xs text-ink-faint mt-1">
            <span className="inline-flex items-center gap-1 align-middle"><span className="inline-block h-2 w-2 rounded-sm" style={{ background: "var(--color-gold)" }} /> last 5 min (86–90)</span>
            {" · "}
            <span className="inline-flex items-center gap-1 align-middle"><span className="inline-block h-2 w-2 rounded-sm" style={{ background: "var(--color-devil-bright)" }} /> stoppage (90+)</span>
            . Fergie time came back with a bang in the 1990s — and the 2020s went a step beyond, with double the added time stacking the red cap as high as the gold base.
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
  );
}

function ComebacksModule({ variant }: ModuleProps) {
  const meta = getMeta();
  const cb = comebacks(6);
  return (
    <Module
      slug="comebacks"
      variant={variant}
      finding={`Of ${fmtNum(cb.summary.replayable)} matches the record lets us replay minute by minute, United fell behind in ${fmtNum(cb.summary.fellBehind)} — and still avoided defeat in ${fmtNum(cb.summary.recovered)} of them, ${fmtNum(cb.summary.wonFromBehind)} turned all the way around into wins. ${fmtNum(cb.summary.twoPlusRecovered)} times they trailed by two or more and did not lose.`}
      slice="Official matches whose goals all carry a minute; a match counts as 'behind' whenever United's running score fell below the opponent's. The deepest comebacks are wins after trailing by two goals or more."
      coverage={`${fmtNum(cb.summary.replayable)} of ${fmtNum(Number(meta.matches))} matches have minute-complete goals, so a fightback can be verified; minute data thins before the 1990s, so older recoveries are under-counted.`}
    >
      <div className="grid items-stretch gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-line bg-panel-2 px-5 py-4 text-center">
          <div className="stat-num text-4xl font-semibold leading-none text-win">{fmtNum(cb.summary.recovered)}</div>
          <div className="mx-auto mt-1.5 max-w-36 text-[11px] uppercase tracking-wider text-ink-faint">
            rescued after falling behind
          </div>
        </div>
        <div className="rounded-lg border border-line bg-panel-2 px-5 py-4 text-center">
          <div className="stat-num text-4xl font-semibold leading-none text-gold">{fmtNum(cb.summary.wonFromBehind)}</div>
          <div className="mx-auto mt-1.5 max-w-36 text-[11px] uppercase tracking-wider text-ink-faint">
            turned right around into wins
          </div>
        </div>
        <div className="rounded-lg border border-line bg-panel-2 px-5 py-4 text-center">
          <div className="stat-num text-4xl font-semibold leading-none text-devil-bright">{fmtNum(cb.summary.twoPlusRecovered)}</div>
          <div className="mx-auto mt-1.5 max-w-36 text-[11px] uppercase tracking-wider text-ink-faint">
            saved from two or more down
          </div>
        </div>
      </div>
      {cb.deepest.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-medium text-ink-dim">The deepest fightbacks — won after trailing by two or more</h3>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {cb.deepest.map((g) => (
              <Link
                key={g.id}
                href={`/match/${g.id}`}
                className="group rounded-lg border border-line bg-panel px-4 py-3 transition-colors hover:border-devil/60"
              >
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-wide text-devil-bright">
                    {g.deficit} goals down
                  </span>
                  <span className="text-[10px] uppercase tracking-wide text-win">won</span>
                </div>
                <div className="truncate font-medium group-hover:text-devil-bright">
                  <span className="text-ink-faint">{venuePrefix(g.venue)}</span> {g.opponent_name}
                </div>
                <div className="stat-num mt-0.5 text-xs text-ink-dim">Recovered to win {g.gf}–{g.ga}</div>
                <div className="stat-num mt-0.5 text-[11px] text-ink-faint">{fmtDate(g.date)} · {g.season}</div>
              </Link>
            ))}
          </div>
        </div>
      )}
      <EvidenceLink href="/matches" label="Browse every match →" />
    </Module>
  );
}

function RunsModule({ variant }: ModuleProps) {
  const streaks = clubStreaks(5);
  const streakGroups: StreakGroup[] = [
    { kind: "unbeaten", title: "Unbeaten", figureNoun: "without defeat", tone: "win", runs: streaks.unbeaten },
    { kind: "winning", title: "Winning", figureNoun: "wins in a row", tone: "gold", runs: streaks.winning },
    { kind: "scoring", title: "Scoring", figureNoun: "matches scoring", tone: "gold", runs: streaks.scoring },
    { kind: "cleansheet", title: "Clean sheets", figureNoun: "without conceding", tone: "win", runs: streaks.cleansheet },
  ];
  const longestUnbeaten = streaks.unbeaten[0];
  const longestWinning = streaks.winning[0];
  const longestScoring = streaks.scoring[0];
  const longestClean = streaks.cleansheet[0];
  return (
    <Module
      slug="runs"
      variant={variant}
      finding={`The longest United have ever gone unbeaten in official football is ${fmtNum(longestUnbeaten?.length ?? 0)} matches (${longestUnbeaten ? `${fmtMonthYear(longestUnbeaten.from)} – ${fmtMonthYear(longestUnbeaten.to)}` : "—"}); the longest run of straight wins is ${fmtNum(longestWinning?.length ?? 0)}. They have scored in as many as ${fmtNum(longestScoring?.length ?? 0)} consecutive matches and kept ${fmtNum(longestClean?.length ?? 0)} clean sheets in a row.`}
      slice="Consecutive official matches (friendlies and wartime excluded), in date order. 'Unbeaten' counts wins and draws; 'scoring' counts any match United scored in; 'clean sheet' counts matches without conceding. Each run links to the matches behind it."
    >
      <StreakBoard groups={streakGroups} />
      <EvidenceLink href="/matches?sort=oldest" label="Browse the record in order →" />
    </Module>
  );
}

function BogeySidesModule({ variant }: ModuleProps) {
  const bogeys = bogeyOpponents(20, 10);
  return (
    <Module
      slug="bogey-sides"
      variant={variant}
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
      <EvidenceLink href="/opponents" label="Every head-to-head record →" />
    </Module>
  );
}

function ManagerBounceModule({ variant }: ModuleProps) {
  const bounce = managerBounce();
  const bounceUp = bounce.filter((b) => b.first10.w > b.prev10.w).length;
  return (
    <Module
      slug="manager-bounce"
      variant={variant}
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
  );
}

function FortressModule({ variant }: ModuleProps) {
  const leadHeld = leadHeldAtHome();
  const otDecades = oldTraffordByDecade();
  const otRecord = otDecades.reduce((a, d) => ({ p: a.p + d.p, w: a.w + d.w }), { p: 0, w: 0 });
  const leadDraws = leadHeld.games.filter((g) => g.result === "D");
  // The leads actually lost, and the unbeaten run since the last of them. Minute
  // data now reaches back far enough to surface old defeats from a half-time lead,
  // so the honest record is "unbeaten since 1984", not "never lost".
  const leadLosses = leadHeld.games.filter((g) => g.result === "L");
  const lastLoss = leadLosses[leadLosses.length - 1];
  const unbeatenSince = lastLoss
    ? { run: leadHeld.games.length - 1 - leadHeld.games.findIndex((g) => g.id === lastLoss.id), from: lastLoss.date }
    : { run: leadHeld.games.length, from: leadHeld.from };
  // Closest calls — the surrendered leads, ranked by how near defeat came (deepest
  // second-half deficit, then biggest scoreline), shown chronologically.
  const closeCalls = [...leadDraws]
    .sort((a, b) => a.worst - b.worst || b.ga - a.ga || b.date.localeCompare(a.date))
    .slice(0, 5)
    .sort((a, b) => a.date.localeCompare(b.date));
  const closeCallRank = new Map(closeCalls.map((g, i) => [g.id, i + 1]));
  const leadDots: LeadDot[] = leadHeld.games.map((g) => {
    const outcome = g.result === "W" ? `won ${g.gf}–${g.ga}` : g.result === "L" ? `lost ${g.gf}–${g.ga}` : `drew ${g.gf}–${g.ga}`;
    const note = g.result === "L" ? " (lead lost)" : g.worst < 0 ? " (fell behind, rescued)" : g.result === "D" ? " (lead surrendered)" : "";
    return {
      result: g.result as LeadDot["result"],
      surrendered: g.result === "D",
      rank: closeCallRank.get(g.id),
      title: `${fmtDate(g.date)} — ${outcome} v ${g.opponent_name}${note}`,
    };
  });
  return (
    <Module
      slug="fortress"
      variant={variant}
      finding={
        lastLoss
          ? `Take a lead into half-time at Old Trafford and recent history says you keep it: United have not lost a home league game led at the break since ${fmtDate(lastLoss.date)} — ${fmtNum(unbeatenSince.run)} of them and counting. Across the full reconstructed record of ${fmtNum(leadHeld.games.length)} such games (${leadHeld.from.slice(0, 4)}–${leadHeld.to.slice(0, 4)}) United won ${fmtNum(leadHeld.w)} and drew ${fmtNum(leadHeld.d)}; the lead was lost just ${fmtNum(leadLosses.length)} times.`
          : `Take a lead into half-time at Old Trafford and the record says you keep it. Across the ${fmtNum(leadHeld.games.length)} home league games we can place where United led at the break, ${leadHeld.from.slice(0, 4)}–${leadHeld.to.slice(0, 4)}, they won ${fmtNum(leadHeld.w)}, drew ${fmtNum(leadHeld.d)}, and lost none.`
      }
      slice="Old Trafford home league games where United led at half-time, the half-time score reconstructed from minute-stamped goal events. Restricted to matches whose goals all carry a minute, so it is the verifiable part of the record rather than a single continuous run."
      coverage={`Half-time scores only reconstruct where every goal has a recorded minute, so these ${fmtNum(leadHeld.games.length)} games are a sample, not a sequence. Opta, working from complete half-time data, puts the current unbeaten run at 400 home league games led at half-time — W365 D35 — back to August 1984.`}
    >
      <div className="grid items-stretch gap-3 sm:grid-cols-[auto_1fr]">
        <div className="rounded-lg border border-line bg-panel-2 px-6 py-4 text-center">
          <div className="stat-num text-5xl font-semibold leading-none text-win">{fmtNum(unbeatenSince.run)}</div>
          <div className="mx-auto mt-1.5 max-w-32 text-[11px] uppercase tracking-wider text-ink-faint">
            led at the break and unbeaten since {unbeatenSince.from.slice(0, 4)}
          </div>
        </div>
        <div className="flex items-center text-sm text-ink-dim sm:px-2">
          <span>
            <span className="text-ink">Won {fmtNum(leadHeld.w)}, drawn {fmtNum(leadHeld.d)}, lost {fmtNum(leadLosses.length)}</span>{" "}
            across the {fmtNum(leadHeld.games.length)} home league games we can place where United led at the break.
            {lastLoss ? ` The lead was last lost on ${fmtDate(lastLoss.date)} — and not once in the ${fmtNum(unbeatenSince.run)} such games since.` : ""}{" "}
            Opta, working from complete half-time data, dates the unbeaten run to 400 such games, back to August 1984.
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
            <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: "var(--color-loss)" }} /> lead lost — {fmtNum(leadLosses.length)} times, the last in {lastLoss ? lastLoss.date.slice(0, 4) : "—"}
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
  );
}

function CupSpecialistsModule({ variant }: ModuleProps) {
  const meta = getMeta();
  const specialists = cupSpecialists(25, 10);
  const cupBaseline = cupGoalShareBaseline();
  const topCupLean = specialists[0];
  return (
    <Module
      slug="cup-specialists"
      variant={variant}
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
  );
}

function OwnGoalsModule({ variant }: ModuleProps) {
  const ogSummary = ownGoalSummary();
  const ogScorers = ownGoalScorers();
  const ogRepeat = ogScorers.filter((s) => s.n > 1);
  const ogRank = topScorers(12).findIndex((p) => p.player_id === "own-goal") + 1;
  return (
    <Module
      slug="own-goals"
      variant={variant}
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
  );
}

function AwayDaysModule({ variant }: ModuleProps) {
  const footprint = awayFootprint();
  const travelSeasons = travelBySeason();
  const travelCov = travelCoverage();
  const domestic = footprint.filter((v) => v.european === 0);
  const european = footprint.filter((v) => v.european > 0);
  const farthest = [...footprint].sort((a, b) => b.km - a.km)[0];
  return (
    <Module
      slug="away-days"
      variant={variant}
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
  );
}

/** Slug → rendered evidence module, the counterpart to the `QUESTIONS` registry. */
export const QUESTION_COMPONENTS: Record<string, (props: ModuleProps) => React.ReactNode> = {
  "late-goals": LateGoalsModule,
  comebacks: ComebacksModule,
  runs: RunsModule,
  "bogey-sides": BogeySidesModule,
  "manager-bounce": ManagerBounceModule,
  fortress: FortressModule,
  "cup-specialists": CupSpecialistsModule,
  "own-goals": OwnGoalsModule,
  "away-days": AwayDaysModule,
};
