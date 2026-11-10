import type { CSSProperties, ReactNode } from "react";

export type AxisTick = { at: number; label: string };

/**
 * The frame every hand-drawn chart shares: a y-label gutter, a plot box whose
 * children draw in percentages (0..100 across and down), horizontal grid lines,
 * and HTML x labels. Server-rendered, so the chart is readable before (and
 * without) any client code.
 */
export function PlotShell({
  height,
  fill = false,
  yAxisWidth = 58,
  yTicks = [],
  xTicks = [],
  padTop = 10,
  padRight = 8,
  xAxisHeight = 26,
  slantX = false,
  grid = "solid",
  xAxisLabel,
  children,
}: {
  height?: number;
  /** Take the parent's definite height instead of `height`. */
  fill?: boolean;
  yAxisWidth?: number;
  /** `at`: 0..100 from the top of the plot box. */
  yTicks?: AxisTick[];
  /** `at`: 0..100 across the plot box. */
  xTicks?: AxisTick[];
  padTop?: number;
  padRight?: number;
  xAxisHeight?: number;
  slantX?: boolean;
  grid?: "solid" | "dashed" | "none";
  xAxisLabel?: string;
  children: ReactNode;
}) {
  const style: CSSProperties = fill ? {} : { height };
  const xRow = slantX ? 52 : xAxisHeight + (xAxisLabel ? 14 : 0);
  return (
    <div className={`flex w-full min-w-0 flex-col ${fill ? "h-full min-h-40" : ""}`} style={style}>
      <div className="flex min-h-0 flex-1" style={{ paddingTop: padTop, paddingRight: padRight }}>
        <div className="relative shrink-0" style={{ width: yAxisWidth }} aria-hidden>
          {yTicks.map((t) => (
            <span
              key={`${t.at}-${t.label}`}
              className="absolute right-2 -translate-y-1/2 whitespace-nowrap text-[11px] leading-none text-ink-faint"
              style={{ top: `${t.at}%` }}
            >
              {t.label}
            </span>
          ))}
        </div>
        <div className="relative min-w-0 flex-1">
          {grid !== "none" && yTicks.length > 0 && (
            <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
              {yTicks.map((t) => (
                <line
                  key={t.at}
                  x1={0}
                  x2={100}
                  y1={t.at}
                  y2={t.at}
                  stroke="var(--color-line)"
                  strokeOpacity={grid === "dashed" ? 0.35 : 0.64}
                  strokeDasharray={grid === "dashed" ? "3 3" : undefined}
                  vectorEffect="non-scaling-stroke"
                />
              ))}
            </svg>
          )}
          {children}
        </div>
      </div>
      <div className="relative shrink-0" style={{ height: xRow, marginLeft: yAxisWidth, marginRight: padRight }} aria-hidden>
        {xTicks.map((t, i) =>
          slantX ? (
            <span
              key={`${i}-${t.label}`}
              className="absolute top-1 origin-top-right whitespace-nowrap text-[10px] leading-none text-ink-faint"
              style={{ right: `${100 - t.at}%`, transform: "rotate(-55deg)" }}
            >
              {t.label}
            </span>
          ) : (
            <span
              key={`${i}-${t.label}`}
              className="absolute top-2 -translate-x-1/2 whitespace-nowrap text-[11px] leading-none text-ink-faint"
              style={{ left: `${t.at}%` }}
            >
              {t.label}
            </span>
          ),
        )}
        {xAxisLabel && (
          <span className="absolute bottom-0 left-1/2 -translate-x-1/2 text-[11px] text-ink-faint">{xAxisLabel}</span>
        )}
      </div>
    </div>
  );
}
