import Link from "next/link";
import {
  allTimeRecord, getMeta, recentMatches, recordByCompetitionType,
  eloSeries, topScorers,
} from "@/lib/queries";
import { fmtNum, pct } from "@/lib/format";
import { MatchList } from "@/components/MatchList";
import { WdlBar } from "@/components/WdlBar";
import { AreaChart } from "@/components/charts";

export const dynamic = "force-dynamic";

const TYPE_LABELS: Record<string, string> = {
  league: "League",
  "domestic-cup": "FA Cup",
  "league-cup": "League Cup",
  european: "Europe",
  "super-cup": "Shields & Super Cups",
  world: "World",
  playoff: "Test Matches",
  unofficial: "Unofficial",
};

export default function Home() {
  const meta = getMeta();
  const rec = allTimeRecord();
  const byType = recordByCompetitionType();
  const recent = recentMatches(8);
  const elo = eloSeries();
  const scorers = topScorers(8);
  const firstYear = meta.first_match?.slice(0, 4) ?? "1886";
  const lastDate = meta.last_match ?? "";

  return (
    <div className="space-y-12">
      {/* hero */}
      <section className="hero-grid -mx-4 sm:-mx-6 px-4 sm:px-6 py-12 border-b border-line">
        <p className="text-xs uppercase tracking-[0.25em] text-devil-bright font-semibold mb-3">
          From Newton Heath to today
        </p>
        <h1 className="display text-4xl sm:text-6xl leading-[0.95] max-w-3xl">
          Every match Manchester United ever played
        </h1>
        <p className="mt-4 text-ink-dim max-w-xl text-sm sm:text-base">
          {fmtNum(rec.p)} matches across {new Date().getFullYear() - Number(firstYear)} years of league,
          cup, and European football — results, attendances, scorers, managers, and the numbers behind them.
        </p>
        <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-px bg-line border border-line rounded-lg overflow-hidden max-w-2xl">
          {[
            ["Matches", fmtNum(rec.p)],
            ["Wins", fmtNum(rec.w)],
            ["Goals scored", fmtNum(rec.gf)],
            ["Win rate", pct(rec.w, rec.p)],
          ].map(([label, value]) => (
            <div key={label} className="bg-panel px-4 py-3">
              <div className="stat-num text-2xl font-semibold">{value}</div>
              <div className="text-xs text-ink-faint uppercase tracking-wider mt-0.5">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* recent + record by competition */}
      <section className="grid lg:grid-cols-[1fr_20rem] gap-10">
        <div>
          <div className="flex items-baseline justify-between mb-3">
            <h2 className="display text-xl">Latest results</h2>
            <Link href="/matches" className="text-xs text-devil-bright hover:underline">
              All matches →
            </Link>
          </div>
          <MatchList matches={recent} showSeason />
        </div>
        <div className="space-y-6">
          <h2 className="display text-xl">All-time record</h2>
          <div className="space-y-4">
            {byType
              .filter((t) => t.type !== "unofficial")
              .map((t) => (
                <div key={t.type}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-ink-dim">{TYPE_LABELS[t.type] ?? t.type}</span>
                    <span className="stat-num text-xs text-ink-faint">
                      {fmtNum(t.p)} P · {pct(t.w, t.p)} W
                    </span>
                  </div>
                  <WdlBar w={t.w} d={t.d} l={t.l} />
                </div>
              ))}
          </div>
          <div className="text-xs text-ink-faint">
            Data through <span className="stat-num">{lastDate}</span> — updated automatically after every match.
          </div>
        </div>
      </section>

      {/* Elo */}
      <section>
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="display text-xl">Strength over {new Date().getFullYear() - Number(firstYear)} years</h2>
          <Link href="/analytics" className="text-xs text-devil-bright hover:underline">
            Analytics →
          </Link>
        </div>
        <div className="border border-line rounded-lg bg-panel p-4">
          <AreaChart
            points={elo.map((e) => ({ x: Date.parse(e.date), y: e.elo }))}
            baseline={1500}
            labels={[1900, 1925, 1950, 1975, 2000, 2025].map((y) => ({
              x: Date.parse(`${y}-01-01`),
              text: String(y),
            }))}
          />
          <p className="text-xs text-ink-faint mt-2">
            Club Elo rating after every competitive match since {firstYear}. The dashed line is the 1500 starting
            baseline.
          </p>
        </div>
      </section>

      {/* scorers teaser */}
      {scorers.length > 0 && (
        <section>
          <div className="flex items-baseline justify-between mb-3">
            <h2 className="display text-xl">Most goals</h2>
            <Link href="/players" className="text-xs text-devil-bright hover:underline">
              All players →
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-line border border-line rounded-lg overflow-hidden">
            {scorers.map((p, i) => (
              <Link key={p.player_id} href={`/player/${p.player_id}`} className="bg-panel px-4 py-3 hover:bg-panel-2 transition-colors">
                <div className="stat-num text-2xl font-semibold text-devil-bright">{p.goals}</div>
                <div className="text-sm truncate">{p.name}</div>
                <div className="text-xs text-ink-faint stat-num">
                  #{i + 1}
                  {p.first_date ? ` · ${p.first_date.slice(0, 4)}–${p.last_date?.slice(0, 4)}` : ""}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
