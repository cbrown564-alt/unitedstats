"use client";

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";

/**
 * Lazy, client-only wrappers for the three recharts charts. recharts is large
 * (~hundreds of KB) and the charts sit below the fold, so we defer the bundle
 * with `ssr: false` and let it load after hydration. Each wrapper reserves the
 * chart's height up front so deferring it costs no layout shift. The `import()`
 * types are erased at runtime, so the heavy modules never enter this chunk.
 */

type SeasonContributionProps = ComponentProps<
  (typeof import("./SeasonContributionChart"))["SeasonContributionChart"]
>;
type InspectableBarProps = ComponentProps<
  (typeof import("./InspectableBarChart"))["InspectableBarChart"]
>;
type InspectableTimeSeriesProps = ComponentProps<
  (typeof import("./InspectableTimeSeriesChart"))["InspectableTimeSeriesChart"]
>;
type CareerDuelProps = ComponentProps<(typeof import("./CareerDuelChart"))["CareerDuelChart"]>;

const SeasonContributionInner = dynamic(
  () => import("./SeasonContributionChart").then((m) => m.SeasonContributionChart),
  { ssr: false },
);
const InspectableBarInner = dynamic(
  () => import("./InspectableBarChart").then((m) => m.InspectableBarChart),
  { ssr: false },
);
const InspectableTimeSeriesInner = dynamic(
  () => import("./InspectableTimeSeriesChart").then((m) => m.InspectableTimeSeriesChart),
  { ssr: false },
);
const CareerDuelInner = dynamic(
  () => import("./CareerDuelChart").then((m) => m.CareerDuelChart),
  { ssr: false },
);

export function SeasonContributionChartLazy(props: SeasonContributionProps) {
  return (
    <div style={{ minHeight: props.height ?? 200 }}>
      <SeasonContributionInner {...props} />
    </div>
  );
}

export function InspectableBarChartLazy(props: InspectableBarProps) {
  // In `fill` mode the chart sizes to its parent via a height:100% chain, so the
  // reservation div must carry a real height (h-full), not just a min-height —
  // a bare min-height leaves the inner ResponsiveContainer with no definite
  // parent height and it collapses to 0. Outside fill mode, reserve the fixed
  // height up front so deferring the bundle costs no layout shift.
  return (
    <div className={props.fill ? "h-full" : undefined} style={{ minHeight: props.fill ? 180 : props.height ?? 180 }}>
      <InspectableBarInner {...props} />
    </div>
  );
}

export function InspectableTimeSeriesChartLazy(props: InspectableTimeSeriesProps) {
  return (
    <div style={{ minHeight: props.height ?? 260 }}>
      <InspectableTimeSeriesInner {...props} />
    </div>
  );
}

export function CareerDuelChartLazy(props: CareerDuelProps) {
  return (
    <div style={{ minHeight: props.height ?? 240 }}>
      <CareerDuelInner {...props} />
    </div>
  );
}
