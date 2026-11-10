import { fmtAxisNumber, fmtNum } from "@/lib/format";
import { ChartInspector, type InspectPoint } from "./ChartInspector";
import { PlotShell } from "./PlotShell";
import { monotonePath, niceDomain, niceTicks, scale } from "./plot";

type ContributionMeasure = "goals" | "assists" | "cleanSheets" | "goalsConceded";

export type SeasonContributionDatum = {
  /** X category — compact season label, e.g. `04/05`. */
  label: string;
  goals?: number;
  assists?: number;
  cleanSheets?: number;
  goalsConceded?: number;
  /** Tooltip headline, e.g. "12 goals · 8 assists". */
  valueLabel: string;
  meta?: string;
  href?: string;
};

function peakIndices(data: SeasonContributionDatum[], key: ContributionMeasure): Set<number> {
  const values = data.map((d) => d[key] ?? 0);
  const max = Math.max(0, ...values);
  if (max <= 0) return new Set();
  return new Set(data.flatMap((d, i) => (d[key] === max ? [i] : [])));
}

function measureLabel(value: number, unit: ContributionMeasure) {
  switch (unit) {
    case "goals":
      return `${fmtNum(value)} ${value === 1 ? "goal" : "goals"}`;
    case "assists":
      return `${fmtNum(value)} ${value === 1 ? "assist" : "assists"}`;
    case "cleanSheets":
      return `${fmtNum(value)} clean sheet${value === 1 ? "" : "s"}`;
    case "goalsConceded":
      return `${fmtNum(value)} conceded`;
    default: {
      const _exhaustive: never = unit;
      return `${fmtNum(value)}`;
    }
  }
}

/**
 * A season's contribution lines — devil red and gold by default for goals and
 * assists; defenders and keepers switch to clean sheets and goals conceded.
 * Pairs with the season table, which carries the exact figures.
 */
export function SeasonContributionChart({
  data,
  height = 200,
  labelEvery = 1,
  chartLabel = "Goal contributions by season",
  variant = "attacking",
}: {
  data: SeasonContributionDatum[];
  height?: number;
  labelEvery?: number;
  chartLabel?: string;
  variant?: "attacking" | "defensive";
}) {
  if (data.length === 0) return null;

  const primaryKey: ContributionMeasure = variant === "defensive" ? "cleanSheets" : "goals";
  const secondaryKey: ContributionMeasure = variant === "defensive" ? "goalsConceded" : "assists";
  const series = [
    { key: primaryKey, color: "var(--color-devil)", peaks: peakIndices(data, primaryKey) },
    { key: secondaryKey, color: "var(--color-gold)", peaks: peakIndices(data, secondaryKey) },
  ];

  const max = Math.max(0, ...data.flatMap((d) => [d[primaryKey] ?? 0, d[secondaryKey] ?? 0]));
  const domain = niceDomain([0, max || 1]);
  const sy = scale(domain, true);
  // A point scale, like the line it replaces: first and last seasons sit on the edges.
  const xAt = (i: number) => (data.length > 1 ? (i / (data.length - 1)) * 100 : 50);
  const half = data.length > 1 ? 50 / (data.length - 1) : 50;
  const yTicks = niceTicks(domain, 4).map((v) => ({ at: sy(v), label: fmtAxisNumber(v, "") }));

  const every = Math.max(1, labelEvery);
  const xTicks = data.flatMap((d, i) =>
    i % every === 0 ? [{ at: xAt(i), label: d.label }] : [],
  );

  const lines = series.map((s) => ({
    ...s,
    pts: data.flatMap((d, i): [number, number][] => (d[s.key] == null ? [] : [[xAt(i), sy(d[s.key] ?? 0)]])),
  }));

  const points: InspectPoint[] = data.map((d, i) => ({
    x: xAt(i),
    x0: Math.max(0, xAt(i) - half),
    x1: Math.min(100, xAt(i) + half),
    href: d.href,
    tip: { title: d.label, value: d.valueLabel, meta: d.meta },
    markers: series.flatMap((s) => (d[s.key] == null ? [] : [{ y: sy(d[s.key] ?? 0), color: s.color }])),
  }));

  return (
    <div className="w-full min-w-0">
      <PlotShell height={height} yTicks={yTicks} xTicks={xTicks} padTop={28} xAxisLabel="Season">
        <ChartInspector points={points} label={`${chartLabel}. Select a season to open its matches.`}>
          <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
            {lines.map((l) => (
              <path key={l.key} d={monotonePath(l.pts)} fill="none" stroke={l.color} strokeWidth={2} strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
            ))}
          </svg>
          {lines.flatMap((l) =>
            [...l.peaks].map((i) => {
              const value = data[i][l.key] ?? 0;
              const align = i === 0 ? "" : i === data.length - 1 ? "-translate-x-full" : "-translate-x-1/2";
              return (
                <div key={`${l.key}-${i}`} aria-hidden className="pointer-events-none absolute" style={{ left: `${xAt(i)}%`, top: `${sy(value)}%` }}>
                  <span className="absolute h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-panel" style={{ background: l.color }} />
                  <span
                    className={`absolute bottom-2 whitespace-nowrap text-[10px] font-semibold leading-none ${align}`}
                    style={{ color: l.color }}
                  >
                    {measureLabel(value, l.key)}
                  </span>
                </div>
              );
            }),
          )}
        </ChartInspector>
      </PlotShell>
    </div>
  );
}
