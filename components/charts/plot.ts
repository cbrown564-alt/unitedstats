/**
 * Geometry for the hand-drawn charts. Every plot draws into a stretched
 * 100×100 viewBox (strokes keep their pixel weight via non-scaling-stroke),
 * while dots, labels and hit targets are HTML positioned in the same
 * percentages, so they stay round and crisp at any width. Server-safe.
 */

export type Domain = [number, number];

/** Map a value in `domain` onto 0..100 (or 100..0 when `invert`, for y). */
export function scale(domain: Domain, invert = false) {
  const [d0, d1] = domain;
  const span = d1 - d0 || 1;
  return (v: number) => {
    const t = ((v - d0) / span) * 100;
    return invert ? 100 - t : t;
  };
}

function tickIncrement(start: number, stop: number, count: number) {
  const step = (stop - start) / Math.max(0, count);
  const power = Math.floor(Math.log10(step));
  const error = step / 10 ** power;
  const factor = error >= Math.sqrt(50) ? 10 : error >= Math.sqrt(10) ? 5 : error >= Math.SQRT2 ? 2 : 1;
  return factor * 10 ** power;
}

/** Round, evenly spaced ticks covering `domain` (d3's tick algorithm). */
export function niceTicks([lo, hi]: Domain, count = 4): number[] {
  if (!(hi > lo)) return [lo];
  const step = tickIncrement(lo, hi, count);
  const first = Math.ceil(lo / step);
  const last = Math.floor(hi / step);
  const out: number[] = [];
  for (let i = first; i <= last; i++) out.push(Number((i * step).toPrecision(12)));
  return out;
}

/** Extend `domain` outward to the nearest tick steps, like an "auto" axis. */
export function niceDomain([lo, hi]: Domain, count = 4): Domain {
  if (!(hi > lo)) return lo === 0 ? [0, 1] : [Math.min(0, lo), Math.max(0, hi) || 1];
  const step = tickIncrement(lo, hi, count);
  return [Math.floor(lo / step) * step, Math.ceil(hi / step) * step];
}

type Point = [number, number];

function sign(v: number) {
  return v < 0 ? -1 : 1;
}

/** Monotone cubic interpolation (d3 curveMonotoneX), in viewBox units. */
export function monotonePath(points: Point[]): string {
  const n = points.length;
  if (n === 0) return "";
  const f = (v: number) => Number(v.toFixed(2));
  if (n === 1) return `M${f(points[0][0])},${f(points[0][1])}`;
  if (n === 2) return `M${f(points[0][0])},${f(points[0][1])}L${f(points[1][0])},${f(points[1][1])}`;

  const tangents = new Array<number>(n);
  for (let i = 1; i < n - 1; i++) {
    const [x0, y0] = points[i - 1];
    const [x1, y1] = points[i];
    const [x2, y2] = points[i + 1];
    const h0 = x1 - x0;
    const h1 = x2 - x1;
    const s0 = (y1 - y0) / (h0 || 1e-9);
    const s1 = (y2 - y1) / (h1 || 1e-9);
    const p = (s0 * h1 + s1 * h0) / (h0 + h1 || 1e-9);
    tangents[i] = (sign(s0) + sign(s1)) * Math.min(Math.abs(s0), Math.abs(s1), 0.5 * Math.abs(p)) || 0;
  }
  // End tangents follow d3's slope2: aim at the neighbour, eased by its tangent.
  const endTangent = (a: number, b: number, t: number) => {
    const h = points[b][0] - points[a][0];
    return h ? ((3 * (points[b][1] - points[a][1])) / h - t) / 2 : t;
  };
  tangents[0] = endTangent(0, 1, tangents[1]);
  tangents[n - 1] = endTangent(n - 2, n - 1, tangents[n - 2]);

  let d = `M${f(points[0][0])},${f(points[0][1])}`;
  for (let i = 0; i < n - 1; i++) {
    const [x0, y0] = points[i];
    const [x1, y1] = points[i + 1];
    const dx = (x1 - x0) / 3;
    d += `C${f(x0 + dx)},${f(y0 + dx * tangents[i])},${f(x1 - dx)},${f(y1 - dx * tangents[i + 1])},${f(x1)},${f(y1)}`;
  }
  return d;
}

/** Close a line path down to `baseY` so it can be filled as an area. */
export function areaPath(line: string, points: Point[], baseY = 100): string {
  if (points.length === 0) return "";
  const first = points[0][0];
  const last = points[points.length - 1][0];
  return `${line}L${Number(last.toFixed(2))},${baseY}L${Number(first.toFixed(2))},${baseY}Z`;
}

/**
 * Largest-triangle-three-buckets: the indices of at most `max` points that keep
 * a dense series' visual shape (peaks and troughs survive). A chart a few
 * hundred pixels wide can't show or hover more than that anyway.
 */
export function thinIndices(points: Point[], max: number): number[] {
  const n = points.length;
  if (n <= max || max < 3) return points.map((_, i) => i);
  const out = [0];
  const size = (n - 2) / (max - 2);
  let a = 0;
  for (let b = 0; b < max - 2; b++) {
    const start = Math.floor(b * size) + 1;
    const end = Math.min(n - 1, Math.floor((b + 1) * size) + 1);
    const nextEnd = Math.min(n, Math.floor((b + 2) * size) + 1);
    let ax = 0;
    let ay = 0;
    for (let j = end; j < nextEnd; j++) {
      ax += points[j][0];
      ay += points[j][1];
    }
    const count = Math.max(1, nextEnd - end);
    ax /= count;
    ay /= count;
    let best = start;
    let bestArea = -1;
    for (let j = start; j < end; j++) {
      const area = Math.abs(
        (points[a][0] - ax) * (points[j][1] - points[a][1]) - (points[a][0] - points[j][0]) * (ay - points[a][1]),
      );
      if (area > bestArea) {
        bestArea = area;
        best = j;
      }
    }
    out.push(best);
    a = best;
  }
  out.push(n - 1);
  return out;
}

export function linearPath(points: Point[]): string {
  return points.map(([x, y], i) => `${i ? "L" : "M"}${Number(x.toFixed(2))},${Number(y.toFixed(2))}`).join("");
}
