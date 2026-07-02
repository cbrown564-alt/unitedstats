import Link from "next/link";
import { CompetitionDot } from "@/components/CompetitionChip";
import { WdlBar } from "@/components/WdlBar";
import { fmtNum, pct } from "@/lib/format";
import { queryString } from "@/lib/url";

export type ManagerCompetitionRow = {
  id: string;
  name: string;
  type: string;
  p: number;
  w: number;
  d: number;
  l: number;
};

/**
 * Every competition this manager oversaw — ranked by volume, each row a W/D/L
 * bar with sample-size lane and a link into the filtered match archive.
 */
export function ManagerCompetitionsPanel({
  competitions,
  managerId,
}: {
  competitions: ManagerCompetitionRow[];
  managerId: string;
}) {
  if (competitions.length === 0) {
    return (
      <p className="rounded-lg border border-line bg-panel px-4 py-6 text-center text-sm text-ink-dim">
        No stamped matches by competition yet.
      </p>
    );
  }

  const maxP = Math.max(1, ...competitions.map((c) => c.p));

  return (
    <ol className="space-y-2">
      {competitions.map((c, index) => (
        <li key={c.id}>
          <Link
            href={`/matches${queryString({ manager: managerId, competition: c.id })}`}
            className="group block rounded-xl border border-line bg-panel px-4 py-2.5 transition-colors hover:border-devil/30 hover:bg-panel-2/50 focus-ring"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2">
                <span className="stat-num w-4 shrink-0 text-[10px] leading-none text-ink-faint">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <CompetitionDot type={c.type} />
                <span className="truncate text-sm font-medium text-ink group-hover:text-devil-bright">
                  {c.name}
                </span>
              </div>
              <span className="stat-num shrink-0 whitespace-nowrap text-sm leading-none text-ink-faint">
                <span className="font-semibold text-ink">{pct(c.w, c.p)}</span>{" "}
                <span className="text-[10px] font-semibold uppercase tracking-[0.12em]">won</span>
              </span>
            </div>
            <WdlBar
              w={c.w}
              d={c.d}
              l={c.l}
              size="sm"
              showLabels
              tooltip={false}
              volume={{ fraction: Math.sqrt(c.p / maxP), games: c.p }}
              className="mt-2"
            />
          </Link>
        </li>
      ))}
      <p className="stat-num pt-1 text-center text-[11px] text-ink-faint">
        {fmtNum(competitions.length)} competitions · {fmtNum(competitions.reduce((n, c) => n + c.p, 0))} matches
      </p>
    </ol>
  );
}
