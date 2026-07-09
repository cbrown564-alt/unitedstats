"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { familyName } from "@/lib/names";

function clamp01(t: number): number {
  return Math.min(1, Math.max(0, t));
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

const VB_W = 1000;
const VB_H = 700;
const LOOP_X = 500; // shared No. 7 monument — the thread loops through here
const LOOP_Y = 296;

/**
 * The looping filament — one continuous thread that leaves Best's knot, loops
 * a full circle *through* the shared No. 7, and returns to Ronaldo's knot. The
 * loop is the device that makes "history loops back" read in one pass.
 */
function buildFilament(
  ax: number,
  ay: number,
  bx: number,
  by: number,
  loopR: number,
) {
  // Neck of the loop — the two strands run close here, like a slipknot returning
  // on itself. Slight horizontal offset so the loop reads as a curl, not a ring.
  const neckX = LOOP_X - loopR * 0.18;
  const neckY = LOOP_Y - loopR;
  // A gentle organic bow on the outer runs so it isn't a dead-straight chord.
  const bow = lerp(26, 8, clamp01(loopR / 140));

  const d =
    `M ${ax.toFixed(1)} ${ay.toFixed(1)} ` +
    `C ${lerp(ax, neckX, 0.35).toFixed(1)} ${(ay - bow).toFixed(1)} ` +
    `${lerp(neckX, ax, 0.4).toFixed(1)} ${(neckY + bow * 0.4).toFixed(1)} ${neckX.toFixed(1)} ${neckY.toFixed(1)} ` +
    // Full circle around the monument = the loop that returns on itself.
    `A ${loopR.toFixed(1)} ${loopR.toFixed(1)} 0 1 1 ${neckX.toFixed(1)} ${neckY.toFixed(1)} ` +
    `C ${lerp(neckX, bx, 0.4).toFixed(1)} ${(neckY + bow * 0.4).toFixed(1)} ` +
    `${lerp(bx, neckX, 0.35).toFixed(1)} ${(by - bow).toFixed(1)} ${bx.toFixed(1)} ${by.toFixed(1)}`;

  return { d };
}

const SLIP_R = 16;

export type RhymeMorphSide = {
  id: string;
  name: string;
  peakYear: number;
  peakSeason: string;
  peakGoals: number;
  peakGames: number;
};

type Props = {
  a: RhymeMorphSide;
  b: RhymeMorphSide;
  compareHref: string;
};

/**
 * Immersive scroll chapter: Best ↔ Ronaldo as a floodlit, chrome-free stage.
 *
 * A shared No. 7 monument; two ghosted peak years on the wings; and a luminous
 * filament that loops history so the peaks touch. Type + light + thread — no
 * chart chrome. See docs/JOURNEY.md.
 */
export function RhymeMorph({ a, b, compareHref }: Props) {
  const runwayRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [reduced, setReduced] = useState(false);

  // Chrome-free route: hand the whole screen to the stage while mounted.
  useEffect(() => {
    const prev = document.documentElement.dataset.chrome;
    document.documentElement.dataset.chrome = "off";
    return () => {
      if (prev) document.documentElement.dataset.chrome = prev;
      else delete document.documentElement.dataset.chrome;
    };
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduced(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    if (reduced) return;
    const el = runwayRef.current;
    if (!el) return;

    let raf = 0;
    const compute = () => {
      raf = 0;
      const rect = el.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      if (total <= 0) {
        setProgress(1);
        return;
      }
      setProgress(clamp01(-rect.top / total));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(compute);
    };
    compute();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [reduced]);

  const p = reduced ? 1 : progress;

  // Phase windows — land is pulled late so the tail *is* the door, not dead scroll.
  const awaken = smoothstep(0, 0.14, p);
  const loopDraw = reduced ? 1 : smoothstep(0.12, 0.52, p);
  const collapse = reduced ? 0 : smoothstep(0.44, 0.74, p);
  const land = reduced ? 1 : smoothstep(0.7, 0.92, p);
  const beforeLand = 1 - land;

  const aName = familyName(a.name);
  const bName = familyName(b.name);

  // Knots slide from the wings toward the shared No. 7 as the years collapse in.
  const knotAX = lerp(225, 452, collapse);
  const knotBX = lerp(775, 548, collapse);
  const knotY = lerp(440, 320, collapse);
  const loopR = lerp(132, 30, collapse);
  const slipR = lerp(SLIP_R, 13, land);
  const { d: loopPath } = buildFilament(knotAX, knotY, knotBX, knotY, loopR);

  // Ghost years ride with their knots (same coordinate system → they always align).
  // They're fully gone before the knots converge, so mobile never stacks "19088".
  const yearFade = reduced ? 1 : 1 - smoothstep(0.42, 0.55, p);
  const yearsOpacity = reduced ? 0.16 : beforeLand * yearFade * (0.5 + awaken * 0.5);

  const sevenOpacity = reduced ? 0.12 : 0.06 + awaken * 0.05 + loopDraw * 0.05 + land * 0.04;
  const sevenScale = lerp(1, 0.86, land);

  // Copy: opener teases, middle raises the question, then we set up the career
  // index before the reveal lands — and make the 32/42 gap honest.
  const line =
    p < 0.22
      ? "Same shirt. Same number."
      : p < 0.46
        ? "Two peaks. One shape."
        : p < 0.7
          ? "Counted from his debut, each man's fifth year was his best."
          : "Both peaked in season five.";

  const sub =
    p < 0.22
      ? "Two No. 7s, forty years apart at opposite ends of United's story."
      : p < 0.46
        ? "The years don't match — but something does."
        : p < 0.7
          ? "A career step, not a calendar year. The same step, a generation apart."
          : `32 in ${a.peakGames} games. 42 in ${b.peakGames}. Different eras, same step.`;

  return (
    <div ref={runwayRef} data-journey-runway className="relative" style={{ height: reduced ? "100dvh" : "360vh" }}>
      <div
        className={`${reduced ? "relative" : "sticky top-0"} z-10 h-dvh`}
        role="img"
        aria-label={`${a.name} and ${b.name}: both peaked in their fifth United season, ${a.peakYear} and ${b.peakYear}. ${a.peakGoals} in ${a.peakGames} games; ${b.peakGoals} in ${b.peakGames} games.`}
      >
        <div className="full-bleed-viewport relative h-full overflow-hidden bg-pitch">
          {/* Atmosphere */}
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_-18%,rgba(255,238,210,0.13),transparent_52%)]"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background: `radial-gradient(70% 55% at 50% 40%, rgba(216,33,13,${reduced ? 0.22 : 0.1 + loopDraw * 0.2}), transparent 68%)`,
            }}
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(130%_120%_at_50%_55%,transparent_30%,rgba(0,0,0,0.8))]"
            aria-hidden
          />

          {/* Stage copy — narrative column, kept clear of the visual core */}
          <div className="absolute inset-x-0 top-0 z-20 flex flex-col items-center px-5 pt-10 text-center sm:pt-14 lg:pt-16">
            <p data-journey-phase className="text-[11px] font-semibold uppercase tracking-[0.32em] text-devil-bright">
              Journey
            </p>
            <h1 className="mt-5 max-w-3xl text-balance text-[2.1rem] font-semibold leading-[1.04] tracking-tight text-ink sm:text-4xl lg:text-5xl">
              {line}
            </h1>
            <p className="mt-4 max-w-xl text-balance text-sm text-ink-dim sm:text-base">{sub}</p>
          </div>

          {/* The visualization — single coordinate system for thread, years, names */}
          <svg
            className="pointer-events-none absolute inset-0 z-[2] h-full w-full"
            viewBox={`0 0 ${VB_W} ${VB_H}`}
            preserveAspectRatio="xMidYMid meet"
            aria-hidden
          >
            <defs>
              {/* Thread gradient — red body, brightening to a gold core at the loop. */}
              <linearGradient id="journey-filament" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="rgb(255 59 31)" stopOpacity="0.9" />
                <stop offset="30%" stopColor="rgb(255 80 40)" stopOpacity="1" />
                <stop offset="50%" stopColor="rgb(255 210 120)" stopOpacity="1" />
                <stop offset="70%" stopColor="rgb(255 80 40)" stopOpacity="1" />
                <stop offset="100%" stopColor="rgb(255 59 31)" stopOpacity="0.9" />
              </linearGradient>
              <filter id="journey-glow" x="-40%" y="-80%" width="180%" height="260%">
                <feGaussianBlur stdDeviation="4" result="b" />
                <feMerge>
                  <feMergeNode in="b" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <filter id="journey-soft" x="-50%" y="-60%" width="200%" height="220%">
                <feGaussianBlur stdDeviation="16" />
              </filter>
              <filter id="journey-yearglow" x="-60%" y="-60%" width="220%" height="220%">
                <feGaussianBlur stdDeviation="10" />
              </filter>
            </defs>

            {/* Shared No. 7 — the monument the thread loops through */}
            <text
              x={LOOP_X}
              y={LOOP_Y}
              textAnchor="middle"
              dominantBaseline="central"
              className="display"
              style={{
                opacity: sevenOpacity,
                transform: `translate(0, 0) scale(${sevenScale})`,
                transformOrigin: `${LOOP_X}px ${LOOP_Y}px`,
                fontSize: "300px",
                fill: "rgb(255 59 31)",
                filter: "blur(0.5px)",
              }}
            >
              7
            </text>

            {/* Soft bloom under the whole drawn thread */}
            <path
              d={loopPath}
              fill="none"
              stroke="rgb(255 59 31)"
              strokeWidth="26"
              strokeLinecap="round"
              strokeLinejoin="round"
              pathLength={1}
              strokeDasharray={1}
              strokeDashoffset={1 - loopDraw}
              opacity={loopDraw * 0.2}
              filter="url(#journey-soft)"
            />
            {/* Glow underlay */}
            <path
              d={loopPath}
              fill="none"
              stroke="rgb(255 90 50)"
              strokeOpacity={0.5 * loopDraw}
              strokeWidth="6"
              strokeLinecap="round"
              strokeLinejoin="round"
              pathLength={1}
              strokeDasharray={1}
              strokeDashoffset={1 - loopDraw}
              style={{ filter: "blur(3px)" }}
            />
            {/* Living filament — the hero mark */}
            <path
              d={loopPath}
              fill="none"
              stroke="url(#journey-filament)"
              strokeWidth="2.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              pathLength={1}
              strokeDasharray={1}
              strokeDashoffset={1 - loopDraw}
              opacity={lerp(0, 1, loopDraw)}
            />

            {/* Ghosted peak years — warm off-white, luminous (not muddy gold) */}
            {[a, b].map((side, i) => {
              const kx = i === 0 ? knotAX : knotBX;
              return (
                <g key={side.id} style={{ opacity: yearsOpacity }}>
                  <text
                    x={kx}
                    y={knotY}
                    textAnchor="middle"
                    dominantBaseline="central"
                    className="stat-num"
                    style={{
                      fontSize: "190px",
                      fontWeight: 700,
                      fill: "rgb(243 237 232)",
                      filter: "url(#journey-yearglow)",
                    }}
                  >
                    {side.peakYear}
                  </text>
                  <text
                    x={kx}
                    y={knotY + 116}
                    textAnchor="middle"
                    dominantBaseline="central"
                    className="display"
                    style={{
                      fontSize: "44px",
                      fontWeight: 600,
                      letterSpacing: "0.01em",
                      fill: "rgb(243 237 232)",
                    }}
                  >
                    {i === 0 ? aName : bName}
                  </text>
                </g>
              );
            })}

            {/* Knot beads — quiet white ties, so the thread stays the hero */}
            {[knotAX, knotBX].map((kx, i) => (
              <g key={i} opacity={lerp(0.5, 1, loopDraw)}>
                <circle cx={kx} cy={knotY} r={slipR * 1.6} fill="rgb(255 255 255)" fillOpacity="0.1" style={{ filter: "blur(5px)" }} />
                <circle cx={kx} cy={knotY} r={slipR} fill="none" stroke="rgb(255 255 255)" strokeOpacity="0.6" strokeWidth="1.3" />
                <circle cx={kx} cy={knotY} r="2.4" fill="#fff4d4" />
              </g>
            ))}

            {/* Shared rhyme knot at the monument — the gold accent, with a pulse */}
            <g style={{ opacity: land }}>
              <circle
                cx={LOOP_X}
                cy={LOOP_Y}
                r={lerp(8, 16, land)}
                fill="rgb(245 197 24)"
                fillOpacity="0.18"
                style={reduced ? undefined : { filter: "url(#journey-glow)" }}
              />
              <circle cx={LOOP_X} cy={LOOP_Y} r={lerp(4, 7, land)} fill="rgb(245 197 24)" stroke="#fff4d4" strokeWidth="1.1" />
              {!reduced && (
                <circle cx={LOOP_X} cy={LOOP_Y} r="10" fill="none" stroke="rgb(245 197 24)" strokeWidth="1.4">
                  <animate attributeName="r" values="8;26;8" dur="2.6s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.7;0;0.7" dur="2.6s" repeatCount="indefinite" />
                </circle>
              )}
            </g>
          </svg>

          {/* Landed rhyme — the climax, with the door into the living product */}
          <div
            className="absolute inset-x-0 bottom-[6%] z-20 sm:bottom-[8%]"
            style={{
              opacity: land,
              transform: `translateY(${lerp(36, 0, land)}px)`,
            }}
          >
            <div className="mx-auto max-w-2xl px-5 text-center">
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-gold">Fifth season</p>
              <div className="mt-5 flex items-end justify-center gap-12 sm:gap-20">
                <div>
                  <p className="stat-num text-5xl font-bold leading-none text-ink sm:text-7xl">{a.peakGoals}</p>
                  <p className="mt-3 text-sm font-medium text-ink sm:text-base">{aName}</p>
                  <p className="stat-num mt-1 text-xs text-ink-faint">{a.peakSeason}</p>
                </div>
                <div>
                  <p className="stat-num text-5xl font-bold leading-none text-ink sm:text-7xl">{b.peakGoals}</p>
                  <p className="mt-3 text-sm font-medium text-ink sm:text-base">{bName}</p>
                  <p className="stat-num mt-1 text-xs text-ink-faint">{b.peakSeason}</p>
                </div>
              </div>
              <p className="mx-auto mt-7 max-w-md text-balance text-sm leading-relaxed text-ink-dim sm:text-base">
                The most United goals either scored in a season — on the same step of the career,
                forty years apart.
              </p>
              <div className="mt-7 flex flex-col items-center gap-4">
                <Link
                  href={compareHref}
                  className="inline-flex items-center gap-2 rounded-full border border-devil-bright/60 bg-devil/15 px-6 py-3 text-sm font-semibold text-ink shadow-[0_0_30px_-6px_rgba(255,59,31,0.6)] transition hover:border-devil-bright hover:bg-devil/25 focus-ring"
                >
                  Open the full duel →
                </Link>
                <Link
                  href="/explore"
                  className="text-xs font-medium uppercase tracking-[0.18em] text-ink-faint transition hover:text-devil-bright focus-ring"
                >
                  Next chapter: what else rhymes? →
                </Link>
              </div>
            </div>
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
