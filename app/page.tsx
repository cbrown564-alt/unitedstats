import Link from "next/link";
import {
  allTimeRecord, getMeta, recentMatches, recordByCompetitionType,
  eloSeries, topScorers,
} from "@/lib/queries";
import { fullestMatchSheets } from "@/lib/trails";
import { fmtNum, pct, fmtDate } from "@/lib/format";
import { MatchList } from "@/components/MatchList";
import { WdlBar } from "@/components/WdlBar";
import { EloRatingChart } from "@/components/charts/EloRatingChart";
import { SearchCommand } from "@/components/SearchCommand";

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

const MYTHS: [question: string, hook: string, href: string][] = [
  ["Do United really score late?", "Late-goal share by decade — is Fergie time an era or a habit?", "/questions#late-goals"],
  ["Which sides are the real bogey teams?", "Lowest win rates across 20+ meetings, home and away.", "/questions#bogey-sides"],
  ["Does Europe cost points at the weekend?", "League form 1–4 days after a European tie, against the same seasons' baseline.", "/questions#european-weeks"],
  ["Is the new-manager bounce real?", "Every manager's first ten matches against the ten before they arrived.", "/questions#manager-bounce"],
  ["How much of a fortress is Old Trafford?", "Home win rate by decade and the longest unbeaten run.", "/questions#fortress"],
  ["Who saved their goals for cup nights?", "Scorers whose goals lean hardest toward cup competition.", "/questions#cup-specialists"],
];

const ROUTES: [label: string, href: string, hint: string][] = [
  ["Matches", "/matches", "filter 6,000+ fixtures"],
  ["Seasons", "/seasons", "1886–87 to today"],
  ["Players", "/players", "every recorded scorer"],
  ["Managers", "/managers", "Mangnall to now"],
  ["Opponents", "/opponents", "every head-to-head"],
  ["Analytics", "/analytics", "Elo, eras, records"],
];

export default function Home() {
  const meta = getMeta();
  const rec = allTimeRecord();
  const byType = recordByCompetitionType();
  const recent = recentMatches(8);
  const elo = eloSeries();
  const scorers = topScorers(8);
  const fullest = fullestMatchSheets(4);
  const firstYear = meta.first_match?.slice(0, 4) ?? "1886";
  const lastDate = meta.last_match ?? "";

  return (
    <div className="space-y-12">
      {/* hero: the curiosity launchpad */}
      <section className="hero-grid -mx-4 sm:-mx-6 px-4 sm:px-6 py-12 border-b border-line">
        <p className="text-xs uppercase tracking-[0.25em] text-devil-bright font-semibold mb-3">
          From Newton Heath to today
        </p>
        <h1 className="display text-4xl sm:text-6xl leading-[0.95] max-w-3xl">
          Every match Manchester United ever played
        </h1>
        <p className="mt-4 text-ink-dim max-w-xl text-sm sm:text-base">
          {fmtNum(rec.p)} matches across {new Date().getFullYear() - Number(firstYear)} years of league,
          cup, and European football — start with a question, a name, or a season.
        </p>
        <div className="mt-6">
          <SearchCommand autoFocusKey={false} />
          <p className="text-xs text-ink-faint mt-1.5">
            Press <kbd className="stat-num border border-line rounded px-1">/</kbd> to search — names, seasons,
            or shaped questions like &ldquo;record away at Arsenal&rdquo;.
          </p>
        </div>
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

      {/* myth-testing prompts */}
      <section>
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="display text-xl">Test a myth</h2>
          <Link href="/questions" className="text-xs text-devil-bright hover:underline">
            All questions →
          </Link>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {MYTHS.map(([question, hook, href]) => (
            <Link
              key={href}
              href={href}
              className="border border-line rounded-lg bg-panel px-4 py-3 hover:border-devil/60 transition-colors"
            >
              <div className="font-medium text-sm">{question}</div>
              <div className="text-xs text-ink-faint mt-1">{hook}</div>
            </Link>
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
                    <Link href={`/matches?type=${t.type}`} className="text-ink-dim hover:text-ink">
                      {TYPE_LABELS[t.type] ?? t.type}
                    </Link>
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
            Each row links to its matches.
          </div>
        </div>
      </section>

      {/* routes into the record + deepest evidence */}
      <section className="grid lg:grid-cols-2 gap-10">
        <div>
          <h2 className="display text-xl mb-3">Routes into the record</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {ROUTES.map(([label, href, hint]) => (
              <Link
                key={href}
                href={href}
                className="border border-line rounded-lg bg-panel px-4 py-3 hover:border-devil/60 transition-colors"
              >
                <div className="font-medium text-sm">{label}</div>
                <div className="text-xs text-ink-faint mt-0.5">{hint}</div>
              </Link>
            ))}
          </div>
        </div>
        <div>
          <div className="flex items-baseline justify-between mb-3">
            <h2 className="display text-xl">Fullest match sheets</h2>
            <Link href="/data" className="text-xs text-devil-bright hover:underline">
              Coverage ledger →
            </Link>
          </div>
          <div className="grid gap-2 text-sm">
            {fullest.map((m) => (
              <Link
                key={m.id}
                href={`/match/${m.id}`}
                className="border border-line rounded-lg bg-panel px-4 py-2.5 hover:border-devil/60 transition-colors"
              >
                <div className="flex justify-between gap-3">
                  <span className="font-medium truncate">
                    {m.venue === "A" ? "@" : "v"} {m.opponent_name}
                  </span>
                  <span className="stat-num text-ink-faint">{m.gf}–{m.ga}</span>
                </div>
                <div className="text-xs text-ink-faint mt-0.5">
                  {fmtDate(m.date)} · {m.competition_name} · scorers, lineups, subs, cards
                </div>
              </Link>
            ))}
          </div>
          <p className="text-xs text-ink-faint mt-2">
            The most fully evidenced matches in the record — every facet sourced and trailed.
          </p>
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
          <EloRatingChart points={elo} />
          <p className="text-xs text-ink-faint mt-2">
            Club Elo rating after every competitive match since {firstYear}. The dashed line is the 1500 starting
            baseline. Every match page carries its pre-match win expectancy.
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
