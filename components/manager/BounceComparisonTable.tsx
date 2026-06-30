import Link from "next/link";
import { DataTable } from "@/components/DataTable";
import { PlayerPortrait } from "@/components/PlayerPortrait";
import { fmtDate } from "@/lib/format";
import type { ManagerBounce } from "@/lib/trails";

function swingWins(b: ManagerBounce): number {
  return b.first10.w - b.prev10.w;
}

const bounceColumns = [
  {
    label: "Manager",
    key: "manager",
    card: "identity" as const,
    render: (b: ManagerBounce) => (
      <Link href={`/manager/${b.id}`} className="font-medium hover:text-devil-bright">
        {b.name}
      </Link>
    ),
    cardRender: (b: ManagerBounce) => (
      <span className="flex min-w-0 items-center gap-2.5">
        <PlayerPortrait name={b.name} src={b.thumb_url ?? b.image_url} size="xs" />
        <span className="truncate text-sm font-medium leading-tight">{b.name}</span>
      </span>
    ),
  },
  {
    label: "From",
    key: "from",
    className: "text-xs text-ink-faint",
    render: (b: ManagerBounce) => fmtDate(b.first_date),
  },
  {
    label: "Prev 10",
    key: "prev",
    numeric: true,
    className: "text-ink-dim",
    render: (b: ManagerBounce) => `${b.prev10.w}W ${b.prev10.d}D ${b.prev10.l}L`,
  },
  {
    label: "First 10",
    key: "first",
    numeric: true,
    render: (b: ManagerBounce) => `${b.first10.w}W ${b.first10.d}D ${b.first10.l}L`,
  },
  {
    label: "Swing",
    key: "swing",
    numeric: true,
    sortKey: "swing",
    card: "figure" as const,
    render: (b: ManagerBounce) => {
      const delta = swingWins(b);
      return (
        <span className={delta > 0 ? "text-win" : delta < 0 ? "text-loss" : "text-ink-faint"}>
          {delta > 0 ? `+${delta}` : delta}
        </span>
      );
    },
    cardRender: (b: ManagerBounce) => {
      const delta = swingWins(b);
      return (
        <span className={delta > 0 ? "text-win" : delta < 0 ? "text-loss" : "text-ink-faint"}>
          {delta > 0 ? `+${delta}` : delta}
        </span>
      );
    },
  },
];

/** Appendix table for the manager-bounce question — leaderboard row on mobile. */
export function BounceComparisonTable({ bounce }: { bounce: ManagerBounce[] }) {
  const rows = [...bounce].sort((a, b) => swingWins(b) - swingWins(a));

  return (
    <DataTable
      caption="New-manager bounce comparison"
      rows={rows}
      rowKey={(b) => b.id}
      density="compact"
      registerCards
      registerLayout="leaderboard"
      registerHref={(b) => `/manager/${b.id}`}
      registerSubline={(b) =>
        `Prev 10 ${b.prev10.w}W-${b.prev10.d}D-${b.prev10.l}L · First 10 ${b.first10.w}W-${b.first10.d}D-${b.first10.l}L`
      }
      sort={{ key: "swing", direction: "desc" }}
      columns={bounceColumns}
    />
  );
}
