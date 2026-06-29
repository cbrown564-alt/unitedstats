import Link from "next/link";
import { FacetIcon } from "@/components/FacetIcon";
import { fmtNum } from "@/lib/format";

type MatchSort = "date-desc" | "date-asc" | "gd-desc" | "gd-asc";

/**
 * List chrome: match count and sort toggles in one row — no separate SORT band.
 */
export function MatchListToolbar({
  total,
  sort,
  dateSort,
  goalDiffSort,
  qs,
}: {
  total: number;
  sort: MatchSort;
  dateSort: "date-desc" | "date-asc";
  goalDiffSort: "gd-desc" | "gd-asc";
  qs: (overrides: Record<string, string | undefined>) => string;
}) {
  const sortPill = (active: boolean) =>
    active
      ? "border-devil/60 bg-devil/15 font-semibold text-devil-bright"
      : "border-line text-ink-dim hover:border-devil/50 hover:bg-panel-2 hover:text-ink";

  return (
    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
      <p className="stat-num text-sm text-ink-dim">
        {fmtNum(total)} {total === 1 ? "match" : "matches"}
      </p>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 text-sm">
        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-faint">Sort</span>
        <Link
          href={`/matches${qs({ sort: dateSort === "date-desc" ? "date-asc" : "date-desc", page: undefined })}`}
          aria-current={dateSort === sort ? "true" : undefined}
          className={`tap-target inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 transition-colors focus-ring ${sortPill(dateSort === sort)}`}
          title={dateSort === "date-desc" ? "Date: newest first" : "Date: oldest first"}
        >
          <FacetIcon name="calendar" className="h-3.5 w-3.5 shrink-0" />
          <span className="text-xs">Date</span>
          <span className="stat-num text-xs">{dateSort === sort ? (dateSort === "date-desc" ? "↓" : "↑") : ""}</span>
        </Link>
        <Link
          href={`/matches${qs({ sort: goalDiffSort === "gd-desc" ? "gd-asc" : "gd-desc", page: undefined })}`}
          aria-current={goalDiffSort === sort ? "true" : undefined}
          className={`tap-target inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 transition-colors focus-ring ${sortPill(goalDiffSort === sort)}`}
          title={goalDiffSort === "gd-desc" ? "Goal difference: highest first" : "Goal difference: lowest first"}
        >
          <FacetIcon name="margin" className="h-3.5 w-3.5 shrink-0" />
          <span className="text-xs">GD</span>
          <span className="stat-num text-xs">{goalDiffSort === sort ? (goalDiffSort === "gd-desc" ? "↓" : "↑") : ""}</span>
        </Link>
      </div>
    </div>
  );
}
