import { useId } from "react";
import type { ChartDatum } from "@/components/charts";
import { fmtAxisNumber } from "@/lib/format";
import { ChartInspector, type InspectPoint } from "./ChartInspector";
import { TapHint } from "./InspectableBarChart";
import { PlotShell } from "./PlotShell";
import { areaPath, linearPath, monotonePath, niceTicks, scale, thinIndices, type Domain } from "./plot";

const MAX_POINTS = 600;

type InspectableTimeSeriesChartProps = {
  data: ChartDatum[];
  height?: number;
  stroke?: string;
  /** Area fill; defaults to a fading gradient of `stroke`. */
  fill?: string;
  baseline?: number;
  baselineLabel?: string;
  yDomain?: [number | "dataMin", number | "dataMax"];
  xTicks?: { x: number; label: string }[];
  valueLabel?: string;
  chartLabel?: string;
  yTickSuffix?: string;
  /** Background era bands (e.g. managerial tenures) drawn behind the series. */
  eras?: { x0: number; x1: number; label?: string; key: string }[];
};

/**
 * A continuous series as a monotone line over a fading area, drawn in the
 * stretched-viewBox frame. Optional era bands sit behind it.
 */
export function InspectableTimeSeriesChart({
  data,
  height = 260,
  stroke = "var(--color-devil-bright)",
  fill,
  baseline,
  baselineLabel,
  yDomain = ["dataMin", "dataMax"],
  xTicks,
  valueLabel,
  chartLabel = valueLabel ?? "Time series chart",
  yTickSuffix = "",
  eras,
}: InspectableTimeSeriesChartProps) {
  const gradientId = `ts-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  if (data.length < 2) return null;

  const xMin = data[0].x;
  const xMax = data[data.length - 1].x;
  const ys = data.map((d) => d.y);
  const domain: Domain = [
    yDomain[0] === "dataMin" ? Math.min(...ys) : yDomain[0],
    yDomain[1] === "dataMax" ? Math.max(...ys) : yDomain[1],
  ];
  const sx = scale([xMin, xMax]);
  const sy = scale(domain, true);
  const all: [number, number][] = data.map((d) => [sx(d.x), sy(d.y)]);
  // Dense series (Elo has ~6,000 matches) are thinned to what a chart can show;
  // a curve through hundreds of points adds bytes, not shape, so draw it straight.
  const dense = data.length > MAX_POINTS;
  const keep = thinIndices(all, MAX_POINTS);
  const pts = keep.map((i) => all[i]);
  const shown = keep.map((i) => data[i]);
  const line = dense ? linearPath(pts) : monotonePath(pts);

  const yTicks = niceTicks(domain, 4).map((v) => ({ at: sy(v), label: fmtAxisNumber(v, yTickSuffix) }));
  const xTickList = (xTicks ?? niceTicks([xMin, xMax], 5).map((x) => ({ x, label: String(x) })))
    .filter((t) => t.x >= xMin && t.x <= xMax)
    .map((t) => ({ at: sx(t.x), label: t.label }));

  const minEraLabelSpan = 7;
  const hasEraLabels = eras?.some((e) => e.label) ?? false;

  const points: InspectPoint[] = shown.flatMap((d, i) =>
    d.bridge
      ? []
      : [{
          x: pts[i][0],
          y: pts[i][1],
          href: d.href,
          tip: { title: d.label, value: d.valueLabel, accent: d.movementLabel, meta: d.meta },
          markers: [{ y: pts[i][1], color: stroke }],
        }],
  );

  return (
    <div className="w-full min-w-0">
      <PlotShell height={height} yTicks={yTicks} xTicks={xTickList} padTop={14 + (hasEraLabels ? 6 : 0)} padRight={10}>
        <ChartInspector points={points} label={chartLabel}>
          {eras?.map((era, i) => {
            const x0 = Math.max(0, sx(era.x0));
            const x1 = Math.min(100, sx(era.x1));
            if (x1 <= x0) return null;
            return (
              <div
                key={era.key}
                aria-hidden
                className="pointer-events-none absolute inset-y-0 border-x border-line/50"
                style={{ left: `${x0}%`, width: `${x1 - x0}%`, background: i % 2 === 0 ? "color-mix(in srgb, var(--color-ink) 4%, transparent)" : undefined }}
              >
                {era.label && x1 - x0 >= minEraLabelSpan && (
                  <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] leading-none text-ink-faint">
                    {era.label}
                  </span>
                )}
              </div>
            );
          })}
          {baseline !== undefined && baseline >= domain[0] && baseline <= domain[1] && (
            <div className="pointer-events-none absolute inset-x-0" style={{ top: `${sy(baseline)}%` }} aria-hidden>
              <div className="border-t border-dashed border-line" />
              {baselineLabel && (
                <span className="absolute right-1 top-1 text-[10px] leading-none text-ink-faint">{baselineLabel}</span>
              )}
            </div>
          )}
          <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
            <defs>
              <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
                <stop offset="5%" stopColor={stroke} stopOpacity={0.22} />
                <stop offset="82%" stopColor={stroke} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <path d={areaPath(line, pts)} fill={fill?.startsWith("url(") ? fill : `url(#${gradientId})`} />
            <path d={line} fill="none" stroke={stroke} strokeWidth={2} strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
          </svg>
        </ChartInspector>
      </PlotShell>
      <TapHint noun="point" />
    </div>
  );
}

