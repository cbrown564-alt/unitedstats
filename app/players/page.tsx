import Link from "next/link";
import { coverageOverview, getMeta, playersIndex, type PlayerTotals } from "@/lib/queries";
import { DataTable, type SortDirection } from "@/components/DataTable";
import { PlayerGreatnessMap } from "@/components/charts/PlayerGreatnessMap";
import { PlayerPortrait } from "@/components/PlayerPortrait";
import { ShirtBadge } from "@/components/ShirtBadge";
import { fmtNum, pct } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Players" };

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
  if (!first) return "?";
  return `${first}-${last ?? "present"}`;
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
  const allPlayers = playersIndex();
  const filteredPlayers = q ? allPlayers.filter((p) => p.name.toLowerCase().includes(q)) : allPlayers;
  const players = [...filteredPlayers].sort((a, b) => comparePlayers(a, b, sortKey, sortDirection));
  const meta = getMeta();
  const coverage = coverageOverview();
  const topScorer = [...allPlayers].sort((a, b) => b.goals - a.goals)[0];
  const mostApps = [...allPlayers].sort((a, b) => (b.apps || 0) - (a.apps || 0))[0];
  const verifiedRecords = allPlayers.filter((p) => p.record_apps != null).length;
  const activeFilters = Boolean(q);

  function sortHref(nextSortKey: string, nextDirection: SortDirection) {
    const params = new URLSearchParams();
    if (rawQuery) params.set("q", rawQuery);
    params.set("sort", nextSortKey);
    params.set("dir", nextDirection);
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
        <div className="relative p-5 sm:p-7">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-devil-bright">
            People · the frontier
          </p>
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
              <dt className="text-[11px] uppercase tracking-[0.14em] text-ink-faint">Top scorer</dt>
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

          <div className="mt-7">
            <PlayerGreatnessMap players={allPlayers} />
          </div>
        </div>
      </section>

      <section className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <form action="/players" className="rounded-lg border border-line bg-panel p-3">
          <label>
            <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.14em] text-ink-faint">Find a player</span>
            <input
              type="search"
              name="q"
              defaultValue={sp.q ?? ""}
              placeholder="Rooney, Best, Charlton"
              className="control w-full"
            />
          </label>
        </form>
        <div className="rounded-lg border border-line bg-panel p-3 text-xs leading-5 text-ink-dim">
        <span className="font-semibold text-ink">Trust context:</span> complete scorer rows cover{" "}
        <span className="stat-num text-ink">{fmtNum(coverage.completeScorers)}</span> matches
        {" "}({pct(coverage.completeScorers, coverage.matches)}); verified player records cover{" "}
        <span className="stat-num text-ink">{fmtNum(verifiedRecords)}</span> players; lineup data covers{" "}
        <span className="stat-num text-ink">{fmtNum(Number(meta.matches_with_lineups ?? 0))}</span> matches.
        </div>
      </section>

      <DataTable
        rows={players}
        rowKey={(p) => p.player_id}
        caption="Manchester United player totals"
        summary={
          <>
            <span>
              <span className="stat-num text-ink">{fmtNum(players.length)}</span>{" "}
              {activeFilters ? `of ${fmtNum(allPlayers.length)} players shown` : "players"}
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
            render: (p) => (
              <ShirtBadge
                number={p.primary_shirt}
                decade={p.primary_shirt_decade}
                apps={p.primary_shirt_apps}
                compact
              />
            ),
          },
          {
            label: "Player",
            key: "name",
            sortKey: "name",
            sortDefaultDirection: PLAYER_SORT_DEFAULTS.name,
            render: (p) => (
              <Link href={`/player/${p.player_id}`} className="flex items-center gap-3 font-medium hover:text-devil-bright">
                <PlayerPortrait name={p.name} src={p.player_thumb_url ?? p.player_image_url} />
                <span>{p.name}</span>
              </Link>
            ),
          },
          {
            label: "Apps",
            key: "apps",
            numeric: true,
            sortKey: "apps",
            sortDefaultDirection: PLAYER_SORT_DEFAULTS.apps,
            render: (p) => p.apps || "0",
          },
          {
            label: "Starts",
            key: "starts",
            numeric: true,
            hideBelow: "hidden sm:table-cell",
            sortKey: "starts",
            sortDefaultDirection: PLAYER_SORT_DEFAULTS.starts,
            render: (p) => p.starts || "0",
          },
          {
            label: "Goals",
            key: "goals",
            numeric: true,
            sortKey: "goals",
            sortDefaultDirection: PLAYER_SORT_DEFAULTS.goals,
            render: (p) => <span className="font-semibold text-devil-bright">{p.goals}</span>,
          },
          {
            label: "Assists",
            key: "assists",
            numeric: true,
            hideBelow: "hidden sm:table-cell",
            sortKey: "assists",
            sortDefaultDirection: PLAYER_SORT_DEFAULTS.assists,
            sortLabel: "assists",
            render: (p) => p.assists || "0",
          },
          {
            label: "Span",
            key: "span",
            numeric: true,
            hideBelow: "hidden lg:table-cell",
            sortKey: "span",
            sortDefaultDirection: PLAYER_SORT_DEFAULTS.span,
            sortLabel: "career span",
            render: (p) => (
              <span className="text-ink-dim">
                {spanForPlayer(p)}
              </span>
            ),
          },
        ]}
      />
    </div>
  );
}
