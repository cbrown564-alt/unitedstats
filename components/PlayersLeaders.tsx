"use client";

import Link from "next/link";
import { useState } from "react";
import type { LeaderboardItem } from "@/components/Leaderboard";
import { PlayerPortrait } from "@/components/PlayerPortrait";

/** Two ranked bar charts — appearances and goals — with a total vs per-game toggle on goals. */
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
        <RankedBarChart title="Most appearances" unit="games" items={topApps} barTone="bg-ink-dim/65" />
        <RankedBarChart
          title={perGame ? "Goals per game" : "Top goalscorers"}
          unit={perGame ? "min. 150 apps" : "goals"}
          items={perGame ? prolific : topGoals}
          barTone="bg-devil-bright/75"
          figureTone="text-devil-bright"
        />
      </div>
    </div>
  );
}

function RankedBarChart({
  title,
  unit,
  items,
  barTone,
  figureTone = "text-ink",
}: {
  title: string;
  unit: string;
  items: LeaderboardItem[];
  barTone: string;
  figureTone?: string;
}) {
  const values = items.map((item) => Number(item.figure.replaceAll(",", "")) || 0);
  const max = Math.max(...values, 1);

  return (
    <section className="rounded-lg border border-line bg-panel px-3.5 py-3" aria-label={`${title}, ${unit}`}>
      <header className="mb-3 flex items-baseline justify-between gap-2">
        <h3 className="display text-base leading-none">{title}</h3>
        <span className="text-[11px] uppercase tracking-[0.12em] text-ink-faint">{unit}</span>
      </header>
      <ol className="space-y-2.5">
        {items.map((item, index) => (
          <li key={item.id}>
            <Link href={`/player/${item.id}`} className="group block rounded-sm focus-ring">
              <span className="flex items-center gap-2.5">
                <span className="stat-num w-4 shrink-0 text-right text-xs text-ink-faint">{index + 1}</span>
                <PlayerPortrait name={item.name} src={item.src} size="xs" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium leading-tight group-hover:text-devil-bright">
                    {item.name}
                  </span>
                  {item.sub && (
                    <span className="stat-num block truncate text-[11px] leading-tight text-ink-faint">{item.sub}</span>
                  )}
                </span>
                <span className={`stat-num shrink-0 text-base font-semibold tabular-nums ${figureTone}`}>
                  {item.figure}
                </span>
              </span>
              <span className="ml-16 mt-1 block h-1.5 overflow-hidden rounded-sm bg-pitch/80" aria-hidden>
                <span
                  className={`block h-full rounded-sm ${barTone} transition-[filter] duration-150 group-hover:brightness-125`}
                  style={{ width: `${(values[index] / max) * 100}%` }}
                />
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
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
