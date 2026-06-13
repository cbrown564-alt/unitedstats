import Link from "next/link";
import { coverageOverview, getMeta, playersIndex, type PlayerTotals } from "@/lib/queries";
import { DataTable, type SortDirection } from "@/components/DataTable";
import { PageHeader, StatTile } from "@/components/PageHeader";
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
  assists: "Recorded assists",
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
  const topScorer = allPlayers[0];
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
    <div className="space-y-7">
      <PageHeader
        eyebrow="People"
        title="Players"
        aside={
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-line bg-line sm:min-w-96">
            <StatTile label={activeFilters ? "Shown" : "Players"} value={fmtNum(players.length)} tone="red" />
            <StatTile
              label="Top scorer"
              value={topScorer ? fmtNum(topScorer.goals) : "0"}
              detail={topScorer?.name}
              tone="gold"
            />
            <StatTile
              label="Most apps"
              value={mostApps ? fmtNum(mostApps.apps || 0) : "0"}
              detail={mostApps?.name}
            />
            <StatTile label="Lineup rows" value={fmtNum(Number(meta.lineup_entries ?? 0))} />
          </div>
        }
      >
        Player pages are emotional entry points into the archive. Totals are paired with coverage context,
        because scorer and lineup depth changes by era.
        <Link href="/data" className="ml-1 text-devil-bright hover:underline">Coverage details</Link>
      </PageHeader>

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
            label: "Rec. ast",
            key: "assists",
            numeric: true,
            hideBelow: "hidden sm:table-cell",
            sortKey: "assists",
            sortDefaultDirection: PLAYER_SORT_DEFAULTS.assists,
            sortLabel: "recorded assists",
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
