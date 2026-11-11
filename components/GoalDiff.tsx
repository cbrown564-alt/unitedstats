"use client";

import { useState } from "react";
import { fmtNum } from "@/lib/format";

const signOf = (n: number) => (n > 0 ? "+" : n < 0 ? "−" : ""); // U+2212 minus
const toneOf = (n: number) => (n > 0 ? "text-win" : n < 0 ? "text-loss" : "text-ink");

/**
 * Aggregate goals shown as the one thing they actually mean: goal difference,
 * signed and colour-coded (yellow ahead, red behind — the win/loss poles), with the scored/conceded
 * split named in support beneath. Replaces the ambiguous "1,234–987" that read
 * like a scoreline and forced the reader to subtract.
 *
 * A subtle toggle switches the whole readout between per-game and total; it
 * defaults to per-game, the unit that compares honestly across a 40-game season
 * and a 1,141-game tenure. Shared by the match band and the detail-page plate.
 *
 * `inline` returns just the signed, tinted *total* figure — for a fixed stat tile
 * that supplies its own label and has no room for a toggle (the season grid).
 */
export function GoalDiff({
  gf,
  ga,
  played,
  size = "md",
  inline = false,
  variant = "block",
  className = "",
}: {
  gf: number;
  ga: number;
  /** Games in the slice; required for the per-game unit (omit only for `inline`). */
  played?: number;
  size?: "md" | "lg";
  inline?: boolean;
  /** `cell` renders dd/dt rows for a plate's stat strip (`PlateStats`), with the
   *  unit toggle seated beside the figure so the cell keeps three rows. */
  variant?: "block" | "cell";
  className?: string;
}) {
  if (inline) {
    const gd = gf - ga;
    return <span className={toneOf(gd)}>{signOf(gd)}{fmtNum(Math.abs(gd))}</span>;
  }
  if (variant === "cell") return <GoalDiffCell gf={gf} ga={ga} played={played} />;
  return <GoalDiffBlock gf={gf} ga={ga} played={played} size={size} className={className} />;
}

function GoalDiffBlock({
  gf,
  ga,
  played,
  size,
  className,
}: {
  gf: number;
  ga: number;
  played?: number;
  size: "md" | "lg";
  className: string;
}) {
  const { canPerGame, perGame, setPerGame, gd, figure, scored, conceded } = useGoalDiff(gf, ga, played);

  return (
    <div className={`leading-none ${className}`}>
      <div className={`stat-num font-semibold ${size === "lg" ? "text-2xl sm:text-3xl" : "text-xl"} ${toneOf(gd)}`}>
        {figure}
      </div>
      <div className="mt-1.5 text-[11px] uppercase tracking-[0.13em] text-ink-faint">goal difference</div>
      <div className="stat-num mt-1.5 text-xs text-ink-dim">
        {scored} scored <span className="text-ink-faint">·</span> {conceded} conceded
      </div>
      {canPerGame && (
        <div className="mt-2 flex items-center gap-1.5 text-[10px] uppercase tracking-wider" role="group" aria-label="Goal stats unit">
          <UnitButton active={perGame} onClick={() => setPerGame(true)}>per game</UnitButton>
          <span className="text-ink-faint/60" aria-hidden>/</span>
          <UnitButton active={!perGame} onClick={() => setPerGame(false)}>total</UnitButton>
        </div>
      )}
    </div>
  );
}

function useGoalDiff(gf: number, ga: number, played?: number) {
  const canPerGame = !!played && played > 0;
  const [perGame, setPerGame] = useState(canPerGame);
  const gd = gf - ga;
  const per = (n: number) => (n / (played as number)).toFixed(1);
  return {
    canPerGame,
    perGame,
    setPerGame,
    gd,
    figure: `${signOf(gd)}${perGame ? per(Math.abs(gd)) : fmtNum(Math.abs(gd))}`,
    scored: perGame ? per(gf) : fmtNum(gf),
    conceded: perGame ? per(ga) : fmtNum(ga),
  };
}

function GoalDiffCell({ gf, ga, played }: { gf: number; ga: number; played?: number }) {
  const g = useGoalDiff(gf, ga, played);
  return (
    <>
      <dd className="plate-cell-value stat-num">
        <span className={toneOf(g.gd)}>{g.figure}</span>
        {g.canPerGame && (
          <button
            type="button"
            className="gd-unit focus-ring"
            onClick={() => g.setPerGame(!g.perGame)}
            title={g.perGame ? "Show totals" : "Show per game"}
            aria-label={g.perGame ? "Per game; show totals" : "Totals; show per game"}
          >
            {g.perGame ? "/ game" : "total"}
            <svg viewBox="0 0 10 10" width="8" height="8" aria-hidden>
              <path d="M2 3.5h6L6.2 1.7M8 6.5H2l1.8 1.8" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}
      </dd>
      <dt className="plate-cell-label">goal difference</dt>
      <dd className="plate-cell-detail">
        <span className="stat-num">{g.scored}</span> for <span className="text-ink-faint">·</span> <span className="stat-num">{g.conceded}</span> against
      </dd>
    </>
  );
}

function UnitButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-sm px-0.5 transition-colors focus-ring ${
        active ? "text-ink" : "text-ink-faint hover:text-ink-dim"
      }`}
    >
      {children}
    </button>
  );
}
