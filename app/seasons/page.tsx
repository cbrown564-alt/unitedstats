import Link from "next/link";
import { seasonsIndex } from "@/lib/queries";
import { WdlBar } from "@/components/WdlBar";
import { clubName } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Seasons" };

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0]);
}

export default function SeasonsPage() {
  const summaries = seasonsIndex();
  const bySeason = new Map<string, typeof summaries>();
  for (const s of summaries) {
    const list = bySeason.get(s.season) ?? [];
    list.push(s);
    bySeason.set(s.season, list);
  }
  const seasons = [...bySeason.entries()];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="display text-3xl">Seasons</h1>
        <p className="text-sm text-ink-dim mt-1">
          {seasons.length} campaigns, {clubName("1890-01-01")} to Manchester United
        </p>
      </header>
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
    </div>
  );
}
