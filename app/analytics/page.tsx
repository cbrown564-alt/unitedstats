import Link from "next/link";
import {
  eloSeries, seasonAggregates, getMeta,
  topAssistPartnerships, coverageOverview, managersIndex,
} from "@/lib/queries";
import { clubRecords } from "@/lib/trails";
import { calibration, oddsFor, ratedOpponents, simulateLeagueSeason, HOME_ADVANTAGE } from "@/lib/predict";
import { ChartPanel } from "@/components/ChartPanel";
import { CoverageNote } from "@/components/CoverageNote";
import { EloHero } from "@/components/EloHero";
import { ReliabilityCurve } from "@/components/charts/ReliabilityCurve";
import {
  InspectableBarChartLazy as InspectableBarChart,
  InspectableTimeSeriesChartLazy as InspectableTimeSeriesChart,
} from "@/components/charts/lazy";
import { PageHeader, StatTile, TrailLink } from "@/components/PageHeader";
import { RecordCards, type RecordCard } from "@/components/RecordCards";
import { OddsPredictor } from "@/components/OddsPredictor";
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

  // Prospective half of the strength signal: what the same Elo projects forward.
  const opponents = ratedOpponents();
  // Precompute odds for every rated opponent at each venue so the forecast widget
  // runs entirely client-side and this page can be statically prerendered.
  type OddsResult = NonNullable<ReturnType<typeof oddsFor>>;
  const oddsByOpponent: Record<string, Partial<Record<"H" | "A" | "N", OddsResult>>> = {};
  for (const o of opponents) {
    const entry: Partial<Record<"H" | "A" | "N", OddsResult>> = {};
    for (const v of ["H", "A", "N"] as const) {
      const r = oddsFor(o.id, v);
      if (r) entry[v] = r;
    }
    oddsByOpponent[o.id] = entry;
  }
  const defaultOpponent = opponents.some((o) => o.id === "liverpool") ? "liverpool" : opponents[0]?.id ?? "";
  const sim = simulateLeagueSeason();
  const buckets = calibration();

  const currentElo = elo.length ? Math.round(elo[elo.length - 1].elo) : 1500;
  const peak = elo.reduce((a, b) => (b.elo > a.elo ? b : a), elo[0]);
  const trough = elo.reduce((a, b) => (b.elo < a.elo ? b : a), elo[0]);
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

  // Records chapter: the all-time peaks as answer-objects, each leading with the
  // record figure and routing to its proof. Built only from records that exist.
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
      detail: `${fmtMonthYear(r.from)} – ${fmtMonthYear(r.to)}`,
      meta: "wins and draws, official matches", href: `/matches?from=${r.from}&to=${r.to}`,
    });
  }
  if (rec.longestWinning) {
    const r = rec.longestWinning;
    recordCards.push({
      eyebrow: "Longest winning run", figure: String(r.length), unit: "wins", tone: "win",
      detail: `${fmtMonthYear(r.from)} – ${fmtMonthYear(r.to)}`,
      meta: "consecutive victories", href: `/matches?from=${r.from}&to=${r.to}`,
    });
  }

  const maxAssist = partnerships[0]?.goals ?? 1;

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
        The strength layer: one Elo rating behind United, read three ways — the signal itself, what it
        projects onto the next match, and the long arc of records and form it has left behind.
      </PageHeader>

      {/* ───────────────── Act I — the signal ───────────────── */}
      <div className="space-y-6">
        <Act n="01" kicker="The signal" title="United’s strength, measured">
          A single rating, updated match by match for over a century. It rises when United beat sides
          they shouldn’t and sinks when they don’t.
        </Act>
        <EloHero
          points={elo}
          eras={managerEras}
          current={currentElo}
          peak={peak}
          trough={trough}
          firstYear={meta.first_match?.slice(0, 4)}
        />
      </div>

      {/* ───────────────── Act II — what it projects ───────────────── */}
      <div className="space-y-8">
        <Act n="02" kicker="What it projects" title="From a rating to the odds">
          The rating folds a result into one number, so win, draw, and loss come from history: how
          sides at this strength gap have actually fared. First the proof, then the forecast.
        </Act>

        <section className="grid items-start gap-8 lg:grid-cols-2">
          <div>
            <div className="mb-3">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-devil-bright">The proof</p>
              <h3 className="display text-xl">Does the expectancy come true?</h3>
            </div>
            <div className="rounded-lg border border-line bg-panel p-4 shadow-[0_1px_0_rgb(255_255_255_/_0.025)_inset]">
              <ReliabilityCurve buckets={buckets} />
              <CoverageNote slice={`all ${fmtNum(buckets.reduce((a, b) => a + b.p, 0))} rated matches since 1886, grouped into deciles by the Elo win expectancy United carried into them.`}>
                The red points track expected against actual points share; sitting on the diagonal means
                the ratings land where they aim. The win-rate dots fall below because Elo folds draws in —
                the gap up to the line is the draw, widest in the evenly-matched middle.
              </CoverageNote>
            </div>
          </div>

          <div>
            <div className="mb-3">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-devil-bright">The forecast</p>
              <h3 className="display text-xl">A hypothetical next meeting</h3>
            </div>
            <OddsPredictor
              opponents={opponents}
              oddsByOpponent={oddsByOpponent}
              defaultOpponent={defaultOpponent}
              homeAdvantage={HOME_ADVANTAGE}
            />
          </div>
        </section>

        {sim && (
          <ChartPanel
            title={`Replaying ${sim.season} from the ratings`}
            kicker="A season as the ratings saw it"
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
                valueLabel: `${(100 * d.share).toFixed(1)}% of replays`,
                meta: `${fmtNum(Math.round(d.share * sim.runs))} of ${fmtNum(sim.runs)} simulations`,
              }))}
              labelEvery={5}
              height={190}
              highlightLabel={String(sim.actualPoints)}
              chartLabel={`${sim.season} replayed points distribution`}
              yTickSuffix="%"
            />
          </ChartPanel>
        )}
      </div>

      {/* ───────────────── Act III — what it produced ───────────────── */}
      <div className="space-y-8">
        <Act n="03" kicker="What it produced" title="The peaks and the long arc">
          A century of that strength leaves a record: the outright peaks first, then the season-by-season
          shape they sit inside.
        </Act>

        <section>
          <RecordCards records={recordCards} />
          <CoverageNote slice="all-time peaks across official competitions — friendlies and wartime excluded, so a friendly rout or a wartime goal glut can't pose as a record. Each card opens its match or season.">
            Ranked in full in the browser:{" "}
            <Link href="/matches?sort=margin" className="text-devil-bright hover:underline">biggest wins</Link>,{" "}
            <Link href="/matches?sort=defeat" className="text-devil-bright hover:underline">heaviest defeats</Link>,{" "}
            <Link href="/matches?sort=attendance" className="text-devil-bright hover:underline">biggest crowds</Link>.
          </CoverageNote>
        </section>

        <section className="grid gap-8 lg:grid-cols-2">
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
        </section>

        <ChartPanel
          title="Average home attendance"
          kicker="The crowd, century-long"
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
            height={170}
            stroke="var(--color-gold)"
            fill="rgb(245 197 24 / 0.08)"
            chartLabel="Manchester United average home attendance by season"
            valueLabel="Average attendance"
            xTicks={yearTicks}
          />
        </ChartPanel>

        {/* Assist partnerships — the canonical home of the assist-link cut, as a
            ranked supply ladder rather than a flat list. */}
        <section>
          <div className="mb-3">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-devil-bright">Supply lines</p>
            <h3 className="display text-xl">The partnerships that built the goals</h3>
          </div>
          <div className="rounded-lg border border-line bg-panel p-4 shadow-[0_1px_0_rgb(255_255_255_/_0.025)_inset]">
            {partnerships.length > 0 ? (
              <div className="space-y-1.5 text-sm">
                {partnerships.map((row) => (
                  <div
                    key={`${row.assister_id}-${row.scorer_id}`}
                    className="grid grid-cols-[minmax(0,1fr)_7rem_1.5rem] items-center gap-3"
                  >
                    <div className="min-w-0 truncate">
                      <Link href={`/player/${row.assister_id}`} className="font-medium hover:text-devil-bright">
                        {row.assister_name}
                      </Link>
                      <span className="mx-1.5 text-ink-faint">→</span>
                      <Link href={`/player/${row.scorer_id}`} className="font-medium hover:text-devil-bright">
                        {row.scorer_name}
                      </Link>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-panel-2" aria-hidden>
                      <div className="h-full rounded-full bg-devil" style={{ width: `${(row.goals / maxAssist) * 100}%` }} />
                    </div>
                    <span className="stat-num text-right text-devil-bright">{row.goals}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-ink-dim">
                Assist fields are wired through the data and player pages; no current source in the
                checked-in dataset records assists for these matches.
              </p>
            )}
            <CoverageNote coverage="assist events exist only from 2012-13 onward (transfermarkt-datasets); no open source records United assists before then, so earlier seasons are blank by source limitation, not omission.">
              Bars scale to the top pairing.
            </CoverageNote>
          </div>
        </section>
      </div>

      {/* ───────────────── Appendix — provenance & trails ───────────────── */}
      <div className="space-y-4 border-t border-line/70 pt-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-faint">Where next</p>
        <section className="grid gap-3 sm:grid-cols-3">
          <TrailLink href="/data" title="Data & coverage">
            Results are complete for every decade; scorer depth reaches {fmtNum(overview.completeScorers)} of{" "}
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
    </div>
  );
}
