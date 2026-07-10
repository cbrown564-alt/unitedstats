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

type FergieTimeKnot = {
  date: string;
  /** The two clocks that completed this comeback. */
  clocks: string;
};

type Props = {
  knots: FergieTimeKnot[];
  axisEndYear: number;
};

function cubicLen(
  p0: [number, number],
  c1: [number, number],
  c2: [number, number],
  p1: [number, number],
): number {
  let length = 0;
  let px = p0[0];
  let py = p0[1];
  for (let i = 1; i <= 16; i++) {
    const t = i / 16;
    const u = 1 - t;
    const x = u * u * u * p0[0] + 3 * u * u * t * c1[0] + 3 * u * t * t * c2[0] + t * t * t * p1[0];
    const y = u * u * u * p0[1] + 3 * u * u * t * c1[1] + 3 * u * t * t * c2[1] + t * t * t * p1[1];
    length += Math.hypot(x - px, y - py);
    px = x;
    py = y;
  }
  return length;
}

/**
 * The fourth chapter's loop. The filament leaves the club timeline at the
 * first 2–1 comeback (1993), circles through Barcelona, then returns at the
 * 2023 echo. The loop holds a clock: this is about the last seconds and a
 * repeated scoreline, not a portrait of one manager.
 */
export function FergieTimeLoop({ knots, axisEndYear }: Props) {
  const { runwayRef, progress, reduced } = useJourneyStage();
  const p = reduced ? 1 : progress;
  const firstYear = Number(knots[0]?.date.slice(0, 4)) || 1993;
  const lastYear = Number(knots[knots.length - 1]?.date.slice(0, 4)) || 2023;
  const departX = AXIS_X0 + clamp01((firstYear - AXIS_START_YEAR) / Math.max(1, axisEndYear - AXIS_START_YEAR)) * (AXIS_X1 - AXIS_X0);
  const returnX = AXIS_X0 + clamp01((lastYear - AXIS_START_YEAR) / Math.max(1, axisEndYear - AXIS_START_YEAR)) * (AXIS_X1 - AXIS_X0);
  const entry = {
    p0: [departX, AXIS_Y] as [number, number],
    c1: [departX - 62, AXIS_Y + 28] as [number, number],
    c2: [POCKET_CX + 104, NECK_Y - 38] as [number, number],
    p1: [POCKET_CX, NECK_Y] as [number, number],
  };
  const exit = {
    p0: [POCKET_CX, NECK_Y] as [number, number],
    c1: [POCKET_CX + 118, NECK_Y - 38] as [number, number],
    c2: [returnX - 74, AXIS_Y + 4] as [number, number],
    p1: [returnX, AXIS_Y] as [number, number],
  };
  const d =
    `M ${AXIS_X0} ${AXIS_Y} L ${departX.toFixed(1)} ${AXIS_Y} ` +
    `C ${entry.c1[0]} ${entry.c1[1]} ${entry.c2[0]} ${entry.c2[1]} ${POCKET_CX} ${NECK_Y} ` +
    `A ${POCKET_R} ${POCKET_R} 0 0 0 ${POCKET_CX} ${POCKET_CY + POCKET_R} ` +
    `A ${POCKET_R} ${POCKET_R} 0 0 0 ${POCKET_CX} ${NECK_Y} ` +
    `C ${exit.c1[0]} ${exit.c1[1]} ${exit.c2[0]} ${exit.c2[1]} ${returnX.toFixed(1)} ${AXIS_Y} ` +
    `L ${AXIS_X1} ${AXIS_Y}`;
  const axisRun = departX - AXIS_X0;
  const total = axisRun + cubicLen(entry.p0, entry.c1, entry.c2, entry.p1) + 2 * Math.PI * POCKET_R + cubicLen(exit.p0, exit.c1, exit.c2, exit.p1) + (AXIS_X1 - returnX);
  const departAt = axisRun / total;
  const knotFracs = [0.25, 0.5, 0.75].map((q) => (axisRun + cubicLen(entry.p0, entry.c1, entry.c2, entry.p1) + q * 2 * Math.PI * POCKET_R) / total);
  const knotXY: [number, number][] = [[POCKET_CX - POCKET_R, POCKET_CY], [POCKET_CX, POCKET_CY + POCKET_R], [POCKET_CX + POCKET_R, POCKET_CY]];
  const awaken = smoothstep(0, 0.14, p);
  const draw = reduced ? 1 : lerp(departAt + 0.03, 1, smoothstep(0.08, 0.68, p));
  const land = reduced ? 1 : smoothstep(0.72, 0.92, p);
  const phase = p < 0.34 ? 0 : p < 0.72 ? 1 : 2;
  const addedSeconds = Math.round(7 * smoothstep(0.36, 0.9, p));
  const boardClock = `90:${String(addedSeconds).padStart(2, "0")}`;
  // This chapter starts with the score, not the name. The reader feels the
  // same last-second turn before learning the thirty-year spread underneath it.
  const headline = ["0–1.", "90+.", "2–1."][phase];
  const sub = [
    "Three nights. Thirty years.",
    "Six goals after the 85th.",
    "1993. 1999. 2023.",
  ][phase];

  return (
    <div ref={runwayRef} data-journey-runway className="relative" style={{ height: reduced ? "100dvh" : "210vh" }}>
      <div className={`${reduced ? "relative" : "sticky top-0"} z-10 h-dvh`} role="img" aria-label="Three 2–1 United comebacks: Sheffield Wednesday in 1993, Bayern Munich in 1999, and Brentford in 2023. Each began 0–1 down and ended with two late United goals.">
        <div className="journey-floodlit full-bleed-viewport relative h-full overflow-hidden">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_-18%,rgba(255,238,210,0.13),transparent_52%)]" aria-hidden />
          <div className="pointer-events-none absolute inset-0" style={{ background: `radial-gradient(72% 58% at 50% 54%, rgba(216,33,13,${reduced ? 0.28 : 0.1 + draw * 0.18}), transparent 68%)` }} aria-hidden />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(130%_120%_at_50%_55%,transparent_30%,rgba(0,0,0,0.8))]" aria-hidden />

          {/* Ferguson is a memory in this chapter, never its proof: the portrait
             sits behind the clock, while the three receipt knots do the arguing. */}
          <div className="pointer-events-none absolute inset-y-0 left-0 z-[1] w-[58%] [mask-image:linear-gradient(to_right,#000,transparent_88%),linear-gradient(to_top,transparent_6%,#000_45%,transparent_94%)]" style={{ opacity: reduced ? 0.22 : 0.08 + awaken * 0.15 }} aria-hidden>
            <Image src="/media/managers/alex-ferguson.webp" alt="" fill priority sizes="(max-width: 640px) 72vw, 58vw" className="object-cover object-[42%_45%] grayscale contrast-125" />
            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(216,33,13,0.65),rgba(216,33,13,0.16),transparent)] mix-blend-color" />
          </div>

          <div className="absolute inset-x-0 top-0 z-20 flex flex-col items-center px-5 pt-10 text-center sm:pt-14 lg:pt-16">
            <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-devil-bright">Red Thread / 04</p>
            <h1 className="mt-5 max-w-4xl text-balance text-[2.1rem] font-semibold leading-[1.04] tracking-tight text-ink sm:text-4xl lg:text-5xl">{headline}</h1>
            <p className="mt-4 max-w-xl text-balance text-sm text-ink-dim sm:text-base">{sub}</p>
          </div>

          <svg className="pointer-events-none absolute inset-0 z-[2] h-full w-full" viewBox={`0 0 ${VB_W} ${VB_H}`} preserveAspectRatio="xMidYMid meet" aria-hidden>
            <defs>
              <linearGradient id="fergie-time-filament" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="rgb(255 59 31)" stopOpacity="0.9" />
                <stop offset="48%" stopColor="rgb(255 210 120)" stopOpacity="1" />
                <stop offset="100%" stopColor="rgb(255 59 31)" stopOpacity="0.9" />
              </linearGradient>
              <filter id="fergie-time-soft" x="-50%" y="-60%" width="200%" height="220%"><feGaussianBlur stdDeviation="16" /></filter>
            </defs>
            <path d={`M ${AXIS_X0} ${AXIS_Y} L ${AXIS_X1} ${AXIS_Y}`} fill="none" stroke="var(--color-ink)" strokeOpacity={0.1 + awaken * 0.08} strokeWidth="1" />
            <text x={AXIS_X0} y={AXIS_Y - 14} textAnchor="start" fill="var(--color-ink-faint)" style={{ fontSize: 12, letterSpacing: "0.14em" }}>1886</text>
            <text x={AXIS_X1} y={AXIS_Y - 14} textAnchor="end" fill="var(--color-ink-faint)" style={{ fontSize: 12, letterSpacing: "0.14em" }}>NOW</text>
            <path d={d} fill="none" stroke="rgb(255 59 31)" strokeOpacity="0.3" strokeWidth="18" filter="url(#fergie-time-soft)" />
            <path d={d} fill="none" stroke="url(#fergie-time-filament)" strokeWidth="3.5" strokeLinecap="round" pathLength="1" strokeDasharray="1" strokeDashoffset={1 - draw} />
            <g opacity={awaken}>
              <circle cx={POCKET_CX} cy={POCKET_CY} r={139} fill="rgb(10 7 6)" fillOpacity="0.9" />
              <circle cx={POCKET_CX} cy={POCKET_CY} r={139} fill="none" stroke="rgb(255 59 31)" strokeOpacity="0.7" strokeWidth="2" />
              <text x={POCKET_CX} y={POCKET_CY - 28} textAnchor="middle" fill="rgb(255 59 31)" style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.28em" }}>ADDED TIME</text>
              <text x={POCKET_CX} y={POCKET_CY + 17} textAnchor="middle" fill="var(--color-ink)" style={{ fontSize: 47, fontWeight: 700, letterSpacing: "-0.08em" }}>{boardClock}</text>
              <text x={POCKET_CX} y={POCKET_CY + 46} textAnchor="middle" fill="rgb(245 197 24)" style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.22em" }}>FERGIE TIME</text>
            </g>
            {knots.slice(0, 3).map((knot, i) => {
              const arrived = reduced ? 1 : smoothstep(knotFracs[i] - 0.025, knotFracs[i] + 0.025, draw);
              const [x, y] = knotXY[i];
              return <g key={knot.date} opacity={arrived}>
                <circle cx={x} cy={y} r={16} fill="rgb(255 210 120)" opacity="0.12" />
                <circle cx={x} cy={y} r={6.5} fill="rgb(255 210 120)" />
                <text x={x} y={y + (i === 1 ? 37 : 31)} textAnchor="middle" fill="var(--color-ink)" style={{ fontSize: 15, fontWeight: 600 }}>{knot.date.slice(0, 4)}</text>
              </g>;
            })}
          </svg>
          <div className="absolute inset-x-0 bottom-8 z-20 flex flex-col items-center px-5 text-center sm:bottom-10">
            <p className="text-xs text-ink-dim">The last one came a decade after Ferguson left.</p>
            {!reduced && <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.22em] text-ink-faint">Follow the thread ↓</p>}
            {land > 0.8 && <p className="mt-4 text-xs text-gold/85">Each scoreline returned 2–1.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
