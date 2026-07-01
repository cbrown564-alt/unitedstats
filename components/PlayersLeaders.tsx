"use client";

import { useState } from "react";
import { Leaderboard, type LeaderboardItem } from "@/components/Leaderboard";

/** Two leaderboards — appearances and goals — with a total vs per-game toggle on goals. */
export function PlayersLeaders({
  topGoals,
  topApps,
  prolific,
}: {
  topGoals: LeaderboardItem[];
  topApps: LeaderboardItem[];
  prolific: LeaderboardItem[];
}) {
  const [perGame, setPerGame] = useState(false);

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="display text-xl">The leaders</h2>
        <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-ink-faint" role="group" aria-label="Leaderboard measure">
          <MeasureButton active={!perGame} onClick={() => setPerGame(false)}>
            Total
          </MeasureButton>
          <span aria-hidden>/</span>
          <MeasureButton active={perGame} onClick={() => setPerGame(true)}>
            Per game
          </MeasureButton>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Leaderboard title="Most appearances" unit="games" items={topApps} />
        <Leaderboard
          title={perGame ? "Goals per game" : "Top goalscorers"}
          unit={perGame ? "min. 150 apps" : "goals"}
          items={perGame ? prolific : topGoals}
          figureTone="text-devil-bright"
        />
      </div>
    </div>
  );
}

function MeasureButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: string;
}) {
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
