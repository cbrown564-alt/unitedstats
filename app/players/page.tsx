import Link from "next/link";
import { coverageOverview, getMeta, playersIndex } from "@/lib/queries";
import { DataTable } from "@/components/DataTable";
import { PageHeader, StatTile } from "@/components/PageHeader";
import { PlayerPortrait } from "@/components/PlayerPortrait";
import { ShirtBadge } from "@/components/ShirtBadge";
import { fmtNum, pct } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Players" };

export default async function PlayersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim().toLowerCase();
  const allPlayers = playersIndex();
  const players = q ? allPlayers.filter((p) => p.name.toLowerCase().includes(q)) : allPlayers;
  const meta = getMeta();
  const coverage = coverageOverview();
  const topScorer = allPlayers[0];
  const mostApps = [...allPlayers].sort((a, b) => (b.apps || 0) - (a.apps || 0))[0];
  const verifiedRecords = allPlayers.filter((p) => p.record_apps != null).length;
  const activeFilters = Boolean(q);

  function spanForPlayer(p: (typeof allPlayers)[number]) {
    const first = p.first_year ?? (p.first_date ? Number(p.first_date.slice(0, 4)) : null);
    const last = p.last_year ?? (p.last_date ? Number(p.last_date.slice(0, 4)) : null);
    if (!first) return "?";
    return `${first}-${last ?? "present"}`;
  }

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="People"
        title="Players"
        aside={
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-line bg-line sm:min-w-96">
            <StatTile label={activeFilters ? "Shown" : "Players"} value={fmtNum(players.length)} tone="red" />
            <StatTile label="Top scorer" value={topScorer ? fmtNum(topScorer.goals) : "0"} tone="gold" />
            <StatTile label="Most apps" value={mostApps ? fmtNum(mostApps.apps || 0) : "0"} />
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
        columns={[
          { label: "#", numeric: true, render: (p) => <span className="text-ink-faint">{players.indexOf(p) + 1}</span> },
          {
            label: "No.",
            numeric: true,
            hideBelow: "hidden sm:table-cell",
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
            render: (p) => (
              <Link href={`/player/${p.player_id}`} className="flex items-center gap-3 font-medium hover:text-devil-bright">
                <PlayerPortrait name={p.name} src={p.player_thumb_url ?? p.player_image_url} />
                <span>{p.name}</span>
              </Link>
            ),
          },
          { label: "Apps", numeric: true, render: (p) => p.apps || "0" },
          { label: "Starts", numeric: true, hideBelow: "hidden sm:table-cell", render: (p) => p.starts || "0" },
          { label: "Goals", numeric: true, render: (p) => <span className="font-semibold text-devil-bright">{p.goals}</span> },
          { label: "Rec. ast", numeric: true, hideBelow: "hidden sm:table-cell", render: (p) => p.assists || "0" },
          {
            label: "Span",
            numeric: true,
            hideBelow: "hidden lg:table-cell",
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
