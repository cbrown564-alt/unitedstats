import { Bead, Cord, CordSvg, Plate, Strand, opticalStroke, type CordBeadKind } from "@/components/glyphs/cord/primitives";

/*
 * Data glyphs: cord marks drawn from the record itself, not from a metaphor.
 * Each takes real values and draws nothing the record does not state. Result
 * colour is always paired with position (above / on / below the line), so the
 * mark never depends on colour alone (DESIGN.md).
 */

type Result = "W" | "D" | "L";
type Pt = [number, number];

const RESULT_BEAD: Record<Result, CordBeadKind> = { W: "w", D: "d", L: "l" };
const r1 = (n: number) => Math.round(n * 100) / 100;

/** A smooth open path through points (Catmull-Rom, as cubic Béziers). */
function smoothPath(pts: Pt[], tension = 1): string {
  if (pts.length < 2) return "";
  let d = `M${r1(pts[0][0])} ${r1(pts[0][1])}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1: Pt = [p1[0] + ((p2[0] - p0[0]) / 6) * tension, p1[1] + ((p2[1] - p0[1]) / 6) * tension];
    const c2: Pt = [p2[0] - ((p3[0] - p1[0]) / 6) * tension, p2[1] - ((p3[1] - p1[1]) / 6) * tension];
    d += `C${r1(c1[0])} ${r1(c1[1])} ${r1(c2[0])} ${r1(c2[1])} ${r1(p2[0])} ${r1(p2[1])}`;
  }
  return d;
}

// ------------------------------------------------------------- match thread

export interface ThreadGoal {
  minute: number;
  added: number | null;
  side: "us" | "them";
}

/**
 * A match as one thread: it runs level, steps up when United score and down
 * when the opponent does, so its height is the score state at every minute.
 * Goal beads land where the score changed; the knot at the end is the result.
 * Stoppage time runs past the 90' tick; extra time extends the field to 120'.
 *
 * `stoppageZoom` gives that fraction of the width to time after 90' (normal
 * time only). It distorts the clock, so a host that sets it must say so; the
 * axis labels it draws mark where the scale changes.
 */
export function MatchThread({
  goals,
  aet,
  result,
  width = 240,
  stoppageZoom,
  axis,
  className,
  label,
}: {
  goals: ThreadGoal[];
  aet: boolean;
  result: Result;
  width?: number;
  stoppageZoom?: number;
  axis?: boolean;
  className?: string;
  label?: string;
}) {
  const W = 120;
  const H = 30;
  const mid = H / 2;
  const padL = 3;
  const padR = 6;
  const sw = opticalStroke(width, W);
  const lastAdded = Math.max(0, ...goals.filter((g) => g.minute === 90 && !aet).map((g) => g.added ?? 0));
  const end = aet ? 121 : 90 + lastAdded + 1.5;
  const eff = (g: ThreadGoal) => (g.added ? (g.minute === 90 && !aet ? 90 + g.added : g.minute + g.added * 0.3) : g.minute);
  const span = W - padL - padR;
  const zoom = !aet && stoppageZoom ? stoppageZoom : 0;
  const x = (m: number) => {
    if (!zoom) return padL + (m / end) * span;
    if (m <= 90) return padL + (m / 90) * span * (1 - zoom);
    return padL + span * (1 - zoom) + ((m - 90) / (end - 90)) * span * zoom;
  };
  const endX = W - padR + 2;

  const ordered = goals.map((g) => ({ side: g.side, m: eff(g) })).sort((a, b) => a.m - b.m);
  const steps: { side: ThreadGoal["side"]; x: number; before: number; after: number }[] = [];
  let diff = 0;
  let maxAbs = 1;
  for (const { side, m } of ordered) {
    const before = diff;
    diff += side === "us" ? 1 : -1;
    maxAbs = Math.max(maxAbs, Math.abs(diff));
    steps.push({ side, x: x(m), before, after: diff });
  }
  const step = Math.min(5, (mid - 4) / maxAbs);
  const y = (d: number) => mid - d * step;
  const rise = Math.min(1.6, sw * 1.1);

  let d = `M${padL} ${mid}`;
  for (const s of steps) {
    const y0 = y(s.before);
    const y1 = y(s.after);
    d += `L${r1(s.x - rise)} ${r1(y0)}C${r1(s.x - rise * 0.3)} ${r1(y0)} ${r1(s.x - rise * 0.3)} ${r1(y1)} ${r1(s.x + rise * 0.4)} ${r1(y1)}`;
  }
  d += `L${endX} ${r1(y(diff))}`;

  const run = endX - padL;
  const tickMinutes = aet ? [45, 90, 105, 120] : [45, 90];
  const ticks = tickMinutes.map((m) => `M${r1(x(m))} ${mid - 2.2}V${mid + 2.2}`).join("");
  const beadR = Math.max(1.05, sw * 1.2);

  const svg = (
    <CordSvg
      size={width}
      unit={W}
      width={width}
      height={(width * H) / W}
      viewBox={`0 0 ${W} ${H}`}
      className={className}
      label={label}
    >
      <Plate d={`M${padL} ${mid}${d.slice(d.indexOf("L"))}V${mid}Z`} />
      <Strand d={`M${padL} ${mid}H${endX}`} dashed />
      <Strand d={ticks} />
      <Cord d={d} />
      {steps.map((s, i) => (
        <Bead
          key={i}
          kind={s.side === "us" ? "thread" : "pale"}
          cx={r1(s.x + rise * 0.4)}
          cy={r1(y(s.after))}
          r={r1(beadR)}
          t={r1((s.x - padL) / run)}
        />
      ))}
      <Bead kind={RESULT_BEAD[result]} cx={endX} cy={r1(y(diff))} r={r1(beadR * 1.5)} t={1} />
    </CordSvg>
  );
  if (!axis) return svg;

  const marks: { at: number; text: string }[] = [
    { at: padL, text: "0′" },
    ...tickMinutes.map((m) => ({ at: x(m), text: `${m}′` })),
  ];
  if (!aet && lastAdded) marks.push({ at: x(90 + lastAdded), text: `+${lastAdded}′` });
  return (
    <div className="cd-thread-axis">
      {svg}
      <div className="cd-thread-axis__marks" aria-hidden>
        {marks.map((mk) => (
          <span key={mk.text} style={{ left: `${(mk.at / W) * 100}%` }}>
            {mk.text}
          </span>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- form cord

/** Recent form as a cord through result beads: up for a win, level for a draw, down for a loss. */
export function FormCord({
  results,
  height = 20,
  className,
  label,
}: {
  results: Result[];
  height?: number;
  className?: string;
  label?: string;
}) {
  const H = 16;
  const gap = 7;
  const W = 8 + (results.length - 1) * gap;
  const lift: Record<Result, number> = { W: -4, D: 0, L: 4 };
  const pts: Pt[] = results.map((r, i) => [4 + i * gap, 8 + lift[r]]);
  return (
    <CordSvg
      size={height}
      unit={H}
      width={(height * W) / H}
      height={height}
      viewBox={`0 0 ${W} ${H}`}
      className={className}
      label={label}
    >
      <Cord d={smoothPath(pts, 0.9)} />
      {pts.map(([cx, cy], i) => (
        <Bead key={i} kind={RESULT_BEAD[results[i]]} cx={cx} cy={cy} r={2.3} i={i} />
      ))}
    </CordSvg>
  );
}

// ---------------------------------------------------------------- season lap

/**
 * A league season as one lap: every match a bead around the ring, set outside
 * it for a win, on it for a draw and inside it for a loss, with the cord
 * running through them in order. A champion's lap closes on a gold bead.
 */
export function SeasonLap({
  results,
  champions,
  size = 160,
  className,
  label,
}: {
  results: Result[];
  champions: boolean;
  size?: number;
  className?: string;
  label?: string;
}) {
  const C = 40;
  const R = 26;
  const sweep = 324;
  const start = -90 + (360 - sweep) / 2;
  const lift: Record<Result, number> = { W: 4.2, D: 0, L: -4.2 };
  const n = results.length;
  const at = (deg: number, rad: number): Pt => {
    const a = (deg * Math.PI) / 180;
    return [C + Math.cos(a) * rad, C + Math.sin(a) * rad];
  };
  const pts = results.map((r, i) => at(start + (i / Math.max(1, n - 1)) * sweep, R + lift[r]));
  const knot = at(start + sweep + 9, R);
  return (
    <CordSvg size={size} unit={80} viewBox="0 0 80 80" className={className} label={label}>
      <Plate d={`M${C} ${C - R + 8}A${R - 8} ${R - 8} 0 1 1 ${C - 0.01} ${C - R + 8}Z`} />
      <Strand d={`M${C} ${C - R}A${R} ${R} 0 1 1 ${C - 0.01} ${C - R}`} dashed />
      <Cord d={smoothPath(champions ? [...pts, knot] : pts, 0.8)} />
      {pts.map(([cx, cy], i) => (
        <Bead key={i} kind={RESULT_BEAD[results[i]]} cx={r1(cx)} cy={r1(cy)} r={1.75} t={r1(i / n)} i={i} />
      ))}
      {champions && <Bead cx={r1(knot[0])} cy={r1(knot[1])} r={3.4} t={1} i={n} />}
    </CordSvg>
  );
}

// ---------------------------------------------------------------- loader

/** A waiting loop: the needle runs round a closed thread. Pair with visible text. */
export function CordLoader({ size = 20, className }: { size?: number; className?: string }) {
  return (
    <CordSvg size={size} className={["cd-loader", className].filter(Boolean).join(" ")}>
      <Strand d="M12 4A8 8 0 1 1 11.99 4" />
      <Cord d="M12 4A8 8 0 1 1 11.99 4" />
    </CordSvg>
  );
}
