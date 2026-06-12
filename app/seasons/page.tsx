import Link from "next/link";
import { seasonsIndex } from "@/lib/queries";
import { decadeBriefs } from "@/lib/narrative";
import { WdlBar } from "@/components/WdlBar";
import { clubName, fmtNum } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Seasons" };

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0]);
}

function decadeLine(b: {
  seasons: number; matches: number; winPct: number; titles: number; cupsWon: number;
  bestPosition: number | null; worstPosition: number | null;
}): string {
  const honours: string[] = [];
  if (b.titles > 0) honours.push(`${b.titles} league title${b.titles > 1 ? "s" : ""}`);
  if (b.cupsWon > 0) honours.push(`${b.cupsWon} cup${b.cupsWon > 1 ? "s" : ""} won`);
  const honoursText = honours.length ? `${honours.join(", ")} · ` : "";
  const range =
    b.bestPosition != null && b.worstPosition != null && b.bestPosition !== b.worstPosition
      ? ` · finished between ${b.bestPosition} and ${b.worstPosition}`
      : "";
  return `${honoursText}${b.winPct}% of ${fmtNum(b.matches)} matches won${range}`;
}

export default function SeasonsPage() {
  const summaries = seasonsIndex();
  const bySeason = new Map<string, typeof summaries>();
  for (const s of summaries) {
    const list = bySeason.get(s.season) ?? [];
    list.push(s);
    bySeason.set(s.season, list);
  }
  const byDecade = new Map<string, [string, typeof summaries][]>();
  for (const entry of bySeason.entries()) {
    const decade = entry[0].slice(0, 3) + "0s";
    const list = byDecade.get(decade) ?? [];
    list.push(entry);
    byDecade.set(decade, list);
  }
  const briefs = decadeBriefs();

  return (
    <div className="space-y-10">
      <header>
        <h1 className="display text-3xl">Seasons</h1>
        <p className="text-sm text-ink-dim mt-1">
          {bySeason.size} campaigns, {clubName("1890-01-01")} to Manchester United, grouped by
          decade with an era brief computed from the record.
        </p>
      </header>
      {[...byDecade.entries()].map(([decade, seasons]) => {
        const brief = briefs.get(decade);
        return (
          <section key={decade}>
            <div className="flex flex-wrap items-baseline gap-x-3 mb-3">
              <h2 className="display text-xl">{decade}</h2>
              {brief && <p className="text-xs text-ink-faint">{decadeLine(brief)}</p>}
            </div>
            <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {seasons.map(([season, comps]) => {
          const league = comps.find((c) => c.type === "league");
          const cups = comps.filter((c) => c.type !== "league");
          const totalP = comps.reduce((a, c) => a + c.p, 0);
          return (
            <li key={season}>
              <Link
                href={`/seasons/${season}`}
                className="block border border-line rounded-lg bg-panel hover:bg-panel-2 transition-colors p-4 h-full"
              >
                <div className="flex items-baseline justify-between">
                  <span className="display text-lg">{season}</span>
                  <span className="stat-num text-xs text-ink-faint">
                    {league?.position
                      ? `${ordinal(league.position)}${league.position === 1 ? " 🏆" : ""} · `
                      : ""}
                    {totalP} matches
                  </span>
                </div>
                {league && (
                  <div className="mt-2">
                    <div className="flex justify-between text-xs text-ink-dim mb-1">
                      <span>{league.competition_name}</span>
                      <span className="stat-num">
                        {league.w}-{league.d}-{league.l}
                      </span>
                    </div>
                    <WdlBar w={league.w} d={league.d} l={league.l} />
                  </div>
                )}
                {cups.length > 0 && (
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {cups.map((c) => (
                      <span
                        key={c.competition_id}
                        className="text-[11px] px-1.5 py-0.5 rounded bg-panel-2 border border-line text-ink-dim"
                      >
                        {c.competition_name.replace("UEFA ", "").replace("FA Charity/Community Shield", "Shield")}
                        {c.furthest_round ? ` · ${c.furthest_round}` : ""}
                      </span>
                    ))}
                  </div>
                )}
              </Link>
            </li>
          );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
