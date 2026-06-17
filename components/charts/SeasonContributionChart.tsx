"use client";

import { useRouter } from "next/navigation";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { fmtAxisNumber } from "@/lib/format";
import { QuietAnalystTooltip } from "./QuietAnalystTooltip";

export type SeasonContributionDatum = {
  /** X category — the season's start year. */
  label: string;
  tickLabel?: string;
  goals: number;
  assists: number;
  /** Tooltip headline, e.g. "12 goals · 8 assists". */
  valueLabel: string;
  meta?: string;
  href?: string;
};

/**
 * A season's goal involvement, stacked: goals (devil red) at the base, assists
 * (gold) on top, so the column height is total goal contributions and the split
 * reads by colour. Pairs with the season table, which carries the exact figures.
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
  const go = (entry: { href?: string; payload?: { href?: string } } | undefined) => {
    const href = entry?.href ?? entry?.payload?.href;
    if (href) router.push(href);
  };

  return (
    <div className="h-full min-h-40 min-w-0 w-full" style={{ height }}>
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
            tickFormatter={(value) => fmtAxisNumber(value, "")}
          />
          <Tooltip content={<QuietAnalystTooltip />} cursor={{ fill: "rgb(255 255 255 / 0.035)" }} isAnimationActive={false} />
          <Bar
            dataKey="goals"
            stackId="ga"
            fill="var(--color-devil)"
            fillOpacity={0.9}
            isAnimationActive={false}
            onClick={go}
            className={hasEvidenceLinks ? "cursor-pointer" : undefined}
          />
          <Bar
            dataKey="assists"
            stackId="ga"
            fill="var(--color-gold)"
            fillOpacity={0.9}
            radius={[2, 2, 0, 0]}
            isAnimationActive={false}
            onClick={go}
            className={hasEvidenceLinks ? "cursor-pointer" : undefined}
          />
          {hasEvidenceLinks && <title>Click a column to open its season</title>}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
