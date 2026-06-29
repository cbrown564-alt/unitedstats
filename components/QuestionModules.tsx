import Link from "next/link";
import {
  comebacks, cupGoalShareBaseline, cupSpecialists, goalMinuteRidge,
  iconicLateWinners, lateGoalShareByDecade, leadHeldAtHome,
  managerBounce, oldTraffordByDecade, timedGoalCounts,
  eraRecord, FERGUSON_END, topFlightFinishes, titlesInRange,
  managerPpgRanking, trebleRuns, trebleDeciders, trebleSemis,
  europeByDecade, europeanFinals,
  matchesSequence,
} from "@/lib/trails";
import { ERA_CATALOGUE, eraFinishes } from "@/lib/compare";
import { clubStreaks } from "@/lib/streaks";
import { StreakBoard, type StreakGroup } from "@/components/StreakBoard";
import { getMeta, managerHonours, ownGoalScorers, ownGoalSummary, topScorers, eventsForMatch } from "@/lib/queries";
import { awayFootprint, travelBySeason, travelCoverage, MANCHESTER } from "@/lib/spatial";
import { BRITAIN_LAND, EUROPE_LAND } from "@/lib/geo/land";
import { InspectableBarChartLazy as InspectableBarChart } from "@/components/charts/lazy";
import { EraSkylineChartLazy as EraSkylineChart } from "@/components/charts/lazy";
import { MinuteColumns } from "@/components/charts/MinuteColumns";
import { LeadHeldDotplot, type LeadDot } from "@/components/charts/LeadHeldDotplot";
import { ResultSpine } from "@/components/charts/ResultSpine";
import { MatchFlow } from "@/components/MatchFlow";
import { InspectableTimeSeriesChartLazy as InspectableTimeSeriesChart } from "@/components/charts/lazy";
import { SlopeCompare } from "@/components/charts/SlopeCompare";
import { DataTable } from "@/components/DataTable";
import { GeoScatter } from "@/components/GeoScatter";
import { MatchList } from "@/components/MatchList";
import { CupLeanBar } from "@/components/charts/CupLeanBar";
import { WdlBar } from "@/components/WdlBar";
import { TrophyIcon, TROPHY_CAT_TONE } from "@/components/CampaignIcons";
import { PlayerPortrait } from "@/components/PlayerPortrait";
import { EvidenceLink } from "@/components/EvidenceLink";
import { AnswerThread, type ThreadStation } from "@/components/AnswerThread";
import { ShareCite } from "@/components/ShareCite";
import { questionBySlug } from "@/lib/questions";
import { fmtDate, fmtMonthYear, fmtNum, pct, venuePrefix } from "@/lib/format";

const BRITAIN: [number, number, number, number] = [49.8, 56.3, -7.6, 2.3];
const EUROPE: [number, number, number, number] = [34, 61.5, -11, 36];

/** "index" renders inside the /questions catalogue; "canonical" is the module's own page. */
type ModuleVariant = "index" | "canonical";
type ModuleProps = { variant?: ModuleVariant };

/** The thread's destination: where "follow the red thread to every match behind
 *  the answer" lands. Rendered as the final station — a full-width arrival panel
 *  rather than a floating pill — stating the size of the record behind the answer
 *  where we know it, so the page's most important node carries real weight. */
function MatchesArrival({
  href, label, count, countNoun,
}: {
  href: string;
  label?: string;
  count?: number;
  countNoun?: string;
}) {
  // Labels carry their own trailing arrow; strip it so the animated chevron isn't doubled.
  const action = (label ?? "Show the matches behind this").replace(/\s*→\s*$/, "");
  return (
    <Link
      href={href}
      className="group flex items-center gap-4 rounded-lg border border-line bg-panel-2 px-5 py-4 transition-colors hover:border-devil/60 focus-ring"
    >
      <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-devil-bright ring-4 ring-devil-bright/15" aria-hidden />
      <span className="min-w-0 flex-1">
        <span className="block text-base font-medium text-ink group-hover:text-devil-bright">{action}</span>
        <span className="mt-0.5 block text-xs text-ink-dim">
          {count != null ? (
            <><span className="stat-num text-ink-dim">{fmtNum(count)}</span> {countNoun ?? "matches"} behind this answer</>
          ) : (
            "The full record behind this answer"
          )}
        </span>
      </span>
      <span className="shrink-0 text-ink-faint transition-transform group-hover:translate-x-0.5 group-hover:text-devil-bright" aria-hidden>
        →
      </span>
    </Link>
  );
}

/**
 * Shared answer-page anatomy in two forms.
 *
 * The **catalogue** form (`variant="index"`) is a compact panel — question,
 * finding, evidence, a matches link, and the slice/coverage footnotes — so many
 * questions can stack and be skimmed.
 *
 * The **canonical** form is the answer rebuilt as a thread: the question is the
 * page title, and the argument runs down a red {@link AnswerThread} spine through
 * its stations — answer, evidence, definition, coverage, and finally the matches
 * the answer rests on — each given real vertical room so the scroll genuinely
 * travels the stages. Definition and coverage are promoted from footnotes to
 * readable sections, which is where the trust lives; the matches come last so the
 * spine fills all the way down and literally terminates at "every match behind the
 * answer", the brand promise made structural. Each station keeps a stable
 * `${slug}-*` id so an answer's stages stay deep-linkable and citable.
 */
function Module({
  slug, finding, slice, coverage, evidence, variant = "canonical", visual, children,
}: {
  slug: string;
  finding: string;
  slice: string;
  coverage?: string;
  evidence?: { href: string; label?: string; count?: number; countNoun?: string };
  variant?: ModuleVariant;
  /** Optional visual payoff rendered before the prose answer (maps, charts). */
  visual?: React.ReactNode;
  children: React.ReactNode;
}) {
  const question = questionBySlug(slug)?.question ?? slug;

  if (variant === "index") {
    return (
      <section id={slug} className="border border-line rounded-lg bg-panel p-5 sm:p-6 scroll-mt-28 space-y-5">
        <header className="flex items-start justify-between gap-4">
          <div className="min-w-0 space-y-4">
            <h2 className="display text-balance text-2xl">{question}</h2>
            {visual}
            <p className="text-sm text-ink-dim text-pretty">{finding}</p>
          </div>
          <Link
            href={`/questions/${slug}`}
            aria-label={`Open ${question} as its own page`}
            className="shrink-0 rounded-md border border-line px-2 py-1 text-xs text-ink-dim transition-colors hover:border-devil/60 hover:text-ink focus-ring"
          >
            Open ↗
          </Link>
        </header>
        <div className="space-y-5">
          {children}
          {evidence && <EvidenceLink href={evidence.href} label={evidence.label} />}
        </div>
        <footer className="border-t border-line pt-3 flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
          <div className="text-xs text-ink-dim space-y-1 min-w-0">
            <p><span className="text-ink-dim">Slice:</span> {slice}</p>
            {coverage && <p><span className="text-ink-dim">Coverage:</span> {coverage}</p>}
          </div>
          <ShareCite path={`/questions/${slug}`} title={question} />
        </footer>
      </section>
    );
  }

  const stations: ThreadStation[] = [
    ...(visual
      ? [{
          id: `${slug}-visual`,
          label: "The map",
          node: visual,
        }]
      : []),
    {
      id: `${slug}-answer`,
      label: "Answer",
      node: <p className="text-lg leading-relaxed text-ink text-pretty sm:text-xl">{finding}</p>,
    },
    {
      id: `${slug}-evidence`,
      label: "The evidence",
      node: <div className="space-y-6">{children}</div>,
    },
    {
      id: `${slug}-definition`,
      label: "Definition",
      node: <p className="text-sm leading-6 text-ink-dim text-pretty">{slice}</p>,
    },
    ...(coverage
      ? [{
          id: `${slug}-coverage`,
          label: "Coverage",
          node: <p className="text-sm leading-6 text-ink-dim text-pretty">{coverage}</p>,
        }]
      : []),
    ...(evidence
      ? [{
          id: `${slug}-matches`,
          label: "The matches",
          node: <MatchesArrival href={evidence.href} label={evidence.label} count={evidence.count} countNoun={evidence.countNoun} />,
        }]
      : []),
  ];

  return (
    <article id={slug} className="scroll-mt-24 rounded-lg border border-line bg-panel p-5 sm:p-7">
      <header className="mb-8">
        <h1 className="display text-3xl text-balance sm:text-4xl">{question}</h1>
      </header>
      <AnswerThread stations={stations} />
      <div className="mt-6 flex justify-end border-t border-line pt-4">
        <ShareCite path={`/questions/${slug}`} title={question} />
      </div>
    </article>
  );
}

function LateGoalsModule({ variant }: ModuleProps) {
  const meta = getMeta();
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
      evidence={{ href: "/matches", label: "Browse every match →", count: Number(meta.matches), countNoun: "matches" }}
      variant={variant}
      finding={`Yes — and the proof is in normal time, not stoppage time. The last five minutes before the whistle (86–90) hold ${pct(overallLateShare.reg, overallLateShare.timed)} of all United goals, comfortably above the ${pct(5, 90)} an even spread would give. United were scoring late long before anyone gave it a name.`}
      slice="United goals with a recorded minute — penalties and own goals for included — grouped by decade, the post-85th window split between minutes 86–90 and stoppage time (90+, with added time folded into the final minute). Decades with fewer than 20 timed goals are hidden."
      coverage={`${fmtNum(timed.timed)} of ${fmtNum(timed.total)} recorded United goals carry a minute, and that data thins quickly before the 1990s. Stoppage-time goals are only separable where a source marks them "90+" — largely a modern convention — so the stoppage segment reads near zero in the early decades partly because it went unrecorded, not only because added time was shorter.`}
    >
      <div>
        <h3 className="text-sm font-medium mb-2 text-ink-dim">Across the 90 — when United’s goals land</h3>
        <MinuteColumns bins={ridge.bins} stoppage={ridge.stoppage} height={200} />
        <p className="text-xs text-ink-dim mt-1">
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
                valueLabel: `${Math.round((100 * d.late) / d.timed)}% after 85'`,
                meta: `${Math.round((100 * d.reg) / d.timed)}% last five minutes · ${Math.round((100 * d.stoppage) / d.timed)}% stoppage`,
                href: `/matches?from=${d.decade.slice(0, 4)}&to=${Number(d.decade.slice(0, 4)) + 9}`,
              }))}
              fill
              color="var(--color-gold)"
              stack={{ color: "var(--color-devil-bright)" }}
              chartLabel="Manchester United late goal share by decade, split between minutes 86-90 and stoppage time"
              yTickSuffix="%"
              baseline={{ value: 100 / 18 }}
            />
          </div>
          <p className="text-xs text-ink-dim mt-1">
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
    </Module>
  );
}

function ComebacksModule({ variant }: ModuleProps) {
  const meta = getMeta();
  const cb = comebacks(6);
  return (
    <Module
      slug="comebacks"
      evidence={{ href: "/matches", label: "Browse every match →", count: Number(meta.matches), countNoun: "matches" }}
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
    </Module>
  );
}

function RunsModule({ variant }: ModuleProps) {
  const meta = getMeta();
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
      evidence={{ href: "/matches?sort=oldest", label: "Browse the record in order →", count: Number(meta.matches), countNoun: "matches" }}
      variant={variant}
      finding={`The longest United have ever gone unbeaten in official football is ${fmtNum(longestUnbeaten?.length ?? 0)} matches (${longestUnbeaten ? `${fmtMonthYear(longestUnbeaten.from)}–${fmtMonthYear(longestUnbeaten.to)}` : "—"}); the longest run of straight wins is ${fmtNum(longestWinning?.length ?? 0)}. They have scored in as many as ${fmtNum(longestScoring?.length ?? 0)} consecutive matches and kept ${fmtNum(longestClean?.length ?? 0)} clean sheets in a row.`}
      slice="Consecutive official matches (friendlies and wartime excluded), in date order. 'Unbeaten' counts wins and draws; 'scoring' counts any match United scored in; 'clean sheet' counts matches without conceding. Each run links to the matches behind it."
    >
      <StreakBoard groups={streakGroups} />
    </Module>
  );
}

// ---- The decline -----------------------------------------------------------

function DeclineModule({ variant }: ModuleProps) {
  const ferg = eraRecord("1986-11-08", FERGUSON_END);
  const since = eraRecord("2013-05-20", "9999-12-31");
  const finishes = topFlightFinishes();
  const fergTitles = titlesInRange("1986-87", "2012-13");
  const sinceTitles = titlesInRange("2013-14", "2999-99");
  const sinceFinishes = finishes.filter((f) => f.season >= "2013-14");
  const avgFinish =
    sinceFinishes.length > 0
      ? (sinceFinishes.reduce((s, f) => s + f.position, 0) / sinceFinishes.length).toFixed(1)
      : "—";
  const worst = sinceFinishes.reduce((m, f) => Math.max(m, f.position), 0);
  const fergEra = ERA_CATALOGUE.find((e) => e.key === "ferguson")!;
  const afterEra = ERA_CATALOGUE.find((e) => e.key === "after")!;
  return (
    <Module
      slug="decline"
      evidence={{ href: `/matches?from=2013-05-20&sort=date-asc`, label: "Every match since Ferguson →", count: since.p, countNoun: "matches" }}
      variant={variant}
      finding={`In ${ferg.p.toLocaleString("en-GB")} official matches under Ferguson, United took ${ferg.ppg.toFixed(2)} points a game and won the title ${fergTitles} times. In the ${since.p.toLocaleString("en-GB")} since, the rate is ${since.ppg.toFixed(2)} a game, the average league finish is ${avgFinish}, the worst is ${worst ? ordinal(worst) : "—"} — and the title count is ${sinceTitles}.`}
      slice="Official matches only (friendlies and wartime excluded). Ferguson's reign is dated 8 Nov 1986 to 19 May 2013; everything after is the post-Ferguson era. Points per game restates every season on three-points terms so older campaigns are comparable."
      coverage="Result-level record — complete for every official match across both eras. No advanced metrics; the comparison leans on the record we hold in full, exactly as the data supports across decades."
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-line bg-panel-2 px-5 py-4">
          <div className="text-[11px] uppercase tracking-wider text-ink-faint">Ferguson era · 1986–2013</div>
          <div className="stat-num mt-2 text-3xl font-semibold text-gold">{ferg.ppg.toFixed(2)}<span className="text-base font-normal text-ink-dim"> ppg</span></div>
          <div className="stat-num mt-1 text-xs text-ink-dim">{ferg.w}W {ferg.d}D {ferg.l}L over {ferg.p.toLocaleString("en-GB")} matches · {fergTitles} titles</div>
        </div>
        <div className="rounded-lg border border-line bg-panel-2 px-5 py-4">
          <div className="text-[11px] uppercase tracking-wider text-ink-faint">Since Ferguson</div>
          <div className="stat-num mt-2 text-3xl font-semibold text-devil-bright">{since.ppg.toFixed(2)}<span className="text-base font-normal text-ink-dim"> ppg</span></div>
          <div className="stat-num mt-1 text-xs text-ink-dim">{since.w}W {since.d}D {since.l}L over {since.p.toLocaleString("en-GB")} matches · {sinceTitles} titles · avg finish {avgFinish}</div>
        </div>
      </div>
      <div>
        <h3 className="mb-2 text-sm font-medium text-ink-dim">League finishes — the two eras side by side</h3>
        <EraSkylineChart a={eraFinishes(fergEra)} b={eraFinishes(afterEra)} labelA="Ferguson era" labelB="Since Ferguson" />
        <p className="text-xs text-ink-dim mt-1">Each bar is one season&apos;s league finish — gold is a title, deep red a relegation or non-top-flight year. The top panel held the line for 27 years; the bottom one is where it drops away.</p>
      </div>
    </Module>
  );
}

// ---- Ferguson vs the field -------------------------------------------------

function FergusonModule({ variant }: ModuleProps) {
  const ranking = managerPpgRanking();
  const ferg = ranking.find((m) => m.id === "alex-ferguson")!;
  const honours = managerHonours();
  const fergTrophies = honours.filter((h) => h.manager_id === "alex-ferguson").reduce((s, h) => s + h.n, 0);
  const topTrophy = honours
    .reduce<Map<string, number>>((m, h) => m.set(h.manager_id, (m.get(h.manager_id) ?? 0) + h.n), new Map());
  const shown = ranking.slice(0, 8);
  return (
    <Module
      slug="ferguson"
      evidence={{ href: "/managers", label: "Every manager's full record →" }}
      variant={variant}
      finding={`Over ${ferg.p.toLocaleString("en-GB")} official matches and nearly 27 years, Ferguson took ${ferg.ppg.toFixed(2)} points a game and won ${fergTrophies} trophies — more than every other United manager combined has won since. No permanent manager before or since clears ${ferg.ppg.toFixed(2)} ppg over a real reign.`}
      slice="Permanent managers only (30+ official matches, so caretaker stints can't top a real reign), ranked by three-points-per-game. Trophies are top-flight titles plus major knockout cups won; each is attributed to the manager of the deciding match."
      coverage="Result-level record — complete for every official match under every manager. Points per game restates older reigns on three-points terms so the comparison travels across eras."
    >
      <div className="grid items-stretch gap-3 sm:grid-cols-[auto_1fr]">
        <div className="rounded-lg border border-line bg-panel-2 px-6 py-4 text-center">
          <div className="stat-num text-5xl font-semibold leading-none text-gold">{fergTrophies}</div>
          <div className="mx-auto mt-1.5 max-w-32 text-[11px] uppercase tracking-wider text-ink-faint">trophies in 27 years</div>
        </div>
        <div className="flex items-center text-sm text-ink-dim sm:px-2">
          <span>
            <span className="text-ink">{ferg.ppg.toFixed(2)} points per game</span> across {ferg.p.toLocaleString("en-GB")} matches — the highest of any United manager over a full reign. The bars below rank the rest by the same measure.
          </span>
        </div>
      </div>
      <div>
        <div className="mb-2 flex items-center justify-between text-[11px] text-ink-dim">
          <span>Points per game · permanent managers</span>
          <span className="stat-num">0–3 ppg →</span>
        </div>
        <InspectableBarChart
          data={shown.map((m) => ({
            label: m.name,
            tickLabel: surname(m.name),
            value: Math.round(m.ppg * 100) / 100,
            valueLabel: `${m.ppg.toFixed(2)} ppg`,
            meta: `${m.name} · ${m.p} matches · ${topTrophy.get(m.id) ?? 0} trophies`,
            href: `/manager/${m.id}`,
          }))}
          height={190}
          color="var(--color-panel-ink-faint)"
          highlightLabel="Sir Alex Ferguson"
          highlightColor="var(--color-gold)"
          chartLabel="Manchester United managers by points per game"
          yTickSuffix=""
        />
        <p className="text-xs text-ink-dim mt-1">Each bar is one manager&apos;s points-per-game over 30+ official matches. Ferguson&apos;s reign is the gold bar — the longest sustained peak in the club&apos;s history.</p>
      </div>
    </Module>
  );
}

// ---- The Treble ------------------------------------------------------------

function TrebleModule({ variant }: ModuleProps) {
  const season = "1998-99";
  const runs = trebleRuns(season).filter((r) => r.won);
  const deciders = trebleDeciders(season);
  const semis = trebleSemis(season);
  const seasonSeq = matchesSequence({ season });
  const overall = runs.reduce(
    (a, r) => ({ p: a.p + r.p, l: a.l + r.l }),
    { p: 0, l: 0 },
  );
  const first = deciders[0];
  const last = deciders[deciders.length - 1];
  const spanDays = first && last ? Math.round((Date.parse(last.date) - Date.parse(first.date)) / 86_400_000) : 0;
  const month = first ? new Date(`${first.date}T00:00:00`).toLocaleDateString("en-GB", { month: "long" }) : "";
  const year = first ? first.date.slice(0, 4) : "";
  const shortDate = (d: string) => fmtDate(d).replace(/\s*\d{4}$/, "");
  const runTypeById = new Map(runs.map((r) => [r.competition_id, r.type]));
  const spineMarkers = deciders.map((d) => ({
    id: d.id,
    label: `${d.competition_name} won — ${shortDate(d.date)}`,
    tone: TROPHY_CAT_TONE[runTypeById.get(d.competition_id) ?? "league"],
  }));
  return (
    <Module
      slug="treble"
      evidence={{ href: `/matches?season=${season}`, label: "Every match of 1998-99 →", count: seasonSeq.length, countNoun: "matches" }}
      variant={variant}
      visual={
        <div className="space-y-1.5">
          <div className="text-[11px] uppercase tracking-wider text-ink-faint">
            All {seasonSeq.length} matches of 1998-99 — wins above the line, losses below
          </div>
          <ResultSpine matches={seasonSeq} markers={spineMarkers} height={120} subject="Manchester United 1998-99" markerGlyph={<TrophyIcon className="h-4 w-4" />} xLabel="month" />
        </div>
      }
      finding={`United played ${overall.p} matches across the three competitions and lost just ${overall.l} — then became the first English club to hold the league, the FA Cup and the European Cup at the same time. All three were won inside ${spanDays} days in ${month} ${year}, the last of them in stoppage time.`}
      slice="Every match of 1998-99 is in the timeline up top. The matches below show who scored and when in the decisive games."
      coverage="Every goal. Every match. One glorious season."
    >
      <section className="space-y-3">
        <div>
          <h3 className="text-sm font-medium text-ink-dim">{spanDays} days in {month}</h3>
          <p className="mt-0.5 text-xs text-ink-dim">
            Three trophies settled in ten days — two wins after going behind, the last with two iconic goals in stoppage time.
          </p>
        </div>
        <div className="space-y-3">
          {deciders.map((d) => {
            const ev = eventsForMatch(d.id);
            const unitedGoals = ev.filter((e) => e.type === "goal" || e.type === "pen-goal" || e.type === "own-goal-for");
            const opponentGoals = ev.filter((e) => e.type === "opp-goal" || e.type === "own-goal-against");
            const hasTimed = unitedGoals.some((g) => g.minute != null) || opponentGoals.some((g) => g.minute != null);
            const crowned = d.wonInStoppage;
            const tone = TROPHY_CAT_TONE[runTypeById.get(d.competition_id) ?? "league"];
            return (
              <div
                key={d.id}
                className={`group relative overflow-hidden rounded-lg border bg-panel-2 p-4 transition-colors ${crowned ? "border-gold/35 shadow-[0_14px_36px_-18px_rgba(0,0,0,0.75)] hover:border-gold/55" : "border-line hover:border-devil/60"}`}
              >
                {crowned && (
                  <span
                    aria-hidden
                    className="pointer-events-none absolute -right-16 -top-20 h-44 w-44 rounded-full opacity-[0.13] blur-3xl"
                    style={{ backgroundColor: "var(--color-gold)" }}
                  />
                )}
                <div className="relative">
                  <Link href={`/match/${d.id}`} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                    <span className="flex items-center gap-1.5 text-sm">
                      <span className="stat-num text-ink-faint">{shortDate(d.date)}</span>
                      <span className="text-ink-faint">·</span>
                      <span aria-hidden className="inline-flex shrink-0" style={{ color: tone }}>
                        <TrophyIcon className="h-3.5 w-3.5" />
                      </span>
                      <span className="font-medium group-hover:text-devil-bright">{d.competition_name}</span>
                    </span>
                    <span className="flex items-center gap-2 text-sm">
                      <span className="text-ink-faint">{venuePrefix(d.venue)}</span>
                      <span className="font-medium text-ink group-hover:text-devil-bright">{d.opponent_name}</span>
                      <span className={`stat-num font-semibold tabular-nums ${crowned ? "text-gold" : "text-ink"}`}>
                        {d.gf}<span className="mx-px text-ink-faint">–</span>{d.ga}
                      </span>
                    </span>
                  </Link>
                  <div className="mt-3.5">
                    {hasTimed ? (
                      <MatchFlow unitedGoals={unitedGoals} opponentGoals={opponentGoals} aet={!!d.aet} />
                    ) : d.goals.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {d.goals.map((g, j) => (
                          <span
                            key={j}
                            className={`stat-num rounded px-1.5 py-0.5 text-[11px] ${g.stoppage ? "bg-gold/20 text-gold" : "bg-panel text-ink-dim"}`}
                          >
                            {g.minute}{g.added ? `+${g.added}` : ""}′ {g.scorer ? surname(g.scorer) : "goal"}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                  {crowned && (
                    <p className="mt-3 text-xs text-gold/90">
                      Trailed from the sixth minute — then scored twice after the 90th. No European Cup final had ever been turned around so late.
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {semis.length > 0 && (
        <section className="space-y-3">
          <div>
            <h3 className="text-sm font-medium text-ink-dim">How it was forged — two semi-final nights</h3>
            <p className="mt-0.5 text-xs text-ink-dim">
              The Treble nearly never was. Both semi-finals turned on comebacks — one from two goals down in Turin, one in extra time at Villa Park.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {semis.map((s) => {
              const ev = eventsForMatch(s.id);
              const unitedGoals = ev.filter((e) => e.type === "goal" || e.type === "pen-goal" || e.type === "own-goal-for");
              const opponentGoals = ev.filter((e) => e.type === "opp-goal" || e.type === "own-goal-against");
              const hasTimed = unitedGoals.some((g) => g.minute != null) || opponentGoals.some((g) => g.minute != null);
              return (
                <div key={s.id} className="group rounded-lg border border-line bg-panel-2 p-4 transition-colors hover:border-devil/60">
                  <Link href={`/match/${s.id}`} className="block">
                    <div className="flex items-baseline justify-between gap-x-2">
                      <span className="text-sm font-medium group-hover:text-devil-bright">{s.competition_name}</span>
                      <span className="stat-num text-[11px] text-ink-faint">{shortDate(s.date)}</span>
                    </div>
                    <div className="mt-1 flex items-baseline gap-2 text-sm">
                      <span className="text-ink-faint">{venuePrefix(s.venue)}</span>
                      <span className="font-medium text-ink group-hover:text-devil-bright">{s.opponent_name}</span>
                      <span className="stat-num font-semibold tabular-nums">{s.gf}<span className="mx-px text-ink-faint">–</span>{s.ga}</span>
                      {s.aet ? <span className="stat-num text-[11px] text-ink-faint">AET</span> : null}
                    </div>
                  </Link>
                  <div className="mt-3.5 border-t border-line pt-3.5">
                    {hasTimed ? (
                      <MatchFlow unitedGoals={unitedGoals} opponentGoals={opponentGoals} aet={!!s.aet} />
                    ) : (
                      <div className="space-y-1">
                        {s.goals.map((g, j) => (
                          <div key={j} className="flex items-center gap-2 text-[11px]">
                            <span className={`inline-block h-1.5 w-1.5 shrink-0 rounded-full ${g.side === "united" ? "bg-win" : "bg-loss"}`} />
                            <span className={`stat-num tabular-nums ${g.side === "united" ? "text-ink" : "text-ink-faint"}`}>
                              {g.minute}{g.added ? `+${g.added}` : ""}′
                            </span>
                            <span className={g.side === "united" ? "text-ink-dim" : "text-ink-faint"}>
                              {g.scorer ? surname(g.scorer) : g.side === "opponent" ? "" : "goal"}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {s.deficit >= 2 && (
                    <p className="mt-2.5 text-xs text-ink-dim">
                      Trailed by {s.deficit} after eleven minutes — came back to win.
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      <section>
        <h3 className="mb-2 text-sm font-medium text-ink-dim">Three runs, one season</h3>
        <div className="grid gap-3 sm:grid-cols-3">
          {runs.map((r) => (
            <Link
              key={r.competition_id}
              href={`/matches?season=${season}`}
              className="group rounded-lg border border-line bg-panel-2 p-4 hover:border-devil/60"
            >
              <div className="flex items-center gap-2">
                <span aria-hidden className="inline-flex shrink-0" style={{ color: TROPHY_CAT_TONE[r.type] }}>
                  <TrophyIcon className="h-4 w-4" />
                </span>
                <span className="text-sm font-medium group-hover:text-devil-bright">{r.competition_name}</span>
                {r.position ? <span className="stat-num ml-auto text-[11px] text-ink-faint">finished {ordinal(r.position)}</span> : null}
              </div>
              <div className="mt-3">
                <WdlBar w={r.w} d={r.d} l={r.l} size="md" variant="stacked" showLabels />
              </div>
              <div className="stat-num mt-2.5 text-xs text-ink-faint">{r.p} played · {r.gf}<span className="mx-px">–</span>{r.ga} goals</div>
            </Link>
          ))}
        </div>
      </section>
    </Module>
  );
}

// ---- United in Europe ------------------------------------------------------

function EuropeModule({ variant }: ModuleProps) {
  const decades = europeByDecade();
  const finals = europeanFinals();
  const won = finals.filter((f) => f.won);
  const total = decades.reduce((a, d) => ({ p: a.p + d.p, w: a.w + d.w, d: a.d + d.d, l: a.l + d.l }), { p: 0, w: 0, d: 0, l: 0 });
  return (
    <Module
      slug="europe"
      evidence={{ href: "/matches?type=european", label: "Every European match →", count: total.p, countNoun: "matches" }}
      variant={variant}
      finding={`From the Busby Babes' first European night in 1956 to today, United have played ${total.p.toLocaleString("en-GB")} continental matches, won ${pct(total.w, total.p)} of them, and reached ${finals.length} major finals — lifting the trophy in ${won.length} of them.`}
      slice="European competition only (European Cup, Champions League, Cup Winners' Cup, UEFA Cup/Europa League, Inter-Cities Fairs Cup, and the UEFA Super Cup), grouped by decade. Finals are the one-off deciding match of each European campaign."
      coverage="Result-level record — every European match held in full. Decade buckets carry the wins, draws and losses; finals name the trophy, the opponent and the night."
    >
      <div className="grid items-stretch gap-3 sm:grid-cols-[auto_1fr]">
        <div className="rounded-lg border border-line bg-panel-2 px-6 py-4 text-center">
          <div className="stat-num text-5xl font-semibold leading-none text-gold">{won.length}</div>
          <div className="mx-auto mt-1.5 max-w-32 text-[11px] uppercase tracking-wider text-ink-faint">European trophies won</div>
        </div>
        <div className="flex items-center text-sm text-ink-dim sm:px-2">
          <span>
            <span className="text-ink">{finals.length} finals reached</span> across six decades — won {won.length}, lost {finals.length - won.length}. The European Cup/Champions League accounts for {finals.filter((f) => f.competition_name.includes("Champions League") || f.competition_name === "European Cup").length} of those finals.
          </span>
        </div>
      </div>
      <div>
        <h3 className="mb-2 text-sm font-medium text-ink-dim">European record by decade</h3>
        <InspectableBarChart
          data={decades.map((d) => ({
            label: d.decade,
            tickLabel: d.decade.slice(2),
            value: d.w,
            value2: d.d,
            valueLabel: `${d.w}W ${d.d}D ${d.l}L`,
            meta: `${d.decade} · ${d.p} matches · ${d.gf}–${d.ga} goals`,
            href: `/matches?type=european&from=${d.decade.slice(0, 4)}&to=${Number(d.decade.slice(0, 4)) + 9}`,
          }))}
          fill
          color="var(--color-win)"
          stack={{ color: "var(--color-ink-faint)" }}
          chartLabel="Manchester United European wins and draws by decade"
        />
        <p className="text-xs text-ink-dim mt-1">
          <span className="inline-flex items-center gap-1 align-middle"><span className="inline-block h-2 w-2 rounded-sm" style={{ background: "var(--color-win)" }} /> wins</span>
          {" · "}
          <span className="inline-flex items-center gap-1 align-middle"><span className="inline-block h-2 w-2 rounded-sm" style={{ background: "var(--color-ink-faint)" }} /> draws</span>
          . The 2000s peak is the Ferguson Champions League years; the 1970s dip is the post-Busby wilderness.
        </p>
      </div>
      {finals.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-medium text-ink-dim">Every European final — won and lost</h3>
          <div className="grid gap-2 sm:grid-cols-2">
            {finals.map((f) => (
              <Link key={f.id} href={`/match/${f.id}`} className="group flex items-center gap-3 rounded-lg border border-line bg-panel px-4 py-3 hover:border-devil/60">
                <span className={`stat-num flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${f.won ? "bg-gold/15 text-gold" : "border border-line text-ink-faint"}`}>
                  {f.won ? "W" : "L"}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium group-hover:text-devil-bright">{f.competition_name}</div>
                  <div className="stat-num text-[11px] text-ink-faint">{fmtDate(f.date)} · v {f.opponent_name}</div>
                </div>
                <span className="stat-num shrink-0 text-sm">{f.gf}–{f.ga}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </Module>
  );
}

function ManagerBounceModule({ variant }: ModuleProps) {
  const bounce = managerBounce();
  const bounceUp = bounce.filter((b) => b.first10.w > b.prev10.w).length;
  return (
    <Module
      slug="manager-bounce"
      evidence={{ href: "/managers", label: "Every manager's full record →" }}
      variant={variant}
      finding={`${bounceUp} of ${bounce.length} United managers won more of their first ten matches than the club managed in the ten before they arrived. Each line runs from the old form (hollow) to the new manager's start (solid) — the upward red lines are the real bounces.`}
      slice="Each manager's first 10 matches in charge versus the club's previous 10 matches (any manager), all competitions; managers with fewer than 10 matches, and the first manager on record, are excluded."
    >
      <div>
        <div className="mb-3 flex items-center justify-between text-[11px] text-ink-dim">
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
      evidence={{ href: "/matches?venue=H", label: "Every home match →" }}
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
        <div className="mb-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-ink-dim">
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
        <p className="text-xs text-ink-dim mt-1">
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
        <p className="text-xs text-ink-dim mt-1">Percent of Old Trafford home matches won, by decade.</p>
      </div>
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
      evidence={{ href: "/matches?type=cup", label: "Every cup match →" }}
      variant={variant}
      finding={`United score just ${pct(cupBaseline.cup, cupBaseline.total)} of their goals in cups — FA Cup, League Cup, Europe, and the one-off finals. These ten goalscorers all more than double that, ${topCupLean.name} most of all at ${(cupBaseline.share ? (topCupLean.cup_goals / topCupLean.total) / cupBaseline.share : 0).toFixed(1)}× the club rate.`}
      slice="Goals (excluding own goals) per player split league v cup by competition type, minimum 25 recorded goals, ranked by cup share. The multiplier is each player's cup share over the club-wide cup share."
      coverage={`Goalscorer attribution exists for ${fmtNum(Number(meta.matches_with_scorers))} of ${fmtNum(Number(meta.matches))} matches, weighted toward the post-war era — pre-war specialists may be under-counted.`}
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
            Of {fmtNum(cupBaseline.total)} recorded goals, just {fmtNum(cupBaseline.cup)} landed in a cup. So a goalscorer
            who hits the same rate is ordinary; the players below cleared{" "}
            <span className="text-gold">double the club’s {pct(cupBaseline.cup, cupBaseline.total)}</span> — they truly saved their goals for cup nights.
          </span>
        </div>
      </div>

      <div>
        <div className="mb-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-ink-dim">
          <span className="flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 rounded-sm bg-gold" /> cup goals</span>
          <span className="flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: "var(--color-panel-2)" }} /> league goals</span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-3 w-0.5 bg-devil-bright" /> club rate {pct(cupBaseline.cup, cupBaseline.total)}
          </span>
          <span className="ml-auto stat-num">× club rate →</span>
        </div>
        <CupLeanBar rows={specialists} baseline={cupBaseline.share} />
      </div>
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
      evidence={{ href: "/player/own-goal", label: "Every own goal for United →", count: ogSummary.total, countNoun: "own goals" }}
      variant={variant}
      finding={`Treat every own goal an opponent has turned into United's net as one goalscorer and the answer is yes: ${fmtNum(ogSummary.total)} of them${ogRank ? `, the ${ogRank === 5 ? "fifth" : `#${ogRank}`}-most in the club's history` : ""} — and spread so thin across ${fmtNum(ogSummary.scorers)} different players that no one has done it more than ${ogRepeat[0]?.n ?? 1} times.`}
      slice="Own goals credited to United (an opponent scoring into his own net), all official competitions, gathered under the synthetic goalscorer 'Own Goal'. The leaderboard counts only own goals with a recorded goalscorer."
      coverage={`${fmtNum(ogSummary.named)} of ${fmtNum(ogSummary.total)} own goals carry a named goalscorer; the remaining ${fmtNum(ogSummary.unknown)}, mostly pre-war, were recorded only as "own goal".`}
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
          {fmtDate(ogSummary.last)} — more than United legends like George Best managed in open play. “Own
          Goal” sits among the club’s leading goalscorers precisely because it belongs to no one.
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
  const countries = new Set(footprint.map((v) => v.country).filter(Boolean)).size;
  const totalKm = footprint.reduce((sum, v) => sum + v.km * v.p, 0);
  const travelVisual = (
    <>
      <div className="flex flex-wrap gap-2">
        {[
          { value: fmtNum(footprint.length), label: "away grounds" },
          { value: fmtNum(countries), label: countries === 1 ? "country" : "countries" },
          { value: `${fmtNum(Math.round(farthest.km))} km`, label: "farthest hop" },
          { value: `${Math.round(totalKm / 1000).toLocaleString()}k km`, label: "mapped travel" },
        ].map((chip) => (
          <div
            key={chip.label}
            className="rounded-full border border-line bg-panel-2 px-3 py-1.5 text-xs"
          >
            <span className="stat-num font-semibold text-ink">{chip.value}</span>
            <span className="ml-1.5 text-ink-faint">{chip.label}</span>
          </div>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div>
          <h3 className="mb-2 text-sm font-medium text-ink-dim">
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
          <h3 className="mb-2 text-sm font-medium text-ink-dim">
            European nights · {european.length} clubs
          </h3>
          <GeoScatter
            points={european.map((v) => ({ lat: v.lat, lng: v.lng, label: v.name, value: v.p }))}
            origin={{ ...MANCHESTER, label: "Manchester" }}
            bounds={EUROPE}
            land={EUROPE_LAND}
            labelTop={8}
            dotColor="var(--color-gold)"
            dotLabel="European away ground"
          />
        </div>
      </div>
    </>
  );
  return (
    <Module
      slug="away-days"
      evidence={{ href: "/matches?venue=A", label: "Every away match →", count: travelCov.total, countNoun: "away matches" }}
      variant={variant}
      visual={travelVisual}
      finding={`Across ${fmtNum(travelCov.covered)} mapped away matches, the trips run from short Lancashire hops to ${fmtNum(Math.round(farthest.km))} km at ${farthest.name}. Season travel steps up with the First Division's southern spread and European football from 1956.`}
      slice={`official away matches; one-way distance from Manchester to each opponent's home town, city level. Average trip per season, ${travelSeasons[0]?.season}–${travelSeasons[travelSeasons.length - 1]?.season}.`}
      coverage={`opponent home towns are mapped for ${fmtNum(travelCov.covered)} of ${fmtNum(travelCov.total)} official away matches.`}
    >
      <div>
        <h3 className="mb-2 text-sm font-medium text-ink-dim">Average away trip per season</h3>
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
    </Module>
  );
}

/** 1 → "1st", 2 → "2nd", 3 → "3rd", 4 → "4th". */
function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] ?? s[v] ?? s[0]}`;
}

/** Last token of a name, dropping honorifics — for compact manager bar labels. */
function surname(name: string): string {
  const parts = name.replace(/^(Sir|Dr\.?|Mr\.?)\s+/, "").split(" ");
  return parts[parts.length - 1] ?? name;
}

/** Slug → rendered evidence module, the counterpart to the `QUESTIONS` registry. */
export const QUESTION_COMPONENTS: Record<string, (props: ModuleProps) => React.ReactNode> = {
  decline: DeclineModule,
  ferguson: FergusonModule,
  treble: TrebleModule,
  europe: EuropeModule,
  "late-goals": LateGoalsModule,
  comebacks: ComebacksModule,
  runs: RunsModule,
  "manager-bounce": ManagerBounceModule,
  fortress: FortressModule,
  "cup-specialists": CupSpecialistsModule,
  "own-goals": OwnGoalsModule,
  "away-days": AwayDaysModule,
};
