import Link from "next/link";
import { coverageOverview, getMeta, playerCareerSparks, playersIndex, type PlayerCareerSpark, type PlayerTotals } from "@/lib/queries";
import { DataTable, type SortDirection } from "@/components/DataTable";
import { PlayerGreatnessMap } from "@/components/charts/PlayerGreatnessMap";
import { CareerSpanBar } from "@/components/charts/CareerSpanBar";
import { PlayerPortrait } from "@/components/PlayerPortrait";
import { PositionTag } from "@/components/PositionTag";
import { ShirtBadge } from "@/components/ShirtBadge";
import { SectionHead } from "@/components/SectionHead";
import { Leaderboard, type LeaderboardItem } from "@/components/Leaderboard";
import { CoverageNote } from "@/components/CoverageNote";
import { fmtNum, pct, fmtYearRange } from "@/lib/format";

export const revalidate = 86400;
export const metadata = {
  title: "Players",
  description: "Everyone to pull on the shirt for Manchester United since 1886 — searchable and sortable by appearances, goals, assists, and career span.",
};

type PlayerSortKey = "name" | "shirt" | "apps" | "starts" | "goals" | "assists" | "span";

const DEFAULT_PLAYER_SORT: PlayerSortKey = "goals";

// Combined assists are curated from 1987-88 on (and match-event–sourced after
// 2014-15); nothing earlier carries assist data. Used to show "–" rather than a
// misleading "0" for players whose career ends before coverage begins.
const ASSIST_COVERAGE_FROM_YEAR = 1987;

const PLAYER_SORT_DEFAULTS: Record<PlayerSortKey, SortDirection> = {
  name: "asc",
  shirt: "asc",
  apps: "desc",
  starts: "desc",
  goals: "desc",
  assists: "desc",
  span: "asc",
};

const PLAYER_SORT_LABELS: Record<PlayerSortKey, string> = {
  name: "Player",
  shirt: "No.",
  apps: "Apps",
  starts: "Starts",
  goals: "Goals",
  assists: "Assists",
  span: "Span",
};

function parsePlayerSort(value: string | undefined): PlayerSortKey {
  return value && Object.hasOwn(PLAYER_SORT_DEFAULTS, value) ? (value as PlayerSortKey) : DEFAULT_PLAYER_SORT;
}

function firstYearForPlayer(p: PlayerTotals): number | null {
  return p.first_year ?? (p.first_date ? Number(p.first_date.slice(0, 4)) : null);
}

function lastYearForPlayer(p: PlayerTotals): number | null {
  return p.last_year ?? (p.last_date ? Number(p.last_date.slice(0, 4)) : null);
}

function compareText(a: string, b: string, direction: SortDirection): number {
  const result = a.localeCompare(b, "en-GB", { sensitivity: "base" });
  return direction === "asc" ? result : -result;
}

function compareNumber(a: number | null | undefined, b: number | null | undefined, direction: SortDirection): number {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  return direction === "asc" ? a - b : b - a;
}

function comparePlayers(a: PlayerTotals, b: PlayerTotals, key: PlayerSortKey, direction: SortDirection): number {
  const primary =
    key === "name" ? compareText(a.name, b.name, direction)
    : key === "shirt" ? compareNumber(a.primary_shirt, b.primary_shirt, direction)
    : key === "apps" ? compareNumber(a.apps, b.apps, direction)
    : key === "starts" ? compareNumber(a.starts, b.starts, direction)
    : key === "assists" ? compareNumber(a.assists, b.assists, direction)
    : key === "span" ? compareNumber(firstYearForPlayer(a), firstYearForPlayer(b), direction)
    : compareNumber(a.goals, b.goals, direction);

  return primary
    || compareNumber(a.goals, b.goals, "desc")
    || compareNumber(a.apps, b.apps, "desc")
    || compareText(a.name, b.name, "asc");
}

function spanForPlayer(p: PlayerTotals) {
  const first = firstYearForPlayer(p);
  const last = lastYearForPlayer(p);
  return fmtYearRange(first, last);
}

export default async function PlayersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const rawQuery = (sp.q ?? "").trim();
  const q = rawQuery.toLowerCase();
  const sortKey = parsePlayerSort(sp.sort);
  const sortDirection: SortDirection =
    sp.dir === "asc" || sp.dir === "desc" ? sp.dir : PLAYER_SORT_DEFAULTS[sortKey];
  // "Own Goal" is a pseudo-scorer (own goals aggregated for the /questions cut and
  // its own page); it is not a player, so it never belongs in this directory's
  // leaderboards, scatter, register, or count.
  const allPlayers = playersIndex().filter((p) => p.player_id !== "own-goal");
  const filteredPlayers = q ? allPlayers.filter((p) => p.name.toLowerCase().includes(q)) : allPlayers;
  const players = [...filteredPlayers].sort((a, b) => comparePlayers(a, b, sortKey, sortDirection));
  // Progressive disclosure: render the top slice of the active sort by default
  // (≈95% fewer portrait images than the full ~984-row register), expanding to
  // the whole list on an explicit server round-trip. Search and the leaderboards
  // are the real access paths; this keeps the default page light without a pager.
  const REGISTER_LIMIT = 50;
  const showAll = sp.all === "1";
  const visiblePlayers = showAll ? players : players.slice(0, REGISTER_LIMIT);
  const truncated = players.length > visiblePlayers.length;
  const meta = getMeta();
  const coverage = coverageOverview();

  // Per-season apps+goals, grouped by player, used to derive each career's span and
  // busiest season for the register barbell. The axis (first→last year across every
  // player) is shared by all rows, so scanning the column reads as eras sliding
  // left→right on one timeline.
  const sparkRows = playerCareerSparks();
  const sparksByPlayer = new Map<string, PlayerCareerSpark[]>();
  let sparkAxisStart = Infinity;
  let sparkAxisEnd = -Infinity;
  for (const r of sparkRows) {
    const list = sparksByPlayer.get(r.player_id);
    if (list) list.push(r);
    else sparksByPlayer.set(r.player_id, [r]);
    const year = Number(r.season.slice(0, 4));
    if (year < sparkAxisStart) sparkAxisStart = year;
    if (year > sparkAxisEnd) sparkAxisEnd = year;
  }

  // Collapse each player's seasons to the span the barbell draws: first→last
  // played year. Just the two endpoints — the register column is too cramped to
  // also pip the busiest season. Players with no match-attributed seasons (early
  // pros) have no entry and fall back to the plain text span.
  const spanByPlayer = new Map<string, { first: number; last: number }>();
  for (const [id, list] of sparksByPlayer) {
    const played = list.filter((s) => s.apps > 0 || s.goals > 0);
    if (played.length === 0) continue;
    const years = played.map((s) => Number(s.season.slice(0, 4)));
    spanByPlayer.set(id, { first: Math.min(...years), last: Math.max(...years) });
  }
  const sparkAxisLabel =
    Number.isFinite(sparkAxisStart) && Number.isFinite(sparkAxisEnd)
      ? fmtYearRange(sparkAxisStart, sparkAxisEnd)
      : "—";
  const topScorer = [...allPlayers].sort((a, b) => b.goals - a.goals)[0];
  const mostApps = [...allPlayers].sort((a, b) => (b.apps || 0) - (a.apps || 0))[0];
  const verifiedRecords = allPlayers.filter((p) => p.record_apps != null).length;
  const assistsCovered = allPlayers.filter((p) => (p.assists || 0) > 0).length;
  const positionsCovered = allPlayers.filter((p) => p.position_bucket).length;
  const activeFilters = Boolean(q);

  // Leaderboards — the answers a reader would otherwise have to sort the 985-row
  // table for, by every meaningful measure. Computed from the same index.
  const portrait = (p: PlayerTotals) => p.player_thumb_url ?? p.player_image_url;
  const toItem = (p: PlayerTotals, figure: string, sub: string): LeaderboardItem => ({
    id: p.player_id, name: p.name, src: portrait(p), figure, sub,
  });
  const PROLIFIC_MIN = 150;
  const topGoals = [...allPlayers]
    .sort((a, b) => b.goals - a.goals)
    .slice(0, 6)
    .map((p) => toItem(p, fmtNum(p.goals), spanForPlayer(p)));
  const topAppsBoard = [...allPlayers]
    .sort((a, b) => (b.apps || 0) - (a.apps || 0))
    .slice(0, 6)
    .map((p) => toItem(p, fmtNum(p.apps || 0), spanForPlayer(p)));
  const prolific = [...allPlayers]
    .filter((p) => (p.apps || 0) >= PROLIFIC_MIN && p.goals > 0)
    .sort((a, b) => b.goals / (b.apps || 1) - a.goals / (a.apps || 1))
    .slice(0, 6)
    .map((p) => toItem(p, (p.goals / (p.apps || 1)).toFixed(2), `${fmtNum(p.goals)} in ${fmtNum(p.apps || 0)}`));
  const topAssists = [...allPlayers]
    .filter((p) => (p.assists || 0) > 0)
    .sort((a, b) => (b.assists || 0) - (a.assists || 0))
    .slice(0, 6)
    .map((p) => toItem(p, fmtNum(p.assists || 0), spanForPlayer(p)));

  const quickViews: { label: string; key: PlayerSortKey }[] = [
    { label: "Goals", key: "goals" },
    { label: "Appearances", key: "apps" },
    { label: "Assists", key: "assists" },
    { label: "Career span", key: "span" },
    { label: "A–Z", key: "name" },
  ];

  function sortHref(nextSortKey: string, nextDirection: SortDirection) {
    const params = new URLSearchParams();
    if (rawQuery) params.set("q", rawQuery);
    params.set("sort", nextSortKey);
    params.set("dir", nextDirection);
    return `/players?${params.toString()}`;
  }

  // Toggle the register between its top slice and the full list, keeping the
  // current search and sort. (Changing sort via a chip resets to the slice.)
  function disclosureHref(all: boolean) {
    const params = new URLSearchParams();
    if (rawQuery) params.set("q", rawQuery);
    params.set("sort", sortKey);
    params.set("dir", sortDirection);
    if (all) params.set("all", "1");
    return `/players?${params.toString()}`;
  }

  return (
    <div className="space-y-8">
      {/* The whole playing history as one object: the squad cloud, the servants
          along the foot, the scorers climbing, the immortals top-right. */}
      <section className="relative overflow-hidden rounded-xl border border-line bg-panel shadow-[0_22px_44px_rgb(0_0_0_/0.22)]">
        <div className="hero-grid pointer-events-none absolute inset-0 opacity-60" aria-hidden />
        <div
          className="pointer-events-none absolute -right-24 -top-28 h-72 w-2/3 rounded-full opacity-[0.12] blur-3xl"
          style={{ backgroundColor: "var(--color-devil)" }}
          aria-hidden
        />
        <div className="relative p-4 sm:p-5 lg:p-7">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-devil-bright lg:mb-3">
            People · the frontier
          </p>

          {/* Mobile: a scan-first headline strip — the stats that matter, one line of
              context, then the map on demand so the first screen isn't all chart. */}
          <div className="space-y-3 border-b border-line/60 pb-4 lg:hidden">
            <h1 className="display text-[1.65rem] leading-[1.02]">
              {fmtNum(allPlayers.length)} players, a handful immortal
            </h1>
            <p className="text-sm leading-6 text-ink-dim">
              {topScorer && <span className="font-semibold text-gold">{topScorer.name}</span>}
              {topScorer && mostApps && " · "}
              {mostApps && <span className="font-semibold text-devil-bright">{mostApps.name}</span>}
              {(topScorer || mostApps) && " — "}
              the two frontiers on goals and appearances.
            </p>
            <dl className="grid grid-cols-3 gap-2">
              <div className="min-w-0 border border-line/80 bg-panel-2/40 px-2.5 py-2">
                <dt className="text-[10px] uppercase tracking-[0.12em] text-ink-faint">Players</dt>
                <dd className="stat-num text-xl font-semibold text-ink">{fmtNum(allPlayers.length)}</dd>
              </div>
              <div className="min-w-0 border border-line/80 bg-panel-2/40 px-2.5 py-2">
                <dt className="text-[10px] uppercase tracking-[0.12em] text-ink-faint">Top scorer</dt>
                <dd className="stat-num text-xl font-semibold leading-tight text-gold">
                  {topScorer ? fmtNum(topScorer.goals) : "0"}
                  {topScorer && (
                    <span className="mt-0.5 block truncate text-[11px] font-normal normal-case tracking-normal text-ink-dim">
                      {topScorer.name}
                    </span>
                  )}
                </dd>
              </div>
              <div className="min-w-0 border border-line/80 bg-panel-2/40 px-2.5 py-2">
                <dt className="text-[10px] uppercase tracking-[0.12em] text-ink-faint">Most apps</dt>
                <dd className="stat-num text-xl font-semibold leading-tight text-devil-bright">
                  {mostApps ? fmtNum(mostApps.apps || 0) : "0"}
                  {mostApps && (
                    <span className="mt-0.5 block truncate text-[11px] font-normal normal-case tracking-normal text-ink-dim">
                      {mostApps.name}
                    </span>
                  )}
                </dd>
              </div>
            </dl>
          </div>

          {/* Desktop: the full intro the chart sits under. */}
          <div className="hidden lg:block">
            <h1 className="display max-w-3xl text-4xl leading-[0.95] sm:text-5xl">
              {fmtNum(allPlayers.length)} players, a handful immortal
            </h1>
            <p className="mt-4 max-w-2xl text-sm text-ink-dim sm:text-base">
              Everyone to pull on the shirt, placed by how long they stayed and how much they scored. Most
              cluster near the start — a cup tie, a cameo — while a few stretch out to the frontier:{" "}
              {topScorer && <span className="font-semibold text-ink">{topScorer.name}</span>} up the goals
              axis, {mostApps && <span className="font-semibold text-ink">{mostApps.name}</span>} far along
              the appearances.
            </p>

            <dl className="mt-5 flex flex-wrap gap-x-8 gap-y-2">
              <div>
                <dt className="text-[11px] uppercase tracking-[0.14em] text-ink-faint">Players</dt>
                <dd className="stat-num text-lg font-semibold text-ink">{fmtNum(allPlayers.length)}</dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-[0.14em] text-ink-faint">Top goalscorer</dt>
                <dd className="stat-num text-lg font-semibold text-gold">
                  {topScorer ? fmtNum(topScorer.goals) : "0"}{" "}
                  <span className="text-sm font-normal text-ink-dim">{topScorer?.name}</span>
                </dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-[0.14em] text-ink-faint">Most appearances</dt>
                <dd className="stat-num text-lg font-semibold text-devil-bright">
                  {mostApps ? fmtNum(mostApps.apps || 0) : "0"}{" "}
                  <span className="text-sm font-normal text-ink-dim">{mostApps?.name}</span>
                </dd>
              </div>
            </dl>
          </div>

          <details className="group mt-4 lg:hidden">
            <summary className="cursor-pointer text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-dim hover:text-ink focus-ring">
              The greatness map
            </summary>
            <div className="mt-3">
              <PlayerGreatnessMap players={allPlayers} />
            </div>
          </details>
          <div className="mt-7 hidden lg:block">
            <PlayerGreatnessMap players={allPlayers} />
          </div>
        </div>
      </section>

      {/* Movement 1 — the leaders: the answer to "who are the greats", by every
          measure at once, so nobody has to sort the register to find it. */}
      <section className="space-y-3">
        <SectionHead title="The leaders" aside="by every measure" />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Leaderboard title="Top goalscorers" unit="goals" items={topGoals} figureTone="text-devil-bright" />
          <Leaderboard title="Most appearances" unit="games" items={topAppsBoard} />
          <Leaderboard
            title="Goals per game"
            unit={`min. ${PROLIFIC_MIN} apps`}
            items={prolific}
            figureTone="text-devil-bright"
          />
          <Leaderboard
            title="Most assists"
            unit="assists"
            items={topAssists}
            figureTone="text-gold"
            note={`recorded for ${fmtNum(assistsCovered)} of ${fmtNum(allPlayers.length)} players and weighted to recent eras — an absence is unrecorded, not zero.`}
          />
        </div>
      </section>

      {/* Movement 2 — the full register: the auditable lookup tool, every player
          who appears in the archive, sortable and searchable. */}
      <section className="space-y-3">
        <SectionHead title="The full register" aside={`${fmtNum(allPlayers.length)} players`} />
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <form action="/players" className="lg:w-72">
            <label>
              <span className="sr-only">Find a player</span>
              <input
                type="search"
                name="q"
                defaultValue={sp.q ?? ""}
                placeholder="Find a player — Rooney, Best, Charlton"
                className="control w-full"
              />
            </label>
          </form>
          <nav aria-label="Quick views" className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-faint">Sort</span>
            {quickViews.map((v) => {
              const active = !activeFilters && sortKey === v.key;
              return (
                <Link
                  key={v.key}
                  href={sortHref(v.key, PLAYER_SORT_DEFAULTS[v.key])}
                  prefetch={false}
                  scroll={false}
                  className={`rounded-md border px-2.5 py-1 text-xs transition-colors focus-ring ${
                    active
                      ? "border-devil bg-devil/15 text-ink"
                      : "border-line bg-panel text-ink-dim hover:border-devil/50 hover:bg-panel-2 hover:text-ink"
                  }`}
                >
                  {v.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Teach the Career column once: a shared 1886→now timeline, each career a
            span from first year to last — sort by Career to watch the eras march across. */}
        <p className="hidden items-center justify-end gap-x-3 gap-y-1 text-[11px] text-ink-faint lg:flex">
          <span className="text-ink-dim">Career</span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-px w-5 bg-ink-dim/55" aria-hidden />
            first year → last
          </span>
          <span>
            on one shared <span className="stat-num">{sparkAxisLabel}</span> timeline,
            guides every 25 years
          </span>
        </p>

      <DataTable
        className="data-table-fit"
        registerCards
        registerLayout="leaderboard"
        registerHref={(p) => `/player/${p.player_id}`}
        registerSubline={(p) => `${fmtNum(p.apps || 0)} apps · ${spanForPlayer(p)}`}
        registerFigureTone={(key) =>
          key === "goals" ? "text-devil-bright" : key === "assists" ? "text-gold" : "text-ink"
        }
        rows={visiblePlayers}
        rowKey={(p) => p.player_id}
        caption="Manchester United player totals"
        summary={
          <>
            <span>
              <span className="stat-num text-ink">{fmtNum(visiblePlayers.length)}</span> shown{" "}
              {activeFilters
                ? `of ${fmtNum(players.length)} matching`
                : `of ${fmtNum(allPlayers.length)} players`}
            </span>
            <span>
              Sorted by <span className="font-semibold text-ink">{PLAYER_SORT_LABELS[sortKey]}</span>,{" "}
              {sortDirection === "asc" ? "ascending" : "descending"}
            </span>
          </>
        }
        emptyState={
          activeFilters ? (
            <span>
              No players match <span className="font-medium text-ink">&quot;{rawQuery}&quot;</span>.
            </span>
          ) : "No players are available."
        }
        sort={{
          key: sortKey,
          direction: sortDirection,
          hrefFor: sortHref,
        }}
        columns={[
          {
            label: "#",
            key: "rank",
            numeric: true,
            card: "skip",
            render: (_p, index) => <span className="text-ink-faint">{index + 1}</span>,
          },
          {
            label: "No.",
            key: "shirt",
            numeric: true,
            hideBelow: "hidden sm:table-cell",
            sortKey: "shirt",
            sortDefaultDirection: PLAYER_SORT_DEFAULTS.shirt,
            sortLabel: "primary shirt number",
            card: "skip",
            render: (p) => (
              <ShirtBadge
                number={p.primary_shirt}
                decade={p.primary_shirt_decade}
                apps={p.primary_shirt_apps}
                compact
                uniform
              />
            ),
            cardRender: (p) => (p.primary_shirt != null ? String(p.primary_shirt) : "—"),
          },
          {
            label: "Player",
            key: "name",
            sortKey: "name",
            sortDefaultDirection: PLAYER_SORT_DEFAULTS.name,
            card: "identity",
            render: (p) => (
              <div className="flex items-center gap-2.5">
                <PositionTag bucket={p.position_bucket} title={p.position_label} />
                <Link href={`/player/${p.player_id}`} className="flex min-w-0 items-center gap-3 font-medium hover:text-devil-bright">
                  <PlayerPortrait name={p.name} src={p.player_thumb_url ?? p.player_image_url} />
                  <span className="min-w-0 break-words leading-snug line-clamp-2 sm:line-clamp-none">{p.name}</span>
                </Link>
              </div>
            ),
            cardRender: (p) => (
              <span className="flex min-w-0 items-center gap-2.5">
                <PlayerPortrait name={p.name} src={p.player_thumb_url ?? p.player_image_url} size="xs" />
                <span className="flex min-w-0 items-center gap-1.5">
                  <PositionTag bucket={p.position_bucket} title={p.position_label} />
                  <span className="truncate text-sm font-medium leading-tight">{p.name}</span>
                </span>
              </span>
            ),
          },
          {
            label: "Goals",
            key: "goals",
            numeric: true,
            sortKey: "goals",
            sortDefaultDirection: PLAYER_SORT_DEFAULTS.goals,
            card: "figure",
            render: (p) => (
              <div className="flex flex-col items-end leading-tight">
                <span className="text-sm font-semibold text-devil-bright">{p.goals}</span>
                {p.goals > 0 && (p.apps || 0) > 0 && (
                  <span className="text-[10px] font-normal text-ink-faint">{(p.goals / p.apps).toFixed(2)}/g</span>
                )}
              </div>
            ),
            cardRender: (p) => fmtNum(p.goals),
          },
          {
            label: "Apps",
            key: "apps",
            numeric: true,
            hideBelow: "hidden sm:table-cell",
            sortKey: "apps",
            sortDefaultDirection: PLAYER_SORT_DEFAULTS.apps,
            render: (p) => (
              <div className="flex flex-col items-end leading-tight">
                <span className="text-sm">{p.apps || "0"}</span>
                {(p.apps || 0) > 0 && (
                  <span className="text-[10px] text-ink-faint">{Math.round((p.starts / p.apps) * 100)}% st</span>
                )}
              </div>
            ),
            cardRender: (p) => fmtNum(p.apps || 0),
          },
          {
            label: "Assists",
            key: "assists",
            numeric: true,
            hideBelow: "hidden sm:table-cell",
            sortKey: "assists",
            sortDefaultDirection: PLAYER_SORT_DEFAULTS.assists,
            sortLabel: "assists",
            render: (p) => {
              const last = lastYearForPlayer(p);
              if (last != null && last < ASSIST_COVERAGE_FROM_YEAR) {
                return <span className="text-ink-faint" title="Assists not recorded before 1987-88">–</span>;
              }
              return <span className="text-ink-dim">{p.assists || "0"}</span>;
            },
            cardRender: (p) => {
              const last = lastYearForPlayer(p);
              if (last != null && last < ASSIST_COVERAGE_FROM_YEAR) {
                return <span className="text-ink-faint" title="Assists not recorded before 1987-88">–</span>;
              }
              return fmtNum(p.assists || 0);
            },
          },
          {
            label: "Career",
            key: "span",
            hideBelow: "hidden lg:table-cell",
            headerClassName: "text-right",
            className: "text-right",
            sortKey: "span",
            sortDefaultDirection: PLAYER_SORT_DEFAULTS.span,
            sortLabel: "career span",
            cardRender: (p) => spanForPlayer(p),
            render: (p) => {
              const s = spanByPlayer.get(p.player_id);
              if (!s) {
                return (
                  <div className="flex justify-end">
                    <span className="text-ink-dim">{spanForPlayer(p)}</span>
                  </div>
                );
              }
              return (
                <div className="flex justify-end">
                  <div className="w-[140px] max-w-full">
                    <CareerSpanBar
                      first={s.first}
                      last={s.last}
                      axisStart={sparkAxisStart}
                      axisEnd={sparkAxisEnd}
                      label={`Career ${fmtYearRange(s.first, s.last)}`}
                      caption={fmtYearRange(s.first, s.last)}
                    />
                  </div>
                </div>
              );
            },
          },
        ]}
      />

        {(truncated || showAll) && (
          <div className="flex justify-center">
            {truncated ? (
              <Link
                href={disclosureHref(true)}
                prefetch={false}
                scroll={false}
                className="rounded-md border border-line bg-panel px-4 py-2 text-sm text-ink-dim transition-colors hover:border-devil/50 hover:bg-panel-2 hover:text-ink focus-ring"
              >
                Show all {fmtNum(players.length)} players →
              </Link>
            ) : (
              <Link
                href={disclosureHref(false)}
                prefetch={false}
                scroll={false}
                className="rounded-md border border-line bg-panel px-4 py-2 text-sm text-ink-dim transition-colors hover:border-devil/50 hover:bg-panel-2 hover:text-ink focus-ring"
              >
                Show top {REGISTER_LIMIT}
              </Link>
            )}
          </div>
        )}

        <CoverageNote
          slice="all competitive appearances and goals, league and cup"
          evidenceHref="/data"
          evidenceLabel="Coverage details"
        >
          Complete goalscorer rows cover{" "}
          <span className="stat-num text-ink">{fmtNum(coverage.completeScorers)}</span> matches (
          {pct(coverage.completeScorers, coverage.matches)}); verified club records cover{" "}
          <span className="stat-num text-ink">{fmtNum(verifiedRecords)}</span> players; lineup data covers{" "}
          <span className="stat-num text-ink">{fmtNum(Number(meta.matches_with_lineups ?? 0))}</span> matches.
          Assists are recorded for{" "}
          <span className="stat-num text-ink">{fmtNum(assistsCovered)}</span> players and weighted to recent eras.
          The position tag beside each name — GK, DF, MF or FW — is the
          player’s primary position from Wikidata, known for{" "}
          <span className="stat-num text-ink">{fmtNum(positionsCovered)}</span> players ({pct(positionsCovered, allPlayers.length)});
          where it is unknown the tag is omitted, never guessed.{" "}
        </CoverageNote>
      </section>
    </div>
  );
}
