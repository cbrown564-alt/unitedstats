import Link from "next/link";
import {
  calibration, oddsFor, ratedOpponents, simulateLeagueSeason, HOME_ADVANTAGE,
} from "@/lib/predict";
import { Bars } from "@/components/charts";
import { ChartPanel } from "@/components/ChartPanel";
import { CoverageNote } from "@/components/CoverageNote";
import { DataTable } from "@/components/DataTable";
import { fmtNum, pct, venueLabel } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "What are the odds?" };

function Pct({ value }: { value: number }) {
  return <span className="stat-num">{(100 * value).toFixed(0)}%</span>;
}

export default async function OddsPage({
  searchParams,
}: {
  searchParams: Promise<{ opponent?: string; venue?: string }>;
}) {
  const sp = await searchParams;
  const opponents = ratedOpponents();
  const opponentId = sp.opponent && opponents.some((o) => o.id === sp.opponent) ? sp.opponent : "liverpool";
  const venue = sp.venue === "A" || sp.venue === "N" ? sp.venue : "H";
  const odds = oddsFor(opponentId, venue);
  const sim = simulateLeagueSeason();
  const buckets = calibration();
  const totalRated = buckets.reduce((a, b) => a + b.p, 0);

  return (
    <div className="space-y-12">
      <header>
        <nav className="text-sm text-ink-faint mb-2">
          <Link href="/analytics" className="hover:text-ink">Analytics</Link>
          <span className="mx-1.5">/</span>
          <span className="text-ink-dim">Odds</span>
        </nav>
        <h1 className="display text-3xl">What are the odds?</h1>
        <p className="text-sm text-ink-dim mt-1 max-w-2xl">
          A careful predictive layer on the closed-universe Elo: pick any opponent United have met
          and see what today&apos;s ratings say about a hypothetical next meeting. These are
          rating-based signals calibrated on {fmtNum(totalRated)} matches, not betting odds, and
          every number links back to the record that produced it.
        </p>
      </header>

      {/* odds widget */}
      <section>
        <h2 className="display text-xl mb-3">A hypothetical next meeting</h2>
        <div className="border border-line rounded-lg bg-panel p-4">
          <form method="GET" className="flex flex-wrap items-end gap-3 text-sm">
            <label className="flex flex-col gap-1">
              <span className="text-xs text-ink-faint uppercase tracking-wider">Opponent</span>
              <select
                name="opponent"
                defaultValue={opponentId}
                className="bg-panel-2 border border-line rounded px-2 py-1.5 focus:outline-2 focus:outline-devil-bright"
              >
                {opponents.map((o) => (
                  <option key={o.id} value={o.id}>{o.name}</option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-ink-faint uppercase tracking-wider">Venue</span>
              <select
                name="venue"
                defaultValue={venue}
                className="bg-panel-2 border border-line rounded px-2 py-1.5 focus:outline-2 focus:outline-devil-bright"
              >
                <option value="H">Home</option>
                <option value="A">Away</option>
                <option value="N">Neutral</option>
              </select>
            </label>
            <button
              type="submit"
              className="bg-devil text-ink rounded px-4 py-1.5 font-medium hover:bg-devil-bright focus:outline-2 focus:outline-devil-bright transition-colors"
            >
              Work it out
            </button>
          </form>

          {odds && (
            <div className="mt-5">
              <p className="text-sm text-ink-dim mb-3">
                United v <span className="text-ink font-medium">{odds.opponentName}</span>,{" "}
                {venueLabel(venue).toLowerCase()}, at today&apos;s ratings:
              </p>
              <div className="grid grid-cols-3 gap-px bg-line border border-line rounded-lg overflow-hidden max-w-xl text-center">
                <div className="bg-panel-2 px-3 py-3">
                  <div className="stat-num text-2xl font-semibold text-win">{(100 * odds.pW).toFixed(0)}%</div>
                  <div className="text-[11px] text-ink-faint uppercase tracking-wider">United win</div>
                </div>
                <div className="bg-panel-2 px-3 py-3">
                  <div className="stat-num text-2xl font-semibold text-draw">{(100 * odds.pD).toFixed(0)}%</div>
                  <div className="text-[11px] text-ink-faint uppercase tracking-wider">Draw</div>
                </div>
                <div className="bg-panel-2 px-3 py-3">
                  <div className="stat-num text-2xl font-semibold text-loss">{(100 * odds.pL).toFixed(0)}%</div>
                  <div className="text-[11px] text-ink-faint uppercase tracking-wider">{odds.opponentName} win</div>
                </div>
              </div>
              <CoverageNote
                slice={`United ${Math.round(odds.unitedElo)} v ${odds.opponentName} ${Math.round(odds.opponentElo)} (closed-universe Elo, ${venueLabel(venue).toLowerCase()} worth ${venue === "N" ? 0 : HOME_ADVANTAGE} points), expectancy ${(100 * odds.expected).toFixed(0)}%, split using the ${fmtNum(odds.sample)} historical matches in that expectancy band.`}
                evidenceHref={`/matches?opponent=${opponentId}`}
                evidenceLabel={`All ${fmtNum(odds.meetings)} rated meetings →`}
              >
                {odds.opponentName}&apos;s rating moves only when they play United; it was last
                updated {odds.lastMet}. Treat long-dormant opponents accordingly.
              </CoverageNote>
            </div>
          )}
        </div>
      </section>

      {/* season replay */}
      {sim && (
        <section>
          <ChartPanel
            title={`Replaying ${sim.season} from the ratings`}
            slice={`each of the ${sim.matches} ${sim.competitionName} matches redrawn ${fmtNum(sim.runs)} times from its pre-match win expectancy, 3 points for a win. This describes points totals, not table positions.`}
            note={
              <>
                The ratings expected about {sim.meanPoints.toFixed(0)} points (90% of replays
                landed between {sim.p5} and {sim.p95}); the real side took{" "}
                <span className="text-gold stat-num">{sim.actualPoints}</span>, a total only{" "}
                {pct(Math.round(sim.shareAbove * sim.runs), sim.runs)} of replays beat. Open the{" "}
                <Link href={`/seasons/${sim.season}`} className="text-devil-bright hover:underline">
                  season
                </Link>{" "}
                to see which results did it.
              </>
            }
          >
            <Bars
              data={sim.distribution.map((d) => ({ label: String(d.points), value: d.share }))}
              labelEvery={5}
              height={190}
              highlightLabel={String(sim.actualPoints)}
            />
          </ChartPanel>
        </section>
      )}

      {/* calibration */}
      <section>
        <h2 className="display text-xl mb-3">Where the probabilities come from</h2>
        <DataTable
          columns={[
            { label: "Pre-match expectancy", render: (b: (typeof buckets)[number]) => `${(100 * b.lo).toFixed(0)}–${(100 * b.hi).toFixed(0)}%` },
            { label: "Matches", numeric: true, render: (b) => fmtNum(b.p) },
            { label: "Won", numeric: true, render: (b) => <Pct value={b.w / b.p} /> },
            { label: "Drawn", numeric: true, render: (b) => <Pct value={b.d / b.p} /> },
            { label: "Lost", numeric: true, render: (b) => <Pct value={b.l / b.p} /> },
          ]}
          rows={buckets}
          rowKey={(b) => String(b.lo)}
        />
        <CoverageNote
          slice={`all ${fmtNum(totalRated)} rated matches since 1886, grouped by the Elo win expectancy United carried into them.`}
        >
          Elo folds draws into one number, so the W/D/L split is read straight from history: when
          the ratings said 60–70%, United actually won half and drew a quarter. That observed split
          is what the widget above applies. The expectancy itself is on every match page.
        </CoverageNote>
      </section>
    </div>
  );
}
