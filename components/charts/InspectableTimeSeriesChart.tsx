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
import type { MouseHandlerDataParam } from "recharts";
import type { ChartDatum } from "@/components/charts";
import { fmtAxisNumber } from "@/lib/format";
import { QuietAnalystTooltip } from "./QuietAnalystTooltip";
import { useChartPin, useCoarsePointer } from "./useChartPin";

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
  /** Interpolation between points — use `linear` when 0% years are flatlined. */
  lineType?: "monotone" | "linear";
  /** Draw a marker on {@link ChartDatum.zeroYear} points (0% flat segments). */
  markZeroYears?: boolean;
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
  lineType = "monotone",
  markZeroYears = false,
  eras,
}: InspectableTimeSeriesChartProps) {
  const gradientId = useId().replace(/:/g, "");
  const coarse = useCoarsePointer();
  const { pinned, pin, rootRef } = useChartPin<ChartDatum>();

  if (data.length < 2) return null;

  const xMin = data[0]?.x ?? 0;
  const xMax = data[data.length - 1]?.x ?? xMin;
  const xSpan = xMax - xMin || 1;
  const minEraLabelSpan = xSpan * 0.07;
  const hasEraLabels = eras?.some((e) => e.label) ?? false;
  const topMargin = 14 + (hasEraLabels ? 6 : 0);
  const dotRadius = coarse ? 7 : 4;

  const onChartClick = (state: MouseHandlerDataParam) => {
    if (!coarse) return;
    const idx = state.activeIndex ?? state.activeTooltipIndex;
    const datum = typeof idx === "number" ? data[idx] : undefined;
    if (datum && !datum.bridge) pin(datum);
  };

  return (
    <div ref={rootRef} className="h-full min-h-56 min-w-0 w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%" minWidth={0} initialDimension={{ width: 800, height }}>
        <AreaChart
          data={data}
          margin={{ top: topMargin, right: 10, bottom: 8, left: 0 }}
          accessibilityLayer
          aria-label={chartLabel}
          onClick={onChartClick}
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
                era.label && era.x1 - era.x0 >= minEraLabelSpan
                  ? { value: era.label, position: "insideBottom", fill: "var(--color-ink-faint)", fontSize: 10, dy: -6 }
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
            tickFormatter={(value) => fmtAxisNumber(value, yTickSuffix)}
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
          {!coarse && (
            <Tooltip
              content={<QuietAnalystTooltip />}
              cursor={{ stroke: "var(--color-devil-bright)", strokeOpacity: 0.32, strokeWidth: 1 }}
              isAnimationActive={false}
            />
          )}
          <Area
            type={lineType}
            dataKey="y"
            name={valueLabel}
            stroke={stroke}
            strokeWidth={2}
            fill={fill.startsWith("url(") ? fill : `url(#${gradientId})`}
            activeDot={{
              r: dotRadius,
              stroke,
              strokeWidth: 2,
              fill: "var(--color-panel)",
            }}
            dot={(props) => {
              const { cx, cy, payload } = props;
              if (!markZeroYears || typeof cx !== "number" || typeof cy !== "number") return null;
              const d = payload as ChartDatum | undefined;
              if (!d?.zeroYear) return null;
              return (
                <circle
                  cx={cx}
                  cy={cy}
                  r={4}
                  stroke={stroke}
                  strokeWidth={2}
                  fill="var(--color-panel)"
                />
              );
            }}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
      {coarse && pinned && (
        <div className="mt-2">
          <QuietAnalystTooltip active pinned payload={[{ payload: pinned }]} />
        </div>
      )}
      {coarse && !pinned && (
        <p className="mt-1.5 text-center text-[11px] text-ink-faint">Tap a point to inspect</p>
      )}
    </div>
  );
}
