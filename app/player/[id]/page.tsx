import Link from "next/link";
import { notFound } from "next/navigation";
import {
  playerAssistPartnerships, playerById, playerClubRanks,
  playerCuratedGoalTypes, playerCuratedTotals,
  playerGoalMatches, playerGoalMinutes, playerGoalsByOpponent, playerLineupMatches,
  playerShirtNumbersByDecade, playerSplitsBySeason,
} from "@/lib/queries";
import { playerBestScoringRun, playerGoalsByCompetitionType } from "@/lib/trails";
import { ChartPanel } from "@/components/ChartPanel";
import { CoverageNote } from "@/components/CoverageNote";
import { Column, DataTable, type SortDirection } from "@/components/DataTable";
import { GoalBodyMap } from "@/components/charts/GoalBodyMap";
import { MinuteRidge } from "@/components/charts/MinuteRidge";
import { SeasonContributionChart } from "@/components/charts/SeasonContributionChart";
import { SplitBar } from "@/components/charts/SplitBar";
import { StatTile, TrailLink } from "@/components/PageHeader";
import { PlayerPlate } from "@/components/PlayerPlate";
import { AssistPartnerships } from "@/components/AssistPartnerships";
import { MatchList } from "@/components/MatchList";
import { HaulCards } from "@/components/HaulCards";
import { ArchiveJumpRail } from "@/components/ArchiveJumpRail";
import { ContributionSpine } from "@/components/charts/ContributionSpine";
import { OwnGoalProfile } from "@/components/OwnGoalProfile";
import { fmtDate, fmtNum, pct } from "@/lib/format";
import { queryString } from "@/lib/url";

export const dynamic = "force-dynamic";

type SeasonSplit = {
  season: string;
  apps: number;
  starts: number;
  goals: number;
  assists: number;
};

type SeasonSortKey = "season" | "apps" | "starts" | "goals" | "assists" | "ga";

const SEASON_SORT_DEFAULTS: Record<SeasonSortKey, SortDirection> = {
  season: "asc",
  apps: "desc",
  starts: "desc",
  goals: "desc",
  assists: "desc",
  ga: "desc",
};

const SEASON_SORT_LABELS: Record<SeasonSortKey, string> = {
  season: "Season",
  apps: "Apps",
  starts: "Starts",
  goals: "Goals",
  assists: "Assists",
  ga: "goals + assists",
};

function parseSeasonSort(value: string | undefined): SeasonSortKey {
  return value && Object.hasOwn(SEASON_SORT_DEFAULTS, value) ? (value as SeasonSortKey) : "season";
}

function compareSeasons(a: SeasonSplit, b: SeasonSplit, key: SeasonSortKey, dir: SortDirection): number {
  const n = (x: number, y: number) => (dir === "asc" ? x - y : y - x);
  const ga = (s: SeasonSplit) => s.goals + s.assists;
  const primary =
    key === "season" ? (dir === "asc" ? a.season.localeCompare(b.season) : b.season.localeCompare(a.season))
    : key === "apps" ? n(a.apps, b.apps)
    : key === "starts" ? n(a.starts, b.starts)
    : key === "goals" ? n(a.goals, b.goals)
    : key === "assists" ? n(a.assists, b.assists)
    : n(ga(a), ga(b));
  // Stable, readable tiebreak: oldest season first.
  return primary || a.season.localeCompare(b.season);
}

export default async function PlayerPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ sort?: string; dir?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;

  // "Own Goal" is a synthetic scorer, not a person: its page shows the opposition
  // players behind the tally rather than a career.
  if (id === "own-goal") return <OwnGoalProfile />;

  const p = playerById(id);
  if (!p) notFound();

  const bySeason = playerSplitsBySeason(id);
  const matches = playerGoalMatches(id);
  const appearances = playerLineupMatches(id);
  const shirts = playerShirtNumbersByDecade(id);
  const minutes = playerGoalMinutes(id);
  const partnerships = playerAssistPartnerships(id);
  const compSplits = playerGoalsByCompetitionType(id);
  const opponentGoals = playerGoalsByOpponent(id, 8);
  const ranks = playerClubRanks(id);
  const bestRun = p.goals >= 5 ? playerBestScoringRun(id) : null;

  // Curated Tableau lane: season-level goals/assists and goal-type breakdown,
  // 1987-88..2014-15. Not match-attributed, so it stays in its own labelled section.
  const curatedTotals = playerCuratedTotals(id);
  const curatedGoalTypes = curatedTotals ? playerCuratedGoalTypes(id) : [];
  const curatedTopType = curatedGoalTypes[0];

  const coveredSeasons = bySeason.filter((s) => s.apps > 0);

  // Goal-minute distribution as a 5-minute ridge across the 90; minutes past 90
  // fold into the closing bin. The final-15 share is called out for the late trail.
  const ridgeBins = Array.from({ length: 18 }, (_, i) => ({ lo: i * 5, hi: i * 5 + 5, n: 0 }));
  for (const m of minutes) ridgeBins[Math.min(17, Math.floor((m - 1) / 5))].n++;
  const lateGoals = minutes.filter((m) => m > 75).length;

  // League vs cup split of recorded goals (unofficial excluded, matching the rest of the app).
  const leagueGoals = compSplits.filter((c) => c.type === "league").reduce((a, c) => a + c.goals, 0);
  const cupGoals = compSplits.filter((c) => c.type !== "league" && c.type !== "unofficial").reduce((a, c) => a + c.goals, 0);

  // Multi-goal hauls are computed from recorded scorer data, not headline totals.
  const multiGoalGames = matches.filter((m) => m.goals >= 2).length;
  const hatTricks = matches.filter((m) => m.goals >= 3).length;
  const peakSeason = bySeason.reduce<SeasonSplit | null>(
    (best, s) => (s.goals > 0 && (!best || s.goals > best.goals) ? s : best),
    null,
  );
  const topOpponent = opponentGoals[0];
  const goalsPerApp = p.apps > 0 ? p.goals / p.apps : null;

  // Earliest and latest match we can place this player in, across scorer and lineup coverage.
  const timeline = [...appearances, ...matches];
  const debut = timeline.length
    ? timeline.reduce((a, b) => (b.date < a.date ? b : a))
    : null;
  const latest = timeline.length
    ? timeline.reduce((a, b) => (b.date > a.date ? b : a))
    : null;

  const careerYears =
    p.career ??
    (p.first_year && p.last_year
      ? `${p.first_year}–${p.last_year}`
      : p.first_year
        ? `${p.first_year}–`
        : null);

  // Scoring matches (newest first). For a prolific scorer the flat list is huge,
  // so we lead with the hauls and tuck the complete record, season-grouped, behind
  // a disclosure. The hauls lead with the biggest, then most recent.
  const braces = multiGoalGames - hatTricks;
  const hauls = matches
    .filter((m) => m.goals >= 2)
    .sort((a, b) => b.goals - a.goals || b.date.localeCompare(a.date));
  // The haul cards are a highlight reel, not the full multi-goal list — biggest
  // nights first, capped, with the complete record carried by the archive below.
  const topHauls = hauls.slice(0, 6);
  const longScoredList = matches.length > 25;
  const scoredBySeason: [string, typeof matches][] = [];
  const seasonIndex = new Map<string, number>();
  for (const m of matches) {
    let i = seasonIndex.get(m.season);
    if (i === undefined) {
      i = scoredBySeason.length;
      seasonIndex.set(m.season, i);
      scoredBySeason.push([m.season, []]);
    }
    scoredBySeason[i][1].push(m);
  }
  // The contribution spine reads left-to-right as the career, so oldest first;
  // hat-tricks get a pip, tying the spine to the haul cards above it.
  const scoringOldestFirst = [...matches].reverse();
  const hatTrickMarkers = matches
    .filter((m) => m.goals >= 3)
    .map((m) => ({ id: m.id, label: m.goals >= 4 ? `${m.goals} goals` : "Hat-trick" }));

  // Lineup appearances, season-grouped (newest first) for the full archive.
  const appsBySeason: [string, typeof appearances][] = [];
  const appsIndex = new Map<string, number>();
  for (const m of appearances) {
    let i = appsIndex.get(m.season);
    if (i === undefined) {
      i = appsBySeason.length;
      appsIndex.set(m.season, i);
      appsBySeason.push([m.season, []]);
    }
    appsBySeason[i][1].push(m);
  }

  // Goal-count badge with the recorded minutes, reused across the scored lists.
  const goalExtra = (m: { goals: number; minutes?: string | null }) => {
    const mins = (m.minutes ?? "")
      .split(",")
      .map((s) => Number(s))
      .filter((n) => Number.isFinite(n) && n > 0)
      .sort((a, b) => a - b);
    return (
      <span
        className={`stat-num whitespace-nowrap rounded px-2 py-0.5 text-xs font-semibold ${
          m.goals >= 3 ? "bg-gold/15 text-gold" : m.goals >= 2 ? "bg-devil/15 text-devil-bright" : "text-ink-faint"
        }`}
        title={mins.length ? `Goals at ${mins.map((x) => `${x}'`).join(", ")}` : undefined}
      >
        {m.goals >= 3 ? `${m.goals} goals` : m.goals === 2 ? "brace" : "1 goal"}
        {mins.length > 0 && <span className="ml-1 font-normal text-ink-faint">{mins.map((x) => `${x}'`).join(" ")}</span>}
      </span>
    );
  };

  // How he entered each appearance — started vs off the bench, with the role.
  const appsExtra = (m: { started: number; sub_on: number | null; role: string | null }) => (
    <span className="stat-num whitespace-nowrap text-xs">
      {m.started ? (
        <span className="text-devil-bright">Started</span>
      ) : (
        <span className="text-ink-dim">Sub{m.sub_on != null ? ` ${m.sub_on}'` : ""}</span>
      )}
      {m.role && <span className="ml-1.5 font-normal text-ink-faint">{m.role}</span>}
    </span>
  );

  // Season table sort.
  const seasonSortKey = parseSeasonSort(sp.sort);
  const seasonSortDir: SortDirection =
    sp.dir === "asc" || sp.dir === "desc" ? sp.dir : SEASON_SORT_DEFAULTS[seasonSortKey];
  const sortedSeasons = [...bySeason].sort((a, b) => compareSeasons(a, b, seasonSortKey, seasonSortDir));

  function seasonSortHref(nextKey: string, nextDir: SortDirection) {
    return `/player/${id}${queryString({ sort: nextKey, dir: nextDir })}#seasons`;
  }

  const seasonColumns: Column<SeasonSplit>[] = [
    {
      label: "Season",
      key: "season",
      sortKey: "season",
      sortDefaultDirection: SEASON_SORT_DEFAULTS.season,
      render: (s) => (
        <Link href={`/seasons/${s.season}`} className="font-medium text-ink hover:text-devil-bright">
          {s.season}
        </Link>
      ),
    },
    {
      label: "Apps",
      key: "apps",
      numeric: true,
      sortKey: "apps",
      sortDefaultDirection: SEASON_SORT_DEFAULTS.apps,
      render: (s) => (s.apps ? fmtNum(s.apps) : "—"),
    },
    {
      label: "Starts",
      key: "starts",
      numeric: true,
      hideBelow: "hidden sm:table-cell",
      sortKey: "starts",
      sortDefaultDirection: SEASON_SORT_DEFAULTS.starts,
      render: (s) => (s.starts ? fmtNum(s.starts) : "—"),
    },
    {
      label: "Goals",
      key: "goals",
      numeric: true,
      sortKey: "goals",
      sortDefaultDirection: SEASON_SORT_DEFAULTS.goals,
      render: (s) => (
        <span className={s.goals > 0 ? "text-devil-bright" : "text-ink-faint"}>{s.goals || "—"}</span>
      ),
    },
    {
      label: "Assists",
      key: "assists",
      numeric: true,
      hideBelow: "hidden sm:table-cell",
      sortKey: "assists",
      sortDefaultDirection: SEASON_SORT_DEFAULTS.assists,
      render: (s) => (
        <span className={s.assists > 0 ? "text-gold" : "text-ink-faint"}>{s.assists || "—"}</span>
      ),
    },
    {
      label: "G+A",
      key: "ga",
      numeric: true,
      sortKey: "ga",
      sortDefaultDirection: SEASON_SORT_DEFAULTS.ga,
      sortLabel: "goals plus assists",
      render: (s) => (s.goals + s.assists > 0 ? fmtNum(s.goals + s.assists) : "—"),
    },
  ];

  // The scoring-profile panel shows only the facets we can fill, so its column
  // count tracks what is present rather than leaving empty cells.
  const facetCount = [leagueGoals + cupGoals > 0, !!topOpponent, !!bestRun].filter(Boolean).length;
  const facetColsClass =
    facetCount >= 3 ? "sm:grid-cols-3" : facetCount === 2 ? "sm:grid-cols-2" : "sm:grid-cols-1";

  return (
    <div className="space-y-10">
      <PlayerPlate
        name={p.name}
        portrait={{
          src: p.player_thumb_url ?? p.player_image_url,
          pageUrl: p.player_image_page_url,
          license: p.player_image_license,
        }}
        primaryShirt={p.primary_shirt}
        position={p.position_label ? p.position_label.charAt(0).toUpperCase() + p.position_label.slice(1) : null}
        careerYears={careerYears}
        rank={ranks}
        stats={{
          goals: p.goals,
          apps: p.apps,
          starts: p.starts,
          subs: p.subs,
          goalsPerApp,
          multiGoalGames,
          hatTricks,
          assists: p.assists,
          curatedAssists: p.curated_assists,
        }}
        span={{ debut, latest, peakSeason }}
        shirts={shirts}
        caveat="Goals, apps, and starts use verified competitive player records where available. Goals per app, multi-goal games, minute, assist, and opponent splits below are drawn from recorded match coverage — the part of a career we can evidence, not a career total."
      />

      {(minutes.length > 3 || facetCount > 0) && (
        <section className="space-y-3">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <h2 className="display text-xl">The shape of his scoring</h2>
            <span className="stat-num text-xs text-ink-faint">recorded goals</span>
          </div>

          <div className="overflow-hidden rounded-xl border border-line bg-panel">
            {minutes.length > 3 && (
              <div className="border-b border-line p-4 sm:p-5">
                <div className="mb-2 flex items-baseline justify-between gap-3">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-ink-faint">When in the match the goals come</p>
                  {lateGoals > 0 && (
                    <span className="stat-num text-xs text-ink-dim">
                      <span className="text-devil-bright">{pct(lateGoals, minutes.length)}</span> in the final 15
                    </span>
                  )}
                </div>
                <MinuteRidge bins={ridgeBins} lateFrom={75} lateLabel={null} subject={p.name} height={170} />
                <p className="mt-1 text-xs text-ink-faint">
                  {fmtNum(minutes.length)} goals with a recorded minute, in 5-minute windows. The closing 15 are shaded;
                  the dashed line is an even spread across the 90.
                </p>
              </div>
            )}

            {facetCount > 0 && (
              <div className={`grid divide-y divide-line sm:divide-x sm:divide-y-0 ${facetColsClass}`}>
                {leagueGoals + cupGoals > 0 && (
                  <div className="p-4 sm:p-5">
                    <p className="mb-2.5 text-[11px] uppercase tracking-[0.14em] text-ink-faint">Where they landed</p>
                    <SplitBar
                      height={16}
                      segments={[
                        { value: leagueGoals, color: "var(--color-draw)" },
                        { value: cupGoals, color: "var(--color-gold)" },
                      ]}
                    />
                    <div className="stat-num mt-2.5 flex items-center justify-between text-xs">
                      <span className="text-ink-dim">
                        League <span className="text-ink">{fmtNum(leagueGoals)}</span>
                      </span>
                      <span className="text-gold">
                        Cup {fmtNum(cupGoals)}
                      </span>
                    </div>
                  </div>
                )}

                {topOpponent && (
                  <div className="p-4 sm:p-5">
                    <p className="mb-2.5 text-[11px] uppercase tracking-[0.14em] text-ink-faint">Favourite victim</p>
                    <Link href={`/opponent/${topOpponent.opponent_id}`} className="group block">
                      <span className="stat-num text-3xl font-semibold text-devil-bright">{fmtNum(topOpponent.goals)}</span>
                      <span className="ml-2 text-sm text-ink-dim">goals</span>
                      <div className="mt-0.5 truncate text-sm font-medium group-hover:text-devil-bright">
                        v {topOpponent.opponent_name}
                      </div>
                    </Link>
                    {opponentGoals.length > 1 && (
                      <p className="mt-1.5 truncate text-xs text-ink-faint">
                        then{" "}
                        {opponentGoals.slice(1, 3).map((o, i) => (
                          <span key={o.opponent_id}>
                            {i > 0 && ", "}
                            <Link href={`/opponent/${o.opponent_id}`} className="hover:text-devil-bright">
                              {o.opponent_name} <span className="stat-num">{fmtNum(o.goals)}</span>
                            </Link>
                          </span>
                        ))}
                      </p>
                    )}
                  </div>
                )}

                {bestRun && (
                  <div className="p-4 sm:p-5">
                    <p className="mb-2.5 text-[11px] uppercase tracking-[0.14em] text-ink-faint">Best scoring run</p>
                    <span className="stat-num text-3xl font-semibold text-devil-bright">{bestRun.length}</span>
                    <span className="ml-2 text-sm text-ink-dim">in a row</span>
                    <p className="stat-num mt-1 text-xs text-ink-faint">
                      {fmtDate(bestRun.from)} – {fmtDate(bestRun.to)}
                    </p>
                    <p className="mt-1 text-[11px] leading-4 text-ink-faint">
                      Consecutive matches scored in, across games with complete scorer records — gaps break a run.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      )}

      {curatedTotals && (
        <section className="space-y-4">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <h2 className="display text-xl">How he scored &amp; created</h2>
            <span className="stat-num text-xs text-ink-faint">
              curated · {curatedTotals.from_season?.slice(0, 4)}–{curatedTotals.to_season?.slice(0, 4)}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <StatTile label="Goals" value={fmtNum(curatedTotals.goals)} tone="red" />
            <StatTile label="Assists" value={fmtNum(curatedTotals.assists)} tone="gold" />
            <StatTile
              label="Goals + assists"
              value={fmtNum(curatedTotals.goals + curatedTotals.assists)}
            />
            {curatedTopType ? (
              <StatTile
                label="Main finish"
                value={curatedTopType.goal_type}
                detail={`${pct(curatedTopType.goals, curatedTotals.goals)} of goals`}
              />
            ) : (
              <StatTile label="Seasons" value={fmtNum(curatedTotals.seasons)} />
            )}
          </div>

          {curatedGoalTypes.length > 1 && (
            <ChartPanel
              title="How the goals were scored"
              note="Body part / technique behind each curated goal."
            >
              <GoalBodyMap types={curatedGoalTypes} totalGoals={curatedTotals.goals} />
            </ChartPanel>
          )}

          <CoverageNote
            slice="curated goals, assists & goal types, 1987–2015"
            coverage={`${fmtNum(curatedTotals.goals)} goals and ${fmtNum(curatedTotals.assists)} assists across ${fmtNum(curatedTotals.seasons)} seasons; hand-curated, not exhaustive, and not match-attributed.`}
            evidenceHref={curatedTotals.source_url ?? undefined}
            evidenceLabel="Tableau source"
          />
        </section>
      )}

      {bySeason.length > 0 && (
        <section id="seasons" className="space-y-3">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <h2 className="display text-xl">Season by season</h2>
            <span className="stat-num text-xs text-ink-faint">
              {fmtNum(p.recorded_goals)} recorded goals · {fmtNum(coveredSeasons.length)} of {fmtNum(bySeason.length)} seasons covered
            </span>
          </div>

          {bySeason.length > 1 && (
            <div className="rounded-xl border border-line bg-panel p-4 sm:p-5">
              <div className="mb-2 flex items-center gap-4 text-[11px] text-ink-faint">
                <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-devil" /> goals</span>
                <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-gold" /> assists</span>
              </div>
              <SeasonContributionChart
                data={bySeason.map((s) => ({
                  label: s.season.slice(0, 4),
                  goals: s.goals,
                  assists: s.assists,
                  valueLabel: `${fmtNum(s.goals)} goals · ${fmtNum(s.assists)} assists`,
                  meta: s.season,
                  href: `/seasons/${s.season}`,
                }))}
                labelEvery={Math.max(1, Math.floor(bySeason.length / 12))}
                chartLabel={`${p.name} goals and assists by season`}
              />
              <p className="mt-1 text-xs text-ink-faint">
                Recorded goals and combined assists (curated through 2014-15, match events after) per season;
                early or sparsely covered seasons can read low.
              </p>
            </div>
          )}

          <details open className="group">
            <summary className="flex cursor-pointer items-baseline justify-between gap-3 list-none">
              <h3 className="text-sm font-medium text-ink-dim">The full table</h3>
              <span className="stat-num text-xs text-ink-faint group-open:hidden">show</span>
              <span className="stat-num text-xs text-ink-faint hidden group-open:inline">hide</span>
            </summary>
            <div className="mt-3">
              <DataTable
                columns={seasonColumns}
                rows={sortedSeasons}
                rowKey={(s) => s.season}
                density="compact"
                caption={`${p.name} season-by-season apps, goals, and assists`}
                sort={{ key: seasonSortKey, direction: seasonSortDir, hrefFor: seasonSortHref }}
                summary={
                  <>
                    <span>{fmtNum(bySeason.length)} recorded seasons</span>
                    <span>
                      Sorted by{" "}
                      <span className="font-semibold text-ink">{SEASON_SORT_LABELS[seasonSortKey]}</span>,{" "}
                      {seasonSortDir === "asc" ? "ascending" : "descending"}
                    </span>
                  </>
                }
              />
              <CoverageNote
                slice="all competitions, per season"
                count={{
                  covered: coveredSeasons.length,
                  total: bySeason.length,
                  noun: "seasons carry lineup coverage",
                  note: "apps and assists reflect local data, so empty cells are coverage gaps, not zero",
                }}
              />
            </div>
          </details>
        </section>
      )}

      <section id="scored" className="space-y-4">
        <div className="flex items-baseline justify-between">
          <h2 className="display text-xl">Matches scored in</h2>
          {matches.length > 0 && (
            <span className="stat-num text-xs text-ink-faint">{fmtNum(matches.length)} matches</span>
          )}
        </div>

        {matches.length === 0 ? (
          <p className="rounded-lg border border-line bg-panel px-4 py-6 text-center text-sm text-ink-faint">
            No matches with recorded scorer data yet.
          </p>
        ) : (
          <>
            {matches.length >= 12 && (
              <div className="rounded-xl border border-line bg-panel p-4 sm:p-5">
                <p className="mb-2 text-[11px] uppercase tracking-[0.14em] text-ink-faint">Goals per game, across the career</p>
                <ContributionSpine matches={scoringOldestFirst} markers={hatTrickMarkers} subject={p.name} />
                <p className="mt-2 text-[11px] leading-4 text-ink-faint">
                  Every match he scored in, in order — bar height is the goals that game; gold marks the multi-goal
                  nights, the pips his hat-tricks. Scoring games only, so blank games aren&apos;t drawn.
                </p>
              </div>
            )}

            {!longScoredList ? (
              <MatchList matches={matches} showSeason renderExtra={goalExtra} />
            ) : (
              <>
                <p className="text-sm text-ink-dim">
                  {fmtNum(matches.length)} matches carry a recorded goal
                  {multiGoalGames > 0 && (
                    <>
                      , including{" "}
                      {braces > 0 && (
                        <span className="text-devil-bright">{fmtNum(braces)} brace{braces === 1 ? "" : "s"}</span>
                      )}
                      {braces > 0 && hatTricks > 0 && " and "}
                      {hatTricks > 0 && (
                        <span className="text-gold">{fmtNum(hatTricks)} hat-trick{hatTricks === 1 ? "" : "s"}</span>
                      )}
                    </>
                  )}
                  .
                </p>

                {topHauls.length > 0 && (
                  <div>
                    <h3 className="mb-2 text-sm font-medium text-ink-dim">
                      The big nights{hauls.length > topHauls.length && (
                        <span className="ml-2 font-normal text-ink-faint">top {topHauls.length} of {fmtNum(hauls.length)} multi-goal games</span>
                      )}
                    </h3>
                    <HaulCards hauls={topHauls} />
                  </div>
                )}

                <details className="group">
                  <summary className="flex cursor-pointer items-baseline justify-between gap-3 list-none">
                    <h3 className="text-sm font-medium text-ink-dim">Every scoring match, season by season</h3>
                    <span className="stat-num text-xs text-devil-bright">
                      <span className="group-open:hidden">show all {fmtNum(matches.length)}</span>
                      <span className="hidden group-open:inline">hide</span>
                    </span>
                  </summary>
                  <div className="mt-3">
                    <ArchiveJumpRail matches={matches} idPrefix="scored" />
                  </div>
                  <div className="mt-3 space-y-6">
                    {scoredBySeason.map(([season, ms]) => {
                      const seasonGoals = ms.reduce((a, m) => a + m.goals, 0);
                      return (
                        <div key={season} id={`scored-${season}`} className="scroll-mt-24">
                          <div className="mb-2 flex items-baseline justify-between border-b border-line pb-1">
                            <Link href={`/seasons/${season}`} className="stat-num text-sm font-medium text-ink hover:text-devil-bright">
                              {season}
                            </Link>
                            <span className="stat-num text-xs text-ink-faint">
                              <span className="text-devil-bright">{fmtNum(seasonGoals)}</span> goal{seasonGoals === 1 ? "" : "s"}
                              {" · "}{fmtNum(ms.length)} match{ms.length === 1 ? "" : "es"}
                            </span>
                          </div>
                          <MatchList matches={ms} renderExtra={goalExtra} />
                        </div>
                      );
                    })}
                  </div>
                </details>
              </>
            )}
          </>
        )}
      </section>

      {appearances.length > 0 && (
        <section className="space-y-3">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <h2 className="display text-xl">Lineup appearances</h2>
            <span className="stat-num text-xs text-ink-faint">{fmtNum(appearances.length)} covered</span>
          </div>

          {(() => {
            const started = appearances.filter((m) => m.started).length;
            const sub = appearances.length - started;
            return (
              <div className="rounded-xl border border-line bg-panel p-4 sm:p-5">
                <p className="mb-2.5 text-[11px] uppercase tracking-[0.14em] text-ink-faint">How he came into the game</p>
                <SplitBar
                  height={16}
                  segments={[
                    { value: started, color: "var(--color-devil)" },
                    { value: sub, color: "var(--color-draw)" },
                  ]}
                />
                <div className="stat-num mt-2.5 flex items-center justify-between text-xs">
                  <span className="text-ink-dim">
                    Started <span className="text-devil-bright">{fmtNum(started)}</span>
                  </span>
                  <span className="text-ink-dim">
                    Off the bench <span className="text-ink">{fmtNum(sub)}</span>
                  </span>
                </div>
                <p className="mt-2 text-xs text-ink-faint">
                  Across {fmtNum(appearances.length)} appearances with lineup coverage — not a career total.
                </p>
              </div>
            );
          })()}

          <details className="group">
            <summary className="flex cursor-pointer items-baseline justify-between gap-3 list-none">
              <h3 className="text-sm font-medium text-ink-dim">The matches, season by season</h3>
              <span className="stat-num text-xs text-devil-bright">
                <span className="group-open:hidden">show all {fmtNum(appearances.length)}</span>
                <span className="hidden group-open:inline">hide</span>
              </span>
            </summary>
            <div className="mt-3">
              <ArchiveJumpRail matches={appearances} idPrefix="apps" />
            </div>
            <div className="mt-3 space-y-6">
              {appsBySeason.map(([season, ms]) => {
                const starts = ms.filter((x) => x.started).length;
                return (
                  <div key={season} id={`apps-${season}`} className="scroll-mt-24">
                    <div className="mb-2 flex items-baseline justify-between border-b border-line pb-1">
                      <Link href={`/seasons/${season}`} className="stat-num text-sm font-medium text-ink hover:text-devil-bright">
                        {season}
                      </Link>
                      <span className="stat-num text-xs text-ink-faint">
                        {fmtNum(ms.length)} app{ms.length === 1 ? "" : "s"}
                        {" · "}<span className="text-devil-bright">{fmtNum(starts)}</span> started
                      </span>
                    </div>
                    <MatchList matches={ms} renderExtra={appsExtra} />
                  </div>
                );
              })}
            </div>
            <CoverageNote
              slice="lineup appearances, all competitions"
              coverage={`${fmtNum(appearances.length)} matches with lineup coverage, season by season — drawn from local lineup data, not a career appearance total.`}
            />
          </details>
        </section>
      )}

      {partnerships.length > 0 && (
        <AssistPartnerships playerId={id} rows={partnerships} />
      )}

      {(peakSeason || topOpponent) && (
        <section>
          <h2 className="display mb-3 text-xl">Keep exploring</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {peakSeason && (
              <TrailLink href={`/seasons/${peakSeason.season}`} title={peakSeason.season}>
                His most prolific recorded season, with {fmtNum(peakSeason.goals)} goals.
              </TrailLink>
            )}
            {topOpponent && (
              <TrailLink href={`/opponent/${topOpponent.opponent_id}`} title={topOpponent.opponent_name}>
                The opponent he has scored against most: {fmtNum(topOpponent.goals)} recorded goals.
              </TrailLink>
            )}
            <TrailLink href="/players" title="All players">
              {ranks
                ? `Where ${p.name} ranks among ${fmtNum(ranks.total)} recorded scorers.`
                : "Browse the full scorer and appearance index."}
            </TrailLink>
          </div>
        </section>
      )}

      <p className="text-sm">
        <Link href="/players" className="text-devil-bright hover:underline">← All players</Link>
      </p>
    </div>
  );
}
