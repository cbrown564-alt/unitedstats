"use client";

import Image from "next/image";
import { useJourneyStage } from "./useJourneyStage";
import { clamp01, lerp, smoothstep } from "./stageMath";

const VB_W = 1000;
const VB_H = 700;

const AXIS_Y = 168;
const AXIS_X0 = 70;
const AXIS_X1 = 930;
const AXIS_START_YEAR = 1886;

const POCKET_CX = 500;
const POCKET_CY = 402;
const POCKET_R = 150;
const NECK_Y = POCKET_CY - POCKET_R;

const MONTHS = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function monthYearShort(date: string): string {
  return `${MONTHS[Number(date.slice(5, 7))]} ${date.slice(2, 4)}`;
}

function cubicLen(
  p0: [number, number],
  c1: [number, number],
  c2: [number, number],
  p1: [number, number],
): number {
  let len = 0;
  let px = p0[0];
  let py = p0[1];
  const N = 16;
  for (let i = 1; i <= N; i++) {
    const t = i / N;
    const u = 1 - t;
    const x = u * u * u * p0[0] + 3 * u * u * t * c1[0] + 3 * u * t * t * c2[0] + t * t * t * p1[0];
    const y = u * u * u * p0[1] + 3 * u * u * t * c1[1] + 3 * u * t * t * c2[1] + t * t * t * p1[1];
    len += Math.hypot(x - px, y - py);
    px = x;
    py = y;
  }
  return len;
}

export type FortressCrackKnot = {
  id: string;
  date: string;
  /** Short opponent label on the knot (Spurs · Wednesday · Bournemouth). */
  label: string;
};

type Props = {
  /** Year the unbeaten run begins after — the last lead lost (1984). */
  hingeYear: number;
  /** Verifiable games led at HT since the hinge. */
  runGames: number;
  /** The three cracks, oldest first. */
  cracks: FortressCrackKnot[];
  axisEndYear: number;
  /** Old Trafford place monument. */
  monumentSrc: string;
  monumentObjectPosition?: string;
};

/**
 * Beat 0 of the Fortress chapter — the **spin-off** as a place pocket
 * (docs/JOURNEY.md §4c). The club timeline runs faint; at 1984 the filament
 * leaves into an Old Trafford pocket; three gold crack-knots land in date
 * order. Copy is manner-first: place → led at half-time → fallen behind only
 * three times; "Never lost" is the quiet foot-fact. Same skeleton as
 * TrebleSpinoff / RhymeMorph.
 */
export function FortressSpinoff({
  hingeYear,
  runGames,
  cracks,
  axisEndYear,
  monumentSrc,
  monumentObjectPosition = "50% 40%",
}: Props) {
  const { runwayRef, progress, reduced } = useJourneyStage();
  const p = reduced ? 1 : progress;

  const departFrac = clamp01((hingeYear - AXIS_START_YEAR) / Math.max(1, axisEndYear - AXIS_START_YEAR));
  const departX = AXIS_X0 + departFrac * (AXIS_X1 - AXIS_X0);
  const returnX = departX + 40;

  const entry = {
    p0: [departX, AXIS_Y] as [number, number],
    c1: [departX - 74, AXIS_Y + 26] as [number, number],
    c2: [POCKET_CX + 105, NECK_Y - 38] as [number, number],
    p1: [POCKET_CX, NECK_Y] as [number, number],
  };
  const exit = {
    p0: [POCKET_CX, NECK_Y] as [number, number],
    c1: [POCKET_CX + 120, NECK_Y - 37] as [number, number],
    c2: [returnX - 84, AXIS_Y + 4] as [number, number],
    p1: [returnX, AXIS_Y] as [number, number],
  };
  const d =
    `M ${AXIS_X0} ${AXIS_Y} L ${departX.toFixed(1)} ${AXIS_Y} ` +
    `C ${entry.c1[0].toFixed(1)} ${entry.c1[1]} ${entry.c2[0]} ${entry.c2[1]} ${POCKET_CX} ${NECK_Y} ` +
    `A ${POCKET_R} ${POCKET_R} 0 0 0 ${POCKET_CX} ${POCKET_CY + POCKET_R} ` +
    `A ${POCKET_R} ${POCKET_R} 0 0 0 ${POCKET_CX} ${NECK_Y} ` +
    `C ${exit.c1[0].toFixed(1)} ${exit.c1[1]} ${exit.c2[0].toFixed(1)} ${exit.c2[1]} ${returnX.toFixed(1)} ${AXIS_Y} ` +
    `L ${AXIS_X1} ${AXIS_Y}`;

  const axisRun = departX - AXIS_X0;
  const entryLen = cubicLen(entry.p0, entry.c1, entry.c2, entry.p1);
  const circleLen = 2 * Math.PI * POCKET_R;
  const exitLen = cubicLen(exit.p0, exit.c1, exit.c2, exit.p1);
  const totalLen = axisRun + entryLen + circleLen + exitLen + (AXIS_X1 - returnX);
  const departAt = axisRun / totalLen;
  const knotFracs = [0.25, 0.5, 0.75].map((q) => (axisRun + entryLen + q * circleLen) / totalLen);
  const knotXY: [number, number][] = [
    [POCKET_CX - POCKET_R, POCKET_CY],
    [POCKET_CX, POCKET_CY + POCKET_R],
    [POCKET_CX + POCKET_R, POCKET_CY],
  ];

  const awaken = smoothstep(0, 0.14, p);
  const draw = reduced ? 1 : lerp(departAt + 0.03, 1, smoothstep(0.08, 0.66, p));
  const land = reduced ? 1 : smoothstep(0.72, 0.92, p);

  const ghostOpacity = reduced ? 0.14 : 0.05 + awaken * 0.04 + draw * 0.04 + land * 0.03;
  const axisOpacity = 0.08 + awaken * 0.1;
  const monumentOpacity = reduced ? 0.28 : 0.1 + awaken * 0.1 + draw * 0.08 + land * 0.06;

  // Manner-first: place → rule → three cracks. Haul is the foot-fact.
  const line =
    p < 0.34 ? "Old Trafford." : p < 0.72 ? "Led at half-time." : "Fallen behind only three times.";
  const sub =
    p < 0.34
      ? "Home. League."
      : p < 0.72
        ? `Since May ${hingeYear}.`
        : cracks.map((c) => `${monthYearShort(c.date)}.`).join(" ");

  return (
    <div ref={runwayRef} data-journey-runway className="relative" style={{ height: reduced ? "100dvh" : "210vh" }}>
      <div
        className={`${reduced ? "relative" : "sticky top-0"} z-10 h-dvh`}
        role="img"
        aria-label={`Old Trafford: led at half-time in the league since May ${hingeYear}, fallen behind only three times — ${cracks.map((c) => c.label).join(", ")}. Never lost across ${runGames} verifiable games.`}
      >
        <div className="journey-floodlit full-bleed-viewport relative h-full overflow-hidden">
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_-18%,rgba(255,238,210,0.13),transparent_52%)]"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background: `radial-gradient(70% 55% at 50% 52%, rgba(216,33,13,${reduced ? 0.22 : 0.1 + draw * 0.16}), transparent 68%)`,
            }}
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(130%_120%_at_50%_55%,transparent_30%,rgba(0,0,0,0.8))]"
            aria-hidden
          />

          {/* Single place monument — Old Trafford behind the pocket */}
          <div
            className="pointer-events-none absolute inset-0 z-[1] [mask-image:radial-gradient(ellipse_78%_72%_at_50%_58%,#000_18%,transparent_78%),linear-gradient(to_top,transparent_0%,#000_18%,#000_72%,transparent_100%)]"
            style={{ opacity: monumentOpacity }}
            aria-hidden
          >
            <Image
              src={monumentSrc}
              alt=""
              fill
              priority
              sizes="100vw"
              className="object-cover grayscale contrast-125"
              style={{ objectPosition: monumentObjectPosition }}
            />
            <div className="absolute inset-0 bg-[radial-gradient(70%_60%_at_50%_55%,rgba(216,33,13,0.55),rgba(216,33,13,0.12)_55%,transparent_78%)] mix-blend-color" />
            <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,0.55)_0%,transparent_28%,transparent_62%,rgba(0,0,0,0.72)_100%)]" />
          </div>

          <div className="absolute inset-x-0 top-0 z-20 flex flex-col items-center px-5 pt-10 text-center sm:pt-14 lg:pt-16">
            <p data-journey-phase className="text-[11px] font-semibold uppercase tracking-[0.32em] text-devil-bright">
              Red Thread / 03
            </p>
            <h1 className="mt-5 max-w-3xl text-balance text-[2.1rem] font-semibold leading-[1.04] tracking-tight text-ink sm:text-4xl lg:text-5xl">
              {line}
            </h1>
            <p className="mt-4 max-w-xl text-balance text-sm text-ink-dim sm:text-base">{sub}</p>
          </div>

          <svg
            className="pointer-events-none absolute inset-0 z-[2] h-full w-full"
            viewBox={`0 0 ${VB_W} ${VB_H}`}
            preserveAspectRatio="xMidYMid meet"
            aria-hidden
          >
            <defs>
              <linearGradient id="fortress-filament" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="rgb(255 59 31)" stopOpacity="0.9" />
                <stop offset="30%" stopColor="rgb(255 80 40)" stopOpacity="1" />
                <stop offset="50%" stopColor="rgb(255 210 120)" stopOpacity="1" />
                <stop offset="70%" stopColor="rgb(255 80 40)" stopOpacity="1" />
                <stop offset="100%" stopColor="rgb(255 59 31)" stopOpacity="0.9" />
              </linearGradient>
              <filter id="fortress-soft" x="-50%" y="-60%" width="200%" height="220%">
                <feGaussianBlur stdDeviation="16" />
              </filter>
            </defs>

            {/* Ghost "OT" — place monument the pocket coils around */}
            <text
              x={POCKET_CX}
              y={POCKET_CY + 10}
              textAnchor="middle"
              dominantBaseline="central"
              className="display"
              style={{
                opacity: ghostOpacity,
                transform: `scale(${lerp(0.88, 0.82, land)})`,
                transformOrigin: `${POCKET_CX}px ${POCKET_CY}px`,
                fontSize: "168px",
                fill: "rgb(255 59 31)",
                filter: "blur(0.5px)",
              }}
            >
              OT
            </text>

            <line
              x1={AXIS_X0}
              y1={AXIS_Y}
              x2={AXIS_X1}
              y2={AXIS_Y}
              stroke="rgb(255 90 50)"
              strokeOpacity={axisOpacity}
              strokeWidth="1.4"
            />
            <g style={{ opacity: 0.2 + awaken * 0.35 }}>
              <text
                x={AXIS_X0}
                y={AXIS_Y - 22}
                textAnchor="start"
                className="stat-num"
                style={{ fontSize: "24px", fontWeight: 600, fill: "rgb(216 207 199)" }}
              >
                {AXIS_START_YEAR}
              </text>
              <text
                x={AXIS_X1}
                y={AXIS_Y - 22}
                textAnchor="end"
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: "22px",
                  fontWeight: 500,
                  letterSpacing: "0.04em",
                  fill: "rgb(216 207 199)",
                }}
              >
                now
              </text>
            </g>
            <text
              x={departX}
              y={AXIS_Y - 26}
              textAnchor="middle"
              className="stat-num"
              style={{
                fontSize: "34px",
                fontWeight: 700,
                fill: "rgb(240 233 226)",
                opacity: reduced ? 0.9 : 0.35 + awaken * 0.55,
              }}
            >
              {hingeYear}
            </text>

            <path
              d={d}
              fill="none"
              stroke="rgb(255 59 31)"
              strokeWidth="26"
              strokeLinecap="round"
              strokeLinejoin="round"
              pathLength={1}
              strokeDasharray={1}
              strokeDashoffset={1 - draw}
              opacity={draw * 0.18}
              filter="url(#fortress-soft)"
            />
            <path
              d={d}
              fill="none"
              stroke="rgb(255 90 50)"
              strokeOpacity={0.55 * draw}
              strokeWidth="8"
              strokeLinecap="round"
              strokeLinejoin="round"
              pathLength={1}
              strokeDasharray={1}
              strokeDashoffset={1 - draw}
              style={{ filter: "blur(3.4px)" }}
            />
            <path
              d={d}
              fill="none"
              stroke="url(#fortress-filament)"
              strokeWidth="3.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              pathLength={1}
              strokeDasharray={1}
              strokeDashoffset={1 - draw}
              opacity={lerp(0.5, 1, draw)}
            />

            <g opacity={lerp(0.5, 1, awaken)}>
              <circle cx={departX} cy={AXIS_Y} r={22} fill="rgb(255 255 255)" fillOpacity="0.09" style={{ filter: "blur(5px)" }} />
              <circle cx={departX} cy={AXIS_Y} r={13} fill="none" stroke="rgb(255 255 255)" strokeOpacity="0.55" strokeWidth="1.3" />
              <circle cx={departX} cy={AXIS_Y} r="2.4" fill="#fff4d4" />
            </g>

            {cracks.slice(0, 3).map((crack, i) => {
              const [kx, ky] = knotXY[i];
              const f = knotFracs[i];
              const op = reduced ? 1 : smoothstep(f - 0.01, f + 0.03, draw);
              const isLast = i === Math.min(cracks.length, 3) - 1;
              const labelPos =
                i === 0
                  ? { x: kx - 28, y: ky - 2, anchor: "end" as const, placeY: ky + 22 }
                  : i === 1
                    ? { x: kx, y: ky + 36, anchor: "middle" as const, placeY: ky + 58 }
                    : { x: kx + 28, y: ky - 2, anchor: "start" as const, placeY: ky + 22 };
              return (
                <g key={crack.id} style={{ opacity: op }}>
                  <circle cx={kx} cy={ky} r={14} fill="rgb(245 197 24)" fillOpacity="0.16" style={{ filter: "blur(5px)" }} />
                  <circle cx={kx} cy={ky} r={6} fill="rgb(245 197 24)" stroke="#fff4d4" strokeWidth="1.1" />
                  {isLast && !reduced && (
                    <g style={{ opacity: land }}>
                      <circle cx={kx} cy={ky} r="10" fill="none" stroke="rgb(245 197 24)" strokeWidth="1.4">
                        <animate attributeName="r" values="8;24;8" dur="2.6s" repeatCount="indefinite" />
                        <animate attributeName="opacity" values="0.7;0;0.7" dur="2.6s" repeatCount="indefinite" />
                      </circle>
                    </g>
                  )}
                  <text
                    x={labelPos.x}
                    y={labelPos.y}
                    textAnchor={labelPos.anchor}
                    dominantBaseline="central"
                    style={{
                      fontFamily: "var(--font-sans)",
                      fontSize: "22px",
                      fontWeight: 500,
                      letterSpacing: "-0.01em",
                      fill: "rgb(216 207 199)",
                    }}
                  >
                    {monthYearShort(crack.date)}
                  </text>
                  <text
                    x={labelPos.x}
                    y={labelPos.placeY}
                    textAnchor={labelPos.anchor}
                    dominantBaseline="central"
                    style={{
                      fontFamily: "var(--font-sans)",
                      fontSize: "15px",
                      fontWeight: 500,
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      fill: "rgb(216 207 199)",
                      opacity: 0.55,
                    }}
                  >
                    {crack.label}
                  </text>
                </g>
              );
            })}
          </svg>

          <div
            className="absolute inset-x-0 bottom-[4%] z-20 flex flex-col items-center"
            style={{ opacity: land, transform: `translateY(${lerp(20, 0, land)}px)` }}
          >
            <p className="mb-3 text-xs text-ink-dim sm:text-sm">
              Never lost.{" "}
              <span className="stat-num font-semibold text-ink">{runGames}</span>
              {" "}games.
            </p>
            <p className="text-[11px] font-medium lowercase tracking-[0.14em] text-ink-faint">
              follow the thread
            </p>
            {!reduced && (
              <span aria-hidden className="mt-2 animate-bounce text-base text-devil-bright/80">
                ↓
              </span>
            )}
          </div>

          {!reduced && p < 0.05 && (
            <p className="absolute inset-x-0 bottom-6 z-20 text-center text-[11px] uppercase tracking-[0.22em] text-ink-faint">
              Scroll
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
