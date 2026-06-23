import Link from "next/link";
import { WdlBar } from "@/components/WdlBar";
import { fmtNum } from "@/lib/format";
import { metricFmt, metricShort, type CutGroup, type CutMetric } from "@/lib/cut";

// One working grid shared by the header and every row, mirroring the record-index
// rows (IndexRow): a flexible label column, the form bar in the middle, the lens
// figure trailing. Mobile drops the bar to two columns; the bar returns at sm.
const ROW =
  "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 sm:grid-cols-[minmax(0,15rem)_minmax(0,1fr)_auto] sm:gap-x-6";

/**
 * A Cut's result as a floodlit standings ladder — the league-table metaphor the
 * record lives in. Each row is the diverging-free W·D·L form bar (the app's record
 * glyph) with a √-scaled volume lane beneath it carrying sample size, the group's
 * label, and the active lens figure trailing as the ranking number. The standout
 * group for the lens glows gold wherever it sits (chronological cuts keep their
 * timeline order, so the peak is rarely at the top). Every row links to exactly the
 * matches it counts.
 */
export function CutBoard({
  groups,
  metric,
  dimLabel,
  standoutKey,
}: {
  groups: CutGroup[];
  metric: CutMetric;
  dimLabel: string;
  standoutKey?: string;
}) {
  const maxPlayed = groups.reduce((m, g) => Math.max(m, g.p), 0) || 1;
  return (
    <div className="overflow-hidden rounded-xl border border-line bg-panel">
      <div
        className={`${ROW} border-b border-line bg-panel-2/40 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-faint`}
      >
        <span className="pl-8">{dimLabel}</span>
        <span className="hidden sm:block">Form · W·D·L</span>
        <span className="text-right">{metricShort(metric)}</span>
      </div>
      <ol className="divide-y divide-line/60">
        {groups.map((g, i) => {
          const standout = g.key === standoutKey;
          return (
            <li key={g.key}>
              <Link
                href={g.href}
                className={`group ${ROW} min-h-[3.5rem] px-4 py-2.5 transition-colors hover:bg-panel-2/50 focus-ring ${
                  standout ? "bg-gold/[0.06] shadow-[inset_2px_0_0_var(--color-gold)]" : ""
                }`}
              >
                <span className="flex min-w-0 items-center gap-3">
                  <span className="stat-num w-5 shrink-0 text-right text-xs text-ink-faint">{i + 1}</span>
                  <span className="min-w-0">
                    <span
                      className={`block truncate font-medium leading-tight ${
                        standout ? "text-gold" : "text-ink"
                      } group-hover:text-devil-bright`}
                    >
                      {g.label}
                    </span>
                    <span className="stat-num block text-[11px] text-ink-faint sm:hidden">
                      {fmtNum(g.p)} played
                      {g.thin && <span className="ml-1.5 uppercase tracking-wide">· thin</span>}
                    </span>
                  </span>
                </span>

                <div className="hidden min-w-0 sm:block">
                  <WdlBar
                    w={g.w}
                    d={g.d}
                    l={g.l}
                    size="sm"
                    tooltip={false}
                    volume={{ fraction: g.p / maxPlayed, games: g.p }}
                  />
                </div>

                <span className="stat-num whitespace-nowrap text-right leading-tight">
                  <span className={`block text-base font-semibold ${standout ? "text-gold" : "text-ink"}`}>
                    {metricFmt(g.value, metric)}
                  </span>
                  {g.thin && (
                    <span className="hidden text-[10px] font-normal uppercase tracking-wide text-ink-faint sm:block">
                      thin sample
                    </span>
                  )}
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
