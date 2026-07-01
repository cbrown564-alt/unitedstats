import Link from "next/link";
import { seasonsIndex, seasonCupLastResults, type SeasonSummary } from "@/lib/queries";
import { decadeBriefs } from "@/lib/narrative";
import { PageHeader } from "@/components/PageHeader";
import { WdlBar } from "@/components/WdlBar";
import { FinishTimeline, type FinishPoint } from "@/components/charts/FinishTimeline";
import { HonoursChip } from "@/components/HonoursBadge";
import { eraForFirstMatchYear, eraSeasonRowClass } from "@/lib/managerEras";
import { CampaignVerdict } from "@/components/CampaignVerdict";
import { CoverageNote } from "@/components/CoverageNote";
import { JumpRail, type JumpChip } from "@/components/JumpRail";
import { FinishLadder } from "@/components/seasons/FinishLadder";
import { SeasonLedgerCard } from "@/components/seasons/SeasonLedgerCard";
import {
  cupOutcomesForSeason,
  cupVerdict,
  LANE_HEAD_TONE,
  LANE_LABEL,
  LANE_ORDER,
  laneOf,
  lanesForComps,
  type Lane,
} from "@/components/seasons/seasonLedgerLanes";
import { fmtNum } from "@/lib/format";
import { queryString } from "@/lib/url";

export const revalidate = 86400;
export const metadata = {
  title: "Seasons",
  description: "Every Manchester United campaign since Newton Heath joined the Football League in 1892 — tracing league finishes, cup campaigns, and honours decade by decade.",
};

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0]);
}

const isTopFlight = (s: { competition_name: string }) =>
  s.competition_name === "First Division" || s.competition_name === "Premier League";

/**
 * The decade's quantitative tail — win rate over its matches and finishing
 * range. Honours moved out of the prose into {@link DecadeHonours} chips, so the
 * count there stays honest (top-flight titles only) without the prose drifting.
 */
function decadeTail(b: { matches: number; winPct: number; bestPosition: number | null; worstPosition: number | null }): string {
  const range =
    b.bestPosition != null && b.worstPosition != null && b.bestPosition !== b.worstPosition
      ? ` · finished ${ordinal(b.bestPosition)} to ${ordinal(b.worstPosition)}`
      : "";
  return `${b.winPct}% of ${fmtNum(b.matches)} matches won${range}`;
}

/**
 * A decade's silverware as scannable chips, echoing the timeline's gold: a gold
 * chip per count of top-flight league titles (weighted heaviest), a quieter chip
 * for cups won. Renders nothing for a barren decade.
 */
function DecadeHonours({ titles, cups }: { titles: number; cups: number }) {
  if (!titles && !cups) return null;
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {titles > 0 && (
        <HonoursChip tone="gold">
          {titles} {titles > 1 ? "league titles" : "league title"}
        </HonoursChip>
      )}
      {cups > 0 && (
        <HonoursChip tone="quiet">
          {cups} {cups > 1 ? "cups won" : "cup won"}
        </HonoursChip>
      )}
    </div>
  );
}

const CUP_SHORT: Record<string, string> = {
  "charity-shield": "Shield",
  "uefa-super-cup": "Super Cup",
  "screen-sport-super-cup": "S.S. Cup",
  "fifa-club-world-cup": "Club World",
  "intercontinental-cup": "Interc.",
  "test-match": "Test",
};

/** One fixed lane's cell for a season: the campaign verdict(s), or an em dash if
 *  the club didn't contest that competition that year. */
function CupCell({
  lane,
  comps,
  results,
}: {
  lane: Lane;
  comps: SeasonSummary[];
  results: Map<string, string>;
}) {
  if (comps.length === 0) {
    return <span className="text-ink-faint/55" aria-hidden>–</span>;
  }
  return (
    <div className="flex flex-col items-start gap-1">
      {comps.map((c) => {
        const v = cupVerdict(c, results.get(`${c.season}:${c.competition_id}`));
        return (
          <span key={c.competition_id} className="inline-flex items-center gap-1.5">
            {lane === "other" && (
              <span className="text-[10px] leading-none text-ink-faint">{CUP_SHORT[c.competition_id] ?? ""}</span>
            )}
            {v.tier === "neutral" ? (
              <span className="stat-num text-xs text-ink-dim">{v.label || "—"}</span>
            ) : (
              <CampaignVerdict label={v.label} tier={v.tier} />
            )}
          </span>
        );
      })}
    </div>
  );
}

export default async function SeasonsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  // Newest first by default — the ledger opens on the latest decades. Ascending
  // flips both the decades and the seasons within each one as a unit.
  const order = sp.order === "asc" ? "asc" : "desc";
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
  // Deciding-match outcome per season+competition, so each cup lane can tell a
  // won final from a lost one without loading every match.
  const cupResults = new Map(
    seasonCupLastResults().map((r) => [`${r.season}:${r.competition_id}`, r.last_outcome]),
  );

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
  const sortedSeasons = [...bySeason.keys()].sort();
  const firstSeason = sortedSeasons[0];
  const latestSeason = sortedSeasons.at(-1);

  const ribbon: { value: string; label: string; tone?: string }[] = [
    { value: fmtNum(topFlightTitles), label: "League titles", tone: "text-gold" },
    { value: fmtNum(bySeason.size), label: "Campaigns" },
    { value: fmtNum(topFlightSeasons), label: "Top-flight seasons" },
    { value: fmtNum(totalMatches), label: "Matches" },
  ];

  // The ledger as ordered decade view-models — the spine for both the sticky
  // jump-rail and the act/era emphasis below. `titles` (top-flight championships
  // that decade) is what separates a glory decade from a barren one; computed
  // once here so the rail, the header weight, and the breathing room all agree.
  const desc = order === "desc";
  const decades = [...byDecade.entries()]
    .sort((a, b) => (desc ? b[0].localeCompare(a[0]) : a[0].localeCompare(b[0])))
    .map(([decade, seasons]) => {
      // `seasonsIndex` returns season-descending, so sort each decade's seasons
      // to match the decade order — chronological by default, reversed for desc.
      const ordered = [...seasons].sort((a, b) =>
        desc ? b[0].localeCompare(a[0]) : a[0].localeCompare(b[0]),
      );
      const titles = ordered.filter(([, comps]) => {
        const lg = comps.find((c) => c.type === "league");
        return lg && isTopFlight(lg) && lg.position === 1;
      }).length;
      const matches = ordered.reduce(
        (sum, [, comps]) => sum + comps.reduce((a, c) => a + c.p, 0),
        0,
      );
      return { decade, seasons: ordered, titles, matches };
    });

  // Decade chips for the sticky rail: one chip per decade `section`, anchored to
  // its `decade-…` id so the shared {@link JumpRail} scrollspy lights the decade
  // you're reading. Each chip "covers" only its own decade (seasons: [decade]).
  const decadeChips: JumpChip[] = decades.map((d) => ({
    key: d.decade,
    label: d.decade,
    anchor: d.decade,
    n: d.matches,
    seasons: [d.decade],
  }));

  return (
    <div className="space-y-10">
      <PageHeader eyebrow="Campaign ledger" title="Seasons" deferOnMobile>
        League and cup campaigns from 1892. Timeline above, full ledger below.
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
              <h2 className="display mt-1 text-2xl">League finishes across the eras</h2>
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
            slice={`league finishes from ${firstSeason ?? "1892–93"} to ${latestSeason}.`}
            coverage="Final-table positions are complete for every league season."
          />
        </div>
      </section>

      {/* Wayfinding: a sticky decade rail over the ledger — the longest scroll on
          the site. Reuses the archive rail's scrollspy, lighting the decade you're
          reading and jumping to its `decade-…` section. */}
      <JumpRail chips={decadeChips} label="Jump to a decade" idPrefix="decade" sticky />

      {/* Order toggle: newest first by default; flip to read from 1892 forward. */}
      <div className="flex items-center justify-end gap-2 text-xs">
        <span className="uppercase tracking-[0.12em] text-ink-faint">Order</span>
        <div className="inline-flex rounded-md border border-line bg-panel p-0.5">
          {([
            { key: "desc", label: "Newest first" },
            { key: "asc", label: "Oldest first" },
          ] as const).map((o) => {
            const active = order === o.key;
            return (
              <Link
                key={o.key}
                href={`/seasons${queryString({ ...sp, order: o.key === "desc" ? undefined : o.key })}`}
                aria-current={active ? "true" : undefined}
                scroll={false}
                className={`rounded px-2.5 py-1 transition-colors focus-ring ${
                  active ? "bg-devil/15 font-semibold text-devil-bright" : "text-ink-dim hover:bg-panel-2 hover:text-ink"
                }`}
              >
                {o.label}
              </Link>
            );
          })}
        </div>
      </div>

      {/* The ledger, paced into eras: title-winning decades carry a gold-edged
          header and extra air above; barren decades stay compressed and quiet, so
          the scroll rises into the glory eras instead of every decade reading flat. */}
      <div>
      {decades.map(({ decade, seasons, titles }, di) => {
        const brief = briefs.get(decade);
        const glory = titles > 0;
        // Breathe wider into a title decade; tighter through the barren stretches.
        const gap = di === 0 ? "" : glory ? "mt-14" : "mt-9";

        const rows = seasons.map(([season, comps]) => ({
          season,
          comps,
          league: comps.find((c) => c.type === "league"),
          totalP: comps.reduce((a, c) => a + c.p, 0),
        }));

        const lanes = lanesForComps(rows.flatMap((r) => r.comps));
        const template = `4.5rem minmax(8.5rem,1.1fr) minmax(6.5rem,0.85fr) ${lanes
          .map(() => "minmax(4.5rem,6rem)")
          .join(" ")}`;

        const decadeHeader = glory ? (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-baseline gap-2.5">
              <span className="h-5 w-1 shrink-0 rounded-full bg-gold/80" aria-hidden />
              <h2 className="display shrink-0 text-2xl leading-none sm:text-[1.75rem]">{decade}</h2>
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gold/80">
                Title era
              </span>
            </div>
            <div className="flex flex-col gap-1.5 sm:items-end">
              <DecadeHonours titles={titles} cups={brief?.cupsWon ?? 0} />
              {brief && <p className="text-sm leading-5 text-ink-dim">{decadeTail(brief)}</p>}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-1.5 sm:flex-row sm:items-end sm:justify-between">
            <h2 className="display shrink-0 text-xl leading-none text-ink-dim">{decade}</h2>
            <div className="flex flex-col gap-1 sm:items-end">
              <DecadeHonours titles={0} cups={brief?.cupsWon ?? 0} />
              {brief && <p className="text-[13px] leading-5 text-ink-faint">{decadeTail(brief)}</p>}
            </div>
          </div>
        );

        return (
          <section key={decade} id={`decade-${decade}`} className={`scroll-mt-28 ${gap}`}>
            <div
              className={`season-decade-header ${glory ? "season-decade-header--glory" : ""} mb-3 border-b pb-3 sm:static sm:z-auto sm:mb-3 sm:border-b sm:bg-transparent sm:backdrop-blur-none ${
                glory ? "border-gold/30 sm:border-gold/30" : "border-line/55 sm:border-line/55"
              }`}
            >
              {decadeHeader}
            </div>

            {/* Mobile: card stream — one season per card, decade header sticks below JumpRail. */}
            <ol className="season-card-stream register-card-list space-y-2.5 sm:hidden">
              {rows.map((r) => {
                const eraKey = eraForFirstMatchYear(Number(r.season.slice(0, 4))).key;
                const seasonGlory =
                  r.league != null &&
                  isTopFlight(r.league) &&
                  r.league.position === 1;
                return (
                  <SeasonLedgerCard
                    key={r.season}
                    season={r.season}
                    href={`/seasons/${r.season}`}
                    league={r.league}
                    totalP={r.totalP}
                    cups={cupOutcomesForSeason(r.comps, lanes, cupResults)}
                    glory={seasonGlory}
                    eraClass={eraSeasonRowClass(eraKey)}
                  />
                );
              })}
            </ol>

            {/* Desktop: scannable grid table. */}
            <div className="hidden overflow-x-auto sm:block">
              <div
                className={`min-w-max overflow-hidden rounded-lg border bg-pitch/35 ${
                  glory ? "border-gold/25" : "border-line"
                }`}
              >
                {/* column headers — the fixed lanes, labelled and tone-coded */}
                <div
                  className="grid items-center gap-x-3 border-b border-line bg-panel/50 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-faint"
                  style={{ gridTemplateColumns: template }}
                >
                  <span>Season</span>
                  <span className="flex items-center gap-1.5">
                    Finish
                    {/* axis legend: 1st (gold) left, last (red) right */}
                    <span className="hidden items-center gap-1 normal-case tracking-normal text-ink-faint/80 lg:inline-flex">
                      <span className="text-[8px]">1st</span>
                      <span className="h-1 w-6 rounded-full bg-gradient-to-r from-gold/45 via-line to-loss/45" />
                      <span className="text-[8px]">last</span>
                    </span>
                  </span>
                  <span>Record</span>
                  {lanes.map((l) => (
                    <span key={l} className={LANE_HEAD_TONE[l]}>{LANE_LABEL[l]}</span>
                  ))}
                </div>

                <ul>
                  {rows.map((r) => {
                    const eraKey = eraForFirstMatchYear(Number(r.season.slice(0, 4))).key;
                    return (
                    <li key={r.season} className={`border-b border-line last:border-b-0 ${eraSeasonRowClass(eraKey)}`}>
                      <Link
                        href={`/seasons/${r.season}`}
                        className="grid items-center gap-x-3 px-4 py-2.5 transition-colors hover:bg-panel-2/60"
                        style={{ gridTemplateColumns: template }}
                      >
                        <div className="min-w-0">
                          <span className="display text-base leading-tight">{r.season}</span>
                          <span className="stat-num block text-[11px] text-ink-faint">{r.totalP}</span>
                        </div>

                        {r.league ? (
                          <FinishLadder league={r.league} />
                        ) : (
                          <span className="text-xs text-ink-faint">Cup competitions only</span>
                        )}

                        {r.league ? (
                          <WdlBar w={r.league.w} d={r.league.d} l={r.league.l} size="md" showLabels tooltip={false} />
                        ) : (
                          <span aria-hidden />
                        )}

                        {lanes.map((l) => (
                          <CupCell
                            key={l}
                            lane={l}
                            comps={r.comps.filter((c) => laneOf(c.type) === l)}
                            results={cupResults}
                          />
                        ))}
                      </Link>
                    </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          </section>
        );
      })}
      </div>
    </div>
  );
}
