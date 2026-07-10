import type { FortressCrack } from "@/lib/journey";
import { fortressShortOpponent } from "@/lib/journey";

/** One timed goal on a crack night — drives the margin thread. */
export type CrackGoal = {
  /** Absolute clock on the axis (90+added for stoppage). */
  clock: number;
  minute: number;
  added: number | null;
  /** +1 United, −1 opponent. */
  delta: 1 | -1;
  name: string;
};

export type ThreeCrackNight = FortressCrack & {
  goals: CrackGoal[];
  /** Optional override for the left label (defaults to short opponent). */
  label?: string;
};

type Props = {
  cracks: ThreeCrackNight[];
};

const MONTHS = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const HALF_TIME = 45;
const FULL_TIME = 90;

/** "1986-12-07" → "Dec 1986". */
function monthYear(iso: string): string {
  return `${MONTHS[Number(iso.slice(5, 7))]} ${iso.slice(0, 4)}`;
}

function clockLabel(minute: number, added: number | null): string {
  return added ? `${minute}+${added}` : `${minute}`;
}

/** Stoppage onto the axis — same convention as MatchFlow for 90+; first-half
 *  stoppage keeps order (45+4 sits just after 45, before 46). */
export function crackGoalClock(minute: number, added: number | null): number {
  if (minute === FULL_TIME && added != null && added > 0) return FULL_TIME + added;
  if (minute === HALF_TIME && added != null && added > 0) return HALF_TIME + added / 10;
  return minute;
}

type MarginPoint = {
  clock: number;
  margin: number;
  /** Goal that produced this margin, if any (kickoff has none). */
  goal: CrackGoal | null;
  /** First time the margin went negative. */
  crack: boolean;
};

/** Replay goals into a step series: kickoff → each goal → full time. */
function marginSeries(goals: CrackGoal[], axisEnd: number): MarginPoint[] {
  const sorted = [...goals].sort(
    (a, b) => a.clock - b.clock || a.delta - b.delta,
  );
  const pts: MarginPoint[] = [{ clock: 0, margin: 0, goal: null, crack: false }];
  let margin = 0;
  let cracked = false;
  for (const g of sorted) {
    margin += g.delta;
    const isCrack = !cracked && margin < 0;
    if (isCrack) cracked = true;
    pts.push({ clock: g.clock, margin, goal: g, crack: isCrack });
  }
  // Hold the final margin out to full time so the draw lands on the FT mark.
  const last = pts[pts.length - 1];
  if (last.clock < axisEnd) {
    pts.push({ clock: axisEnd, margin: last.margin, goal: null, crack: false });
  }
  return pts;
}

const VB_W = 640;
/** Tall enough that the deepest crack + its label never share a band. */
const VB_H = 160;
const PAD_L = 36;
const PAD_R = 52;
const PAD_T = 26;
/** Gutter under the plot for "fell behind" copy — kept clear of the filament. */
const PAD_B = 48;

/**
 * Journey-local composition for Fortress beat 1 — the three cracks
 * (docs/JOURNEY.md §4c). Each night is the full match margin as a filament:
 * every goal a rise or fall, first half included, the crack marked where the
 * lead first goes negative. Shared clock + margin scales so the three nights
 * rhyme. Not a general-purpose chart.
 */
export function ThreeCracks({ cracks }: Props) {
  const axisEnd = Math.max(
    FULL_TIME,
    ...cracks.flatMap((c) => c.goals.map((g) => g.clock)),
  ) + 2;

  let minM = 0;
  let maxM = 1;
  for (const c of cracks) {
    let m = 0;
    for (const g of c.goals) {
      m += g.delta;
      if (m < minM) minM = m;
      if (m > maxM) maxM = m;
    }
  }
  // Extra air under the deepest crack so the hold-line sits well above the
  // gutter where "fell behind" is written.
  const yMin = minM - 1.25;
  const yMax = maxM + 0.55;

  const xAt = (clock: number) => PAD_L + (clock / axisEnd) * (VB_W - PAD_L - PAD_R);
  const yAt = (margin: number) => {
    const t = (margin - yMin) / (yMax - yMin);
    return PAD_T + (1 - t) * (VB_H - PAD_T - PAD_B);
  };

  const yZero = yAt(0);
  const xHt = xAt(HALF_TIME);
  const xFt = xAt(FULL_TIME);

  return (
    <div className="relative mx-auto w-full max-w-lg px-1 sm:max-w-2xl sm:px-2">
      <ul className="flex flex-col gap-10 sm:gap-12">
        {cracks.map((c, nightIdx) => {
          const name = c.label ?? fortressShortOpponent(c.opponent);
          const pts = marginSeries(c.goals, axisEnd);
          const isLast = nightIdx === cracks.length - 1;

          // Step path: horizontal to the goal clock, then vertical to the new
          // margin — so each rise/fall reads as a beat, not a diagonal smear.
          let d = `M ${xAt(0).toFixed(1)} ${yAt(0).toFixed(1)}`;
          let prev = pts[0];
          for (let i = 1; i < pts.length; i++) {
            const p = pts[i];
            if (p.goal) {
              d += ` L ${xAt(p.clock).toFixed(1)} ${yAt(prev.margin).toFixed(1)}`;
              d += ` L ${xAt(p.clock).toFixed(1)} ${yAt(p.margin).toFixed(1)}`;
            } else {
              d += ` L ${xAt(p.clock).toFixed(1)} ${yAt(p.margin).toFixed(1)}`;
            }
            prev = p;
          }

          const htPt = (() => {
            // Margin at the half-time whistle (goals with clock ≤ 45, plus 45+added).
            let m = 0;
            for (const g of c.goals) {
              if (g.clock <= HALF_TIME + 0.9) m += g.delta;
            }
            return m;
          })();

          // Alternating ghost year — left · right · left so the last night
          // clears the figure's big "3" watermark on the right.
          const ghostYear = c.date.slice(2, 4);
          const ghostSide = nightIdx % 2 === 0 ? "left" : "right";

          return (
            <li key={c.id} className="relative flex flex-col gap-2">
              <span
                aria-hidden
                className={`pointer-events-none absolute top-1/2 z-0 select-none stat-num text-[5.5rem] font-bold leading-none text-devil-bright/[0.07] sm:text-[7rem] ${
                  ghostSide === "right"
                    ? "right-0 translate-x-[8%] -translate-y-1/2"
                    : "left-0 -translate-x-[8%] -translate-y-1/2"
                }`}
              >
                {ghostYear}
              </span>

              <div className="relative z-[1] flex flex-col gap-2">
              <div className="flex items-baseline justify-between gap-3 px-2">
                <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-ink-faint">
                  {name}
                </p>
                <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink-faint/70">
                  {monthYear(c.date)}
                </p>
              </div>

              <svg
                viewBox={`0 0 ${VB_W} ${VB_H}`}
                className="h-auto w-full"
                role="img"
                aria-label={`${name}: ${c.goals.length} goals, led ${c.ht} at half-time, fell behind${c.fellBehindMinute != null ? ` on ${c.fellBehindMinute}` : ""}, drew ${c.ft}`}
              >
                <defs>
                  <linearGradient id={`crack-fil-${c.id}`} x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="rgb(245 197 24)" stopOpacity="0.85" />
                    <stop offset="45%" stopColor="rgb(255 90 50)" stopOpacity="1" />
                    <stop offset="55%" stopColor="rgb(255 59 31)" stopOpacity="1" />
                    <stop offset="100%" stopColor="rgb(245 197 24)" stopOpacity="0.9" />
                  </linearGradient>
                  <filter id={`crack-glow-${c.id}`} x="-10%" y="-40%" width="120%" height="180%">
                    <feGaussianBlur stdDeviation="3.2" result="b" />
                    <feMerge>
                      <feMergeNode in="b" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                {/* Level line — the knife-edge between lead and crack */}
                <line
                  x1={PAD_L}
                  y1={yZero}
                  x2={VB_W - PAD_R}
                  y2={yZero}
                  stroke="rgb(216 207 199)"
                  strokeOpacity="0.14"
                  strokeWidth="1"
                  strokeDasharray="3 5"
                />

                {/* Half-time / full-time marks */}
                <line
                  x1={xHt}
                  y1={PAD_T}
                  x2={xHt}
                  y2={VB_H - PAD_B + 4}
                  stroke="rgb(216 207 199)"
                  strokeOpacity="0.18"
                  strokeWidth="1"
                />
                <line
                  x1={xFt}
                  y1={PAD_T}
                  x2={xFt}
                  y2={VB_H - PAD_B + 4}
                  stroke="rgb(216 207 199)"
                  strokeOpacity="0.22"
                  strokeWidth="1"
                />
                <text
                  x={xHt}
                  y={VB_H - 8}
                  textAnchor="middle"
                  style={{
                    fontFamily: "var(--font-sans)",
                    fontSize: "9px",
                    fontWeight: 500,
                    letterSpacing: "0.12em",
                    fill: "rgb(216 207 199)",
                    opacity: 0.45,
                  }}
                >
                  HT
                </text>
                <text
                  x={xFt}
                  y={VB_H - 8}
                  textAnchor="middle"
                  style={{
                    fontFamily: "var(--font-sans)",
                    fontSize: "9px",
                    fontWeight: 500,
                    letterSpacing: "0.12em",
                    fill: "rgb(216 207 199)",
                    opacity: 0.5,
                  }}
                >
                  FT
                </text>

                {/* Soft bloom under the filament */}
                <path
                  d={d}
                  fill="none"
                  stroke="rgb(255 59 31)"
                  strokeWidth="12"
                  strokeLinejoin="round"
                  strokeLinecap="butt"
                  opacity="0.14"
                  filter={`url(#crack-glow-${c.id})`}
                />

                {/* Living margin thread — butt caps so the FT end isn't a phantom knot */}
                <path
                  d={d}
                  fill="none"
                  stroke={`url(#crack-fil-${c.id})`}
                  strokeWidth="2.6"
                  strokeLinejoin="round"
                  strokeLinecap="butt"
                />

                {/* Goal knots — gold United, pale opponent; crack flares */}
                {pts
                  .filter((p) => p.goal)
                  .map((p) => {
                    const g = p.goal!;
                    const x = xAt(p.clock);
                    const y = yAt(p.margin);
                    const united = g.delta === 1;
                    if (p.crack) {
                      // Fixed gap under the knot — domain padding keeps this
                      // clear of the hold-line bloom and inside the viewBox.
                      const labelY = y + 26;
                      return (
                        <g key={`g-${g.clock}-${g.delta}`}>
                          <circle cx={x} cy={y} r={15} fill="rgb(255 59 31)" fillOpacity="0.2" />
                          <circle
                            cx={x}
                            cy={y}
                            r={6}
                            fill="var(--color-pitch)"
                            stroke="rgb(255 59 31)"
                            strokeWidth="2"
                          />
                          {isLast && (
                            <circle cx={x} cy={y} r="9" fill="none" stroke="rgb(255 59 31)" strokeWidth="1.2" opacity="0.7">
                              <animate attributeName="r" values="7;18;7" dur="2.6s" repeatCount="indefinite" />
                              <animate attributeName="opacity" values="0.65;0;0.65" dur="2.6s" repeatCount="indefinite" />
                            </circle>
                          )}
                          <text
                            x={x}
                            y={labelY}
                            textAnchor="middle"
                            style={{
                              fontFamily: "var(--font-sans)",
                              fontSize: "9px",
                              fontWeight: 600,
                              letterSpacing: "0.08em",
                              textTransform: "uppercase",
                              fill: "rgb(255 150 120)",
                            }}
                          >
                            fell behind · {clockLabel(g.minute, g.added)}′
                          </text>
                        </g>
                      );
                    }
                    return (
                      <g key={`g-${g.clock}-${g.delta}`}>
                        <circle
                          cx={x}
                          cy={y}
                          r={united ? 4.2 : 3.6}
                          fill={united ? "rgb(245 197 24)" : "var(--color-pitch)"}
                          stroke={united ? "#fff4d4" : "rgb(216 207 199)"}
                          strokeWidth={united ? 1.1 : 1.3}
                          strokeOpacity={united ? 1 : 0.7}
                        >
                          {/* Single text child — multi-node <title> children SSR as empty in HTML. */}
                          <title>{`${clockLabel(g.minute, g.added)}′ ${g.name}${united ? "" : " (opp)"}`}</title>
                        </circle>
                      </g>
                    );
                  })}

                {/* HT score — parked on the half-time mark at the held margin */}
                <g>
                  <circle cx={xHt} cy={yAt(htPt)} r={4} fill="rgb(245 197 24)" fillOpacity="0.35" />
                  <text
                    x={xHt}
                    y={yAt(htPt) - 10}
                    textAnchor="middle"
                    className="stat-num"
                    style={{ fontSize: "12px", fontWeight: 700, fill: "rgb(240 233 226)" }}
                  >
                    {c.ht}
                  </text>
                </g>

                {/* FT draw score — type only; no knot (a dot here reads as a phantom goal). */}
                <text
                  x={xFt - 8}
                  y={yAt(c.gf - c.ga) - 11}
                  textAnchor="end"
                  className="stat-num"
                  style={{ fontSize: "13px", fontWeight: 700, fill: "rgb(240 233 226)" }}
                >
                  {c.ft}
                </text>
              </svg>
              </div>
            </li>
          );
        })}
      </ul>

      {/* Shared axis caption — inset to match SVG pads */}
      <div
        className="relative mt-1 h-4"
        style={{ marginLeft: `${(PAD_L / VB_W) * 100}%`, marginRight: `${(PAD_R / VB_W) * 100}%` }}
        aria-hidden
      >
        <span className="absolute left-0 text-[10px] font-medium uppercase tracking-[0.14em] text-ink-faint/55">
          0′
        </span>
        <span
          className="absolute -translate-x-1/2 text-[10px] font-medium uppercase tracking-[0.14em] text-ink-faint/55"
          style={{ left: `${((HALF_TIME / axisEnd) * 100).toFixed(1)}%` }}
        >
          45′
        </span>
        <span
          className="absolute -translate-x-1/2 text-[10px] font-medium uppercase tracking-[0.14em] text-ink-faint/70"
          style={{ left: `${((FULL_TIME / axisEnd) * 100).toFixed(1)}%` }}
        >
          90′
        </span>
      </div>
    </div>
  );
}
