"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import type { GreatNight } from "@/lib/greatNights";

function LivePulse() {
  return (
    <span className="relative flex h-1.5 w-1.5" aria-hidden>
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-devil-bright/70" />
      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-devil-bright" />
    </span>
  );
}

/** The goals that made the night — name + minute, the line a fan recites from
 *  memory. Capped so a rout doesn't run off the edge. */
function Scorers({
  scorers,
  timeline,
  hoveredIndex,
  onHoverChange,
}: {
  scorers: GreatNight["scorers"];
  timeline: GreatNight["timeline"];
  hoveredIndex: number | null;
  onHoverChange: (index: number | null) => void;
}) {
  if (scorers.length === 0) return null;
  const shown = scorers.slice(0, 5);
  const extra = scorers.length - shown.length;

  const axisMax = timeline.length > 0 ? Math.max(96, ...timeline.map((g) => g.clock + 4)) : 96;

  return (
    <p className="mt-3 flex flex-wrap items-baseline gap-x-4 gap-y-1 text-sm sm:text-base">
      {shown.map((s, i) => {
        const g = timeline[i];
        const delay = g ? Math.round(240 + 820 * (g.clock / axisMax) + (g.winner ? 150 : 0)) : 0;

        const isHovered = hoveredIndex === i;
        const isAnyHovered = hoveredIndex !== null;

        return (
          <span
            key={i}
            onMouseEnter={() => onHoverChange(i)}
            onMouseLeave={() => onHoverChange(null)}
            className="scorer-item cursor-pointer transition-all duration-500 ease-out"
            style={{
              animationDelay: `${delay}ms`,
              opacity: isHovered ? 1 : isAnyHovered ? 0.55 : undefined,
              color: isHovered ? "rgb(245 197 24)" : undefined,
            }}
          >
            {s.name}
            {s.minute && (
              <span
                className={`stat-num ml-1.5 transition-colors duration-500 ease-out ${
                  isHovered ? "text-gold" : "text-win"
                }`}
              >
                {s.minute}
              </span>
            )}
          </span>
        );
      })}
      {extra > 0 && <span className="text-ink-faint">+{extra} more</span>}
    </p>
  );
}

/**
 * The Red Thread, tied as the match — the Wavy Slipknot treatment. One continuous
 * filament runs down the left, read as the clock (kickoff at the top, full time at
 * the foot). It doesn't fall straight: it sways, a slack cord swung down the stage.
 * At every United goal it ties a *slipknot* — a full circle centred on the thread,
 * the cord running straight on through its middle — with a translucent bead held
 * inside, the winner's in gold. A late pair (1999's 90+1' and 90+3') overlaps into
 * one fat double-knot, the overlap itself telling the story; the minute labels
 * alternate sides so they never collide. The geometry is exact: every x is sampled
 * from the same sway curve and the whole thing is scaled as one, so loops stay
 * circular and land on the real minute at any stage height.
 *
 * On load the filament traces itself top→foot and the beads settle into each knot
 * in scoring order, so the late winner drops in last. Gated on prefers-reduced-
 * motion. A night with no recorded minutes falls back to the bare swaying cord, the
 * ghosted-year monument (rendered by the hero) carrying it instead.
 */
function ThreadTimeline({
  timeline,
  hoveredIndex,
  onHoverChange,
}: {
  timeline: GreatNight["timeline"];
  hoveredIndex: number | null;
  onHoverChange: (index: number | null) => void;
}) {
  // viewBox space — geometry is authored here once and scaled whole, so the knots
  // stay perfectly circular and land on the exact minute at any stage height.
  const VB_W = 120;
  const VB_H = 760;
  const X = 60; // the filament's resting line
  const TOP = 74; // 0' anchor
  const BOT = 686; // full-time anchor
  const R = 16; // slipknot radius
  const AMP = 5; // how far the cord sways off its line
  const svgClass = "pointer-events-none absolute inset-y-0 left-0 w-[7rem] h-full overflow-visible z-10 sm:w-[8.5rem]";

  const axisMax = timeline.length > 0 ? Math.max(96, ...timeline.map((g) => g.clock + 4)) : 96;
  const y = (clock: number) => TOP + (clock / axisMax) * (BOT - TOP);

  // The sway: every x — cord, loops, beads — is read off this slow wave down the
  // stage. We use coordinate blending around loops so they remain mathematically
  // perfect circles tangent to the swaying thread without horizontal kinks.
  const wx = (yy: number) => {
    const baseWave = (yVal: number) => AMP * Math.sin((yVal / VB_H) * Math.PI * 2.4 + 0.5);
    if (timeline.length === 0) return X + baseWave(yy);

    // Find the closest goal to blend around its center coordinate
    let closestGoal = timeline[0];
    let minDist = Math.abs(yy - y(timeline[0].clock));
    for (const g of timeline) {
      const dist = Math.abs(yy - y(g.clock));
      if (dist < minDist) {
        minDist = dist;
        closestGoal = g;
      }
    }

    const yc = y(closestGoal.clock);
    const dStart = yc - R;
    const dEnd = yc + R;

    // Inside the loop: constant shift
    if (yy >= dStart && yy <= dEnd) {
      return X + baseWave(yc);
    }
    // Upper blend zone: [yc - 2*R, yc - R]
    if (yy >= yc - 2 * R && yy < dStart) {
      const blend = (yy - (yc - 2 * R)) / R;
      return X + blend * baseWave(yc) + (1 - blend) * baseWave(yy);
    }
    // Lower blend zone: [yc + R, yc + 2*R]
    if (yy > dEnd && yy <= yc + 2 * R) {
      const blend = ((yc + 2 * R) - yy) / R;
      return X + blend * baseWave(yc) + (1 - blend) * baseWave(yy);
    }

    return X + baseWave(yy);
  };

  if (timeline.length === 0) {
    // No recorded minutes: the bare swaying cord, one gold node at its middle.
    let bare = `M ${wx(0).toFixed(1)} 0`;
    for (let yy = 10; yy <= VB_H; yy += 10) bare += ` L ${wx(yy).toFixed(1)} ${yy}`;
    return (
      <svg className={svgClass} viewBox={`0 0 ${VB_W} ${VB_H}`} preserveAspectRatio="xMinYMid meet" fill="none" height="100%" aria-hidden>
        <path d={bare} stroke="rgb(255 59 31)" strokeOpacity="0.5" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={wx(VB_H / 2)} cy={VB_H / 2} r="4.5" fill="rgb(245 197 24)" />
      </svg>
    );
  }

  const side = (i: number) => (i % 2 === 0 ? 1 : -1); // labels alternate so close goals don't collide

  // One continuous filament: it sways down the stage (a poly-line sampling the wave)
  // and at every goal ties a slipknot — a full circle centred on the cord, drawn as
  // two semicircle arcs — after which the cord runs straight on through the loop's
  // middle to the next.
  const STEP = 10;
  const sway = (from: number, to: number) => {
    let s = "";
    for (let yy = Math.ceil((from + 0.01) / STEP) * STEP; yy < to; yy += STEP) {
      s += ` L ${wx(yy).toFixed(1)} ${yy.toFixed(1)}`;
    }
    return s;
  };

  let d = `M ${wx(0).toFixed(1)} 0`;
  let penY = 0;
  timeline.forEach((g) => {
    const yc = y(g.clock);
    const ys = yc - R; // top of the loop
    const ye = yc + R; // bottom of the loop
    d += `${sway(penY, ys)} L ${wx(ys).toFixed(1)} ${ys.toFixed(1)}`;
    d += ` A ${R} ${R} 0 0 1 ${wx(ye).toFixed(1)} ${ye.toFixed(1)}`;
    d += ` A ${R} ${R} 0 0 1 ${wx(ys).toFixed(1)} ${ys.toFixed(1)}`;
    penY = ys; // the cord runs on from the loop's top, straight through its middle
  });
  d += `${sway(penY, VB_H)} L ${wx(VB_H).toFixed(1)} ${VB_H}`;

  const winner = timeline[timeline.length - 1];
  const wy = y(winner.clock);

  return (
    <svg className={svgClass} viewBox={`0 0 ${VB_W} ${VB_H}`} preserveAspectRatio="xMinYMid meet" fill="none" height="100%" aria-hidden>
      <defs>
        {/* Keyframe style injection for slow, spring-free falling entry and unblurring text fade-in */}
        <style dangerouslySetInnerHTML={{ __html: `
          .thread-bead,
          .thread-knot {
            animation-name: bead-fall-in !important;
            animation-duration: 2000ms !important;
            animation-timing-function: cubic-bezier(0.22, 1, 0.36, 1) !important;
          }
          .thread-knot {
            animation-duration: 2450ms !important;
          }
          @keyframes bead-fall-in {
            0% { opacity: 0; transform: translateY(-20px) scale(0.9); }
            100% { opacity: 1; transform: translateY(0) scale(1); }
          }
          
          .core-bead-el {
            animation: core-fade-in 1800ms cubic-bezier(0.22, 1, 0.36, 1) both;
          }
          @keyframes core-fade-in {
            0% { transform: scale(0.6); opacity: 0; }
            100% { transform: scale(1); opacity: 1; }
          }

          .bead-ripple {
            animation: glow-expand 2200ms cubic-bezier(0.22, 1, 0.36, 1) both;
          }
          @keyframes glow-expand {
            0% { transform: scale(0.6); opacity: 0; }
            30% { opacity: 0.35; }
            100% { transform: scale(1.5); opacity: 0; }
          }

          .scorer-item {
            display: inline-block;
            opacity: 0;
            animation: scorer-fade-in 1800ms cubic-bezier(0.22, 1, 0.36, 1) both;
          }
          @keyframes scorer-fade-in {
            0% { opacity: 0; filter: blur(3px); transform: translateY(6px) scale(0.97); }
            100% { opacity: 1; filter: blur(0); transform: translateY(0) scale(1); }
          }
        `}} />

        {/* Continuous gradient flow using native percentage-based SVG SMIL translate animation */}
        <linearGradient id="rt-thread" x1="0" y1="0" x2="0" y2="2">
          <animateTransform
            attributeName="gradientTransform"
            type="translate"
            from="0,-1"
            to="0,0"
            dur="15s"
            repeatCount="indefinite"
          />
          <stop offset="0%" stopColor="rgb(255 59 31)" stopOpacity="0.12" />
          <stop offset="8%" stopColor="rgb(255 59 31)" stopOpacity="0.72" />
          <stop offset="42%" stopColor="rgb(245 197 24)" stopOpacity="0.82" />
          <stop offset="50%" stopColor="rgb(245 197 24)" stopOpacity="0.1" />
          
          <stop offset="50%" stopColor="rgb(255 59 31)" stopOpacity="0.12" />
          <stop offset="58%" stopColor="rgb(255 59 31)" stopOpacity="0.72" />
          <stop offset="92%" stopColor="rgb(245 197 24)" stopOpacity="0.82" />
          <stop offset="100%" stopColor="rgb(245 197 24)" stopOpacity="0.1" />
        </linearGradient>
      </defs>

      {/* Half-time: the one quiet mark that gives the clock a middle. */}
      <line x1={wx(y(45)) - 5} y1={y(45)} x2={wx(y(45)) + 5} y2={y(45)} stroke="rgb(168 156 148)" strokeOpacity="0.22" strokeWidth="0.8" />
      {/* The winner's glow — light gathered in the knot that settled it. */}
      <circle cx={wx(wy)} cy={wy} r={R * 1.6} fill="rgb(245 197 24)" fillOpacity="0.1" style={{ filter: "blur(5px)" }} />

      {/* The filament: a soft glow underlay, then the gradient thread — both traced on load. */}
      <path d={d} stroke="rgb(255 59 31)" strokeOpacity="0.22" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" pathLength={1} className="thread-path" style={{ filter: "blur(2.5px)" }} />
      <path d={d} stroke="url(#rt-thread)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" pathLength={1} className="thread-path" />

      {timeline.map((g, i) => {
        const s = side(i);
        const yc = y(g.clock);
        const cx = wx(yc);
        const isWin = g.winner;
        const tone = isWin ? "rgb(245 197 24)" : "rgb(255 59 31)";
        const delay = Math.round(240 + 820 * (g.clock / axisMax) + (isWin ? 150 : 0));

        const isHovered = hoveredIndex === i;
        const isAnyHovered = hoveredIndex !== null;

        return (
          <g
            key={i}
            className="cursor-pointer"
            style={{ pointerEvents: "auto" }}
            onMouseEnter={() => onHoverChange(i)}
            onMouseLeave={() => onHoverChange(null)}
          >
            {/* The bead held in the loop — translucent, the winner's in gold — settling in on load. */}
            <g
              className={isWin ? "thread-knot" : "thread-bead"}
              style={{
                animationDelay: `${delay}ms`,
                transition: "opacity 500ms ease, transform 500ms cubic-bezier(0.25, 1, 0.5, 1)",
                transform: isHovered ? "scale(1.22)" : "scale(1)",
                transformOrigin: `${cx}px ${yc}px`,
                opacity: isHovered ? 1 : isAnyHovered ? 0.55 : 1,
              }}
            >
              {/* Outer glow */}
              <circle cx={cx} cy={yc} r={R * 1.4} fill={tone} fillOpacity={isHovered ? 0.35 : isWin ? 0.22 : 0.14} style={{ filter: "blur(1px)" }} />
              {/* Loop backing */}
              <circle cx={cx} cy={yc} r={R} fill={tone} fillOpacity="0.08" stroke={tone} strokeOpacity={isHovered ? 0.6 : 0.3} strokeWidth="0.8" />
              {/* Core Bead */}
              <circle cx={cx} cy={yc} r={isWin ? 4.8 : 3.8} fill={tone} stroke="#ffffff" strokeWidth="1" className="core-bead-el" style={{ animationDelay: `${delay}ms`, transformOrigin: `${cx}px ${yc}px` }} />
              <circle cx={cx} cy={yc} r="1.5" fill={isWin ? "#fff4d4" : "#ffdcd5"} className="core-bead-el" style={{ animationDelay: `${delay}ms`, transformOrigin: `${cx}px ${yc}px` }} />
            </g>

            {/* Expansion outline ripple circle */}
            {!isAnyHovered && (
              <circle
                cx={cx}
                cy={yc}
                r={R}
                fill="none"
                stroke={tone}
                strokeWidth="1.2"
                className="bead-ripple"
                style={{
                  animationDelay: `${delay}ms`,
                  transformOrigin: `${cx}px ${yc}px`,
                }}
              />
            )}

            <text
              className="stat-num thread-mark"
              x={cx + s * (R + 9)}
              y={yc}
              dy="0.32em"
              textAnchor={s > 0 ? "start" : "end"}
              fontSize="12.5"
              fill={isHovered ? "rgb(245 197 24)" : isWin ? "rgb(245 197 24)" : "rgb(168 156 148)"}
              style={{
                animationDelay: `${delay}ms`,
                transition: "opacity 500ms ease, fill 500ms ease",
                opacity: isHovered ? 1 : isAnyHovered ? 0.55 : 1,
              }}
            >
              {g.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/**
 * The first-contact spark (CONTEXT.md §6): the front door *is* the gate, so it is
 * built like nothing else on the site — not a panel among panels, but one floodlit
 * stage carrying a single match-night.
 *
 * The composition is the signature: the brand's Red Thread runs down the left as a
 * luminous spine read as the match clock, holding each goal as a bead at its minute
 * and the winner as the knot (see ThreadTimeline); the story line is the editorial
 * lead; and the match itself is given real presence — full scoreline and the
 * goalscorers with their minutes, the line a fan recites from memory. No card, no
 * grid, no metric tiles.
 *
 * The server picks `nights[seed]`, so a shared link or a no-JS visit shows the
 * same real night with a working door; the only client layer is the thread's
 * hover interplay, which respects the global reduced-motion rule.
 */
export function TonightHero({
  nights,
  seed,
}: {
  nights: GreatNight[];
  seed: number;
}) {
  const [hoveredGoalIndex, setHoveredGoalIndex] = useState<number | null>(null);

  const night = nights[seed];
  if (!night) return null;

  return (
    <div>
      {/* The stage. Bleeds past the column to the page edges and pulls flush under
          the header so it reads as a floodlit field, not a card on a page. */}
      <Link
        href={night.href}
        aria-label={`${night.line ?? `Manchester United ${night.score} ${night.opponent}`} — see the match`}
        className="group relative -mx-4 -mt-8 block overflow-hidden bg-pitch focus-ring sm:-mx-6 sm:-mt-10"
      >
        {/* Floodlight from above. */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(115%_75%_at_50%_-12%,rgba(255,238,210,0.10),transparent_55%)]" aria-hidden />

        {/* The match-winner, a faded monument bled off the right and dissolved into
            the dark — a face to carry the night. Masked on the left and foot so the
            portrait's own background (and any club crest) fades out; a devil wash
            duotones it red so it reads as atmosphere, not a stray modern photo.
            Falls back to the ghosted year. */}
        {night.image ? (
          <div
            className="pointer-events-none absolute inset-y-0 right-0 w-[70%] [-webkit-mask-composite:source-in] [mask-composite:intersect] [mask-image:linear-gradient(to_right,transparent,#000_60%),linear-gradient(to_top,transparent_6%,#000_46%)] sm:w-[56%]"
            aria-hidden
          >
            <Image
              src={night.image.src}
              alt=""
              fill
              sizes="(max-width: 640px) 70vw, 48vw"
              className="object-cover object-[center_14%] opacity-[0.2] grayscale contrast-110"
            />
            <div className="absolute inset-0 bg-[linear-gradient(to_left,rgba(216,33,13,0.32),rgba(216,33,13,0.10)_45%,transparent)] mix-blend-overlay" />
          </div>
        ) : (
          <span
            className="stat-num pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 select-none font-bold leading-none text-win/[0.05] text-[9rem] sm:text-[16rem] lg:text-[20rem]"
            aria-hidden
          >
            {night.year}
          </span>
        )}

        {/* A red wash by the thread and a vignette that sinks the edges to black —
            laid over the portrait so it reads as atmosphere, not a photo. */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_60%_at_14%_24%,rgba(216,33,13,0.18),transparent_60%)]" aria-hidden />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(125%_120%_at_45%_45%,transparent_38%,rgba(0,0,0,0.66))]" aria-hidden />

        {/* The Red Thread, made the monument: the spine read as the match clock,
            every United goal a bead at its minute, the winner the gold knot. */}
        <ThreadTimeline
          key={`thread-${night.id}`}
          timeline={night.timeline}
          hoveredIndex={hoveredGoalIndex}
          onHoverChange={setHoveredGoalIndex}
        />

        {/* The night, hung off the thread. */}
        <div
          key={night.id}
          className="surprise-in relative flex min-h-[31rem] flex-col justify-center py-16 pl-28 pr-6 sm:min-h-[42rem] sm:pl-40 sm:pr-12"
        >
          <p className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.32em] text-devil-bright">
            <span className="stat-num text-sm font-bold tracking-normal text-gold">{night.year}</span>
            {night.live && <LivePulse />}
            {night.eyebrow}
          </p>

          {night.line && (
            <p className="mt-6 max-w-2xl text-balance text-[2rem] font-semibold leading-[1.08] tracking-tight text-ink sm:text-5xl sm:leading-[1.05] lg:text-6xl">
              {night.line}
            </p>
          )}

          {/* The match, given presence: the scoreline and the goals behind it. */}
          <div className="mt-8 sm:mt-10">
            <p className="flex flex-wrap items-baseline gap-x-3 text-xl font-medium sm:text-2xl">
              <span className="text-ink">Manchester United</span>
              <span className={`stat-num text-3xl font-bold sm:text-4xl ${night.tone}`}>{night.score}</span>
              <span className="text-ink">{night.opponent}</span>
            </p>
            <Scorers
              scorers={night.scorers}
              timeline={night.timeline}
              hoveredIndex={hoveredGoalIndex}
              onHoverChange={setHoveredGoalIndex}
            />
            <p className="mt-2.5 text-sm text-ink-faint">{night.meta}</p>
          </div>

          <span className="mt-9 inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-devil-bright sm:mt-11">
            {night.cta}
            <span aria-hidden className="transition-transform duration-200 group-hover:translate-x-1">→</span>
          </span>

          {/* A quieter second door: the thread doesn't end at the match — it runs on
              down into the record below. This nudges you to follow it rather than click
              through, so it suppresses the stage's link and scrolls to the foundation. */}
          <span
            aria-hidden
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
              document
                .getElementById("the-record")
                ?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
            }}
            className="group/thread mt-3 inline-flex cursor-pointer items-center gap-1.5 self-start text-xs lowercase tracking-wide text-ink-faint transition-colors hover:text-ink-dim"
          >
            or follow the thread
            <span className="transition-transform duration-300 group-hover/thread:translate-y-0.5">↓</span>
          </span>
        </div>
      </Link>
    </div>
  );
}
