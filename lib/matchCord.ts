/**
 * Shared geometry for the score-state cord: the match page's MatchFlow and the
 * match share card draw the same night the same way. x runs 0..100 across the
 * match clock; stoppage after 90' gets a widened slice that every host must
 * disclose.
 */

/**
 * Absolute minute on the match axis. Stoppage is 90+added; older sources sometimes
 * write 93 directly instead of 90+3 — same contract as late-goal plotting.
 */
export function goalClock(minute: number, added: number | null): number {
  if (minute === 90 && added != null && added > 0) return 90 + added;
  return minute;
}

export interface MatchTimeScale {
  /** Last minute on the axis. */
  end: number;
  /** Minutes of stoppage drawn after 90' (0 when none or after extra time). */
  stoppage: number;
  /** Share of the width given to stoppage time (0 when not zoomed). */
  zoom: number;
  /** x (0..100) where the result knot sits. */
  endX: number;
  /** Minute to x (0..100). */
  pos: (minute: number) => number;
}

/** % of width kept after the whistle for the result knot. */
const KNOT = 2.5;

export function matchTimeScale(clocks: number[], aet: boolean): MatchTimeScale {
  const maxClock = Math.max(90, ...clocks);
  // Pad past the last stoppage goal so the final knot isn't pinned to the edge.
  const stoppage = !aet && maxClock > 90 ? maxClock - 90 : 0;
  const end = aet ? 120 : stoppage ? 90 + stoppage + 1.5 : 90;
  // Stoppage gets a widened slice of the axis, scaled to how much was played.
  const zoom = stoppage ? Math.min(0.2, 0.07 + stoppage * 0.018) : 0;
  const span = 100 - KNOT;
  const pos = (m: number) => {
    const c = Math.max(0, Math.min(end, m));
    if (!zoom) return (c / end) * span;
    if (c <= 90) return (c / 90) * span * (1 - zoom);
    return span * (1 - zoom) + ((c - 90) / (end - 90)) * span * zoom;
  };
  return { end, stoppage, zoom, endX: 100 - KNOT / 2, pos };
}

/**
 * The cord itself: hold each score, then step at the goal with a short eased
 * turn. `steps` are in clock order, each the x of the goal and the score
 * difference (United's perspective) after it. Returns the cord and the plate
 * closed back to the level line.
 */
export function scoreCordPath(
  steps: { x: number; after: number }[],
  yOf: (diff: number) => number,
  endX: number,
  ease = 0.5,
): { d: string; plate: string } {
  const mid = yOf(0);
  let d = `M0 ${mid}`;
  let level = 0;
  for (const s of steps) {
    const y0 = yOf(level);
    level = s.after;
    const y1 = yOf(level);
    d += `L${(s.x - ease).toFixed(2)} ${y0}C${s.x.toFixed(2)} ${y0} ${s.x.toFixed(2)} ${y1} ${(s.x + ease).toFixed(2)} ${y1}`;
  }
  d += `L${endX} ${yOf(level)}`;
  return { d, plate: `${d}L${endX} ${mid}L0 ${mid}Z` };
}
