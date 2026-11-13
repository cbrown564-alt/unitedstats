/** `next/web-vitals` for the Astro build, on the `web-vitals` package. */
import { useEffect, useRef } from "react";
import { onCLS, onFCP, onINP, onLCP, onTTFB, type Metric } from "web-vitals";

export function useReportWebVitals(report: (metric: Metric) => void): void {
  const ref = useRef(report);
  ref.current = report;
  useEffect(() => {
    const cb = (m: Metric) => ref.current(m);
    onCLS(cb);
    onFCP(cb);
    onINP(cb);
    onLCP(cb);
    onTTFB(cb);
  }, []);
}
