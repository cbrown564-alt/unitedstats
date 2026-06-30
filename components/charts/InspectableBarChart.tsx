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
import type { MouseHandlerDataParam } from "recharts";
import type { ChartBarDatum } from "@/components/charts";
import { fmtAxisNumber } from "@/lib/format";
import { QuietAnalystTooltip } from "./QuietAnalystTooltip";
import { useChartPin, useCoarsePointer } from "./useChartPin";

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
  /**
   * Draw each datum's `value2` as a second segment stacked above `value`, filled
   * with `color`/`label`. Turns the bars into a two-part total so the parts can be
   * read against each other (e.g. a flat regulation base with a growing stoppage
   * cap), rather than collapsing them into one height.
   */
  stack?: { color: string; label?: string };
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
  stack,
}: InspectableBarChartProps) {
  const router = useRouter();
  const coarse = useCoarsePointer();
  const { pinned, pin, rootRef } = useChartPin<ChartBarDatum>();

  if (data.length === 0) return null;

  const hasEvidenceLinks = data.some((datum) => datum.href);

  const onBarActivate = (datum: ChartBarDatum) => {
    if (coarse) {
      pin(datum);
      return;
    }
    if (datum.href) router.push(datum.href);
  };

  const onBarClick = (datum: ChartBarDatum) => {
    if (coarse && pinned === datum && datum.href) {
      router.push(datum.href);
      return;
    }
    onBarActivate(datum);
  };

  const onChartClick = (state: MouseHandlerDataParam) => {
    if (!coarse) return;
    const idx = state.activeIndex ?? state.activeTooltipIndex;
    if (typeof idx === "number" && data[idx]) onBarClick(data[idx]);
  };

  return (
    <div ref={rootRef} className="h-full min-h-40 min-w-0 w-full" style={fill ? undefined : { height }}>
      <ResponsiveContainer width="100%" height="100%" minWidth={0} initialDimension={{ width: 800, height }}>
        <BarChart
          data={data}
          margin={{ top: 10, right: 8, bottom: 8, left: 0 }}
          accessibilityLayer
          aria-label={chartLabel}
          onClick={onChartClick}
        >
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
          {!coarse && (
            <Tooltip
              content={<QuietAnalystTooltip />}
              cursor={{ fill: "rgb(255 255 255 / 0.035)" }}
              isAnimationActive={false}
            />
          )}
          {baseline && (
            <ReferenceLine
              y={baseline.value}
              stroke="var(--color-ink-faint)"
              strokeDasharray="3 3"
              strokeWidth={1}
              ifOverflow="extendDomain"
              label={
                baseline.label
                  ? // Draw the label a few px *above* the line, hard left — over the
                    // short early bars where the background is dark, so light-grey
                    // text stays legible (on the right it lands on the tall gold bars
                    // and vanishes; named "inside" positions sit below the line).
                    ({ viewBox }: { viewBox?: { x?: number; y?: number } }) => (
                      <text x={(viewBox?.x ?? 0) + 6} y={(viewBox?.y ?? 0) - 5} fill="var(--color-ink-dim)" fontSize={10}>
                        {baseline.label}
                      </text>
                    )
                  : undefined
              }
            />
          )}
          <Bar
            dataKey="value"
            stackId={stack ? "a" : undefined}
            radius={stack ? [0, 0, 0, 0] : [2, 2, 0, 0]}
            isAnimationActive={false}
          >
            {data.map((datum, index) => (
              <Cell
                key={`${datum.label}-${index}`}
                className={datum.href ? "cursor-pointer" : undefined}
                fill={datum.label === highlightLabel ? highlightColor : color}
                fillOpacity={datum.label === highlightLabel ? 1 : 0.9}
                onClick={() => onBarClick(datum)}
              />
            ))}
          </Bar>
          {stack && (
            <Bar dataKey="value2" stackId="a" radius={[2, 2, 0, 0]} isAnimationActive={false}>
              {data.map((datum, index) => (
                <Cell
                  key={`${datum.label}-cap-${index}`}
                  className={datum.href ? "cursor-pointer" : undefined}
                  fill={stack.color}
                  onClick={() => onBarClick(datum)}
                />
              ))}
            </Bar>
          )}
          {hasEvidenceLinks && <title>Click a bar to open its evidence</title>}
        </BarChart>
      </ResponsiveContainer>
      {coarse && pinned && (
        <div className="mt-2">
          <QuietAnalystTooltip active pinned payload={[{ payload: pinned }]} />
        </div>
      )}
      {coarse && !pinned && (
        <p className="mt-1.5 text-center text-[11px] text-ink-faint">Tap a bar to inspect</p>
      )}
    </div>
  );
}
