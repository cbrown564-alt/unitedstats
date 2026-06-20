/**
 * A horizontal dumbbell: a hollow origin dot (the "before") joined to a solid
 * outcome dot (the "after") by a connector tinted red when the value rose and
 * slate when it fell. The shift left-or-right *is* the story — a manager's bounce,
 * or the cost of a European week — read at a glance across a shared scale.
 *
 * HTML/CSS (not SVG) so value labels stay crisp at any width. Reused for the
 * Europe before/after split and the per-manager bounce rows.
 */
type Point = { value: number; label?: string };

export function SlopeCompare({
  from,
  to,
  min = 0,
  max,
  format = (v) => String(v),
  showValues = false,
  compact = false,
}: {
  /** The "before" / baseline value. */
  from: Point;
  /** The "after" / outcome value. */
  to: Point;
  min?: number;
  max: number;
  format?: (v: number) => string;
  /** Render the two values as labels flanking the dots. */
  showValues?: boolean;
  /** Tighter rail + smaller dots for list rows. */
  compact?: boolean;
}) {
  const span = max - min || 1;
  const clamp = (v: number) => Math.max(0, Math.min(100, ((v - min) / span) * 100));
  const fromPct = clamp(from.value);
  const toPct = clamp(to.value);
  const dir = to.value === from.value ? "flat" : to.value > from.value ? "up" : "down";
  const toColor =
    dir === "flat" ? "var(--color-draw)" : dir === "up" ? "var(--color-win)" : "var(--color-loss)";
  const left = Math.min(fromPct, toPct);
  const width = Math.abs(toPct - fromPct);

  const dotTo = compact ? 11 : 15;
  const dotFrom = compact ? 8 : 11;
  const connectorH = compact ? 3 : 4;

  return (
    <div className={`relative w-full ${compact ? "h-6" : "h-10"}`}>
      {/* full-domain track */}
      <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-line" />
      {/* connector between the two points, coloured by direction */}
      <div
        className="absolute top-1/2 -translate-y-1/2 rounded-full"
        style={{ left: `${left}%`, width: `${width}%`, height: connectorH, background: toColor, opacity: 0.9 }}
      />
      {/* origin (before) — hollow */}
      <span
        className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 bg-pitch"
        style={{ left: `${fromPct}%`, width: dotFrom, height: dotFrom, borderColor: "var(--color-ink-faint)" }}
      />
      {/* outcome (after) — solid, ringed so it never disappears against the bar */}
      <span
        className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-panel"
        style={{ left: `${toPct}%`, width: dotTo, height: dotTo, background: toColor }}
      />
      {showValues && (
        <>
          <span
            className="stat-num absolute -translate-x-1/2 whitespace-nowrap text-[11px] text-ink-faint"
            style={{ left: `${fromPct}%`, bottom: 0 }}
          >
            {format(from.value)}
          </span>
          <span
            className="stat-num absolute -translate-x-1/2 whitespace-nowrap text-xs font-semibold"
            style={{ left: `${toPct}%`, top: 0, color: toColor }}
          >
            {format(to.value)}
          </span>
        </>
      )}
    </div>
  );
}
