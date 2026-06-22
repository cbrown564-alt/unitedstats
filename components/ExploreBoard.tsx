import Link from "next/link";
import { WdlBar } from "@/components/WdlBar";
import { fmtNum, pct } from "@/lib/format";

export interface BoardRow {
  key: string;
  label: string;
  /** /matches link reproducing exactly this group's matches. */
  href: string;
  p: number;
  w: number;
  d: number;
  l: number;
  gf: number;
  ga: number;
}

// Shared grid template so the header and every row line up under one set of columns.
const GRID =
  "grid grid-cols-[1.25rem_minmax(0,7rem)_minmax(0,1fr)_3rem] gap-2.5 sm:grid-cols-[1.5rem_minmax(0,11rem)_minmax(0,1fr)_3.25rem_3.5rem_3.5rem] sm:gap-3";

/**
 * The explorer's result as a ranked ladder rather than a dense table: one row per
 * group, ordered by the active sort, each leading with the W/D/L form bar (the
 * app's record glyph) and its played/win-rate/goal-difference figures. The whole
 * row is the evidence link to the matches it counts. The bar carries form; the
 * "played" figure carries sample size; row order carries the ranking.
 */
export function ExploreBoard({ rows, dimLabel }: { rows: BoardRow[]; dimLabel: string }) {
  return (
    <div className="overflow-hidden rounded-lg border border-line bg-panel">
      <div
        className={`${GRID} items-center border-b border-line bg-panel-2/50 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-faint`}
      >
        <span className="text-right">#</span>
        <span className="truncate">{dimLabel}</span>
        <span>Form · W·D·L</span>
        <span className="hidden text-right sm:block">Played</span>
        <span className="text-right">Win %</span>
        <span className="hidden text-right sm:block">GD</span>
      </div>
      <ol>
        {rows.map((r, i) => {
          const gd = r.gf - r.ga;
          return (
            <li key={r.key} className="border-b border-line/60 last:border-b-0">
              <Link
                href={r.href}
                className={`group ${GRID} items-center px-3 py-2.5 transition-colors hover:bg-panel-2/60 focus-ring ${
                  i === 0 ? "bg-panel-2/40" : ""
                }`}
              >
                <span className="stat-num text-right text-xs text-ink-faint">{i + 1}</span>
                <span className="truncate font-medium text-ink group-hover:text-devil-bright">{r.label}</span>
                <div className="min-w-0">
                  <WdlBar w={r.w} d={r.d} l={r.l} size="sm" tooltip={false} />
                </div>
                <span className="hidden stat-num text-right text-sm text-ink-dim sm:block">{fmtNum(r.p)}</span>
                <span className="stat-num text-right text-sm font-semibold text-ink">{pct(r.w, r.p)}</span>
                <span
                  className={`hidden stat-num text-right text-sm sm:block ${
                    gd > 0 ? "text-win" : gd < 0 ? "text-loss" : "text-ink-dim"
                  }`}
                >
                  {gd > 0 ? `+${fmtNum(gd)}` : fmtNum(gd)}
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
