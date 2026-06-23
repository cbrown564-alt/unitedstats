import Link from "next/link";
import { WdlBar } from "@/components/WdlBar";
import { fmtNum } from "@/lib/format";
import { metricFmt, metricLabel, type CutGroup, type CutMetric } from "@/lib/cut";

// Shared grid template so the header and every row line up under one set of columns.
// Mobile drops the Played column; the lens figure is always the last, emphasised cell.
const GRID =
  "grid grid-cols-[1.25rem_minmax(0,7rem)_minmax(0,1fr)_4rem] gap-2.5 sm:grid-cols-[1.5rem_minmax(0,12rem)_minmax(0,1fr)_3.5rem_4.5rem] sm:gap-3";

/**
 * A Cut's result as a ranked ladder rather than a dense table: one row per group,
 * ordered by the active metric (the lens), each leading with the W·D·L form bar —
 * the app's record glyph — and ending with the lens figure as the emphasised
 * ranking column. The whole row is the evidence link to exactly the matches it
 * counts. The bar carries form; "played" carries sample size; the lens column
 * carries the ranking; row order carries the standings.
 */
export function CutBoard({
  groups,
  metric,
  dimLabel,
}: {
  groups: CutGroup[];
  metric: CutMetric;
  dimLabel: string;
}) {
  const lensHead = metricLabel(metric);
  return (
    <div className="overflow-hidden rounded-lg border border-line bg-panel">
      <div
        className={`${GRID} items-center border-b border-line bg-panel-2/50 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-faint`}
      >
        <span className="text-right">#</span>
        <span className="truncate">{dimLabel}</span>
        <span>Form · W·D·L</span>
        <span className="hidden text-right sm:block">Played</span>
        <span className="text-right">{lensHead}</span>
      </div>
      <ol>
        {groups.map((g, i) => (
          <li key={g.key} className="border-b border-line/60 last:border-b-0">
            <Link
              href={g.href}
              className={`group ${GRID} items-center px-3 py-2.5 transition-colors hover:bg-panel-2/60 focus-ring ${
                i === 0 ? "bg-panel-2/40" : ""
              }`}
            >
              <span className="stat-num text-right text-xs text-ink-faint">{i + 1}</span>
              <span className="truncate font-medium text-ink group-hover:text-devil-bright">{g.label}</span>
              <div className="min-w-0">
                <WdlBar w={g.w} d={g.d} l={g.l} size="sm" tooltip={false} />
              </div>
              <span className="hidden stat-num text-right text-sm text-ink-dim sm:block">{fmtNum(g.p)}</span>
              <span className="stat-num flex items-baseline justify-end gap-1 text-right text-sm font-semibold text-ink">
                {g.thin && (
                  <span
                    className="text-[10px] font-normal uppercase tracking-wide text-ink-faint"
                    title={`Thin sample — ${fmtNum(g.p)} ${g.p === 1 ? "match" : "matches"}`}
                  >
                    thin
                  </span>
                )}
                {metricFmt(g.value, metric)}
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}
