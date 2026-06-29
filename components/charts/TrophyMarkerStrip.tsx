"use client";

import { useId } from "react";

/** Matches {@link InspectableTimeSeriesChart} Y-axis width so the strip lines up with the plot. */
const Y_AXIS_W = 58;

const DOT_R = 2.5;
const STACK_STEP = 5.5;

/**
 * Trophy-winning seasons as gold ticks on a timeline — rendered outside Recharts
 * so markers are never clipped by the plot margin. Multiple trophies in one
 * season stack vertically at the same date.
 */
export function TrophyMarkerStrip({
  markers,
  xMin,
  xMax,
}: {
  markers: { date: string; season: string; count: number }[];
  xMin: number;
  xMax: number;
}) {
  const labelId = useId();

  if (!markers.length) return null;
  const span = xMax - xMin || 1;
  const maxStack = Math.max(1, ...markers.map((m) => m.count));
  const viewHeight = DOT_R * 2 + 2 + (maxStack - 1) * STACK_STEP;
  const totalTrophies = markers.reduce((sum, m) => sum + m.count, 0);

  return (
    <figure className="m-0 mt-0.5">
      <div className="flex items-end">
        <span
          id={labelId}
          className="w-[58px] shrink-0 pb-0.5 pr-2 text-right text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-faint"
        >
          Trophies
        </span>
        <div className="min-w-0 flex-1 pr-2.5" aria-labelledby={labelId}>
          <div
            className="relative w-full"
            style={{ height: viewHeight }}
            title={`${totalTrophies} trophies across ${markers.length} seasons`}
          >
            <svg
              className="h-full w-full overflow-visible"
              viewBox={`0 0 1000 ${viewHeight}`}
              preserveAspectRatio="none"
              aria-hidden
            >
              {markers.flatMap((m) => {
                const pad = 0.01;
                const x = (pad + ((Date.parse(m.date) - xMin) / span) * (1 - 2 * pad)) * 1000;
                const baseCy = viewHeight - DOT_R - 1;
                return Array.from({ length: m.count }, (_, i) => (
                  <circle
                    key={`${m.season}-${i}`}
                    cx={x}
                    cy={baseCy - i * STACK_STEP}
                    r={DOT_R}
                    fill="var(--color-gold)"
                    stroke="var(--color-panel)"
                    strokeWidth={0.75}
                  >
                    <title>{`${m.season}: ${m.count} ${m.count === 1 ? "trophy" : "trophies"}`}</title>
                  </circle>
                ));
              })}
            </svg>
          </div>
        </div>
      </div>
      <figcaption
        className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-ink-faint"
        style={{ paddingLeft: Y_AXIS_W, paddingRight: 10 }}
      >
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 shrink-0 rounded-full bg-gold shadow-[0_0_0_1px_var(--color-panel)]" aria-hidden />
          One dot per trophy
        </span>
        <span className="text-ink-dim">Stacked when a season won more than one · league titles and major cups</span>
      </figcaption>
    </figure>
  );
}
