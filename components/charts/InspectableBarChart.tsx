"use client";

import { useRouter } from "next/navigation";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ChartBarDatum } from "@/components/charts";
import { fmtAxisNumber } from "@/lib/format";
import { QuietAnalystTooltip } from "./QuietAnalystTooltip";

type InspectableBarChartProps = {
  data: ChartBarDatum[];
  height?: number;
  color?: string;
  highlightLabel?: string;
  highlightColor?: string;
  labelEvery?: number;
  chartLabel?: string;
  yTickSuffix?: string;
  /**
   * Optional comparison line drawn across the plot — the "what would random look
   * like" baseline. Encodes the contrast on the object instead of in prose.
   */
  baseline?: { value: number; label?: string };
  /**
   * Fill the parent's height instead of using a fixed `height`. The parent must
   * supply a definite height (e.g. a flex-1 cell) — lets the chart match the
   * height of a sibling such as a match list.
   */
  fill?: boolean;
};

export function InspectableBarChart({
  data,
  height = 180,
  color = "var(--color-devil)",
  highlightLabel,
  highlightColor = "var(--color-gold)",
  labelEvery = 1,
  chartLabel = "Bar chart",
  yTickSuffix = "",
  baseline,
  fill = false,
}: InspectableBarChartProps) {
  const router = useRouter();

  if (data.length === 0) return null;

  const hasEvidenceLinks = data.some((datum) => datum.href);

  return (
    <div className="h-full min-h-40 min-w-0 w-full" style={fill ? undefined : { height }}>
      <ResponsiveContainer width="100%" height="100%" minWidth={0} initialDimension={{ width: 800, height }}>
        <BarChart data={data} margin={{ top: 10, right: 8, bottom: 8, left: 0 }} accessibilityLayer aria-label={chartLabel}>
          <CartesianGrid stroke="var(--color-line)" strokeOpacity={0.64} vertical={false} />
          <XAxis
            dataKey="label"
            interval={labelEvery <= 1 ? 0 : labelEvery - 1}
            tickFormatter={(label) => data.find((datum) => datum.label === label)?.tickLabel ?? String(label)}
            axisLine={false}
            tickLine={false}
            tickMargin={8}
            minTickGap={8}
            stroke="var(--color-ink-faint)"
            fontSize={11}
          />
          <YAxis
            type="number"
            axisLine={false}
            tickLine={false}
            tickMargin={8}
            width={58}
            stroke="var(--color-ink-faint)"
            fontSize={11}
            tickFormatter={(value) => fmtAxisNumber(value, yTickSuffix)}
          />
          <Tooltip
            content={<QuietAnalystTooltip />}
            cursor={{ fill: "rgb(255 255 255 / 0.035)" }}
            isAnimationActive={false}
          />
          {baseline && (
            <ReferenceLine
              y={baseline.value}
              stroke="var(--color-ink-faint)"
              strokeDasharray="3 3"
              strokeWidth={1}
              ifOverflow="extendDomain"
              label={
                baseline.label
                  ? {
                      value: baseline.label,
                      position: "insideTopRight",
                      fill: "var(--color-ink-faint)",
                      fontSize: 10,
                    }
                  : undefined
              }
            />
          )}
          <Bar dataKey="value" radius={[2, 2, 0, 0]} isAnimationActive={false}>
            {data.map((datum, index) => (
              <Cell
                key={`${datum.label}-${index}`}
                className={datum.href ? "cursor-pointer" : undefined}
                fill={datum.label === highlightLabel ? highlightColor : color}
                fillOpacity={datum.label === highlightLabel ? 1 : 0.9}
                onClick={() => {
                  if (datum.href) router.push(datum.href);
                }}
              />
            ))}
          </Bar>
          {hasEvidenceLinks && <title>Click a bar to open its evidence</title>}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
