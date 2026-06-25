"use client";

/**
 * Trophy-winning seasons as gold ticks on a timeline — rendered outside Recharts
 * so markers are never clipped by the plot margin.
 */
export function TrophyMarkerStrip({
  markers,
  xMin,
  xMax,
}: {
  markers: { date: string; season: string }[];
  xMin: number;
  xMax: number;
}) {
  if (!markers.length) return null;
  const span = xMax - xMin || 1;

  return (
    <div
      className="relative h-3 w-full"
      aria-hidden
      title={`${markers.length} trophy-winning seasons`}
    >
      <svg className="h-full w-full overflow-visible" viewBox="0 0 1000 12" preserveAspectRatio="none">
        {markers.map((m) => {
          const x = ((Date.parse(m.date) - xMin) / span) * 1000;
          return (
            <circle
              key={m.season}
              cx={x}
              cy={6}
              r={2.5}
              fill="var(--color-gold)"
              stroke="var(--color-panel)"
              strokeWidth={0.75}
            />
          );
        })}
      </svg>
    </div>
  );
}
