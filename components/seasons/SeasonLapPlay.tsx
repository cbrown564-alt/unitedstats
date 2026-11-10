"use client";

import { useState } from "react";
import { SeasonLap } from "@/components/glyphs/cord/DataGlyphs";

type Result = "W" | "D" | "L";

/**
 * A league season as a lap of results that the reader can replay: pressing it
 * runs the cord round the ring once, a bead landing for every match in order.
 * Static until asked (never on load); reduced motion shows the finished lap.
 */
export function SeasonLapPlay({
  results,
  champions,
  season,
  size = 132,
  caption,
}: {
  results: Result[];
  champions: boolean;
  season: string;
  size?: number;
  /** Small text inside the ring, under the season. */
  caption?: string;
}) {
  const [run, setRun] = useState(0);
  const w = results.filter((r) => r === "W").length;
  const d = results.filter((r) => r === "D").length;
  const l = results.length - w - d;
  return (
    <button
      type="button"
      onClick={() => setRun((n) => n + 1)}
      className="cord-host group relative grid shrink-0 place-items-center rounded-full focus-ring"
      aria-label={`Play the ${season} league season: ${w} won, ${d} drawn, ${l} lost${champions ? ", champions" : ""}`}
      title="Play the league season"
    >
      <SeasonLap
        key={run}
        results={results}
        champions={champions}
        size={size}
        className={`cd-lit ${run ? "cd-play" : ""}`}
      />
      <span aria-hidden className="pointer-events-none absolute grid place-items-center text-center leading-tight">
        <span className="stat-num text-[11px] font-semibold text-ink">{results.length}</span>
        <span className="text-[9px] uppercase tracking-[0.14em] text-ink-faint">{caption ?? "league"}</span>
        <svg viewBox="0 0 12 12" width="9" height="9" className="mt-0.5 text-devil-bright opacity-60 transition-opacity group-hover:opacity-100 motion-reduce:hidden">
          <path d="M3 1.8L10 6L3 10.2Z" fill="currentColor" />
        </svg>
      </span>
    </button>
  );
}
