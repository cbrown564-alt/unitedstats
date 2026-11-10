"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState, type ComponentProps } from "react";

/**
 * Client-only chart wrappers with reserved space. The player contribution chart
 * additionally waits until it approaches the viewport, rather than downloading
 * Recharts at hydration on phones where the whole chart is below the fold.
 * The other wrappers retain their existing post-hydration loading behavior.
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
type EraSkylineProps = ComponentProps<(typeof import("./EraSkylineChart"))["EraSkylineChart"]>;
type ManagerLongevityProps = ComponentProps<(typeof import("./ManagerLongevityChart"))["ManagerLongevityChart"]>;

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
const EraSkylineInner = dynamic(
  () => import("./EraSkylineChart").then((m) => m.EraSkylineChart),
  { ssr: false },
);
const ManagerLongevityInner = dynamic(
  () => import("./ManagerLongevityChart").then((m) => m.ManagerLongevityChart),
  { ssr: false },
);

export function SeasonContributionChartLazy(props: SeasonContributionProps) {
  const host = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!host.current) return;
    if (typeof IntersectionObserver === "undefined") {
      const frame = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(frame);
    }
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        setVisible(true);
        observer.disconnect();
      }
    }, { rootMargin: "200px" });
    observer.observe(host.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={host} style={{ minHeight: props.height ?? 200 }} aria-busy={!visible}>
      {visible ? <SeasonContributionInner {...props} /> : null}
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

export function EraSkylineChartLazy(props: EraSkylineProps) {
  return (
    <div style={{ minHeight: 300 }}>
      <EraSkylineInner {...props} />
    </div>
  );
}

export function ManagerLongevityChartLazy(props: ManagerLongevityProps) {
  return (
    <div style={{ minHeight: 280 }}>
      <ManagerLongevityInner {...props} />
    </div>
  );
}
