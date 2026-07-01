import Link from "next/link";
import { playerCareerSparks, playersIndex, type PlayerCareerSpark, type PlayerTotals } from "@/lib/queries";
import type { SortDirection } from "@/components/DataTable";
import { PlayerGreatnessMap } from "@/components/charts/PlayerGreatnessMap";
import { PlayersLeaders } from "@/components/PlayersLeaders";
import { PlayersRegisterTable } from "@/components/PlayersRegisterTable";
import { SectionHead } from "@/components/SectionHead";
import { type LeaderboardItem } from "@/components/Leaderboard";
import { CoverageNote } from "@/components/CoverageNote";
import { PageHeader } from "@/components/PageHeader";
import { fmtNum, pct, fmtYearRange } from "@/lib/format";

export const revalidate = 86400;
export const metadata = {
  title: "Players",
  description: "Everyone to pull on the shirt for Manchester United since 1886 — searchable and sortable by appearances, goals, assists, and career span.",
};

type PlayerSortKey = "name" | "shirt" | "apps" | "starts" | "goals" | "assists" | "span";

const DEFAULT_PLAYER_SORT: PlayerSortKey = "goals";

const PLAYER_SORT_DEFAULTS: Record<PlayerSortKey, SortDirection> = {
  name: "asc",
  shirt: "asc",
  apps: "desc",
  starts: "desc",
  goals: "desc",
  assists: "desc",
  span: "asc",
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
  const allPlayers = playersIndex().filter((p) => p.player_id !== "own-goal");
  const filteredPlayers = q ? allPlayers.filter((p) => p.name.toLowerCase().includes(q)) : allPlayers;
  const players = [...filteredPlayers].sort((a, b) => comparePlayers(a, b, sortKey, sortDirection));
  const REGISTER_LIMIT = 50;
  const showAll = sp.all === "1";
  const visiblePlayers = showAll ? players : players.slice(0, REGISTER_LIMIT);
  const truncated = players.length > visiblePlayers.length;

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

  const spanByPlayer = new Map<string, { first: number; last: number }>();
  for (const [id, list] of sparksByPlayer) {
    const played = list.filter((s) => s.apps > 0 || s.goals > 0);
    if (played.length === 0) continue;
    const years = played.map((s) => Number(s.season.slice(0, 4)));
    spanByPlayer.set(id, { first: Math.min(...years), last: Math.max(...years) });
  }
  const topScorer = [...allPlayers].sort((a, b) => b.goals - a.goals)[0];
  const mostApps = [...allPlayers].sort((a, b) => (b.apps || 0) - (a.apps || 0))[0];
  const activeFilters = Boolean(q);

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

  const quickViews: { label: string; key: PlayerSortKey }[] = [
    { label: "Goals", key: "goals" },
    { label: "Appearances", key: "apps" },
    { label: "Assists", key: "assists" },
    { label: "Debut", key: "span" },
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
      <PageHeader eyebrow="People · the frontier" title="Players" deferOnMobile>
        Most barely feature. A few defined the club for decades.
      </PageHeader>

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
          <div className="space-y-3 border-b border-line/60 pb-4 lg:hidden">
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

          <div className="hidden lg:block">
            <dl className="flex flex-wrap gap-x-8 gap-y-2">
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

      <section className="space-y-3">
        <SectionHead title="The leaders" aside="appearances and goals" />
        <PlayersLeaders topGoals={topGoals} topApps={topAppsBoard} prolific={prolific} />
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
                placeholder="Find a player"
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

        <PlayersRegisterTable
          visiblePlayers={visiblePlayers}
          playersCount={players.length}
          allPlayersCount={allPlayers.length}
          activeFilters={activeFilters}
          sortKey={sortKey}
          sortDirection={sortDirection}
          rawQuery={rawQuery}
          spanByPlayer={Object.fromEntries(spanByPlayer)}
          sparkAxisStart={sparkAxisStart}
          sparkAxisEnd={sparkAxisEnd}
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
        />
      </section>
    </div>
  );
}
