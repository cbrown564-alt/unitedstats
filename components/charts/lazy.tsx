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

export function SeasonContributionChartLazy(props: SeasonContributionProps) {
  return (
    <div style={{ minHeight: props.height ?? 200 }}>
      <SeasonContributionInner {...props} />
    </div>
  );
}

export function InspectableBarChartLazy(props: InspectableBarProps) {
  return (
    <div style={{ minHeight: props.height ?? 180 }}>
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
