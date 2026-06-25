import { InspectableTimeSeriesChart } from "./InspectableTimeSeriesChart";
import type { ChartDatum } from "@/components/charts";
import { fmtAxisNumber, fmtMonthYear } from "@/lib/format";

type EloRatingChartProps = {
  points: { date: string; elo: number }[];
  height?: number;
  /** Managerial eras to shade behind the rating line; long tenures carry a label. */
  eras?: { from: string; to: string; label?: string }[];
};

function movementLabel(current: number, previous?: number) {
  if (previous === undefined) return undefined;
  const movement = Math.round(current - previous);
  if (movement === 0) return "No movement";
  return `${movement > 0 ? "+" : ""}${movement} since previous point`;
}

export function EloRatingChart({ points, height = 260, eras }: EloRatingChartProps) {
  const data: ChartDatum[] = points.map((point, index) => ({
    x: Date.parse(point.date),
    y: point.elo,
    label: fmtMonthYear(point.date.slice(0, 10)),
    valueLabel: fmtAxisNumber(point.elo, " Elo"),
    movementLabel: movementLabel(point.elo, points[index - 1]?.elo),
  }));

  const ticks = [1900, 1920, 1940, 1960, 1980, 2000, 2020].map((year) => ({
    x: Date.parse(`${year}-01-01`),
    label: String(year),
  }));

  const values = data.map((datum) => datum.y);
  const min = Math.min(...values, 1500);
  const max = Math.max(...values, 1500);
  const padding = Math.max(30, Math.round((max - min) * 0.08));

  const eraAreas = eras?.map((era) => ({
    key: `${era.from}-${era.label ?? ""}`,
    x0: Date.parse(era.from),
    x1: Date.parse(era.to),
    label: era.label,
  }));

  return (
    <InspectableTimeSeriesChart
      data={data}
      baseline={1500}
      baselineLabel="1500 baseline"
      height={height}
      valueLabel="Elo rating"
      chartLabel="Manchester United Elo rating over time"
      xTicks={ticks}
      yDomain={[Math.floor(min - padding), Math.ceil(max + padding)]}
      eras={eraAreas}
    />
  );
}
