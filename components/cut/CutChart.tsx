import Link from "next/link";
import {
  InspectableBarChartLazy,
  InspectableTimeSeriesChartLazy,
} from "@/components/charts/lazy";
import {
  isChronological,
  metricFmt,
  type CutDimension,
  type CutGroup,
  type CutMetric,
} from "@/lib/cut";

/**
 * A Cut rendered as a visualisation, not a table — the chart is the answer.
 *
 * The dimension's nature picks the form:
 *  - season → an area chart over a continuous time axis, so the arc of the record
 *    across the years reads at a glance;
 *  - decade → vertical columns: a discrete time progression, not a continuous line —
 *    which also sets it apart from the season view;
 *  - categorical (opponent, manager, competition, type, venue, result) → a clean
 *    horizontal ranked bar chart: one bar per group, length the metric, goal
 *    difference diverging from a zero axis, every bar a link to its matches.
 *
 * One encoding per mark, no stacked annotations. Non-winners are muted to grey so the
 * standout — always in gold — carries the eye.
 */
export function CutChart({
  groups,
  metric,
  dimension,
  baseline,
  standoutKey,
}: {
  groups: CutGroup[];
  metric: CutMetric;
  dimension: CutDimension;
  /** Slice-wide average for the lens, from the engine; null where no line fits. */
  baseline?: number | null;
  /** The headline group's key — drawn in gold. */
  standoutKey?: string;
}) {
  // Decades are discrete spans → columns. Seasons read as a line, given enough
  // distinct points to draw one. Everything else is a ranked bar chart.
  if (dimension === "decade") {
    return <CutColumns groups={groups} metric={metric} baseline={baseline} standoutKey={standoutKey} />;
  }
  if (isChronological(dimension) && distinctYears(groups) >= 2) {
    return <CutTimeSeries groups={groups} metric={metric} baseline={baseline} />;
  }
  return <CutRankedBars groups={groups} metric={metric} standoutKey={standoutKey} />;
}

/** The muted fill for non-standout bars — recedes so the gold winner dominates. */
const BAR_MUTED = "var(--color-ink-faint)";

// ── chronological: area over time ─────────────────────────────────────────

const TS_STYLE: Record<CutMetric, { stroke: string; suffix: string }> = {
  winrate: { stroke: "var(--color-win)", suffix: "%" },
  ppg: { stroke: "var(--color-devil-bright)", suffix: "" },
  gd: { stroke: "var(--color-devil-bright)", suffix: "" },
  matches: { stroke: "var(--color-silver)", suffix: "" },
  goals: { stroke: "var(--color-win)", suffix: "" },
  apps: { stroke: "var(--color-silver)", suffix: "" },
  starts: { stroke: "var(--color-silver)", suffix: "" },
  goalsperapp: { stroke: "var(--color-win)", suffix: "" },
};

function CutTimeSeries({
  groups,
  metric,
  baseline,
}: {
  groups: CutGroup[];
  metric: CutMetric;
  baseline?: number | null;
}) {
  // Time order, oldest → newest: the x-axis carries the ranking, not the row order.
  const data = groups
    .map((g) => ({
      x: yearOf(g.key),
      y: g.value ?? 0,
      label: g.label,
      valueLabel: valuePhrase(g.value, metric),
      meta: g.meta,
    }))
    .sort((a, b) => a.x - b.x);

  const style = TS_STYLE[metric];
  const baseVal = baseline ?? undefined;
  const baselineLabel =
    baseVal === undefined ? undefined : metric === "gd" ? "even" : metricFmt(baseVal, metric);

  return (
    <InspectableTimeSeriesChartLazy
      data={data}
      height={300}
      stroke={style.stroke}
      yTickSuffix={style.suffix}
      yDomain={yDomain(metric)}
      baseline={baseVal}
      baselineLabel={baselineLabel}
      xTicks={yearTicks(data.map((d) => d.x))}
      valueLabel={valueNoun(metric)}
      chartLabel={`United ${valueNoun(metric)} over time`}
    />
  );
}

// ── decade: discrete columns over time ────────────────────────────────────

function CutColumns({
  groups,
  metric,
  baseline,
  standoutKey,
}: {
  groups: CutGroup[];
  metric: CutMetric;
  baseline?: number | null;
  standoutKey?: string;
}) {
  // groups already arrive in chronological order (1880s → today); keep it so the
  // columns read left-to-right as a timeline, with the peak picked out in gold.
  const standout = groups.find((g) => g.key === standoutKey);
  const baselineRef =
    metric === "gd"
      ? { value: 0, label: "even" }
      : baseline == null
        ? undefined
        : { value: baseline, label: metricFmt(baseline, metric) };

  return (
    <InspectableBarChartLazy
      data={groups.map((g) => ({
        label: g.label,
        value: g.value ?? 0,
        valueLabel: valuePhrase(g.value, metric),
        meta: g.meta,
        href: g.href,
      }))}
      height={300}
      color={BAR_MUTED}
      highlightLabel={standout?.label}
      baseline={baselineRef}
      yTickSuffix={metric === "winrate" ? "%" : ""}
      chartLabel={`United ${valueNoun(metric)} by decade`}
    />
  );
}

// ── categorical: horizontal ranked bars ───────────────────────────────────

function CutRankedBars({
  groups,
  metric,
  standoutKey,
}: {
  groups: CutGroup[];
  metric: CutMetric;
  standoutKey?: string;
}) {
  const diverging = metric === "gd";
  // Scale: rate metrics on their own absolute domain so a 90% bar reads nearly full;
  // counts and goal difference scale to the largest bar in the slice.
  const domainMax =
    metric === "winrate"
      ? 100
      : metric === "ppg"
        ? 3
        : diverging
          ? Math.max(1, ...groups.map((g) => Math.abs(g.value ?? 0)))
          : Math.max(1, ...groups.map((g) => g.value ?? 0));

  // Flexbox + standard width utilities only — a closely-stacked horizontal bar
  // chart: a fixed label gutter (the y-axis), bars all starting at one left edge,
  // values trailing. No arbitrary grid template (those proved fragile under dev HMR).
  return (
    <ol className="space-y-0.5">
      {groups.map((g) => {
        const v = g.value ?? 0;
        const standout = g.key === standoutKey;
        const pct = Math.min(100, (Math.abs(v) / domainMax) * 100);
        return (
          <li key={g.key}>
            <Link
              href={g.href}
              title={`${g.label} — ${valuePhrase(g.value, metric)} · ${g.meta}`}
              className="group flex items-center gap-2.5 rounded-md px-1.5 py-1 transition-colors hover:bg-panel-2/60 focus-ring sm:gap-3"
            >
              <span
                className={`w-28 shrink-0 truncate text-[13px] leading-tight sm:w-40 ${
                  standout ? "font-semibold text-gold" : "text-ink-dim group-hover:text-ink"
                }`}
              >
                {g.label}
              </span>

              <span className="min-w-0 flex-1">
                {diverging ? (
                  <DivergingBar pct={pct} positive={v >= 0} standout={standout} thin={g.thin} />
                ) : (
                  <LinearBar pct={pct} standout={standout} thin={g.thin} />
                )}
              </span>

              <span
                className={`stat-num w-12 shrink-0 text-right text-[13px] tabular-nums sm:w-16 ${
                  standout ? "font-semibold text-gold" : g.thin ? "text-ink-faint" : "text-ink"
                }`}
              >
                {metricFmt(g.value, metric)}
              </span>
            </Link>
          </li>
        );
      })}
    </ol>
  );
}

/** Left-anchored bar: rate metrics and counts. */
function LinearBar({ pct, standout, thin }: { pct: number; standout: boolean; thin: boolean }) {
  return (
    <span className="relative block h-2.5 w-full overflow-hidden rounded-full bg-panel-2">
      <span
        className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-300"
        style={{
          width: `${Math.max(pct, 1.5)}%`,
          background: standout ? "var(--color-gold)" : BAR_MUTED,
          opacity: thin ? 0.45 : standout ? 1 : 0.9,
        }}
      />
    </span>
  );
}

/** Diverging bar for goal difference: positive grows right, negative left, off a
 *  centre zero axis — the natural reading of a +/- measure. */
function DivergingBar({
  pct,
  positive,
  standout,
  thin,
}: {
  pct: number;
  positive: boolean;
  standout: boolean;
  thin: boolean;
}) {
  const half = pct / 2;
  return (
    <span className="relative block h-2.5 w-full rounded-full bg-panel-2">
      <span className="absolute inset-y-[-2px] left-1/2 w-px -translate-x-1/2 bg-line" aria-hidden />
      <span
        className="absolute inset-y-0 rounded-full transition-[width] duration-300"
        style={{
          width: `${Math.max(half, 0.75)}%`,
          [positive ? "left" : "right"]: "50%",
          background: standout ? "var(--color-gold)" : BAR_MUTED,
          opacity: thin ? 0.45 : 0.9,
        }}
      />
    </span>
  );
}

// ── shared shaping helpers ─────────────────────────────────────────────────

/** Leading year of a chronological key: "1990s" → 1990, "1990-91" → 1990. */
function yearOf(key: string): number {
  return parseInt(key, 10);
}

function distinctYears(groups: CutGroup[]): number {
  return new Set(groups.map((g) => yearOf(g.key))).size;
}

function yDomain(metric: CutMetric): [number | "dataMin", number | "dataMax"] {
  switch (metric) {
    case "winrate":
      return [0, 100];
    case "ppg":
      return [0, 3];
    case "gd":
      return ["dataMin", "dataMax"];
    case "matches":
    case "goals":
    case "apps":
    case "starts":
    case "goalsperapp":
      return [0, "dataMax"];
  }
}

/** ~6 evenly spaced, decade-rounded axis ticks across the data's year span. */
function yearTicks(years: number[]): { x: number; label: string }[] {
  if (years.length === 0) return [];
  const min = Math.min(...years);
  const max = Math.max(...years);
  if (min === max) return [{ x: min, label: String(min) }];
  const niceSteps = [5, 10, 20, 25, 50, 100, 200];
  const step = niceSteps.find((s) => s >= (max - min) / 5) ?? 200;
  const ticks: { x: number; label: string }[] = [];
  for (let y = Math.ceil(min / step) * step; y <= max; y += step) {
    ticks.push({ x: y, label: String(y) });
  }
  return ticks;
}

/** A spoken value: "58.2% win rate", "+212 goal difference", "253 goals". */
function valuePhrase(value: number | null, metric: CutMetric): string {
  return `${metricFmt(value, metric)} ${valueNoun(metric)}`;
}

function valueNoun(metric: CutMetric): string {
  switch (metric) {
    case "winrate":
      return "win rate";
    case "ppg":
      return "points per game";
    case "gd":
      return "goal difference";
    case "matches":
      return "matches";
    case "goals":
      return "goals";
    case "apps":
      return "appearances";
    case "starts":
      return "starts";
    case "goalsperapp":
      return "goals per app";
  }
}
