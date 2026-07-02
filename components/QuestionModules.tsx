import Link from "next/link";
import {
  comebacks, cupGoalShareBaseline, cupSpecialists, goalMinuteRidge,
  annotatedLateGoals, lateGoalManagerEras, lateGoalScatter, lateGoalShareByDecade, leadHeldAtHome,
  managerBounce, oldTraffordByDecade, timedGoalCounts,
  eraRecord,
  fergusonFloorSummary, fergusonFloorTimeline, managerLongevityField, postFergusonFloorMoments,
  trebleDeciders, trebleSemis, trebleSummary,
  europeByDecade, europeWinRateTimeline, europeanFinals, europeMatchSequence,
  matchesSequence,
} from "@/lib/trails";
import { clubStreaks } from "@/lib/streaks";
import { StreakBoard, type StreakGroup } from "@/components/StreakBoard";
import { getMeta, matchesSummary, ownGoalScorers, ownGoalSummary, topScorers, eventsForMatch } from "@/lib/queries";
import { awayFootprint, travelBySeason, travelCoverage, MANCHESTER } from "@/lib/spatial";
import { BRITAIN_LAND, EUROPE_LAND } from "@/lib/geo/land";
import { InspectableBarChartLazy as InspectableBarChart, ManagerLongevityChartLazy as ManagerLongevityChart } from "@/components/charts/lazy";
import { TitleFloorTimeline } from "@/components/charts/TitleFloorTimeline";
import { FinishLadder } from "@/components/seasons/FinishLadder";
import { MinuteColumns } from "@/components/charts/MinuteColumns";
import { LateGoalScatter } from "@/components/charts/LateGoalScatter";
import { LeadHeldDotplot, type LeadDot } from "@/components/charts/LeadHeldDotplot";
import { ResultSpine } from "@/components/charts/ResultSpine";
import { MatchFlow } from "@/components/MatchFlow";
import { InspectableTimeSeriesChartLazy as InspectableTimeSeriesChart } from "@/components/charts/lazy";
import { EuropeFinalsTimeline } from "@/components/charts/EuropeFinalsTimeline";
import { SlopeCompare } from "@/components/charts/SlopeCompare";
import { BounceComparisonTable } from "@/components/manager/BounceComparisonTable";
import { GeoScatter } from "@/components/GeoScatter";
import { CupLeanBar } from "@/components/charts/CupLeanBar";
import { WdlBar } from "@/components/WdlBar";
import { TrophyIcon, TROPHY_CAT_TONE } from "@/components/CampaignIcons";
import { PlayerPortrait } from "@/components/PlayerPortrait";
import { EvidenceLink } from "@/components/EvidenceLink";
import { AnswerThread, type ThreadStation } from "@/components/AnswerThread";
import { ThreadBeatRow, ThreadUnderline, type ThreadBeat } from "@/components/ThreadBeatRow";
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
  slug, finding, slice, coverage, evidence, variant = "canonical", visual, visualLabel = "The map", children,
}: {
  slug: string;
  finding: string;
  slice: string;
  coverage?: string;
  evidence?: { href: string; label?: string; count?: number; countNoun?: string };
  variant?: ModuleVariant;
  /** Optional visual payoff rendered before the prose answer (maps, charts). */
  visual?: React.ReactNode;
  /** Eyebrow for the visual station on canonical pages. */
  visualLabel?: string;
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
          label: visualLabel,
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
      mobileAppendix: true,
      node: <p className="text-sm leading-6 text-ink-dim text-pretty">{slice}</p>,
    },
    ...(coverage
      ? [{
          id: `${slug}-coverage`,
          label: "Coverage",
          mobileAppendix: true,
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
    <article id={slug} className="relative scroll-mt-24 rounded-lg border border-line bg-panel p-5 sm:p-7">
      <div className="absolute right-4 top-4 z-10">
        <ShareCite path={`/questions/${slug}`} title={question} />
      </div>
      <header className="mb-8 pr-24">
        <h1 className="display text-3xl text-balance sm:text-4xl">{question}</h1>
      </header>
      <AnswerThread stations={stations} />
    </article>
  );
}

// ---- Late goals / Fergie time ------------------------------------------------

/** Fan-facing beat labels for the three nights on every United fan's list. */
function lateGoalBeatFanCopy(tag: string): { title: string; note: string } {
  switch (tag) {
    case "The original":
      return {
        title: "Sheffield Wednesday",
        note: "Bruce twice in stoppage time — where they started saying it.",
      };
    case "The Treble":
      return {
        title: "Barcelona",
        note: "Teddy, then Ole — the phrase at full volume.",
      };
    case "Since Ferguson":
      return {
        title: "Still happening",
        note: "McTominay twice after the 90th — the habit outlasted the manager.",
      };
    default:
      return { title: tag, note: "" };
  }
}

function LateGoalsModule({ variant }: ModuleProps) {
  const lateByDecade = lateGoalShareByDecade();
  const ridge = goalMinuteRidge();
  const timed = timedGoalCounts();
  const scatter = lateGoalScatter();
  const annotated = annotatedLateGoals();
  const eras = lateGoalManagerEras();
  const overallLateShare = lateByDecade.reduce(
    (a, d) => ({ timed: a.timed + d.timed, late: a.late + d.late, reg: a.reg + d.reg, stoppage: a.stoppage + d.stoppage }),
    { timed: 0, late: 0, reg: 0, stoppage: 0 },
  );
  const round1 = (n: number) => Math.round(n * 10) / 10;
  const evenSpread = pct(5, 90);
  const busby = eras.find((e) => e.label === "Busby");
  const between = eras.find((e) => e.label === "Between");
  const ferg = eras.find((e) => e.label === "Ferguson");
  const since = eras.find((e) => e.label === "Since Ferguson");
  const busbyLate = busby ? pct(busby.reg + busby.stoppage, busby.timed) : evenSpread;
  const betweenLate = between ? pct(between.reg + between.stoppage, between.timed) : evenSpread;
  const fergLate = ferg ? pct(ferg.reg + ferg.stoppage, ferg.timed) : evenSpread;
  const sinceLate = since ? pct(since.reg + since.stoppage, since.timed) : evenSpread;
  const shortDate = (d: string) => fmtDate(d).replace(/\s*\d{4}$/, "");
  const lateMatches = matchesSummary({ goalWindow: "late" });

  const signatureNights = annotated.length > 0 ? (
    <section className="space-y-3">
      <div>
        <h3 className="text-sm font-medium text-ink-dim">Three nights — coined, crowned, continued</h3>
        <p className="mt-0.5 text-xs text-ink-dim text-pretty">
          Where the phrase was born, where it became legend, and where it kept landing after Ferguson left — minute by minute.
        </p>
      </div>
      <div className="space-y-3">
        {annotated.map((a) => {
          const ev = eventsForMatch(a.matchId);
          const unitedGoals = ev.filter((e) => e.type === "goal" || e.type === "pen-goal" || e.type === "own-goal-for");
          const opponentGoals = ev.filter((e) => e.type === "opp-goal" || e.type === "own-goal-against");
          const hasTimed = unitedGoals.some((g) => g.minute != null) || opponentGoals.some((g) => g.minute != null);
          const crowned = a.tag === "The Treble" || a.tag === "The original";
          return (
            <div
              key={`${a.matchId}:${a.minute}:${a.added ?? 0}`}
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
                <Link href={`/match/${a.matchId}`} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                  <span className="flex items-center gap-2 text-sm">
                    <span className={`text-[10px] font-medium uppercase tracking-wide ${crowned ? "text-gold" : "text-devil-bright"}`}>
                      {a.tag}
                    </span>
                    <span className="stat-num text-ink-faint">{shortDate(a.date)}</span>
                  </span>
                  <span className="flex items-center gap-2 text-sm">
                    <span className="text-ink-faint">{venuePrefix(a.venue)}</span>
                    <span className="font-medium text-ink group-hover:text-devil-bright">{a.opponent}</span>
                    <span className={`stat-num font-semibold tabular-nums ${crowned ? "text-gold" : "text-ink"}`}>
                      {a.gf}<span className="mx-px text-ink-faint">–</span>{a.ga}
                    </span>
                  </span>
                </Link>
                <div className="mt-3.5">
                  {hasTimed ? (
                    <MatchFlow unitedGoals={unitedGoals} opponentGoals={opponentGoals} aet={a.clock > 95} />
                  ) : null}
                </div>
                <p className="mt-3 text-xs text-ink-dim text-pretty">{a.note}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  ) : null;

  const lateGoalsVisual = (
    <div className="space-y-4">
      <ThreadBeatRow
        lead={
          <>
            Every United fan knows the phrase — <ThreadUnderline>Fergie time</ThreadUnderline>. It jumped from{" "}
            <ThreadUnderline>{betweenLate ?? busbyLate}</ThreadUnderline> to{" "}
            <ThreadUnderline>{fergLate}</ThreadUnderline> under Ferguson and has kept climbing since —{" "}
            <ThreadUnderline>{sinceLate}</ThreadUnderline> of timed goals now land after the 85th, mostly in added time.
            Three nights tell the story: Wednesday, Barcelona, Brentford.
          </>
        }
        beats={annotated.map((a) => {
          const fan = lateGoalBeatFanCopy(a.tag);
          const crowned = a.tag === "The Treble";
          return {
            id: `${a.matchId}:${a.minute}`,
            href: `/match/${a.matchId}`,
            label: shortDate(a.date),
            title: fan.title,
            detail: `${a.gf}–${a.ga} v ${a.opponent} · ${a.minute}${a.added ? `+${a.added}` : ""}′`,
            tone: crowned ? "var(--color-gold)" : "var(--color-devil-bright)",
            highlight: crowned,
            note: fan.note,
          };
        })}
      />
      <div className="space-y-2">
        <div className="text-[11px] uppercase tracking-wider text-ink-faint">
          {fmtNum(scatter.length)} late goals since 1950 — three nights pinned on the cloud
        </div>
        <LateGoalScatter points={scatter} annotated={annotated} />
        <p className="text-xs text-ink-dim text-pretty">
          Every dot is a United goal after the 85th with a recorded minute. Quiet for decades, then the reds stack up
          past the 90′ line from the Ferguson era on — the three labelled nights are unpacked below.
        </p>
      </div>
    </div>
  );

  return (
    <Module
      slug="late-goals"
      evidence={{
        href: "/matches?goalWindow=late",
        label: "Every match with a late United goal →",
        count: lateMatches.p,
        countNoun: "matches",
      }}
      variant={variant}
      visual={lateGoalsVisual}
      visualLabel="Fergie time"
      finding={`You still hear "Fergie time" on the terraces — and the numbers back the feeling. For decades about ${betweenLate ?? busbyLate} of United goals came after the 85th; Ferguson pushed it to ${fergLate}, and since he left it has climbed to ${sinceLate}, mostly in added time rather than the last five regulation minutes. Bruce against Sheffield Wednesday is where they started saying it; Teddy and Ole in Barcelona is where it became myth; McTominay against Brentford is proof the habit never left with the manager.`}
      slice="United goals with a recorded minute — penalties and own goals included — grouped by manager era and by decade. The post-85th window is split between minutes 86–90 and stoppage time (90+, with added time folded into the final minute)."
      coverage={`${fmtNum(timed.timed)} of ${fmtNum(timed.total)} recorded United goals carry a minute, and that data thins quickly before the 1990s. Stoppage-time goals are only separable where a source marks them "90+" — largely a modern convention — so the stoppage segment reads near zero in the early decades partly because it went unrecorded, not only because added time was shorter.`}
    >
      {signatureNights}

      <section className="space-y-3">
        <div>
          <h3 className="text-sm font-medium text-ink-dim">Did it leave with him?</h3>
          <p className="mt-0.5 text-xs text-ink-dim text-pretty">
            Busby ({busbyLate}) and the years between ({betweenLate}) are the long-run baseline. Ferguson ({fergLate}) marks the jump; since ({sinceLate}) goes further — mostly in stoppage time as the clock itself gets longer, not a regulation-minute edge unique to Old Trafford.
          </p>
        </div>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-stretch">
          <div className="flex flex-col">
            <div className="min-h-40 flex-1">
              <InspectableBarChart
                data={eras.map((e) => ({
                  label: e.label,
                  tickLabel: e.label === "Since Ferguson" ? "Since" : e.label,
                  value: round1((100 * e.reg) / e.timed),
                  value2: round1((100 * e.stoppage) / e.timed),
                  valueLabel: `${Math.round((100 * (e.reg + e.stoppage)) / e.timed)}% after 85′`,
                  meta: `${Math.round((100 * e.reg) / e.timed)}% last five minutes · ${Math.round((100 * e.stoppage) / e.timed)}% stoppage · ${fmtNum(e.timed)} timed goals`,
                }))}
                fill
                color="var(--color-gold)"
                stack={{ color: "var(--color-devil-bright)" }}
                chartLabel="Manchester United late goal share by manager era"
                yTickSuffix="%"
                baseline={{ value: 100 / 18, label: "even spread" }}
              />
            </div>
            <p className="text-xs text-ink-dim mt-1">
              <span className="inline-flex items-center gap-1 align-middle"><span className="inline-block h-2 w-2 rounded-sm" style={{ background: "var(--color-gold)" }} /> last 5 min (86–90)</span>
              {" · "}
              <span className="inline-flex items-center gap-1 align-middle"><span className="inline-block h-2 w-2 rounded-sm" style={{ background: "var(--color-devil-bright)" }} /> stoppage (90+)</span>
            </p>
          </div>
          <div className="flex flex-col">
            <h3 className="text-sm font-medium mb-2 text-ink-dim">By decade — the 2020s surge</h3>
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
                chartLabel="Manchester United late goal share by decade"
                yTickSuffix="%"
                baseline={{ value: 100 / 18 }}
              />
            </div>
            <p className="text-xs text-ink-dim mt-1">
              The 1990s brought the phrase; the 2020s brought longer added time — the red cap now stacks as high as the gold base.
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <div>
          <h3 className="text-sm font-medium text-ink-dim">Where in the match — minute by minute</h3>
          <p className="mt-0.5 text-xs text-ink-dim text-pretty">
            An even spread would put {evenSpread} in every five-minute window. The 86–90 bar clears that baseline; the stoppage cap on the final column is the lengthening closing window, not a United-only trait.
          </p>
        </div>
        <MinuteColumns bins={ridge.bins} stoppage={ridge.stoppage} height={200} />
      </section>
    </Module>
  );
}

function ComebacksModule({ variant }: ModuleProps) {
  const meta = getMeta();
  const cb = comebacks(6);
  const shortDate = (d: string) => fmtDate(d).replace(/\s*\d{4}$/, "");
  const comebackVisual = (
    <ThreadBeatRow
      lead={
        <>
          Every United fan has heard it — <ThreadUnderline>never write them off</ThreadUnderline>. The record shows{" "}
          <ThreadUnderline>{fmtNum(cb.summary.recovered)}</ThreadUnderline> fights back from losing positions,{" "}
          <ThreadUnderline>{fmtNum(cb.summary.wonFromBehind)}</ThreadUnderline> turned into wins, and{" "}
          <ThreadUnderline>{fmtNum(cb.summary.twoPlusRecovered)}</ThreadUnderline> salvaged from two or more down.
        </>
      }
      beats={cb.deepest.slice(0, 3).map((g) => ({
        id: g.id,
        href: `/match/${g.id}`,
        label: shortDate(g.date),
        title: `${g.deficit} goals down`,
        detail: `Won ${g.gf}–${g.ga} v ${g.opponent_name}`,
        tone: "var(--color-gold)",
        highlight: g.deficit >= 3,
        note: g.deficit >= 3 ? "The kind of night you tell your kids about." : "Turned it around when it mattered.",
      }))}
    />
  );
  return (
    <Module
      slug="comebacks"
      evidence={{ href: "/matches", label: "Browse every match →", count: Number(meta.matches), countNoun: "matches" }}
      variant={variant}
      visual={comebackVisual}
      visualLabel="Never write United off"
      finding={`You grew up hearing United never know when they're beaten — and the minute-by-minute record backs it. In ${fmtNum(cb.summary.replayable)} matches we can replay goal for goal, they fell behind ${fmtNum(cb.summary.fellBehind)} times and still got something from ${fmtNum(cb.summary.recovered)} of them, including ${fmtNum(cb.summary.wonFromBehind)} complete turnarounds. ${fmtNum(cb.summary.twoPlusRecovered)} times they were two or more down and did not lose.`}
      slice="Official matches whose goals all carry a minute; a match counts as 'behind' whenever United's running score fell below the opponent's. The deepest comebacks are wins after trailing by two goals or more."
      coverage={`${fmtNum(cb.summary.replayable)} of ${fmtNum(Number(meta.matches))} matches have minute-complete goals, so a fightback can be verified; minute data thins before the 1990s, so older recoveries are under-counted.`}
    >
      {cb.deepest.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-medium text-ink-dim">The deepest fightbacks — won from two or more down</h3>
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
  const shortDate = (d: string) => fmtDate(d).replace(/\s*\d{4}$/, "");
  const runsVisual = (
    <ThreadBeatRow
      lead={
        <>
          United fans measure greatness in runs — and the record still starts with the{" "}
          <ThreadUnderline>{fmtNum(longestUnbeaten?.length ?? 0)}-match unbeaten</ThreadUnderline> stretch that carried the Treble.
          Straight wins peaked at <ThreadUnderline>{fmtNum(longestWinning?.length ?? 0)}</ThreadUnderline>; they once scored in{" "}
          <ThreadUnderline>{fmtNum(longestScoring?.length ?? 0)}</ThreadUnderline> in a row.
        </>
      }
      beats={[
        longestUnbeaten && {
          id: "unbeaten",
          href: `/matches?from=${longestUnbeaten.from}&to=${longestUnbeaten.to}`,
          label: longestUnbeaten.from.slice(0, 4),
          title: "Unbeaten",
          detail: `${fmtNum(longestUnbeaten.length)} matches without defeat`,
          tone: "var(--color-win)",
          highlight: true,
          note: `${shortDate(longestUnbeaten.from)}–${shortDate(longestUnbeaten.to)} — the run every other run is judged against.`,
        },
        longestWinning && {
          id: "winning",
          href: `/matches?from=${longestWinning.from}&to=${longestWinning.to}`,
          label: longestWinning.from.slice(0, 4),
          title: "Winning",
          detail: `${fmtNum(longestWinning.length)} straight wins`,
          tone: "var(--color-gold)",
          note: "When the machine was at its most ruthless.",
        },
        longestScoring && {
          id: "scoring",
          href: `/matches?from=${longestScoring.from}&to=${longestScoring.to}`,
          label: longestScoring.from.slice(0, 4),
          title: "Scoring",
          detail: `${fmtNum(longestScoring.length)} matches finding the net`,
          tone: "var(--color-devil-bright)",
          note: "Attack as habit, not accident.",
        },
      ].filter(Boolean) as ThreadBeat[]}
    />
  );
  return (
    <Module
      slug="runs"
      evidence={{ href: "/matches?sort=oldest", label: "Browse the record in order →", count: Number(meta.matches), countNoun: "matches" }}
      variant={variant}
      visual={runsVisual}
      visualLabel="The runs that matter"
      finding={`Every generation has its "you'll never beat them when they're on a run" stretch. United's benchmark is still ${fmtNum(longestUnbeaten?.length ?? 0)} matches without defeat${longestUnbeaten ? ` (${fmtMonthYear(longestUnbeaten.from)}–${fmtMonthYear(longestUnbeaten.to)} — the Treble season and beyond)` : ""}; the longest winning run is ${fmtNum(longestWinning?.length ?? 0)}, they have scored in ${fmtNum(longestScoring?.length ?? 0)} consecutive matches, and kept ${fmtNum(longestClean?.length ?? 0)} clean sheets in a row.`}
      slice="Consecutive official matches (friendlies and wartime excluded), in date order. 'Unbeaten' counts wins and draws; 'scoring' counts any match United scored in; 'clean sheet' counts matches without conceding. Each run links to the matches behind it."
    >
      <StreakBoard groups={streakGroups} />
    </Module>
  );
}

// ---- Ferguson era: the floor dropped ---------------------------------------

function FergusonEraModule({ variant }: ModuleProps) {
  const floor = fergusonFloorSummary();
  const timeline = fergusonFloorTimeline();
  const since = eraRecord("2013-05-20", "9999-12-31");
  const moments = postFergusonFloorMoments();
  const longevity = managerLongevityField();
  const fergPoint = longevity.find((p) => p.kind === "ferguson");
  const sincePoints = longevity.filter((p) => p.kind === "since");
  const longestSince = sincePoints.reduce((a, b) => (a.matches > b.matches ? a : b), sincePoints[0]);

  const skylineVisual = (
    <div className="space-y-4">
      <ThreadBeatRow
        lead={
          <>
            Every United fan knows the split — <ThreadUnderline>{fmtNum(floor.fergTitles)} league titles</ThreadUnderline> under Ferguson,
            <ThreadUnderline> {fmtNum(floor.sinceTitles)} since</ThreadUnderline>. The floor that held for a generation gave way after May 2013;
            average finish slipped from <ThreadUnderline>{ordinal(Math.round(floor.fergAvgFinish))}</ThreadUnderline> to{" "}
            <ThreadUnderline>{ordinal(Math.round(floor.sinceAvgFinish))}</ThreadUnderline>
            {floor.sinceWorst ? `, bottoming out at ${ordinal(floor.sinceWorst)}` : ""}.
          </>
        }
        beats={moments.map((m) => ({
          id: m.id,
          href: `/seasons/${m.season}`,
          label: m.season,
          title: m.tag,
          detail: `${ordinal(m.league.position)} under ${m.managerName}`,
          tone: m.tone === "peak" ? "var(--color-gold)" : m.tone === "floor" ? "var(--color-loss)" : "var(--color-devil-bright)",
          highlight: m.tone === "peak",
          note: m.note.split(".").slice(0, 2).join(".") + (m.note.includes(".") ? "." : ""),
        }))}
      />
      <div className="space-y-2">
        <TitleFloorTimeline
          points={timeline}
          fergTitles={floor.fergTitles}
          sinceTitles={floor.sinceTitles}
          fergAvg={floor.fergAvgFinish}
          sinceAvg={floor.sinceAvgFinish}
        />
        <p className="text-xs text-ink-dim text-pretty">
          One dot per season — higher is better. The red line held the top four for a generation; after Ferguson left it fell away.
        </p>
      </div>
    </div>
  );

  return (
    <Module
      slug="ferguson-era"
      evidence={{ href: `/matches?from=2013-05-20&sort=date-asc`, label: "Every match since Ferguson →", count: since.p, countNoun: "matches" }}
      variant={variant}
      visual={skylineVisual}
      visualLabel="After Ferguson"
      finding={`Twenty-six years without the league, then twenty-six with Ferguson at the helm — ${floor.fergTitles} titles, top four ${floor.fergTop4} times, averaging ${ordinal(Math.round(floor.fergAvgFinish))} in the table even through the rebuild. Since May 2013: ${floor.sinceTitles} titles, only ${floor.sinceTop4} top-four finishes, average ${ordinal(Math.round(floor.sinceAvgFinish))}${floor.sinceWorst ? `, and a low of ${ordinal(floor.sinceWorst)}` : ""}. Every fan feels the drop; the season-by-season record shows exactly where it landed.`}
      slice="Top-flight league finishes (First Division / Premier League) season by season. Ferguson's reign runs 8 Nov 1986 to 19 May 2013; everything after is the post-Ferguson era. Post-2013 seasons are attributed to the manager who took most league matches that season, mapped to their tenure dates."
      coverage="Result-level record — complete for every official match across both eras. No advanced metrics; the comparison uses league position and titles, exactly as the record supports."
    >
      <section className="space-y-3">
        <div>
          <h3 className="text-sm font-medium text-ink-dim">Longevity and rate — Ferguson on two axes</h3>
          <p className="mt-0.5 text-xs text-ink-dim text-pretty">
            {fergPoint && longestSince ? (
              <>
                Ferguson&apos;s <span className="text-ink">{fmtNum(fergPoint.matches)}</span> matches at{" "}
                <span className="text-ink">{fergPoint.ppg.toFixed(2)}</span> points per game sit alone in the top-right — no successor has matched both.
                Since 2013 every permanent spell has been shorter; the longest,{" "}
                {longestSince.name.split(" ").pop()}, reached just{" "}
                <span className="text-ink">{fmtNum(longestSince.matches)}</span> matches
                {longestSince.matches < fergPoint.matches * 0.15 ? " — under one-ninth of Ferguson&apos;s reign" : ""}.
              </>
            ) : (
              "Points per game against matches in charge — the two axes Ferguson mastered and successors rarely combine."
            )}
          </p>
        </div>
        <ManagerLongevityChart points={longevity} />
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-ink-faint">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-gold" />
            Ferguson · Busby
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-europe/90" />
            Since 2013 · one dot per tenure
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-ink-dim" />
            Earlier managers
          </span>
        </div>
      </section>

      {moments.length > 0 && (
        <section className="space-y-3">
          <div>
            <h3 className="text-sm font-medium text-ink-dim">The drop in three seasons</h3>
            <p className="mt-0.5 text-xs text-ink-dim text-pretty">
              Moyes&apos;s first year, the best any successor has managed, and the campaign that hit the floor — each opens the full season.
            </p>
          </div>
          <div className="space-y-3">
            {moments.map((m) => {
              const pts = m.league.w * 3 + m.league.d;
              const gd = m.league.gf - m.league.ga;
              const cardTone =
                m.tone === "peak"
                  ? "border-gold/35 shadow-[0_14px_36px_-18px_rgba(0,0,0,0.75)] hover:border-gold/55"
                  : m.tone === "floor"
                    ? "border-loss/35 hover:border-loss/55"
                    : "border-line hover:border-devil/60";
              const tagTone =
                m.tone === "peak" ? "text-gold" : m.tone === "floor" ? "text-loss" : "text-devil-bright";
              const posTone =
                m.tone === "peak" ? "text-gold" : m.tone === "floor" ? "text-loss" : "text-ink";
              return (
                <div
                  key={m.id}
                  className={`group relative overflow-hidden rounded-lg border bg-panel-2 p-4 transition-colors ${cardTone}`}
                >
                  <Link
                    href={`/seasons/${m.season}`}
                    className="absolute inset-0 z-0 rounded-lg focus-ring"
                    aria-label={`${m.season} season — ${ordinal(m.league.position)} under ${m.managerName}`}
                  />
                  {m.tone === "peak" && (
                    <span
                      aria-hidden
                      className="pointer-events-none absolute -right-16 -top-20 h-44 w-44 rounded-full opacity-[0.13] blur-3xl"
                      style={{ backgroundColor: "var(--color-gold)" }}
                    />
                  )}
                  <div className="relative z-10 space-y-3">
                    <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
                      <span className={`text-[10px] font-medium uppercase tracking-wide ${tagTone}`}>{m.tag}</span>
                      <span className="stat-num text-[11px] text-ink-faint transition-colors group-hover:text-devil-bright">
                        {m.season} season →
                      </span>
                    </div>
                    <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-2">
                      <Link
                        href={`/manager/${m.managerId}`}
                        className="relative z-20 text-sm font-medium text-ink transition-colors hover:text-devil-bright focus-ring"
                      >
                        {m.managerName}
                      </Link>
                      <span className={`stat-num text-4xl font-semibold leading-none tabular-nums ${posTone}`}>
                        {ordinal(m.league.position)}
                      </span>
                    </div>
                    <div className="grid gap-3 border-t border-line/70 pt-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
                      <FinishLadder league={m.league} />
                      <WdlBar w={m.league.w} d={m.league.d} l={m.league.l} size="md" variant="stacked" showLabels />
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-[11px] text-ink-faint">
                      <span className="stat-num font-medium text-ink-dim">{fmtNum(pts)} pts</span>
                      <span className="stat-num tabular-nums">
                        {m.league.gf}–{m.league.ga} · {gd >= 0 ? `+${gd}` : gd} GD
                      </span>
                    </div>
                    <p className="text-xs text-ink-dim text-pretty">{m.note}</p>
                    {m.footnote && (
                      <p className="text-[11px] text-ink-faint text-pretty">{m.footnote}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </Module>
  );
}

// ---- The Treble ------------------------------------------------------------

/** Fan-facing labels for the three nights everyone remembers — not competition bureaucracy. */
function trebleBeatFanCopy(matchId: string): { title: string; note?: string } {
  if (matchId.includes("tottenham-hotspur")) {
    return { title: "The title", note: "Final day at Old Trafford. One point clear. Came from behind anyway." };
  }
  if (matchId.includes("newcastle-united")) {
    return { title: "Wembley", note: "Five days after the league — the Double was on the line." };
  }
  if (matchId.includes("bayern-munich")) {
    return { title: "Barcelona", note: "Basler had it won. Teddy in the 91st. Ole in the 93rd." };
  }
  return { title: "Decider" };
}

function TrebleModule({ variant }: ModuleProps) {
  const season = "1998-99";
  const summary = trebleSummary(season);
  const runs = summary.wonRuns;
  const deciders = trebleDeciders(season);
  const semis = trebleSemis(season);
  const seasonSeq = matchesSequence({ season });
  const { spanDays, month, year, decidersFromBehind } = summary;
  const runPlayed = runs.reduce((n, r) => n + r.p, 0);
  const trebleLosses = runs.reduce((n, r) => n + r.l, 0);
  const shortDate = (d: string) => fmtDate(d).replace(/\s*\d{4}$/, "");
  const runTypeById = new Map(runs.map((r) => [r.competition_id, r.type]));
  const spineMarkers = deciders.map((d) => ({
    id: d.id,
    label: `${d.competition_name} won — ${shortDate(d.date)}`,
    tone: TROPHY_CAT_TONE[runTypeById.get(d.competition_id) ?? "league"],
  }));
  const lastDecider = deciders[deciders.length - 1];
  const behindCopy =
    decidersFromBehind === 0
      ? "every decider won without falling behind"
      : decidersFromBehind === 1
        ? "one win after going behind"
        : `${fmtNum(decidersFromBehind)} wins after going behind`;
  const stoppageCopy = lastDecider?.wonInStoppage ? ", the last settled in stoppage time" : "";
  const trebleVisual = (
    <div className="space-y-4">
      <ThreadBeatRow
        lead={
          <>
            You know how this ends — <ThreadUnderline>ten days in {month}</ThreadUnderline>, three trophies,
            the only English Treble. <ThreadUnderline>{fmtNum(runPlayed)} matches</ThreadUnderline> to get there,{" "}
            <ThreadUnderline>{fmtNum(trebleLosses)} defeats</ThreadUnderline> in the competitions that mattered — then Spurs,
            Newcastle, and that night in the Nou Camp.
          </>
        }
        beats={deciders.map((d) => {
          const tone = TROPHY_CAT_TONE[runTypeById.get(d.competition_id) ?? "league"];
          const fan = trebleBeatFanCopy(d.id);
          return {
            id: d.id,
            href: `/match/${d.id}`,
            label: shortDate(d.date),
            title: fan.title,
            detail: `${d.gf}–${d.ga} v ${d.opponent_name}`,
            tone,
            highlight: d.wonInStoppage,
            glyph: <TrophyIcon className="h-3.5 w-3.5" />,
            note: fan.note,
          };
        })}
      />
      <div className="space-y-1.5">
        <div className="text-[11px] uppercase tracking-wider text-ink-faint">
          The whole {season} season — {seasonSeq.length} matches, League Cup and Charity Shield included
        </div>
        <ResultSpine
          matches={seasonSeq}
          markers={spineMarkers}
          height={120}
          subject="Manchester United 1998-99"
          markerGlyph={<TrophyIcon className="h-4 w-4" />}
          xLabel="month"
        />
      </div>
      <p className="text-xs text-ink-dim text-pretty">
        Every result on the way — most of it building toward a May everyone still talks about.{" "}
        <span className="text-ink">Wins above the line, losses below</span>; the three trophies pin the nights you remember.{" "}
        <Link href={`/seasons/${season}`} className="text-devil-bright hover:underline focus-ring">
          Open the full {season} campaign →
        </Link>
      </p>
    </div>
  );
  return (
    <Module
      slug="treble"
      evidence={{ href: `/matches?season=${season}`, label: "Every match of 1998-99 →", count: seasonSeq.length, countNoun: "matches" }}
      variant={variant}
      visual={trebleVisual}
      visualLabel="Ten days in May"
      finding={`Every United fan knows the shape of it — Spurs on the final day, Newcastle at Wembley five days later, then Barcelona and those two goals after the 90th. Underneath: ${fmtNum(runPlayed)} matches across league, cup and Europe, just ${fmtNum(trebleLosses)} defeats, and the only English Treble, all inside ${spanDays} days in ${month} ${year}.`}
      slice={`Every match of ${season} is in the timeline up top. The matches below show who scored and when in the decisive games and semi-finals — the deciding legs that forged the Treble, not the full two-legged ties (scoreless first legs omitted).`}
      coverage="Full 1998-99 match and goal record across all three competitions."
    >
      <section className="space-y-3">
        <div>
          <h3 className="text-sm font-medium text-ink-dim">Ten days in {month} — the three everyone recites</h3>
          <p className="mt-0.5 text-xs text-ink-dim">
            Old Trafford, Wembley, the Nou Camp — {behindCopy}{stoppageCopy}.
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
                      Basler&apos;s free-kick had Bayern ahead. Teddy levelled in the 91st, Ole won it in the 93rd — still the latest any Champions League final has been turned around.
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
            <h3 className="text-sm font-medium text-ink-dim">Before May — the nights it nearly slipped</h3>
            <p className="mt-0.5 text-xs text-ink-dim">
              Giggs against Arsenal. Keane booked in Turin. Extra time at Villa Park. The Treble was never a procession — these are the deciding legs only; scoreless first legs omitted.
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
                    <div className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-sm">
                      <span className="text-ink-faint">{venuePrefix(s.venue)}</span>
                      <span className="font-medium text-ink group-hover:text-devil-bright">{s.opponent_name}</span>
                      <span className="stat-num font-semibold tabular-nums">{s.gf}<span className="mx-px text-ink-faint">–</span>{s.ga}</span>
                      {s.aet ? <span className="stat-num text-[11px] text-ink-faint">(a.e.t)</span> : null}
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
              href={`/matches?season=${season}&competition=${r.competition_id}`}
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
  const euroTimeline = europeWinRateTimeline();
  const finals = europeanFinals();
  const won = finals.filter((f) => f.won);
  const euroSeq = europeMatchSequence();
  const total = decades.reduce((a, d) => ({ p: a.p + d.p, w: a.w + d.w, d: a.d + d.d, l: a.l + d.l }), { p: 0, w: 0, d: 0, l: 0 });
  const winRate = pct(total.w, total.p);
  const firstFinalYear = finals[0]?.date.slice(0, 4) ?? "1968";
  const lastWonFinal = [...finals].reverse().find((f) => f.won);
  const shortDate = (d: string) => fmtDate(d).replace(/\s*\d{4}$/, "");
  const iconicFinalIds = ["1968-05-29-benfica-n", "1999-05-26-bayern-munich-n", "2008-05-21-chelsea-n"];
  const iconicFinals = iconicFinalIds
    .map((id) => finals.find((f) => f.id === id))
    .filter((f): f is NonNullable<typeof f> => f != null);
  const spineMarkers = finals.map((f) => ({
    id: f.id,
    label: `${f.competition_name} ${f.won ? "won" : "lost"} — ${fmtDate(f.date)}`,
    tone: f.won ? "var(--color-gold)" : "var(--color-ink-faint)",
  }));
  const europeVisual = (
    <div className="space-y-4">
      <ThreadBeatRow
        lead={
          <>
            European nights are the nights you still replay — <ThreadUnderline>{won.length} trophies</ThreadUnderline> from{" "}
            <ThreadUnderline>{finals.length} finals</ThreadUnderline>, {winRate} of continental matches won.
            Ten years after Munich, Benfica. Then the long wilderness. Then Barcelona, Moscow, and the finals since.
          </>
        }
        beats={iconicFinals.map((f) => ({
          id: f.id,
          href: `/match/${f.id}`,
          label: shortDate(f.date),
          title: f.date.startsWith("1968") ? "Benfica" : f.date.startsWith("1999") ? "Barcelona" : "Moscow",
          detail: `${f.gf}–${f.ga} v ${f.opponent_name}`,
          tone: "var(--color-gold)",
          highlight: f.date.startsWith("1999"),
          glyph: <TrophyIcon className="h-3.5 w-3.5" />,
          note:
            f.date.startsWith("1968")
              ? "Ten years after Munich — the first English club to lift the European Cup."
              : f.date.startsWith("1999")
                ? "Teddy, then Ole — the Treble completed."
                : "Penalties in the Moscow rain — a second European Cup.",
        }))}
      />
      <div className="space-y-1.5">
        <div className="text-[11px] uppercase tracking-wider text-ink-faint">
          All {euroSeq.length} European matches — trophies mark every final reached
        </div>
        <ResultSpine
          matches={euroSeq}
          markers={spineMarkers}
          height={140}
          subject="Manchester United in Europe"
          markerGlyph={<TrophyIcon className="h-4 w-4" />}
          hrefForMatch={(id) => `/match/${id}`}
        />
      </div>
    </div>
  );
  return (
    <Module
      slug="europe"
      evidence={{ href: "/matches?type=european", label: "Every European match →", count: total.p, countNoun: "matches" }}
      variant={variant}
      visual={europeVisual}
      visualLabel="European nights"
      finding={`United's European story is the one fans tell in finals — first at Wembley in ${firstFinalYear}, then long quiet decades, then the nights everyone still names: Barcelona '99, Moscow '08. Only half the ${finals.length} finals since have ended with silverware raised (${won.length} trophies from ${winRate} of ${fmtNum(total.p)} continental matches). Since ${lastWonFinal ? fmtMonthYear(lastWonFinal.date) : "2008"}, the ledger has tilted toward finals lost, not won.`}
      slice="European competition only (European Cup, Champions League, Cup Winners' Cup, UEFA Cup/Europa League, Inter-Cities Fairs Cup, and the UEFA Super Cup). Finals are the one-off deciding match of each European campaign."
      coverage="Result-level record — every European match held in full. The bars track win rate season by season, with gaps where United did not play in Europe; finals name the trophy, the opponent and the night."
    >
      <div>
        <h3 className="mb-2 text-sm font-medium text-ink-dim">European win rate by season</h3>
        <InspectableBarChart
          data={euroTimeline.map((s) => {
            const seasonLabel = `${s.season.slice(2, 4)}–${s.season.slice(5)}`;
            if (s.rate === null) {
              return {
                label: s.season,
                tickLabel: seasonLabel,
                value: null,
                gap: true,
                valueLabel: s.p === 0 ? "No European football" : "Too few matches for a rate",
                meta:
                  s.p === 0
                    ? `${s.season} · United did not play in Europe this season`
                    : `${s.season} · only ${s.p} European match${s.p === 1 ? "" : "es"}`,
              };
            }
            return {
              label: s.season,
              tickLabel: seasonLabel,
              value: s.rate,
              valueLabel: `${pct(s.w, s.p)} won`,
              meta: `${s.season} · ${s.p} matches · ${s.w}W ${s.d}D ${s.l}L`,
              href: `/matches?type=european&season=${encodeURIComponent(s.season)}`,
            };
          })}
          height={260}
          color="var(--color-gold)"
          labelEvery={1}
          yTickSuffix="%"
          yDomain={[0, 100]}
          baseline={{ value: Math.round((100 * total.w) / total.p), label: `${winRate} all-time` }}
          chartLabel="Manchester United European win rate by season"
          slantXLabels
        />
        <p className="text-xs text-ink-dim mt-1">
          Win rate each season when United played at least two European matches. Empty seasons are gaps — no bar means no continental football, often the wilderness between deep runs.
        </p>
      </div>
      {finals.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-medium text-ink-dim">Every European final — won and lost</h3>
          <EuropeFinalsTimeline finals={finals} />
        </div>
      )}
    </Module>
  );
}

function ManagerBounceModule({ variant }: ModuleProps) {
  const bounce = managerBounce();
  const bounceUp = bounce.filter((b) => b.first10.w > b.prev10.w).length;
  const topBounces = [...bounce]
    .sort((a, b) => b.first10.w - b.prev10.w - (a.first10.w - a.prev10.w))
    .slice(0, 3);
  const bounceVisual = (
    <ThreadBeatRow
      lead={
        <>
          Every United fan knows the honeymoon — <ThreadUnderline>{bounceUp} of {bounce.length} managers</ThreadUnderline> won more
          of their first ten than the ten before they arrived. The new-manager bounce is real; the question is who kept it.
        </>
      }
      beats={topBounces.map((b) => {
        const swing = b.first10.w - b.prev10.w;
        return {
          id: b.id,
          href: `/manager/${b.id}`,
          label: b.name.split(" ").pop() ?? b.name,
          title: b.name,
          detail: `${b.prev10.w} wins → ${b.first10.w} in the first ten`,
          tone: swing > 0 ? "var(--color-win)" : "var(--color-loss)",
          highlight: swing >= 4,
          note: swing > 0 ? `+${swing} wins in the bounce — the lift everyone hoped for.` : "No lift at all in the first ten.",
        };
      })}
    />
  );
  return (
    <Module
      slug="manager-bounce"
      evidence={{ href: "/managers", label: "Every manager's full record →" }}
      variant={variant}
      visual={bounceVisual}
      visualLabel="The honeymoon"
      finding={`The new-manager bounce is part of United folklore — and the numbers bear it out. ${bounceUp} of ${bounce.length} managers won more of their first ten matches than the club managed in the ten before they walked in. Each line below runs from the old form to the new start; the steep red climbs are the bounces fans remember hoping would last.`}
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
          <BounceComparisonTable bounce={bounce} />
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
  const fortressVisual = (
    <div className="space-y-4">
      <ThreadBeatRow
        lead={
          <>
            Score first at Old Trafford and you expect to keep it — <ThreadUnderline>{fmtNum(unbeatenSince.run)} home league games</ThreadUnderline>{" "}
            led at half-time without losing since {lastLoss ? lastLoss.date.slice(0, 4) : leadHeld.from.slice(0, 4)}.
            The fortress is real; the numbered dots below are the nights it nearly cracked.
          </>
        }
        beats={[
          lastLoss && {
            id: lastLoss.id,
            href: `/match/${lastLoss.id}`,
            label: fmtDate(lastLoss.date).replace(/\s*\d{4}$/, ""),
            title: "The last time",
            detail: `Lost ${lastLoss.gf}–${lastLoss.ga} v ${lastLoss.opponent_name}`,
            tone: "var(--color-loss)",
            note: "The lead was lost at half-time — and the unbeaten run began the next time.",
          },
          ...closeCalls.slice(0, 2).map((g, i) => ({
            id: g.id,
            href: `/match/${g.id}`,
            label: fmtDate(g.date).replace(/\s*\d{4}$/, ""),
            title: `Close call ${i + 1}`,
            detail: `Drew ${g.gf}–${g.ga} v ${g.opponent_name}`,
            tone: "var(--color-gold)",
            note: "Led at the break — the lead surrendered, but not the point.",
          })),
        ].filter(Boolean) as ThreadBeat[]}
      />
      <div>
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
          Every dot is a home league game United led at half-time — wins, the rare surrendered lead, and the last defeat before the run everyone cites.
        </p>
      </div>
    </div>
  );
  return (
    <Module
      slug="fortress"
      evidence={{ href: "/matches?venue=H", label: "Every home match →" }}
      variant={variant}
      visual={fortressVisual}
      visualLabel="Fortress OT"
      finding={
        lastLoss
          ? `Fortress Old Trafford is not just a phrase — take a half-time lead at home in the league and United have not lost since ${fmtDate(lastLoss.date)}. That is ${fmtNum(unbeatenSince.run)} games and counting. Across every verifiable home league game led at the break (${leadHeld.from.slice(0, 4)}–${leadHeld.to.slice(0, 4)}), they won ${fmtNum(leadHeld.w)}, drew ${fmtNum(leadHeld.d)}, and lost the lead only ${fmtNum(leadLosses.length)} times.`
          : `Fortress Old Trafford is not just a phrase — across ${fmtNum(leadHeld.games.length)} home league games where United led at half-time (${leadHeld.from.slice(0, 4)}–${leadHeld.to.slice(0, 4)}), they won ${fmtNum(leadHeld.w)}, drew ${fmtNum(leadHeld.d)}, and never lost.`
      }
      slice="Old Trafford home league games where United led at half-time, the half-time score reconstructed from minute-stamped goal events. Restricted to matches whose goals all carry a minute, so it is the verifiable part of the record rather than a single continuous run."
      coverage={`Half-time scores only reconstruct where every goal has a recorded minute, so these ${fmtNum(leadHeld.games.length)} games are a sample, not a sequence. Opta, working from complete half-time data, puts the current unbeaten run at 400 home league games led at half-time — W365 D35 — back to August 1984.`}
    >
      {closeCalls.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-medium text-ink-dim">The nights the lead nearly went — surrendered, not lost</h3>
          <div className="space-y-2">
            {closeCalls.map((g) => {
              const ev = eventsForMatch(g.id);
              const unitedGoals = ev.filter((e) => e.type === "goal" || e.type === "pen-goal" || e.type === "own-goal-for");
              const opponentGoals = ev.filter((e) => e.type === "opp-goal" || e.type === "own-goal-against");
              return (
                <div
                  key={g.id}
                  className="group rounded-lg border border-line bg-panel-2 p-3 transition-colors hover:border-devil/60"
                >
                  <Link
                    href={`/match/${g.id}`}
                    className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5"
                  >
                    <span className="flex items-baseline gap-2 text-sm">
                      <span className="stat-num text-[11px] text-ink-faint">{fmtDate(g.date)}</span>
                      <span className="stat-num font-semibold tabular-nums text-ink group-hover:text-devil-bright">
                        {g.gf}<span className="mx-px text-ink-faint">–</span>{g.ga}
                      </span>
                    </span>
                    <span className="text-sm font-medium group-hover:text-devil-bright">{g.opponent_name}</span>
                  </Link>
                  <div className="mt-2.5 border-t border-line pt-2.5">
                    <MatchFlow unitedGoals={unitedGoals} opponentGoals={opponentGoals} aet={false} />
                  </div>
                </div>
              );
            })}
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
          height={260}
          color="var(--color-gold)"
          dimOpacity={0.32}
          highlightLabel="2000s"
          highlightColor="var(--color-gold)"
          chartLabel="Manchester United Old Trafford win rate by decade"
          yTickSuffix="%"
          baseline={{ value: 50, label: "half won" }}
        />
        <p className="text-xs text-ink-dim mt-1">
          Percent of Old Trafford home matches won, by decade — the{" "}
          <span className="text-gold">2000s</span> were the peak.
        </p>
      </div>
    </Module>
  );
}

function CupSpecialistsModule({ variant }: ModuleProps) {
  const meta = getMeta();
  const specialists = cupSpecialists(25, 10);
  const cupBaseline = cupGoalShareBaseline();
  const topCupLean = specialists[0];
  const cupMult = cupBaseline.share ? (topCupLean.cup_goals / topCupLean.total) / cupBaseline.share : 0;
  const cupVisual = (
    <div className="space-y-4">
      <ThreadBeatRow
        lead={
          <>
            Some players save their best for cup nights — the squad averages{" "}
            <ThreadUnderline>{pct(cupBaseline.cup, cupBaseline.total)}</ThreadUnderline> of goals in cups; the names below
            cleared <ThreadUnderline>double that</ThreadUnderline>, led by{" "}
            <ThreadUnderline>{topCupLean.name}</ThreadUnderline> at {cupMult.toFixed(1)}× the club rate.
          </>
        }
        beats={specialists.slice(0, 3).map((p, i) => ({
          id: p.player_id,
          href: `/player/${p.player_id}`,
          label: `#${i + 1}`,
          title: p.name,
          detail: `${(cupBaseline.share ? (p.cup_goals / p.total) / cupBaseline.share : 0).toFixed(1)}× the club cup rate`,
          tone: i === 0 ? "var(--color-gold)" : "var(--color-devil-bright)",
          highlight: i === 0,
          note: i === 0 ? "The archetypal cup-night specialist." : `${fmtNum(p.cup_goals)} of ${fmtNum(p.total)} goals in the cups.`,
        }))}
      />
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
    </div>
  );
  return (
    <Module
      slug="cup-specialists"
      evidence={{ href: "/matches?type=cup", label: "Every cup match →" }}
      variant={variant}
      visual={cupVisual}
      visualLabel="Cup-night specialists"
      finding={`Every fan knows the type — the player who turns up when the tie matters. United average ${pct(cupBaseline.cup, cupBaseline.total)} of their goals in cups; these ten all more than double that, ${topCupLean.name} most of all at ${cupMult.toFixed(1)}× the club rate. League grinders, cup assassins.`}
      slice="Goals (excluding own goals) per player split league v cup by competition type, minimum 25 recorded goals, ranked by cup share. The multiplier is each player's cup share over the club-wide cup share."
      coverage={`Goalscorer attribution exists for ${fmtNum(Number(meta.matches_with_scorers))} of ${fmtNum(Number(meta.matches))} matches, weighted toward the post-war era — pre-war specialists may be under-counted.`}
    />
  );
}

function OwnGoalsModule({ variant }: ModuleProps) {
  const ogSummary = ownGoalSummary();
  const ogScorers = ownGoalScorers();
  const ogRepeat = ogScorers.filter((s) => s.n > 1);
  const ogRank = topScorers(12).findIndex((p) => p.player_id === "own-goal") + 1;
  const ogVisual = (
    <ThreadBeatRow
      lead={
        <>
          Every United fan knows the joke — <ThreadUnderline>Own Goal</ThreadUnderline> on the all-time scorers list.
          <ThreadUnderline>{fmtNum(ogSummary.total)} goals</ThreadUnderline>
          {ogRank ? `, the ${ogRank === 5 ? "fifth" : `#${ogRank}`}-highest tally in the club's history` : ""} — gifted by{" "}
          <ThreadUnderline>{fmtNum(ogSummary.scorers)}</ThreadUnderline> different opposition players, belonging to no one.
        </>
      }
      beats={[
        {
          id: "own-goal-total",
          href: "/player/own-goal",
          label: "All-time",
          title: "Own Goal",
          detail: `${fmtNum(ogSummary.total)} goals`,
          tone: "var(--color-devil-bright)",
          highlight: true,
          note: "More than George Best managed in open play — the punchline is real.",
        },
        ogRepeat[0] && {
          id: `og-repeat-${ogRepeat[0].name}`,
          href: `/match/${ogRepeat[0].recent_match_id}`,
          label: "Twice",
          title: ogRepeat[0].name,
          detail: `v ${ogRepeat[0].recent_opponent}`,
          tone: "var(--color-gold)",
          note: "One of only two men to do it twice for United.",
        },
        ogRepeat[1] && {
          id: `og-repeat-${ogRepeat[1].name}`,
          href: `/match/${ogRepeat[1].recent_match_id}`,
          label: "Twice",
          title: ogRepeat[1].name,
          detail: `v ${ogRepeat[1].recent_opponent}`,
          tone: "var(--color-gold)",
          note: "The other repeat benefactor.",
        },
      ].filter(Boolean) as ThreadBeat[]}
    />
  );
  return (
    <Module
      slug="own-goals"
      evidence={{ href: "/player/own-goal", label: "Every own goal for United →", count: ogSummary.total, countNoun: "own goals" }}
      variant={variant}
      visual={ogVisual}
      visualLabel="The punchline"
      finding={`"Own Goal" on the all-time scorers list is every United fan's favourite stat — and it checks out: ${fmtNum(ogSummary.total)} goals${ogRank ? `, ${ogRank === 5 ? "fifth" : `#${ogRank}`} in club history` : ""}, spread across ${fmtNum(ogSummary.scorers)} opposition players between ${fmtDate(ogSummary.first)} and ${fmtDate(ogSummary.last)}. No one has done it more than ${ogRepeat[0]?.n ?? 1} times; the joke works because the numbers are absurd.`}
      slice="Own goals credited to United (an opponent scoring into his own net), all official competitions, gathered under the synthetic goalscorer 'Own Goal'. The leaderboard counts only own goals with a recorded goalscorer."
      coverage={`${fmtNum(ogSummary.named)} of ${fmtNum(ogSummary.total)} own goals carry a named goalscorer; the remaining ${fmtNum(ogSummary.unknown)}, mostly pre-war, were recorded only as "own goal".`}
    >
      {ogRepeat.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-medium text-ink-dim">The only two to do it twice</h3>
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
    <div className="space-y-4">
      <ThreadBeatRow
        lead={
          <>
            Following United means following the road — <ThreadUnderline>{fmtNum(footprint.length)} away grounds</ThreadUnderline> in{" "}
            <ThreadUnderline>{fmtNum(countries)} countries</ThreadUnderline>, from Lancashire hops to{" "}
            <ThreadUnderline>{fmtNum(Math.round(farthest.km))} km</ThreadUnderline> at {farthest.name}.
            European football from &apos;56 stretched the map; the league&apos;s southern spread did the rest.
          </>
        }
        beats={[
          {
            id: "domestic",
            label: "League",
            title: `${fmtNum(domestic.length)} grounds`,
            detail: "The domestic footprint",
            tone: "var(--color-devil-bright)",
            note: "Short trips to Lancashire, longer hauls as the league spread south.",
          },
          {
            id: "europe",
            label: "Europe",
            title: `${fmtNum(european.length)} clubs`,
            detail: "Continental away nights",
            tone: "var(--color-gold)",
            highlight: true,
            note: "The nights that take you past the Channel.",
          },
          {
            id: "farthest",
            label: "Farthest",
            title: farthest.name,
            detail: `${fmtNum(Math.round(farthest.km))} km from Manchester`,
            tone: "var(--color-gold)",
            note: `${Math.round(totalKm / 1000).toLocaleString()}k km mapped across the full away record.`,
          },
        ]}
      />
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
    </div>
  );
  return (
    <Module
      slug="away-days"
      evidence={{ href: "/matches?venue=A", label: "Every away match →", count: travelCov.total, countNoun: "away matches" }}
      variant={variant}
      visual={travelVisual}
      visualLabel="Following the road"
      finding={`An away day is half the ritual — ${fmtNum(footprint.length)} grounds in ${fmtNum(countries)} countries, from a short hop across Lancashire to ${fmtNum(Math.round(farthest.km))} km at ${farthest.name}. Across ${fmtNum(travelCov.covered)} mapped away matches the mileage stacks to ${Math.round(totalKm / 1000).toLocaleString()}k km; the average trip stepped up when European football arrived in 1956 and the league spread south.`}
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
  "ferguson-era": FergusonEraModule,
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
