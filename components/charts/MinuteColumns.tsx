import { InspectableBarChartLazy as InspectableBarChart } from "@/components/charts/lazy";
import { fmtNum } from "@/lib/format";

/**
 * Goals by 5-minute window across the match, as a stacked column chart: a gold
 * column per window, with stoppage-time goals (90+) stacked as a red cap on the
 * final bar rather than folded into a fat 86–90 bar. The dashed baseline is an
 * even spread across the 90. One shape, used by every late-goals surface (the
 * questions module, the homepage card, the explore signature, a player page) so
 * they all read identically — fed by `goalMinuteRidge` / `playerGoalMinuteBins`,
 * which already split regulation bins from the stoppage count.
 */
export function MinuteColumns({
  bins,
  stoppage,
  height = 200,
  subject = "United",
}: {
  bins: { lo: number; hi: number; n: number }[];
  stoppage: number;
  height?: number;
  /** Whose goals these are, for the accessible chart label. */
  subject?: string;
}) {
  const avg = bins.reduce((a, b) => a + b.n, 0) / bins.length;
  return (
    <InspectableBarChart
      data={bins.map((b, i) => {
        const last = i === bins.length - 1;
        return {
          label: String(b.lo),
          tickLabel: [0, 15, 30, 45, 60, 75].includes(b.lo) ? `${b.lo}'` : last ? "85'" : "",
          value: b.n,
          value2: last ? stoppage : 0,
          valueLabel: last ? `${fmtNum(b.n + stoppage)} goals` : `${fmtNum(b.n)} goals`,
          meta: last ? `86–90′: ${fmtNum(b.n)} · stoppage: ${fmtNum(stoppage)}` : `${b.lo + 1}–${b.hi}′`,
        };
      })}
      height={height}
      color="var(--color-gold)"
      stack={{ color: "var(--color-devil-bright)" }}
      chartLabel={`${subject} goals by 5-minute window, with stoppage time stacked on the final bar`}
      baseline={{ value: avg, label: "even spread" }}
    />
  );
}
