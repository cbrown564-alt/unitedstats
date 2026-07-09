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

/** Cubic bezier point. */
function bez(
  t: number,
  p0: { x: number; y: number },
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  p3: { x: number; y: number },
): { x: number; y: number } {
  const u = 1 - t;
  const uu = u * u;
  const tt = t * t;
  return {
    x: uu * u * p0.x + 3 * uu * t * p1.x + 3 * u * tt * p2.x + tt * t * p3.x,
    y: uu * u * p0.y + 3 * uu * t * p1.y + 3 * u * tt * p2.y + tt * t * p3.y,
  };
}

/**
 * Organic looping filament — TonightHero's swaying cord, turned horizontal.
 * One continuous stroke: slipknot at A → slack arc → slipknot at B. A soft
 * perpendicular sway keeps it from reading as a chart curve.
 */
function buildFilament(ax: number, ay: number, bx: number, by: number, apexY: number, collapse: number, slipR: number) {
  const c1 = { x: lerp(ax + (bx - ax) * 0.22, ax + 40, collapse), y: apexY };
  const c2 = { x: lerp(ax + (bx - ax) * 0.78, bx - 40, collapse), y: apexY };
  const p0 = { x: ax, y: ay };
  const p3 = { x: bx, y: by };

  const amp = lerp(34, 10, collapse);
  const samples: { x: number; y: number }[] = [];
  const N = 56;
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const p = bez(t, p0, c1, c2, p3);
    const t2 = Math.min(1, t + 0.02);
    const q = bez(t2, p0, c1, c2, p3);
    const dx = q.x - p.x;
    const dy = q.y - p.y;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    const envelope = Math.sin(t * Math.PI);
    // Two harmonics — a slow sag plus a quicker flutter, like a slack cord.
    const sway = amp * envelope * (0.72 * Math.sin(t * Math.PI * 2.2 + 0.35) + 0.28 * Math.sin(t * Math.PI * 5.1 + 1.1));
    samples.push({ x: p.x + nx * sway, y: p.y + ny * sway });
  }

  const a0 = samples[0];
  const b0 = samples[samples.length - 1];

  // Continuous filament (TonightHero pattern): enter at A's loop top, tie a full
  // circle, run on through the middle along the sway, then tie B's loop.
  let d = `M ${(a0.x).toFixed(1)} ${(a0.y - slipR).toFixed(1)}`;
  d += ` A ${slipR} ${slipR} 0 0 1 ${(a0.x).toFixed(1)} ${(a0.y + slipR).toFixed(1)}`;
  d += ` A ${slipR} ${slipR} 0 0 1 ${(a0.x).toFixed(1)} ${(a0.y - slipR).toFixed(1)}`;
  // Through the loop centre and along the cord
  d += ` L ${a0.x.toFixed(1)} ${a0.y.toFixed(1)}`;
  for (let i = 1; i < samples.length; i++) {
    d += ` L ${samples[i].x.toFixed(1)} ${samples[i].y.toFixed(1)}`;
  }
  // Approach B's loop from centre → top, then full circle
  d += ` L ${(b0.x).toFixed(1)} ${(b0.y - slipR).toFixed(1)}`;
  d += ` A ${slipR} ${slipR} 0 0 1 ${(b0.x).toFixed(1)} ${(b0.y + slipR).toFixed(1)}`;
  d += ` A ${slipR} ${slipR} 0 0 1 ${(b0.x).toFixed(1)} ${(b0.y - slipR).toFixed(1)}`;

  const mid = samples[Math.floor(samples.length / 2)];
  return { d, mid, a: a0, b: b0 };
}

const SLIP_R = 18;

export type RhymeMorphSide = {
  id: string;
  name: string;
  peakYear: number;
  peakSeason: string;
  peakGoals: number;
};

type Props = {
  a: RhymeMorphSide;
  b: RhymeMorphSide;
  compareHref: string;
};

/**
 * Immersive scroll chapter: Best ↔ Ronaldo as a floodlit stage.
 *
 * Signature: a shared No. 7 monument, two ghosted peak years on the wings, and a
 * luminous filament that loops history so the peaks touch. Type + light + thread —
 * no chart chrome. See docs/JOURNEY.md.
 */
export function RhymeMorph({ a, b, compareHref }: Props) {
  const runwayRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduced(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    if (reduced) {
      setProgress(1);
      return;
    }
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

  const awaken = smoothstep(0, 0.12, p);
  const loopDraw = smoothstep(0.08, 0.42, p);
  const collapse = smoothstep(0.38, 0.72, p);
  const land = smoothstep(0.68, 0.9, p);
  const beforeLand = 1 - land;

  const aName = familyName(a.name);
  const bName = familyName(b.name);

  // Filament knots slide from the wings toward the shared No. 7.
  const knotAX = lerp(140, 455, collapse);
  const knotBX = lerp(860, 545, collapse);
  const knotY = lerp(420, 340, collapse);
  // Apex flattens as peaks meet — land should feel like a touch, not a mountain.
  const apexY = lerp(145, 290, collapse);
  const slipR = lerp(SLIP_R, 15, land);
  const { d: loopPath, mid } = buildFilament(knotAX, knotY, knotBX, knotY, apexY, collapse, slipR);

  const sevenOpacity = 0.07 + awaken * 0.05 + loopDraw * 0.04 + land * 0.06;
  const sevenScale = lerp(1, 0.82, land);

  const line =
    p < 0.3
      ? "Two No. 7s."
      : p < 0.62
        ? "History loops back."
        : "Both peaked in season five.";

  const sub =
    p < 0.3
      ? "Forty years apart on the same club."
      : p < 0.62
        ? `${a.peakYear} reaches for ${b.peakYear}.`
        : "The same career step — a generation apart.";

  return (
    <div ref={runwayRef} data-journey-runway className="relative" style={{ height: reduced ? "100dvh" : "360vh" }}>
      <div
        className={`${reduced ? "relative" : "sticky top-0"} z-10 h-dvh`}
        role="img"
        aria-label={`${a.name} and ${b.name}: both peaked in their fifth United season, ${a.peakYear} and ${b.peakYear}.`}
      >
        <div className="full-bleed-viewport relative h-full overflow-hidden bg-pitch">
          {/* Atmosphere */}
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_-18%,rgba(255,238,210,0.14),transparent_52%)]"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background: `radial-gradient(70% 55% at 50% 42%, rgba(216,33,13,${0.1 + loopDraw * 0.22}), transparent 68%)`,
            }}
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(130%_120%_at_50%_55%,transparent_28%,rgba(0,0,0,0.82))]"
            aria-hidden
          />

          {/* Shared No. 7 — the monument the thread loops through */}
          <span
            className="display pointer-events-none absolute left-1/2 top-[46%] z-[1] -translate-x-1/2 -translate-y-1/2 select-none text-devil-bright"
            style={{
              opacity: sevenOpacity,
              transform: `translate(-50%, -50%) scale(${sevenScale})`,
              fontSize: "clamp(12rem, 42vw, 28rem)",
              lineHeight: 0.85,
              textShadow: `0 0 ${40 + loopDraw * 60}px rgba(255,59,31,${0.15 + loopDraw * 0.25})`,
            }}
            aria-hidden
          >
            7
          </span>

          {/* The filament — organic cord with slipknots (TonightHero vocabulary) */}
          <svg
            className="pointer-events-none absolute inset-0 z-[2] h-full w-full"
            viewBox="0 0 1000 700"
            preserveAspectRatio="xMidYMid slice"
            aria-hidden
          >
            <defs>
              {/* Flowing gradient — same family as TonightHero's rt-thread */}
              <linearGradient id="journey-filament" x1="0" y1="0" x2="2" y2="0">
                {!reduced && (
                  <animateTransform
                    attributeName="gradientTransform"
                    type="translate"
                    from="-1,0"
                    to="0,0"
                    dur="12s"
                    repeatCount="indefinite"
                  />
                )}
                <stop offset="0%" stopColor="rgb(255 59 31)" stopOpacity="0.15" />
                <stop offset="12%" stopColor="rgb(255 59 31)" stopOpacity="0.85" />
                <stop offset="42%" stopColor="rgb(245 197 24)" stopOpacity="0.9" />
                <stop offset="50%" stopColor="rgb(245 197 24)" stopOpacity="0.12" />
                <stop offset="50%" stopColor="rgb(255 59 31)" stopOpacity="0.15" />
                <stop offset="62%" stopColor="rgb(255 59 31)" stopOpacity="0.85" />
                <stop offset="92%" stopColor="rgb(245 197 24)" stopOpacity="0.9" />
                <stop offset="100%" stopColor="rgb(245 197 24)" stopOpacity="0.12" />
              </linearGradient>
              <filter id="journey-glow" x="-30%" y="-80%" width="160%" height="260%">
                <feGaussianBlur stdDeviation="4" result="b" />
                <feMerge>
                  <feMergeNode in="b" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <filter id="journey-soft" x="-40%" y="-60%" width="180%" height="220%">
                <feGaussianBlur stdDeviation="16" />
              </filter>
            </defs>

            {/* Soft bloom — clipped to the drawn length so it doesn't ghost the full arc */}
            <path
              d={loopPath}
              fill="none"
              stroke="rgb(255 59 31)"
              strokeWidth="28"
              strokeLinecap="round"
              strokeLinejoin="round"
              pathLength={1}
              strokeDasharray={1}
              strokeDashoffset={1 - loopDraw}
              opacity={loopDraw * 0.22}
              filter="url(#journey-soft)"
            />
            {/* Glow underlay */}
            <path
              d={loopPath}
              fill="none"
              stroke="rgb(255 59 31)"
              strokeOpacity={0.32 * loopDraw}
              strokeWidth="4.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              pathLength={1}
              strokeDasharray={1}
              strokeDashoffset={1 - loopDraw}
              style={{ filter: "blur(2.8px)" }}
            />
            {/* Living filament */}
            <path
              d={loopPath}
              fill="none"
              stroke="url(#journey-filament)"
              strokeWidth="1.85"
              strokeLinecap="round"
              strokeLinejoin="round"
              pathLength={1}
              strokeDasharray={1}
              strokeDashoffset={1 - loopDraw}
              opacity={lerp(0, 1, loopDraw)}
            />

            {/* Slipknot A — Best's peak: loop ring + bead (TonightHero vocabulary) */}
            <g opacity={lerp(0.45, 1, loopDraw)}>
              <circle cx={knotAX} cy={knotY} r={slipR * 1.7} fill="rgb(245 197 24)" fillOpacity="0.12" style={{ filter: "blur(6px)" }} />
              <circle
                cx={knotAX}
                cy={knotY}
                r={slipR}
                fill="none"
                stroke="rgb(245 197 24)"
                strokeOpacity="0.55"
                strokeWidth="1.4"
              />
              <circle
                cx={knotAX}
                cy={knotY}
                r={slipR * 0.92}
                fill="rgb(245 197 24)"
                fillOpacity="0.06"
              />
              <circle cx={knotAX} cy={knotY} r={lerp(5.4, 7.2, land)} fill="rgb(245 197 24)" stroke="#ffffff" strokeWidth="1.15" />
              <circle cx={knotAX} cy={knotY} r="1.9" fill="#fff4d4" />
            </g>

            {/* Slipknot B — Ronaldo's peak */}
            <g opacity={Math.max(smoothstep(0.25, 0.55, loopDraw), land)}>
              <circle cx={knotBX} cy={knotY} r={slipR * 1.7} fill="rgb(245 197 24)" fillOpacity="0.12" style={{ filter: "blur(6px)" }} />
              <circle
                cx={knotBX}
                cy={knotY}
                r={slipR}
                fill="none"
                stroke="rgb(245 197 24)"
                strokeOpacity="0.55"
                strokeWidth="1.4"
              />
              <circle
                cx={knotBX}
                cy={knotY}
                r={slipR * 0.92}
                fill="rgb(245 197 24)"
                fillOpacity="0.06"
              />
              <circle cx={knotBX} cy={knotY} r={lerp(5.4, 7.2, land)} fill="rgb(245 197 24)" stroke="#ffffff" strokeWidth="1.15" />
              <circle cx={knotBX} cy={knotY} r="1.9" fill="#fff4d4" />
            </g>

            {/* Mid-arc whisper — brightens into the shared rhyme knot */}
            <g opacity={loopDraw * beforeLand * 0.45 + land}>
              <circle
                cx={mid.x}
                cy={mid.y}
                r={lerp(2.8, 10, land)}
                fill="rgb(245 197 24)"
                fillOpacity={lerp(0.4, 0.16, land)}
                filter="url(#journey-glow)"
              />
              <circle cx={mid.x} cy={mid.y} r={lerp(0, 6, land)} fill="rgb(245 197 24)" opacity={land} />
              <circle cx={mid.x} cy={mid.y} r={lerp(0, 2, land)} fill="#fff4d4" opacity={land} />
            </g>
          </svg>

          {/* Stage copy — content column so years never sit under the sidebar */}
          <div className="full-bleed-foreground relative z-10 flex h-full flex-col px-4 py-10 sm:px-6 sm:py-12 lg:py-14">
            <div className="relative z-10">
              <p data-journey-phase className="text-[11px] font-semibold uppercase tracking-[0.32em] text-devil-bright">
                Journey
              </p>
              <h1 className="mt-5 max-w-3xl text-balance text-[2.5rem] font-semibold leading-[1.02] tracking-tight text-ink sm:text-5xl lg:text-6xl">
                {line}
              </h1>
              <p className="mt-4 max-w-xl text-base text-ink-dim sm:text-lg">{sub}</p>
            </div>

            {/* Peak years — inside the content column, opposite wings */}
            <div
              className="pointer-events-none absolute inset-x-4 top-[42%] flex -translate-y-1/2 justify-between sm:inset-x-6 lg:inset-x-0"
              style={{ opacity: beforeLand * (0.85 + awaken * 0.15) }}
              aria-hidden
            >
              <span
                className="stat-num font-bold leading-none text-win"
                style={{
                  fontSize: "clamp(3.5rem, 10vw, 9rem)",
                  opacity: 0.14 + loopDraw * 0.04,
                  transform: `translateX(${lerp(0, 18, collapse)}%)`,
                }}
              >
                {a.peakYear}
              </span>
              <span
                className="stat-num font-bold leading-none text-win"
                style={{
                  fontSize: "clamp(3.5rem, 10vw, 9rem)",
                  opacity: 0.14 + loopDraw * 0.04,
                  transform: `translateX(${lerp(0, -18, collapse)}%)`,
                }}
              >
                {b.peakYear}
              </span>
            </div>

            {/* Names under the years */}
            <div
              className="pointer-events-none absolute inset-x-4 top-[58%] flex justify-between sm:inset-x-6 lg:inset-x-0"
              style={{ opacity: beforeLand * (0.6 + loopDraw * 0.4) }}
            >
              <div>
                <p className="text-2xl font-semibold tracking-tight text-devil-bright sm:text-4xl">{aName}</p>
                <p className="stat-num mt-2 text-base text-gold/90 sm:text-lg">{a.peakYear}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-semibold tracking-tight text-[color:var(--color-europe)] sm:text-4xl">{bName}</p>
                <p className="stat-num mt-2 text-base text-gold/90 sm:text-lg">{b.peakYear}</p>
              </div>
            </div>

            {/* Landed rhyme */}
            <div
              className="absolute inset-x-4 bottom-[9%] z-10 sm:inset-x-6 sm:bottom-[11%] lg:inset-x-0"
              style={{
                opacity: land,
                transform: `translateY(${lerp(40, 0, land)}px)`,
              }}
            >
              <div className="mx-auto max-w-2xl text-center">
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-gold">Fifth season</p>
                <div className="mt-6 flex items-end justify-center gap-14 sm:gap-24">
                  <div>
                    <p className="stat-num text-6xl font-bold leading-none text-devil-bright sm:text-8xl">{a.peakGoals}</p>
                    <p className="mt-4 text-base font-medium text-ink sm:text-lg">{aName}</p>
                    <p className="stat-num mt-1 text-sm text-ink-faint">{a.peakSeason}</p>
                  </div>
                  <div>
                    <p className="stat-num text-6xl font-bold leading-none text-[color:var(--color-europe)] sm:text-8xl">
                      {b.peakGoals}
                    </p>
                    <p className="mt-4 text-base font-medium text-ink sm:text-lg">{bName}</p>
                    <p className="stat-num mt-1 text-sm text-ink-faint">{b.peakSeason}</p>
                  </div>
                </div>
                <p className="mx-auto mt-8 max-w-md text-balance text-base leading-relaxed text-ink-dim sm:text-lg">
                  The most United goals either scored in a season — on the same step of the career,
                  forty years apart.
                </p>
                <p className="mt-7">
                  <Link href={compareHref} className="text-sm font-medium text-devil-bright hover:underline focus-ring">
                    Open the full duel →
                  </Link>
                </p>
              </div>
            </div>

            <div className="mt-auto">
              {!reduced && p < 0.05 && (
                <p className="text-center text-[11px] uppercase tracking-[0.22em] text-ink-faint">Scroll</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
