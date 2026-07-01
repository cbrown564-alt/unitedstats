import Link from "next/link";
import { familyName } from "@/lib/names";
import {
  eloSeries, getMeta,
  topAssistPartnerships, coverageOverview, managersIndex, honourSeasonMarkers,
} from "@/lib/queries";
import { calibration, simulateLeagueSeason } from "@/lib/predict";
import { CoverageNote } from "@/components/CoverageNote";
import { EloHero } from "@/components/EloHero";
import { ReliabilityCurve } from "@/components/charts/ReliabilityCurve";
import { InspectableBarChartLazy as InspectableBarChart } from "@/components/charts/lazy";
import { PageHeader, StatTile, TrailLink } from "@/components/PageHeader";
import { SupplyLineRows } from "@/components/SupplyLineRows";
import { ChapterPager, type Chapter } from "@/components/mobile/ChapterPager";
import { fmtNum, pct } from "@/lib/format";

export const metadata = { title: "Analytics" };

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

function SupplyLinesSection({ showHeader = true }: { showHeader?: boolean }) {
  const partnerships = topAssistPartnerships(10);

  return (
    <div>
      {showHeader && (
        <div className="mb-3">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-devil-bright">Supply lines</p>
          <h3 className="display text-xl">The partnerships that built the goals</h3>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-ink-dim">
            Assister on the left, scorer on the right — bar width is how many goals that combination produced.
          </p>
        </div>
      )}
      <SupplyLineRows rows={partnerships} />
    </div>
  );
}

export default function AnalyticsPage() {
  const elo = eloSeries();
  const meta = getMeta();
  const overview = coverageOverview();

  const sim = simulateLeagueSeason();
  const buckets = calibration();

  const currentElo = elo.length ? Math.round(elo[elo.length - 1].elo) : 1500;
  const peak = elo.reduce((a, b) => (b.elo > a.elo ? b : a), elo[0]);
  const trough = elo.reduce((a, b) => (b.elo < a.elo ? b : a), elo[0]);

  const managers = managersIndex().filter((m) => m.first && m.p > 0);
  const lastEloDate = elo.length ? elo[elo.length - 1].date : null;
  const managerEras = managers.map((m, i) => ({
    from: m.first!,
    to: managers[i + 1]?.first ?? lastEloDate ?? m.last!,
    label: m.p >= 250 ? familyName(m.name) : undefined,
  }));

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
    <div className="rounded-lg border border-line bg-panel p-4 shadow-[0_1px_0_rgb(255_255_255_/_0.025)_inset]">
      {!embedded && (
        <div className="mb-3">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-devil-bright">A season as the ratings saw it</p>
          <h3 className="display text-xl">Replaying {sim.season} from the ratings</h3>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-ink-dim">
            Each match redrawn thousands of times from its pre-match win expectancy — a plain-language
            check that the rating&apos;s expectations match what actually happened over a full campaign.
          </p>
        </div>
      )}
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
      <CoverageNote
        collapsible
        slice={`each of the ${sim.matches} ${sim.competitionName} matches redrawn ${fmtNum(sim.runs)} times from its pre-match win expectancy, 3 points for a win. This describes points totals, not table positions.`}
      >
        The ratings expected about {sim.meanPoints.toFixed(0)} points (90% of replays
        landed between {sim.p5} and {sim.p95}); the real side took{" "}
        <span className="stat-num text-gold">{sim.actualPoints}</span>, a total only{" "}
        {pct(Math.round(sim.shareAbove * sim.runs), sim.runs)} of replays beat. Open the{" "}
        <Link href={`/seasons/${sim.season}`} className="text-devil-bright hover:underline">season</Link>{" "}
        to see which results did it.
      </CoverageNote>
    </div>
  ) : null;

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
      id: "partnerships",
      kicker: "03 · Supply lines",
      title: "The partnerships that built the goals",
      dek: "Assister ↔ scorer — bar width is goals.",
      content: <SupplyLinesSection showHeader={false} />,
    },
  ];

  return (
    <div className="space-y-14">
      <PageHeader
        eyebrow="Strength layer"
        title="Analytics"
        deferOnMobile
        aside={
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-line bg-line sm:min-w-80">
            <StatTile label="Matches" value={fmtNum(Number(meta.matches))} tone="red" />
            <StatTile label="Scorer rows" value={fmtNum(overview.completeScorers)} />
          </div>
        }
      >
        The strength layer: one Elo rating behind United, read three ways — the signal itself, how well it
        reads the matches it has rated, and the assist supply lines that built the goals.
      </PageHeader>

      <ChapterPager chapters={mobileChapters} label="Analytics chapters" />

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
          <Act n="03" kicker="Supply lines" title="The partnerships that built the goals">
            Who set up whom — the recorded assist combinations, read as barbell rows rather than a flat list.
          </Act>

          <section>
            <SupplyLinesSection />
          </section>
        </div>
      </div>

      {appendix}
    </div>
  );
}
