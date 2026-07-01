import Link from "next/link";
import { familyName } from "@/lib/names";
import {
  eloSeries, seasonAggregates, getMeta,
  topAssistPartnerships, coverageOverview, managersIndex, honourSeasonMarkers,
} from "@/lib/queries";
import { clubRecords } from "@/lib/trails";
import { calibration, simulateLeagueSeason } from "@/lib/predict";
import { ChartPanel } from "@/components/ChartPanel";
import { CoverageNote } from "@/components/CoverageNote";
import { EloHero } from "@/components/EloHero";
import { ReliabilityCurve } from "@/components/charts/ReliabilityCurve";
import {
  InspectableBarChartLazy as InspectableBarChart,
  InspectableTimeSeriesChartLazy as InspectableTimeSeriesChart,
} from "@/components/charts/lazy";
import { PageHeader, StatTile, TrailLink } from "@/components/PageHeader";
import { PlayerPortrait } from "@/components/PlayerPortrait";
import { RecordCards, type RecordCard } from "@/components/RecordCards";
import { ChapterPager, type Chapter } from "@/components/mobile/ChapterPager";
import { fmtDate, fmtMonthYear, fmtNum, pct, scoreline, venuePrefix } from "@/lib/format";

export const metadata = { title: "Analytics" };

/**
 * Act header — the page's three movements (the signal, what it projects, what it
 * produced). Bolder than a plain divider: a ghosted act numeral, a kicker, a
 * title, and a one-line dek, so the eye registers a real change of chapter.
 */
function Act({ n, kicker, title, children }: { n: string; kicker: string; title: string; children?: React.ReactNode }) {
  return (
    <header className="flex items-baseline gap-4 border-b border-line/70 pb-3">
      <span aria-hidden className="display text-4xl leading-none text-devil-bright/25 sm:text-5xl">{n}</span>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-devil-bright">{kicker}</p>
        <h2 className="display text-2xl">{title}</h2>
        {children && <p className="mt-1 max-w-2xl text-sm leading-6 text-ink-dim">{children}</p>}
      </div>
    </header>
  );
}

export default function AnalyticsPage() {
  const elo = eloSeries();
  const seasons = seasonAggregates();
  const partnerships = topAssistPartnerships(10);
  const meta = getMeta();
  const overview = coverageOverview();

  const sim = simulateLeagueSeason();
  const buckets = calibration();

  const currentElo = elo.length ? Math.round(elo[elo.length - 1].elo) : 1500;
  const peak = elo.reduce((a, b) => (b.elo > a.elo ? b : a), elo[0]);
  const trough = elo.reduce((a, b) => (b.elo < a.elo ? b : a), elo[0]);
  const yearTicks = [1900, 1930, 1960, 1990, 2020].map((year) => ({ x: year, label: String(year) }));

  const managers = managersIndex().filter((m) => m.first && m.p > 0);
  const lastEloDate = elo.length ? elo[elo.length - 1].date : null;
  const managerEras = managers.map((m, i) => ({
    from: m.first!,
    to: managers[i + 1]?.first ?? lastEloDate ?? m.last!,
    label: m.p >= 250 ? familyName(m.name) : undefined,
  }));

  const rec = clubRecords();
  const recordCards: RecordCard[] = [];
  if (rec.biggestWin) {
    const m = rec.biggestWin;
    recordCards.push({
      eyebrow: "Biggest win", figure: scoreline(m.gf, m.ga), tone: "win",
      detail: `${venuePrefix(m.venue)} ${m.opponent_name}`,
      meta: `${fmtDate(m.date)} · ${m.competition_name}`, href: `/match/${m.id}`,
    });
  }
  if (rec.heaviestDefeat) {
    const m = rec.heaviestDefeat;
    recordCards.push({
      eyebrow: "Heaviest defeat", figure: scoreline(m.gf, m.ga), tone: "loss",
      detail: `${venuePrefix(m.venue)} ${m.opponent_name}`,
      meta: `${fmtDate(m.date)} · ${m.competition_name}`, href: `/match/${m.id}`,
    });
  }
  if (rec.recordCrowd?.attendance != null) {
    const m = rec.recordCrowd;
    recordCards.push({
      eyebrow: "Record crowd", figure: fmtNum(m.attendance), tone: "gold",
      detail: `${venuePrefix(m.venue)} ${m.opponent_name} · ${scoreline(m.gf, m.ga)}`,
      meta: `${fmtDate(m.date)} · ${m.competition_name}`, href: `/match/${m.id}`,
    });
  }
  if (rec.mostGoalsInSeason) {
    const s = rec.mostGoalsInSeason;
    recordCards.push({
      eyebrow: "Most goals in a season", figure: fmtNum(s.gf), unit: "goals", tone: "devil",
      detail: s.season, meta: `${fmtNum(s.p)} matches · all competitions`,
      href: `/seasons/${s.season}`,
    });
  }
  if (rec.longestUnbeaten) {
    const r = rec.longestUnbeaten;
    recordCards.push({
      eyebrow: "Longest unbeaten run", figure: String(r.length), unit: "matches", tone: "win",
      detail: `${fmtMonthYear(r.from)}–${fmtMonthYear(r.to)}`,
      meta: "wins and draws, official matches", href: `/matches?from=${r.from}&to=${r.to}`,
    });
  }
  if (rec.longestWinning) {
    const r = rec.longestWinning;
    recordCards.push({
      eyebrow: "Longest winning run", figure: String(r.length), unit: "wins", tone: "win",
      detail: `${fmtMonthYear(r.from)}–${fmtMonthYear(r.to)}`,
      meta: "consecutive victories", href: `/matches?from=${r.from}&to=${r.to}`,
    });
  }

  const maxAssist = partnerships[0]?.goals ?? 1;

  const eloHero = (
    <EloHero
      points={elo}
      eras={managerEras}
      trophyMarkers={honourSeasonMarkers()}
      current={currentElo}
      peak={peak}
      trough={trough}
      firstYear={meta.first_match?.slice(0, 4)}
    />
  );

  const eloHeroChapter = (
    <EloHero
      points={elo}
      eras={managerEras}
      trophyMarkers={honourSeasonMarkers()}
      current={currentElo}
      peak={peak}
      trough={trough}
      firstYear={meta.first_match?.slice(0, 4)}
      compact
    />
  );

  const reliabilityPanel = (
    <div className="min-w-0 overflow-x-auto rounded-lg border border-line bg-panel p-4 shadow-[0_1px_0_rgb(255_255_255_/_0.025)_inset]">
      <ReliabilityCurve buckets={buckets} />
      <CoverageNote
        collapsible
        slice={`all ${fmtNum(buckets.reduce((a, b) => a + b.p, 0))} rated matches since 1886, grouped into deciles by the Elo win expectancy United carried into them.`}
      >
        The red points track expected against actual points share; sitting on the diagonal means
        the ratings land where they aim. The win-rate dots fall below because Elo folds draws in —
        the gap up to the line is the draw, widest in the evenly-matched middle.
      </CoverageNote>
    </div>
  );

  const simPanel = (embedded = false) =>
    sim ? (
    <ChartPanel
      embedded={embedded}
      title={`Replaying ${sim.season} from the ratings`}
      kicker={embedded ? undefined : "A season as the ratings saw it"}
      collapsibleNote
      slice={`each of the ${sim.matches} ${sim.competitionName} matches redrawn ${fmtNum(sim.runs)} times from its pre-match win expectancy, 3 points for a win. This describes points totals, not table positions.`}
      note={
        <>
          The ratings expected about {sim.meanPoints.toFixed(0)} points (90% of replays
          landed between {sim.p5} and {sim.p95}); the real side took{" "}
          <span className="stat-num text-gold">{sim.actualPoints}</span>, a total only{" "}
          {pct(Math.round(sim.shareAbove * sim.runs), sim.runs)} of replays beat. Open the{" "}
          <Link href={`/seasons/${sim.season}`} className="text-devil-bright hover:underline">season</Link>{" "}
          to see which results did it.
        </>
      }
    >
      <InspectableBarChart
        data={sim.distribution.map((d) => ({
          label: String(d.points),
          value: d.share * 100,
          valueLabel: `${(100 * d.share).toFixed(0)}% of replays`,
          meta: `${fmtNum(Math.round(d.share * sim.runs))} of ${fmtNum(sim.runs)} simulations`,
        }))}
        labelEvery={5}
        height={190}
        highlightLabel={String(sim.actualPoints)}
        chartLabel={`${sim.season} replayed points distribution`}
        yTickSuffix="%"
      />
    </ChartPanel>
  ) : null;

  const recordsSection = (
    <>
      <RecordCards records={recordCards} />
      <CoverageNote
        collapsible
        slice="all-time peaks across official competitions — friendlies and wartime excluded, so a friendly rout or a wartime goal glut can't pose as a record. Each card opens its match or season."
      >
        Ranked in full in the browser:{" "}
        <Link href="/matches?sort=margin" className="text-devil-bright hover:underline">biggest wins</Link>,{" "}
        <Link href="/matches?sort=defeat" className="text-devil-bright hover:underline">heaviest defeats</Link>,{" "}
        <Link href="/matches?sort=attendance" className="text-devil-bright hover:underline">biggest crowds</Link>.
      </CoverageNote>
    </>
  );

  const winRatePanel = (embedded = false) => (
    <ChartPanel
      embedded={embedded}
      title="Win rate by season"
      collapsibleNote
      slice="all competitions per season; the dashed line is 50%. Troughs mark the relegation seasons and the early 1930s; the plateau is the Ferguson era."
      note={
        <>
          <Link href="/seasons" className="text-devil-bright hover:underline">Season by season →</Link>
        </>
      }
    >
      <InspectableTimeSeriesChart
        data={seasons.map((s) => ({
          x: Number(s.season.slice(0, 4)),
          y: s.win_pct,
          label: s.season,
          valueLabel: `${s.win_pct.toFixed(0)}% won`,
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
  );

  const goalsPanel = (embedded = false) => (
    <ChartPanel
      embedded={embedded}
      title="Goals scored per season"
      collapsibleNote
      slice="goals scored, all competitions — taller wartime-adjacent seasons partly reflect longer cup runs."
      note={
        <Link href="/seasons" className="text-devil-bright hover:underline">Season detail →</Link>
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
  );

  const attendancePanel = (embedded = false) => (
    <ChartPanel
      embedded={embedded}
      title="Average home attendance"
      kicker={embedded ? undefined : "The crowd, century-long"}
      collapsibleNote
      slice="mean of recorded home attendances per season."
      coverage="sparse before the 1920s — early points lean on few matches. The post-war boom and the 1990s expansion of Old Trafford are the two big climbs."
    >
      <InspectableTimeSeriesChart
        data={seasons.filter((s) => s.avg_att).map((s) => ({
          x: Number(s.season.slice(0, 4)),
          y: s.avg_att!,
          label: s.season,
          valueLabel: `${fmtNum(s.avg_att!)} average`,
          meta: `${fmtNum(s.p)} matches in all competitions`,
        }))}
        height={170}
        stroke="var(--color-gold)"
        fill="rgb(245 197 24 / 0.08)"
        chartLabel="Manchester United average home attendance by season"
        valueLabel="Average attendance"
        xTicks={yearTicks}
      />
    </ChartPanel>
  );

  const partnershipsSection = (
    <div className="rounded-lg border border-line bg-panel p-4 shadow-[0_1px_0_rgb(255_255_255_/_0.025)_inset]">
      {partnerships.length > 0 ? (
        <ul className="space-y-2.5 text-sm">
          {partnerships.map((row) => (
            <li
              key={`${row.assister_id}-${row.scorer_id}`}
              className="flex items-center gap-2.5"
            >
              <div className="flex shrink-0 items-center gap-1">
                <PlayerPortrait name={row.assister_name} src={row.assister_thumb} size="xs" />
                <span className="text-xs text-ink-faint" aria-hidden>→</span>
                <PlayerPortrait name={row.scorer_name} src={row.scorer_thumb} size="xs" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="min-w-0 truncate">
                    <Link href={`/player/${row.assister_id}`} className="font-medium hover:text-devil-bright">
                      {row.assister_name}
                    </Link>
                    <span className="mx-1.5 text-ink-faint">→</span>
                    <Link href={`/player/${row.scorer_id}`} className="font-medium hover:text-devil-bright">
                      {row.scorer_name}
                    </Link>
                  </p>
                  <span className="stat-num shrink-0 text-devil-bright">{row.goals}</span>
                </div>
                <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-panel-2" aria-hidden>
                  <div className="h-full rounded-full bg-devil" style={{ width: `${(row.goals / maxAssist) * 100}%` }} />
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-ink-dim">
          Assist fields are wired through the data and player pages; no current source in the
          checked-in dataset records assists for these matches.
        </p>
      )}
      <CoverageNote
        collapsible
        coverage="assist events exist only from 2012–13 onward (transfermarkt-datasets); no open source records United assists before then, so earlier seasons are blank by source limitation, not omission."
      >
        Bars scale to the top pairing.
      </CoverageNote>
    </div>
  );

  const appendix = (
    <div className="space-y-4 border-t border-line/70 pt-8">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-faint">Where next</p>
      <section className="grid gap-3 sm:grid-cols-3">
        <TrailLink href="/data" title="Data and coverage">
          Results are complete for every decade; goalscorer depth reaches {fmtNum(overview.completeScorers)} of{" "}
          {fmtNum(overview.matches)} matches and {fmtNum(Number(meta.matches_with_lineups ?? 0))} carry full
          lineups. See the ledger and how the gaps get filled.
        </TrailLink>
        <TrailLink href="/matches" title="Match browser">
          Every match, filterable by competition, opponent, season, venue, and result — the auditable
          spine these summaries read from.
        </TrailLink>
        <TrailLink href="/explore" title="Discover">
          The myth-testing trails: late goals, bogey sides, the manager bounce, and the Old Trafford
          fortress, each with its own evidence.
        </TrailLink>
      </section>
    </div>
  );

  const mobileChapters: Chapter[] = [
    {
      id: "signal",
      kicker: "01 · The signal",
      title: "United's strength, measured",
      dek: "A single rating, updated match by match for over a century.",
      content: eloHeroChapter,
    },
    {
      id: "reliability",
      kicker: "02 · Does it hold up",
      title: "Does the expectancy come true?",
      dek: "Expected vs actual across every rated match.",
      content: reliabilityPanel,
    },
    ...(sim
      ? [{
          id: "replay",
          kicker: "02 · Does it hold up",
          title: `Replaying ${sim.season} from the ratings`,
          dek: "One season redrawn from pre-match win expectancy.",
          content: simPanel(true),
        } satisfies Chapter]
      : []),
    {
      id: "records",
      kicker: "03 · What it produced",
      title: "The outright peaks",
      dek: "All-time records as answer-objects — each opens its proof.",
      content: recordsSection,
    },
    {
      id: "win-rate",
      kicker: "03 · What it produced",
      title: "Win rate by season",
      content: winRatePanel(true),
    },
    {
      id: "goals",
      kicker: "03 · What it produced",
      title: "Goals scored per season",
      content: goalsPanel(true),
    },
    {
      id: "attendance",
      kicker: "03 · What it produced",
      title: "Average home attendance",
      dek: "The crowd, century-long",
      content: attendancePanel(true),
    },
    {
      id: "partnerships",
      kicker: "03 · Supply lines",
      title: "The partnerships that built the goals",
      content: partnershipsSection,
    },
  ];

  return (
    <div className="space-y-14">
      <PageHeader
        eyebrow="Strength layer"
        title="Analytics"
        aside={
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-line bg-line sm:min-w-80">
            <StatTile label="Matches" value={fmtNum(Number(meta.matches))} tone="red" />
            <StatTile label="Scorer rows" value={fmtNum(overview.completeScorers)} />
          </div>
        }
      >
        The strength layer: one Elo rating behind United, read three ways — the signal itself, how well it
        reads the matches it has rated, and the long arc of records and form it has left behind.
      </PageHeader>

      <ChapterPager chapters={mobileChapters} label="Analytics chapters" />

      {/* Desktop — three-act vertical narrative unchanged. */}
      <div className="hidden space-y-14 sm:block">
        <div className="space-y-6">
          <Act n="01" kicker="The signal" title="United's strength, measured">
            A single rating, updated match by match for over a century. It rises when United beat sides
            they shouldn't and sinks when they don't.
          </Act>
          {eloHero}
        </div>

        <div className="space-y-8">
          <Act n="02" kicker="Does it hold up" title="Testing the rating against history">
            The rating folds each result into one number. Both of these check it against what actually
            happened — first across every rated match, then across a single season replayed.
          </Act>

          <section className="max-w-3xl">
            <div className="mb-3">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-devil-bright">The proof</p>
              <h3 className="display text-xl">Does the expectancy come true?</h3>
            </div>
            {reliabilityPanel}
          </section>

          {simPanel()}
        </div>

        <div className="space-y-8">
          <Act n="03" kicker="What it produced" title="The peaks and the long arc">
            A century of that strength leaves a record: the outright peaks first, then the season-by-season
            shape they sit inside.
          </Act>

          <section>{recordsSection}</section>

          <section className="grid gap-8 lg:grid-cols-2">
            {winRatePanel()}
            {goalsPanel()}
          </section>

          {attendancePanel()}

          <section>
            <div className="mb-3">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-devil-bright">Supply lines</p>
              <h3 className="display text-xl">The partnerships that built the goals</h3>
            </div>
            {partnershipsSection}
          </section>
        </div>
      </div>

      {appendix}
    </div>
  );
}
