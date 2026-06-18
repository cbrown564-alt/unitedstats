import Link from "next/link";
import { seasonsIndex, type SeasonSummary } from "@/lib/queries";
import { decadeBriefs } from "@/lib/narrative";
import { CompetitionChip } from "@/components/CompetitionChip";
import { PageHeader } from "@/components/PageHeader";
import { WdlBar, WdlColumns } from "@/components/WdlBar";
import { FinishTimeline, type FinishPoint } from "@/components/charts/FinishTimeline";
import { TrophyIcon } from "@/components/CampaignIcons";
import { CoverageNote } from "@/components/CoverageNote";
import { clubName, fmtNum } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Seasons" };

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0]);
}

const isTopFlight = (s: { competition_name: string }) =>
  s.competition_name === "First Division" || s.competition_name === "Premier League";

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

/**
 * A season's league finish as a graded tag — the row's lead verdict, coloured to
 * echo the timeline above: gold for champions, a hollow gold ring for a Second
 * Division title, red for a bottom-of-the-table finish, quiet ink otherwise.
 */
function FinishPill({ league }: { league: SeasonSummary }) {
  if (league.position == null) {
    return <span className="stat-num text-xs text-ink-faint">No league finish</span>;
  }
  const top = isTopFlight(league);
  const champ = league.position === 1;
  const ratio = league.league_size ? (league.position - 1) / (league.league_size - 1) : 0;
  const danger = top && !champ && ratio >= 0.8;
  const tone = champ
    ? top
      ? "border-gold/55 bg-gold/15 text-gold"
      : "border-gold/40 bg-gold/[0.06] text-gold/90"
    : danger
      ? "border-loss/40 bg-loss/10 text-loss"
      : top
        ? "border-line bg-panel-2/70 text-ink-dim"
        : "border-line/70 bg-transparent text-ink-faint";
  const label = champ
    ? top
      ? "Champions"
      : "Div 2 winners"
    : `${ordinal(league.position)}${league.league_size ? ` of ${league.league_size}` : ""}`;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold leading-none ${tone}`}
    >
      {champ && <TrophyIcon className="h-3 w-3" />}
      {label}
    </span>
  );
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

  // The finish timeline reads only the league campaigns; the second tier is its
  // own band, so the two relegations show as the valleys they were.
  const leagueRows = summaries.filter((s) => s.type === "league" && s.position != null);
  const points: FinishPoint[] = leagueRows.map((s) => ({
    season: s.season,
    year: Number(s.season.slice(0, 4)),
    competition: s.competition_name,
    tier: isTopFlight(s) ? "top" : "second",
    position: s.position as number,
    size: s.league_size ?? 0,
  }));

  // Honest counts: a Second Division title is *not* a league title, so the headline
  // reckons the 20 top-flight championships, with the second-tier wins noted apart.
  const totalMatches = summaries.reduce((sum, s) => sum + s.p, 0);
  const topFlightTitles = leagueRows.filter((s) => isTopFlight(s) && s.position === 1).length;
  const topFlightSeasons = leagueRows.filter((s) => isTopFlight(s)).length;
  const firstSeason = [...bySeason.keys()].sort()[0];

  const ribbon: { value: string; label: string; tone?: string }[] = [
    { value: fmtNum(topFlightTitles), label: "League titles", tone: "text-gold" },
    { value: fmtNum(bySeason.size), label: "Campaigns" },
    { value: fmtNum(topFlightSeasons), label: "Top-flight seasons" },
    { value: fmtNum(totalMatches), label: "Matches" },
  ];

  return (
    <div className="space-y-10">
      <PageHeader eyebrow="Campaign ledger" title="Seasons">
        Every Manchester United campaign since {clubName("1890-01-01")} joined the Football League in
        1892, season by season. The timeline traces where each one finished; the decade ledger below
        opens every campaign into its match evidence and competition trail.
      </PageHeader>

      {/* The hero: the whole league history as one rise-and-fall of finishing position. */}
      <section className="relative overflow-hidden rounded-xl border border-line bg-panel shadow-[0_22px_44px_rgb(0_0_0_/0.22)]">
        <div className="hero-grid pointer-events-none absolute inset-0 opacity-60" aria-hidden />
        <div
          className="pointer-events-none absolute -right-24 -top-28 h-72 w-2/3 rounded-full opacity-[0.12] blur-3xl"
          style={{ backgroundColor: "var(--color-devil)" }}
          aria-hidden
        />
        <div className="relative p-5 sm:p-6">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-devil-bright">
                The shape of the eras
              </p>
              <h2 className="display mt-1 text-2xl">Where United finished</h2>
            </div>
            <dl className="flex flex-wrap items-end gap-x-7 gap-y-3">
              {ribbon.map((r) => (
                <div key={r.label} className="leading-none">
                  <dd className={`stat-num text-2xl font-semibold ${r.tone ?? "text-ink"}`}>{r.value}</dd>
                  <dt className="mt-1.5 text-[11px] uppercase tracking-[0.13em] text-ink-faint">{r.label}</dt>
                </div>
              ))}
            </dl>
          </div>
          <FinishTimeline points={points} />
          <CoverageNote
            className="mt-3"
            slice={`league finishes from ${firstSeason ?? "1892-93"} to ${[...bySeason.keys()].sort().at(-1)}.`}
            coverage="Final-table positions are complete for every league season; the breaks are the war years, when no league ran."
          />
        </div>
      </section>

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
                const champions = league?.position === 1 && league && isTopFlight(league);
                const danger =
                  league?.position != null &&
                  league.league_size &&
                  isTopFlight(league) &&
                  (league.position - 1) / (league.league_size - 1) >= 0.8;
                const accent = champions
                  ? "border-l-gold/70"
                  : danger
                    ? "border-l-loss/45"
                    : "border-l-transparent";
                return (
                  <li key={season} className={`border-b border-l-2 border-line last:border-b-0 ${accent}`}>
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
                          <div className="mb-1 text-center text-xs text-ink-dim">{league.competition_name}</div>
                          <WdlColumns w={league.w} d={league.d} l={league.l} className="mb-1" />
                          <WdlBar w={league.w} d={league.d} l={league.l} tooltip={false} />
                        </div>
                      )}
                      <div className="flex flex-col items-start gap-1.5 sm:items-end">
                        {league ? (
                          <FinishPill league={league} />
                        ) : (
                          <span className="stat-num text-xs text-ink-faint">No league finish</span>
                        )}
                        {cups.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 sm:justify-end">
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
