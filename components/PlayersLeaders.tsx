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
    <section className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <p className="text-sm text-ink-dim">The frontiers on appearances and goals.</p>
        <div
          className="inline-flex rounded-md border border-line bg-panel p-0.5"
          role="group"
          aria-label="Leaderboard measure"
        >
          <button
            type="button"
            onClick={() => setPerGame(false)}
            className={`rounded px-2.5 py-1 text-xs transition-colors focus-ring ${
              !perGame ? "bg-devil/15 text-ink" : "text-ink-dim hover:text-ink"
            }`}
          >
            Total
          </button>
          <button
            type="button"
            onClick={() => setPerGame(true)}
            className={`rounded px-2.5 py-1 text-xs transition-colors focus-ring ${
              perGame ? "bg-devil/15 text-ink" : "text-ink-dim hover:text-ink"
            }`}
          >
            Per game
          </button>
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
    </section>
  );
}
