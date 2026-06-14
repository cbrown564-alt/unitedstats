import Link from "next/link";
import { seasonsIndex } from "@/lib/queries";
import { decadeBriefs } from "@/lib/narrative";
import { CompetitionChip } from "@/components/CompetitionChip";
import { PageHeader, StatTile } from "@/components/PageHeader";
import { WdlBar, WdlRecord } from "@/components/WdlBar";
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
  const totalMatches = summaries.reduce((sum, s) => sum + s.p, 0);
  const leagueTitles = summaries.filter((s) => s.type === "league" && s.position === 1).length;
  const latestSeason = [...bySeason.keys()].sort().at(-1);

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Campaign ledger"
        title="Seasons"
        aside={
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-line bg-line sm:min-w-96">
            <StatTile label="Campaigns" value={bySeason.size} tone="red" />
            <StatTile label="Matches" value={fmtNum(totalMatches)} />
            <StatTile label="League titles" value={leagueTitles} tone="gold" />
            <StatTile label="Latest" value={latestSeason ?? "?"} />
          </div>
        }
      >
        {clubName("1890-01-01")} to Manchester United, grouped by decade. Era briefs are computed from
        the record, then each campaign opens into its match evidence and competition trail.
      </PageHeader>
      {[...byDecade.entries()].map(([decade, seasons]) => {
        const brief = briefs.get(decade);
        return (
          <section key={decade}>
            <div className="mb-3 grid gap-2 border-b border-line pb-3 sm:grid-cols-[9rem_1fr] sm:items-end">
              <h2 className="display text-2xl">{decade}</h2>
              {brief && <p className="text-sm leading-5 text-ink-dim">{decadeLine(brief)}</p>}
            </div>
            <ul className="overflow-hidden rounded-lg border border-line bg-pitch/35">
              {seasons.map(([season, comps]) => {
          const league = comps.find((c) => c.type === "league");
          const cups = comps.filter((c) => c.type !== "league");
          const totalP = comps.reduce((a, c) => a + c.p, 0);
          return (
            <li key={season} className="border-b border-line last:border-b-0">
              <Link
                href={`/seasons/${season}`}
                className="grid gap-3 px-4 py-3 transition-colors hover:bg-panel sm:grid-cols-[8rem_1fr_14rem] sm:items-center"
              >
                <div>
                  <span className="display text-lg">{season}</span>
                  <span className="stat-num mt-0.5 block text-xs text-ink-dim">{totalP} matches</span>
                </div>
                {league && (
                  <div className="min-w-0">
                    <div className="mb-1 flex justify-between gap-3 text-xs text-ink-dim">
                      <span>{league.competition_name}</span>
                      <WdlRecord w={league.w} d={league.d} l={league.l} />
                    </div>
                    <WdlBar w={league.w} d={league.d} l={league.l} tooltip={false} />
                  </div>
                )}
                <div className="sm:text-right">
                  <span className="stat-num text-xs text-ink-dim">
                    {league?.position ? `${ordinal(league.position)} league` : "No league finish"}
                    {league?.position === 1 ? " · title" : ""}
                  </span>
                  {cups.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1.5 sm:justify-end">
                    {cups.map((c) => (
                      <CompetitionChip
                        key={c.competition_id}
                        type={c.type}
                        name={c.competition_name.replace("UEFA ", "").replace("FA Charity/Community Shield", "Shield")}
                        round={c.furthest_round}
                      />
                    ))}
                    </div>
                  )}
                </div>
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
