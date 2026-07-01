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
import type { MouseHandlerDataParam } from "recharts";
import { fmtAxisNumber, fmtNum } from "@/lib/format";
import { QuietAnalystTooltip } from "./QuietAnalystTooltip";

export type SeasonContributionDatum = {
  /** X category — compact season label, e.g. `04/05`. */
  label: string;
  goals: number;
  assists: number;
  /** Tooltip headline, e.g. "12 goals · 8 assists". */
  valueLabel: string;
  meta?: string;
  href?: string;
};

function peakIndices(data: SeasonContributionDatum[], key: "goals" | "assists"): Set<number> {
  const max = Math.max(0, ...data.map((d) => d[key]));
  if (max <= 0) return new Set();
  return new Set(data.flatMap((d, i) => (d[key] === max ? [i] : [])));
}

function measureLabel(value: number, unit: "goals" | "assists") {
  const noun = value === 1 ? unit.slice(0, -1) : unit;
  return `${fmtNum(value)} ${noun}`;
}

type PeakMarkerProps = {
  cx?: number;
  cy?: number;
  payload?: SeasonContributionDatum;
  peaks: Set<number>;
  color: string;
  unit: "goals" | "assists";
  count: number;
  data: readonly SeasonContributionDatum[];
};

function PeakMarker({
  cx,
  cy,
  payload,
  peaks,
  color,
  unit,
  count,
  data,
}: PeakMarkerProps) {
  if (cx == null || cy == null || !payload) return null;

  const datum = payload as SeasonContributionDatum;
  const index = data.indexOf(datum);
  if (index < 0 || !peaks.has(index)) return null;

  const value = datum[unit];
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
 * A season's goals and assists as two lines — devil red for goals, gold for
 * assists — so each series reads independently across the career. Pairs with the
 * season table, which carries the exact figures.
 */
export function SeasonContributionChart({
  data,
  height = 200,
  labelEvery = 1,
  chartLabel = "Goal contributions by season",
}: {
  data: SeasonContributionDatum[];
  height?: number;
  labelEvery?: number;
  chartLabel?: string;
}) {
  const router = useRouter();

  if (data.length === 0) return null;

  const hasEvidenceLinks = data.some((datum) => datum.href);
  const goalPeaks = peakIndices(data, "goals");
  const assistPeaks = peakIndices(data, "assists");

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
            dataKey="goals"
            name="Goals"
            stroke="var(--color-devil)"
            strokeWidth={2}
            dot={(props) => (
              <PeakMarker
                {...props}
                peaks={goalPeaks}
                color="var(--color-devil)"
                unit="goals"
                count={data.length}
                data={data}
              />
            )}
            activeDot={{
              r: 4,
              stroke: "var(--color-devil)",
              strokeWidth: 2,
              fill: "var(--color-panel)",
            }}
            isAnimationActive={false}
            className={hasEvidenceLinks ? "cursor-pointer" : undefined}
          />
          <Line
            type="monotone"
            dataKey="assists"
            name="Assists"
            stroke="var(--color-gold)"
            strokeWidth={2}
            dot={(props) => (
              <PeakMarker
                {...props}
                peaks={assistPeaks}
                color="var(--color-gold)"
                unit="assists"
                count={data.length}
                data={data}
              />
            )}
            activeDot={{
              r: 4,
              stroke: "var(--color-gold)",
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
