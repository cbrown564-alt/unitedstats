import type { EventRow } from "@/lib/queries";

/**
 * Score-progression ribbon: a step chart of United's lead margin across the
 * match, so the *shape* of the result (comfortable, nervy, comeback, collapse)
 * reads before any number. Built from the same timed goals as the timeline.
 *
 * y = United goals minus opponent goals. Above the centre line (United ahead)
 * fills green; below (behind) fills red; on the line it is level. Colour follows
 * lead state, height follows margin — two channels, no decoration.
 */

const W = 1000;
const H = 64;
const CENTER = H / 2;
const PAD = 8;

function endMinute(minutes: number[], aet: boolean): number {
  const maxMin = Math.max(90, ...minutes, aet ? 120 : 0);
  return aet ? 120 : maxMin > 90 ? Math.min(120, Math.ceil(maxMin / 5) * 5) : 90;
}

export function ScoreRibbon({
  unitedGoals,
  opponentGoals,
  aet,
}: {
  unitedGoals: EventRow[];
  opponentGoals: EventRow[];
  aet: boolean;
}) {
  const steps = [
    ...unitedGoals.filter((e) => e.minute != null).map((e) => ({ m: e.minute as number, delta: 1 })),
    ...opponentGoals.filter((e) => e.minute != null).map((e) => ({ m: e.minute as number, delta: -1 })),
  ].sort((a, b) => a.m - b.m);

  if (steps.length === 0) return null;

  const end = endMinute(steps.map((s) => s.m), aet);
  const maxAbs = Math.max(1, ...((() => {
    let cur = 0;
    return steps.map((s) => Math.abs((cur += s.delta)));
  })()));
  const unit = (CENTER - PAD) / maxAbs;
  const x = (m: number) => (m / end) * W;
  const y = (margin: number) => CENTER - margin * unit;

  // Step polyline: hold the current margin to each goal minute, then jump.
  const pts: [number, number][] = [[0, y(0)]];
  let cur = 0;
  for (const s of steps) {
    pts.push([x(s.m), y(cur)]);
    cur += s.delta;
    pts.push([x(s.m), y(cur)]);
  }
  pts.push([W, y(cur)]);
  const finalMargin = cur;

  const line = pts.map(([px, py], i) => `${i ? "L" : "M"}${px.toFixed(1)},${py.toFixed(1)}`).join(" ");
  const area = `${line} L${W},${CENTER} L0,${CENTER} Z`;
  const marginLabel = finalMargin > 0 ? `+${finalMargin}` : `${finalMargin}`;

  return (
    <div className="max-w-3xl rounded-lg border border-line bg-panel px-5 py-3">
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <span className="text-[11px] uppercase tracking-wider text-ink-faint">Lead by minute</span>
        <span
          className={`stat-num text-xs ${
            finalMargin > 0 ? "text-win" : finalMargin < 0 ? "text-loss" : "text-draw"
          }`}
        >
          {marginLabel}
        </span>
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        className="block h-16 w-full"
        role="img"
        aria-label={`Score progression, final margin ${marginLabel}`}
      >
        <defs>
          <clipPath id="ribbon-top">
            <rect x="0" y="0" width={W} height={CENTER} />
          </clipPath>
          <clipPath id="ribbon-bottom">
            <rect x="0" y={CENTER} width={W} height={CENTER} />
          </clipPath>
        </defs>
        <path d={area} fill="var(--color-win)" fillOpacity="0.18" clipPath="url(#ribbon-top)" />
        <path d={area} fill="var(--color-loss)" fillOpacity="0.18" clipPath="url(#ribbon-bottom)" />
        {/* half-time marker */}
        {end >= 45 && (
          <line
            x1={x(45)}
            x2={x(45)}
            y1="0"
            y2={H}
            stroke="var(--color-line)"
            strokeDasharray="3 3"
            vectorEffect="non-scaling-stroke"
          />
        )}
        {/* level line */}
        <line x1="0" x2={W} y1={CENTER} y2={CENTER} stroke="var(--color-line)" vectorEffect="non-scaling-stroke" />
        {/* the lead trace, tinted by side */}
        <path
          d={line}
          fill="none"
          stroke="var(--color-win)"
          strokeWidth="1.75"
          clipPath="url(#ribbon-top)"
          vectorEffect="non-scaling-stroke"
        />
        <path
          d={line}
          fill="none"
          stroke="var(--color-loss)"
          strokeWidth="1.75"
          clipPath="url(#ribbon-bottom)"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <div className="mt-1 flex items-baseline justify-between stat-num text-[10px] text-ink-faint">
        <span>0&prime;</span>
        <span>{end > 90 ? "FT (AET)" : "FT"}</span>
      </div>
    </div>
  );
}
