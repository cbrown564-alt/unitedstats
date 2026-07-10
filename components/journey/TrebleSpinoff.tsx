"use client";

import Image from "next/image";
import { useJourneyStage } from "./useJourneyStage";
import { clamp01, lerp, smoothstep } from "./stageMath";

const VB_W = 1000;
const VB_H = 700;

// The club timeline — §2's constant anchor. A single faint line, two wing
// labels, no ticks (tick marks are the dashboard register the journey refuses).
const AXIS_Y = 168;
const AXIS_X0 = 70;
const AXIS_X1 = 930;
const AXIS_START_YEAR = 1886;

// The pocket the thread spins into — centred on the ghost "99" monument, high
// enough that the south knot's date label clears the hand-off at the stage foot.
const POCKET_CX = 500;
const POCKET_CY = 402;
const POCKET_R = 150;
const NECK_Y = POCKET_CY - POCKET_R;

const NUM_WORDS = [
  "zero", "one", "two", "three", "four", "five", "six", "seven", "eight",
  "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen",
];
const MONTHS = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function numWord(n: number, capitalize = false): string {
  const w = NUM_WORDS[n] ?? String(n);
  return capitalize ? w.charAt(0).toUpperCase() + w.slice(1) : w;
}

/** "1999-05-16" → "16 May". */
function dayLabel(date: string): string {
  return `${Number(date.slice(8, 10))} ${MONTHS[Number(date.slice(5, 7))]}`;
}

/** "1999-05-22" → "the 22nd". */
function dayOrdinal(date: string): string {
  const n = Number(date.slice(8, 10));
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return `the ${n}${s[(v - 20) % 10] ?? s[v] ?? s[0]}`;
}

/** Approximate cubic-bezier arc length by sampling — plenty for reveal timing. */
function cubicLen(
  p0: [number, number], c1: [number, number], c2: [number, number], p1: [number, number],
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

export type TrebleDecider = {
  id: string;
  /** ISO date — supplies the knot's day label and the eleven-day span. */
  date: string;
  /** Competition name, already shortened for stage copy (e.g. "Champions League"). */
  competition: string;
  /** Ground that hosted the night — place monument label (Old Trafford · Wembley · Camp Nou). */
  place: string;
};

export type TreblePlaceMonument = {
  /** Matches {@link TrebleDecider.place}. */
  label: string;
  imageSrc: string;
  /** CSS object-position for the treated still. */
  objectPosition?: string;
};

type Props = {
  /** Season label, e.g. "1998–99". */
  seasonLabel: string;
  /** Official games played that season — the phase-one measure. */
  games: number;
  /** The three deciders, oldest first. */
  deciders: TrebleDecider[];
  /** Right end of the club timeline (the current year); rendered as "now". */
  axisEndYear: number;
  /** Place monuments — Old Trafford · Wembley · Camp Nou — keyed by label. */
  places: TreblePlaceMonument[];
  /** Unbeaten tail length absorbed as a morph foot-fact (no dedicated spine beat). */
  unbeatenGames: number;
};

/**
 * Beat 0 of the Treble chapter — the **spin-off**, the journey's second metaphor
 * verb (docs/JOURNEY.md §2, §4b). The club timeline runs as one faint line;
 * at May '99 the filament leaves the axis, coils a pocket around the ghost "99",
 * and three gold knots land in date order — the 16th, the 22nd, the 26th —
 * before the thread returns to the line. Place monuments (licensed Commons
 * stills) dissolve into the floodlights with each knot. Same skeleton as
 * RhymeMorph: scroll owns time, reduced motion lands the finished composition.
 */
export function TrebleSpinoff({
  seasonLabel,
  games,
  deciders,
  axisEndYear,
  places,
  unbeatenGames,
}: Props) {
  const { runwayRef, progress, reduced } = useJourneyStage();
  const p = reduced ? 1 : progress;

  const departYear = Number(deciders[0]?.date.slice(0, 4)) || 1999;
  const spanDays =
    deciders.length >= 2
      ? Math.round(
          (Date.parse(deciders[deciders.length - 1].date) - Date.parse(deciders[0].date)) / 86_400_000,
        ) + 1
      : 1;

  const placeByLabel = new Map(places.map((pl) => [pl.label, pl]));

  // The departure knot sits at the season's true position on the club timeline.
  const departFrac = clamp01((departYear - AXIS_START_YEAR) / Math.max(1, axisEndYear - AXIS_START_YEAR));
  const departX = AXIS_X0 + departFrac * (AXIS_X1 - AXIS_X0);
  const returnX = departX + 40;

  // One continuous filament: along the axis, swoop into the pocket, full circle
  // (two semicircle arcs — a single arc whose start equals its end is dropped by
  // the SVG spec), swoop back out, and on toward "now". The entry sags low and
  // the exit runs flat, so the two strands read as an open V between the axis
  // and the neck instead of doubling into one bright line.
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

  // Reveal timing: where along the filament each landmark sits, so the knots
  // land exactly as the drawn tip reaches them (counter-clockwise from the neck:
  // west quarter → south half → east three-quarters).
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

  // Phase windows. First frame already shows the thread dipping off the axis at
  // '99, so the scene reads as a departure before anyone scrolls.
  const awaken = smoothstep(0, 0.14, p);
  const draw = reduced ? 1 : lerp(departAt + 0.03, 1, smoothstep(0.08, 0.66, p));
  const land = reduced ? 1 : smoothstep(0.72, 0.92, p);

  const ninetyNineOpacity = reduced ? 0.13 : 0.05 + awaken * 0.04 + draw * 0.04 + land * 0.03;
  const axisOpacity = 0.08 + awaken * 0.1;
  // Place stills stay atmospheric — never compete with the filament or type.
  const placeBase = reduced ? 0.22 : 0.06 + awaken * 0.08;

  // Copy: season and size, then the window (the sub names the dates as their
  // knots land), then the haul. Facts only — the beats below carry the rhyme,
  // the comeback, and the teamsheet.
  const line =
    p < 0.34
      ? `${seasonLabel}.`
      : p < 0.72
        ? `The last ${numWord(spanDays)} days.`
        : `${numWord(deciders.length, true)} trophies.`;
  const sub =
    p < 0.34
      ? `${games} games.`
      : p < 0.72
        ? deciders.map((x) => `${dayOrdinal(x.date).replace(/^t/, "T")}.`).join(" ")
        : deciders.map((x) => x.competition).join(". ") + ".";

  const dayLabels = deciders.map((x) => dayLabel(x.date));
  const placeLabels = deciders.map((x) => x.place).join(", ");

  // HTML place panels — left / bottom / right — dissolve in with their knots.
  // Same treated-monument register as chapter 1's portraits (grayscale + red wash).
  const placePanels: {
    side: "left" | "bottom" | "right";
    decider: TrebleDecider | undefined;
    knotIndex: number;
    className: string;
  }[] = [
    {
      side: "left",
      decider: deciders[0],
      knotIndex: 0,
      className:
        "pointer-events-none absolute inset-y-[18%] left-0 z-[1] w-[46%] [mask-image:linear-gradient(to_right,#000,transparent_90%),linear-gradient(to_top,transparent_8%,#000_45%,transparent_100%)] sm:w-[38%]",
    },
    {
      side: "bottom",
      decider: deciders[1],
      knotIndex: 1,
      className:
        "pointer-events-none absolute bottom-0 left-1/2 z-[1] h-[42%] w-[70%] max-w-xl -translate-x-1/2 [mask-image:linear-gradient(to_top,#000,transparent_88%),linear-gradient(to_right,transparent_6%,#000_40%,#000_60%,transparent_94%)] sm:h-[38%] sm:w-[48%]",
    },
    {
      side: "right",
      decider: deciders[2],
      knotIndex: 2,
      className:
        "pointer-events-none absolute inset-y-[18%] right-0 z-[1] w-[46%] [mask-image:linear-gradient(to_left,#000,transparent_90%),linear-gradient(to_top,transparent_8%,#000_45%,transparent_100%)] sm:w-[38%]",
    },
  ];

  return (
    <div ref={runwayRef} data-journey-runway className="relative" style={{ height: reduced ? "100dvh" : "210vh" }}>
      <div
        className={`${reduced ? "relative" : "sticky top-0"} z-10 h-dvh`}
        role="img"
        aria-label={`The ${seasonLabel} season: ${games} games, ending with ${numWord(deciders.length)} trophies in ${numWord(spanDays)} days at ${placeLabels} — ${dayLabels.join(", ")} ${departYear}.`}
      >
        <div className="journey-floodlit full-bleed-viewport relative h-full overflow-hidden">
          {/* Atmosphere — same floodlit register as the chapter-one stage */}
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

          {/* Place monuments — three grounds dissolve into the floodlights as
             their knots land. Atmosphere, not match photography. */}
          {placePanels.map((panel) => {
            const dec = panel.decider;
            if (!dec) return null;
            const monument = placeByLabel.get(dec.place);
            if (!monument) return null;
            const f = knotFracs[panel.knotIndex];
            const op = reduced
              ? placeBase
              : placeBase + smoothstep(f - 0.02, f + 0.08, draw) * 0.16 + land * 0.04;
            const wash =
              panel.side === "left"
                ? "bg-[linear-gradient(to_right,rgba(216,33,13,0.72),rgba(216,33,13,0.14),transparent)]"
                : panel.side === "right"
                  ? "bg-[linear-gradient(to_left,rgba(216,33,13,0.72),rgba(216,33,13,0.14),transparent)]"
                  : "bg-[linear-gradient(to_top,rgba(216,33,13,0.55),rgba(216,33,13,0.12),transparent)]";
            return (
              <div key={dec.id} className={panel.className} style={{ opacity: op }} aria-hidden>
                <Image
                  src={monument.imageSrc}
                  alt=""
                  fill
                  priority={panel.knotIndex === 0}
                  sizes="(max-width: 640px) 46vw, 38vw"
                  className="object-cover grayscale contrast-125"
                  style={{ objectPosition: monument.objectPosition ?? "50% 45%" }}
                />
                <div className={`absolute inset-0 ${wash} mix-blend-color`} />
              </div>
            );
          })}

          {/* Stage copy — narrative column, kept clear of the visual core */}
          <div className="absolute inset-x-0 top-0 z-20 flex flex-col items-center px-5 pt-10 text-center sm:pt-14 lg:pt-16">
            <p data-journey-phase className="text-[11px] font-semibold uppercase tracking-[0.32em] text-devil-bright">
              Red Thread / 02
            </p>
            <h1 className="mt-5 max-w-3xl text-balance text-[2.1rem] font-semibold leading-[1.04] tracking-tight text-ink sm:text-4xl lg:text-5xl">
              {line}
            </h1>
            <p className="mt-4 max-w-xl text-balance text-sm text-ink-dim sm:text-base">{sub}</p>
          </div>

          {/* The visualization — one coordinate system for axis, pocket, knots */}
          <svg
            className="pointer-events-none absolute inset-0 z-[2] h-full w-full"
            viewBox={`0 0 ${VB_W} ${VB_H}`}
            preserveAspectRatio="xMidYMid meet"
            aria-hidden
          >
            <defs>
              {/* Thread gradient — red body brightening to a gold core at the pocket. */}
              <linearGradient id="treble-filament" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="rgb(255 59 31)" stopOpacity="0.9" />
                <stop offset="30%" stopColor="rgb(255 80 40)" stopOpacity="1" />
                <stop offset="50%" stopColor="rgb(255 210 120)" stopOpacity="1" />
                <stop offset="70%" stopColor="rgb(255 80 40)" stopOpacity="1" />
                <stop offset="100%" stopColor="rgb(255 59 31)" stopOpacity="0.9" />
              </linearGradient>
              <filter id="treble-glow" x="-40%" y="-80%" width="180%" height="260%">
                <feGaussianBlur stdDeviation="4" result="b" />
                <feMerge>
                  <feMergeNode in="b" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <filter id="treble-soft" x="-50%" y="-60%" width="200%" height="220%">
                <feGaussianBlur stdDeviation="16" />
              </filter>
            </defs>

            {/* Ghost "99" — the monument the pocket coils around */}
            <text
              x={POCKET_CX}
              y={POCKET_CY + 10}
              textAnchor="middle"
              dominantBaseline="central"
              className="display"
              style={{
                opacity: ninetyNineOpacity,
                transform: `scale(${lerp(1, 0.92, land)})`,
                transformOrigin: `${POCKET_CX}px ${POCKET_CY}px`,
                fontSize: "270px",
                fill: "rgb(255 59 31)",
                filter: "blur(0.5px)",
              }}
            >
              {seasonLabel.slice(-2)}
            </text>

            {/* The club timeline, always underneath the living thread */}
            <line
              x1={AXIS_X0}
              y1={AXIS_Y}
              x2={AXIS_X1}
              y2={AXIS_Y}
              stroke="rgb(255 90 50)"
              strokeOpacity={axisOpacity}
              strokeWidth="1.4"
            />
            {/* Wing labels — 1886 → now, the anchor the pocket departs from */}
            <g style={{ opacity: 0.2 + awaken * 0.35 }}>
              <text x={AXIS_X0} y={AXIS_Y - 22} textAnchor="start" className="stat-num" style={{ fontSize: "24px", fontWeight: 600, fill: "rgb(216 207 199)" }}>
                {AXIS_START_YEAR}
              </text>
              <text
                x={AXIS_X1}
                y={AXIS_Y - 22}
                textAnchor="end"
                style={{ fontFamily: "var(--font-sans)", fontSize: "22px", fontWeight: 500, letterSpacing: "0.04em", fill: "rgb(216 207 199)" }}
              >
                now
              </text>
            </g>
            {/* The departure year, crisp above its knot */}
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
              {departYear}
            </text>

            {/* Soft bloom under the whole drawn thread */}
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
              filter="url(#treble-soft)"
            />
            {/* Glow underlay */}
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
            {/* Living filament — the hero mark */}
            <path
              d={d}
              fill="none"
              stroke="url(#treble-filament)"
              strokeWidth="3.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              pathLength={1}
              strokeDasharray={1}
              strokeDashoffset={1 - draw}
              opacity={lerp(0.5, 1, draw)}
            />

            {/* Departure knot — the quiet white tie where the thread leaves the line */}
            <g opacity={lerp(0.5, 1, awaken)}>
              <circle cx={departX} cy={AXIS_Y} r={22} fill="rgb(255 255 255)" fillOpacity="0.09" style={{ filter: "blur(5px)" }} />
              <circle cx={departX} cy={AXIS_Y} r={13} fill="none" stroke="rgb(255 255 255)" strokeOpacity="0.55" strokeWidth="1.3" />
              <circle cx={departX} cy={AXIS_Y} r="2.4" fill="#fff4d4" />
            </g>

            {/* Three gold knots — the trophies, landing in date order as the
               filament tip passes them. Gold stays reserved for the payoff.
               Place name sits under the date so the pocket reads as three nights
               in three grounds. */}
            {deciders.slice(0, 3).map((dec, i) => {
              const [kx, ky] = knotXY[i];
              const f = knotFracs[i];
              const op = reduced ? 1 : smoothstep(f - 0.01, f + 0.03, draw);
              const isLast = i === Math.min(deciders.length, 3) - 1;
              const labelPos =
                i === 0
                  ? { x: kx - 28, y: ky - 2, anchor: "end" as const, placeY: ky + 22 }
                  : i === 1
                    ? { x: kx, y: ky + 36, anchor: "middle" as const, placeY: ky + 58 }
                    : { x: kx + 28, y: ky - 2, anchor: "start" as const, placeY: ky + 22 };
              return (
                <g key={dec.id} style={{ opacity: op }}>
                  <circle cx={kx} cy={ky} r={14} fill="rgb(245 197 24)" fillOpacity="0.16" style={{ filter: "blur(5px)" }} />
                  <circle cx={kx} cy={ky} r={6} fill="rgb(245 197 24)" stroke="#fff4d4" strokeWidth="1.1" />
                  {isLast && !reduced && (
                    /* CSS opacity on the group gates the pulse until the landing
                       phase — the SMIL animate would override an attribute. */
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
                    style={{ fontFamily: "var(--font-sans)", fontSize: "24px", fontWeight: 500, letterSpacing: "-0.01em", fill: "rgb(216 207 199)" }}
                  >
                    {dayLabel(dec.date)}
                  </text>
                  <text
                    x={labelPos.x}
                    y={labelPos.placeY}
                    textAnchor={labelPos.anchor}
                    dominantBaseline="central"
                    style={{
                      fontFamily: "var(--font-sans)",
                      fontSize: "16px",
                      fontWeight: 500,
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      fill: "rgb(216 207 199)",
                      opacity: 0.55,
                    }}
                  >
                    {dec.place}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* The hand-off: the pocket resolves; unbeaten run is a foot-fact, then
             the thread runs on into the bench rhyme below. */}
          <div
            className="absolute inset-x-0 bottom-[4%] z-20 flex flex-col items-center"
            style={{ opacity: land, transform: `translateY(${lerp(20, 0, land)}px)` }}
          >
            <p className="mb-3 text-xs text-ink-dim sm:text-sm">
              <span className="stat-num font-semibold text-ink">{unbeatenGames}</span>
              {" "}without defeat.
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
