"use client";

import { useId } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ChartDatum } from "@/components/charts";
import { QuietAnalystTooltip } from "./QuietAnalystTooltip";

type InspectableTimeSeriesChartProps = {
  data: ChartDatum[];
  height?: number;
  stroke?: string;
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

export function InspectableTimeSeriesChart({
  data,
  height = 260,
  stroke = "var(--color-devil-bright)",
  fill = "rgb(216 33 13 / 0.12)",
  baseline,
  baselineLabel,
  yDomain = ["dataMin", "dataMax"],
  xTicks,
  valueLabel,
  chartLabel = valueLabel ?? "Time series chart",
  yTickSuffix = "",
  eras,
}: InspectableTimeSeriesChartProps) {
  const gradientId = useId().replace(/:/g, "");

  if (data.length < 2) return null;

  return (
    <div className="h-full min-h-56 min-w-0 w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%" minWidth={0} initialDimension={{ width: 800, height }}>
        <AreaChart
          data={data}
          margin={{ top: 10, right: 10, bottom: 8, left: 0 }}
          accessibilityLayer
          aria-label={chartLabel}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
              <stop offset="5%" stopColor={stroke} stopOpacity={0.22} />
              <stop offset="82%" stopColor={stroke} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          {eras?.map((era, i) => (
            <ReferenceArea
              key={era.key}
              x1={era.x0}
              x2={era.x1}
              ifOverflow="hidden"
              fill="var(--color-ink)"
              fillOpacity={i % 2 === 0 ? 0.04 : 0}
              stroke="var(--color-line)"
              strokeOpacity={0.5}
              label={
                era.label
                  ? { value: era.label, position: "insideTop", fill: "var(--color-ink-faint)", fontSize: 10 }
                  : undefined
              }
            />
          ))}
          <CartesianGrid stroke="var(--color-line)" strokeOpacity={0.72} vertical={false} />
          <XAxis
            dataKey="x"
            type="number"
            domain={["dataMin", "dataMax"]}
            ticks={xTicks?.map((tick) => tick.x)}
            tickFormatter={(value) => xTicks?.find((tick) => tick.x === value)?.label ?? String(value)}
            axisLine={false}
            tickLine={false}
            tickMargin={8}
            minTickGap={28}
            stroke="var(--color-ink-faint)"
            fontSize={11}
          />
          <YAxis
            type="number"
            domain={yDomain}
            axisLine={false}
            tickLine={false}
            tickMargin={8}
            width={58}
            stroke="var(--color-ink-faint)"
            fontSize={11}
            tickFormatter={(value) => `${Math.round(Number(value)).toLocaleString("en-GB")}${yTickSuffix}`}
          />
          {baseline !== undefined && (
            <ReferenceLine
              y={baseline}
              stroke="var(--color-line)"
              strokeDasharray="4 4"
              label={
                baselineLabel
                  ? {
                      value: baselineLabel,
                      fill: "var(--color-ink-faint)",
                      fontSize: 10,
                      position: "insideTopRight",
                    }
                  : undefined
              }
            />
          )}
          <Tooltip
            content={<QuietAnalystTooltip />}
            cursor={{ stroke: "var(--color-devil-bright)", strokeOpacity: 0.32, strokeWidth: 1 }}
            isAnimationActive={false}
          />
          <Area
            type="monotone"
            dataKey="y"
            name={valueLabel}
            stroke={stroke}
            strokeWidth={2}
            fill={fill.startsWith("url(") ? fill : `url(#${gradientId})`}
            activeDot={{
              r: 4,
              stroke,
              strokeWidth: 2,
              fill: "var(--color-panel)",
            }}
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
