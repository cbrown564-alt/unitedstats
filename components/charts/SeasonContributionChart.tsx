"use client";

import { useRouter } from "next/navigation";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { DotItemDotProps, MouseHandlerDataParam } from "recharts";
import { fmtAxisNumber, fmtNum } from "@/lib/format";
import { QuietAnalystTooltip } from "./QuietAnalystTooltip";

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

function PeakMarker({
  cx,
  cy,
  index,
  payload,
  peaks,
  color,
  unit,
  count,
}: DotItemDotProps & {
  peaks: Set<number>;
  color: string;
  unit: ContributionMeasure;
  count: number;
}) {
  if (cx == null || cy == null || index == null || !payload || !peaks.has(index)) return null;

  const datum = payload as SeasonContributionDatum;
  const value = datum[unit] ?? 0;
  const anchor =
    index === 0 ? "start" : index === count - 1 ? "end" : "middle";
  const dx = anchor === "start" ? 4 : anchor === "end" ? -4 : 0;

  return (
    <g>
      <circle cx={cx} cy={cy} r={4} fill={color} stroke="var(--color-panel)" strokeWidth={2} />
      <text
        x={cx + dx}
        y={cy - 10}
        textAnchor={anchor}
        fill={color}
        fontSize={10}
        fontWeight={600}
      >
        {measureLabel(value, unit)}
      </text>
    </g>
  );
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
  const router = useRouter();

  if (data.length === 0) return null;

  const primaryKey: ContributionMeasure = variant === "defensive" ? "cleanSheets" : "goals";
  const secondaryKey: ContributionMeasure = variant === "defensive" ? "goalsConceded" : "assists";
  const primaryName = variant === "defensive" ? "Clean sheets" : "Goals";
  const secondaryName = variant === "defensive" ? "Goals conceded" : "Assists";
  const primaryColor = "var(--color-devil)";
  const secondaryColor = "var(--color-gold)";

  const hasEvidenceLinks = data.some((datum) => datum.href);
  const primaryPeaks = peakIndices(data, primaryKey);
  const secondaryPeaks = peakIndices(data, secondaryKey);

  const go = (state: MouseHandlerDataParam) => {
    const idx = state.activeTooltipIndex;
    const href = typeof idx === "number" ? data[idx]?.href : undefined;
    if (href) router.push(href);
  };

  return (
    <div className="h-full min-h-40 min-w-0 w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%" minWidth={0} initialDimension={{ width: 800, height }}>
        <LineChart
          data={data}
          margin={{ top: 28, right: 8, bottom: 22, left: 0 }}
          accessibilityLayer
          aria-label={chartLabel}
          onClick={hasEvidenceLinks ? go : undefined}
        >
          <CartesianGrid stroke="var(--color-line)" strokeOpacity={0.64} vertical={false} />
          <XAxis
            dataKey="label"
            interval={labelEvery <= 1 ? "preserveStartEnd" : labelEvery - 1}
            axisLine={false}
            tickLine={false}
            tickMargin={8}
            minTickGap={14}
            stroke="var(--color-ink-faint)"
            fontSize={11}
            label={{
              value: "Season",
              position: "insideBottom",
              offset: -2,
              style: { fill: "var(--color-ink-faint)", fontSize: 11, textAnchor: "middle" },
            }}
          />
          <YAxis
            type="number"
            axisLine={false}
            tickLine={false}
            tickMargin={8}
            width={58}
            stroke="var(--color-ink-faint)"
            fontSize={11}
            tickFormatter={(value) => fmtAxisNumber(value, "")}
          />
          <Tooltip
            content={<QuietAnalystTooltip />}
            cursor={{ stroke: "var(--color-devil-bright)", strokeOpacity: 0.28, strokeWidth: 1 }}
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey={primaryKey}
            name={primaryName}
            stroke={primaryColor}
            strokeWidth={2}
            dot={(props) => (
              <PeakMarker
                {...props}
                peaks={primaryPeaks}
                color={primaryColor}
                unit={primaryKey}
                count={data.length}
              />
            )}
            activeDot={{
              r: 4,
              stroke: primaryColor,
              strokeWidth: 2,
              fill: "var(--color-panel)",
            }}
            isAnimationActive={false}
            className={hasEvidenceLinks ? "cursor-pointer" : undefined}
          />
          <Line
            type="monotone"
            dataKey={secondaryKey}
            name={secondaryName}
            stroke={secondaryColor}
            strokeWidth={2}
            dot={(props) => (
              <PeakMarker
                {...props}
                peaks={secondaryPeaks}
                color={secondaryColor}
                unit={secondaryKey}
                count={data.length}
              />
            )}
            activeDot={{
              r: 4,
              stroke: secondaryColor,
              strokeWidth: 2,
              fill: "var(--color-panel)",
            }}
            isAnimationActive={false}
            className={hasEvidenceLinks ? "cursor-pointer" : undefined}
          />
          {hasEvidenceLinks && <title>Click a point to open its season</title>}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
