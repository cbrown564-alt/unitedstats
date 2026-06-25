import Link from "next/link";
import { seasonsIndex, seasonCupLastResults, type SeasonSummary } from "@/lib/queries";
import { decadeBriefs } from "@/lib/narrative";
import { PageHeader } from "@/components/PageHeader";
import { WdlBar } from "@/components/WdlBar";
import { FinishTimeline, type FinishPoint } from "@/components/charts/FinishTimeline";
import { HonoursChip } from "@/components/HonoursBadge";
import { TrophyIcon } from "@/components/CampaignIcons";
import { eraForFirstMatchYear, eraSeasonRowClass } from "@/lib/managerEras";
import { CampaignVerdict, type CampaignTier } from "@/components/CampaignVerdict";
import { CoverageNote } from "@/components/CoverageNote";
import { JumpRail, type JumpChip } from "@/components/JumpRail";
import { clubName, fmtNum } from "@/lib/format";
import { queryString } from "@/lib/url";

export const dynamic = "force-dynamic";
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

/**
 * A season's league finish as the league table itself: a track running 1st (left)
 * to last (right), the relegation zone shaded red and the top edge gold, with a
 * marker pinned where United finished. Self-contained per row — the ends carry
 * the axis, so the placing reads as a *position* without any cross-row scaffolding.
 * The Second Division is the same shape, muted and tagged, since winning it is a
 * promotion, not the gold of a league title.
 */
function FinishLadder({ league }: { league: SeasonSummary }) {
  if (league.position == null) {
    return <span className="stat-num text-xs text-ink-faint">No league finish</span>;
  }
  const top = isTopFlight(league);
  const size = league.league_size ?? 0;
  const pos = league.position;
  const frac = size > 1 ? (pos - 1) / (size - 1) : 0;
  const champ = pos === 1;
  const danger = top && !champ && frac >= 0.8;
  const relZone = size > 1 ? Math.min(22, (3 / size) * 100) : 16; // ~bottom three places

  const marker = champ
    ? top
      ? "bg-gold border-pitch"
      : "bg-pitch border-gold" // Div 2 title — hollow gold, a promotion not a crown
    : danger
      ? "bg-loss border-pitch"
      : top
        ? "bg-ink border-pitch"
        : "bg-ink-faint border-pitch";
  const placingTone = champ
    ? top
      ? "text-gold"
      : "text-gold/85"
    : danger
      ? "text-loss"
      : "text-ink-dim";
  const placingLabel = champ ? (top ? "Champions" : "Winners") : ordinal(pos);

  return (
    <div className="min-w-0">
      <div className="relative">
        <div className="h-2 w-full overflow-hidden rounded-full bg-panel-2/70 ring-1 ring-inset ring-line/60">
          {top ? (
            <>
              <div className="absolute inset-y-0 left-0 w-[7%] bg-gold/30" />
              <div className="absolute inset-y-0 right-0 bg-loss/25" style={{ width: `${relZone}%` }} />
            </>
          ) : (
            <div className="absolute inset-y-0 left-0 w-[12%] bg-ink/12" />
          )}
        </div>
        <span
          className={`absolute top-1 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 shadow-[0_1px_2px_rgb(0_0_0/0.5)] ${marker}`}
          style={{ left: `${frac * 100}%` }}
        />
      </div>
      <div className="mt-1.5 flex items-center justify-between gap-2 text-[11px] leading-none">
        <span className={`flex items-center gap-1 font-semibold ${placingTone}`}>
          {champ && top && <TrophyIcon className="h-3 w-3" />}
          {!top && (
            <span className="rounded bg-panel-2 px-1 py-px text-[9px] font-bold uppercase tracking-wide text-ink-faint">
              Div 2
            </span>
          )}
          {placingLabel}
        </span>
        {size > 0 && <span className="stat-num shrink-0 text-ink-faint">{size} teams</span>}
      </div>
    </div>
  );
}

// ---- Fixed competition lanes ------------------------------------------------
// Every cup the club enters maps to one of four fixed lanes, in a stable order,
// so a decade's table can be scanned straight down a column ("how far in Europe
// each year?"). The lane a competition lives in is its type, collapsed.

type Lane = "fa-cup" | "league-cup" | "europe" | "other";
const LANE_ORDER: Lane[] = ["fa-cup", "league-cup", "europe", "other"];
const LANE_LABEL: Record<Lane, string> = {
  "fa-cup": "FA Cup",
  "league-cup": "League Cup",
  europe: "Europe",
  other: "Other",
};
// Column-header tone mirrors the detail page's competition colour-coding: the
// cup nights gold-warm, the European nights blue. The header carries the
// competition colour; the cells below it carry only the outcome (so gold/silver
// stay reserved for silverware/runners-up, never a mid-round exit).
const LANE_HEAD_TONE: Record<Lane, string> = {
  "fa-cup": "text-gold/75",
  "league-cup": "text-gold/75",
  europe: "text-europe",
  other: "text-ink-dim",
};
function laneOf(type: string): Lane | null {
  switch (type) {
    case "domestic-cup":
      return "fa-cup";
    case "league-cup":
      return "league-cup";
    case "european":
      return "europe";
    case "super-cup":
    case "world":
    case "playoff":
      return "other";
    default:
      return null; // league — not a cup lane
  }
}

const CUP_SHORT: Record<string, string> = {
  "charity-shield": "Shield",
  "uefa-super-cup": "Super Cup",
  "screen-sport-super-cup": "S.S. Cup",
  "fifa-club-world-cup": "Club World",
  "intercontinental-cup": "Interc.",
  "test-match": "Test",
};

/** A round name shortened to a scannable token for a narrow lane cell. */
function shortRound(round: string | null): string {
  if (!round) return "";
  const r = round.toLowerCase();
  if (r.includes("semi")) return "SF";
  if (r.includes("quarter")) return "QF";
  if (r.includes("round of 16")) return "R16";
  if (r.includes("group")) return "Group";
  if (r.includes("play-off") || r.includes("playoff")) return "Play-off";
  if (r.includes("qualifying")) return "Qual.";
  const m = round.match(/round\s*(\d+)/i);
  if (m) return `R${m[1]}`;
  if (r.includes("final")) return "Final";
  return round;
}

/**
 * A cup campaign's verdict from index-level data alone — the furthest round from
 * the summary, plus the deciding match's outcome to tell a won final from a lost
 * one. Mirrors the season detail's {@link campaignOutcome}: a reached final won
 * is silverware, lost is runners-up; anything shallower is the round, stated
 * quietly. The promotion/relegation Test Match is a result, never a trophy.
 */
function cupVerdict(s: SeasonSummary, lastOutcome: string | undefined): { label: string; tier: CampaignTier } {
  if (s.type === "playoff") {
    return { label: lastOutcome === "W" ? "Won" : "Lost", tier: "neutral" };
  }
  const oneOff = s.type === "super-cup" || s.type === "world";
  const fr = s.furthest_round ?? "";
  const reachedFinal = oneOff || (/final/i.test(fr) && !/(semi|quarter)/i.test(fr));
  if (reachedFinal && lastOutcome) {
    return lastOutcome === "W" ? { label: "Won", tier: "silverware" } : { label: "Final", tier: "final-loss" };
  }
  return { label: shortRound(s.furthest_round), tier: "neutral" };
}

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
  // Chronological by default — the ledger reads as a story from 1892 forward,
  // matching the decade order. Descending flips both the decades and the
  // seasons within each one, so the whole ledger reverses as a unit.
  const order = sp.order === "desc" ? "desc" : "asc";
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
      <PageHeader eyebrow="Campaign ledger" title="Seasons">
        Every league and cup campaign since {clubName("1890-01-01")} joined the Football League in
        1892. Follow the trajectory of the club’s league finishes on the timeline, or open any season
        below to trace the match evidence and competition paths.
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
            coverage="Final-table positions are complete for every league season; the breaks are the war years, when no league ran."
          />
        </div>
      </section>

      {/* Wayfinding: a sticky decade rail over the ledger — the longest scroll on
          the site. Reuses the archive rail's scrollspy, lighting the decade you're
          reading and jumping to its `decade-…` section. */}
      <JumpRail chips={decadeChips} label="Jump to a decade" idPrefix="decade" sticky />

      {/* Order toggle: the ledger runs chronologically by default; flip it to read
          the latest decades first. Both the decades and the seasons within each
          reverse together, so the ordering stays consistent top to bottom. */}
      <div className="flex items-center justify-end gap-2 text-xs">
        <span className="uppercase tracking-[0.12em] text-ink-faint">Order</span>
        <div className="inline-flex rounded-md border border-line bg-panel p-0.5">
          {([
            { key: "asc", label: "Oldest first" },
            { key: "desc", label: "Newest first" },
          ] as const).map((o) => {
            const active = order === o.key;
            return (
              <Link
                key={o.key}
                href={`/seasons${queryString({ ...sp, order: o.key === "asc" ? undefined : o.key })}`}
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

        // Only the cup lanes this decade actually used, in their fixed order —
        // no League Cup column before 1960, no Europe column before 1956.
        const laneSet = new Set<Lane>();
        for (const r of rows) for (const c of r.comps) {
          const ln = laneOf(c.type);
          if (ln) laneSet.add(ln);
        }
        const lanes = LANE_ORDER.filter((l) => laneSet.has(l));
        const template = `4.5rem minmax(8.5rem,1.1fr) minmax(6.5rem,0.85fr) ${lanes
          .map(() => "minmax(4.5rem,6rem)")
          .join(" ")}`;

        return (
          <section key={decade} id={`decade-${decade}`} className={`scroll-mt-28 ${gap}`}>
            {glory ? (
              <div className="mb-3 flex flex-col gap-2 border-b border-gold/30 pb-3 sm:flex-row sm:items-end sm:justify-between">
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
              <div className="mb-2.5 flex flex-col gap-1.5 border-b border-line/55 pb-2.5 sm:flex-row sm:items-end sm:justify-between">
                <h2 className="display shrink-0 text-xl leading-none text-ink-dim">{decade}</h2>
                <div className="flex flex-col gap-1 sm:items-end">
                  <DecadeHonours titles={0} cups={brief?.cupsWon ?? 0} />
                  {brief && <p className="text-[13px] leading-5 text-ink-faint">{decadeTail(brief)}</p>}
                </div>
              </div>
            )}

            <div className="overflow-x-auto">
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
