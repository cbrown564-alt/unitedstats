import Link from "next/link";
import { SeasonLapMini } from "@/components/glyphs/cord/DataGlyphs";

type Result = "W" | "D" | "L";

export interface DecadeLap {
  season: string;
  href: string;
  results: Result[];
  champions: boolean;
  position: number | null;
}

/**
 * A decade as a row of league laps, oldest first: each season's cord stepping
 * out for wins and in for losses, so a title run and a slump read as shapes
 * before any number. Title laps are lit and close on gold; the rest stay quiet
 * until hovered. A season without a league campaign shows as an open ring.
 */
export function DecadeLaps({ laps }: { laps: DecadeLap[] }) {
  if (laps.length === 0) return null;
  return (
    <ol className="mb-4 grid grid-cols-5 gap-x-1 gap-y-2 sm:flex sm:flex-wrap sm:gap-x-1.5" aria-label="League seasons as laps, oldest first">
      {laps.map((lap) => {
        const w = lap.results.filter((r) => r === "W").length;
        const d = lap.results.filter((r) => r === "D").length;
        const l = lap.results.length - w - d;
        const has = lap.results.length >= 10;
        const title = has
          ? `${lap.season}: W${w} D${d} L${l}${lap.position ? `, finished ${ordinal(lap.position)}` : ""}`
          : `${lap.season}: no league campaign on record`;
        return (
          <li key={lap.season}>
            <Link
              href={lap.href}
              prefetch={false}
              title={title}
              aria-label={title}
              className={`cord-host group flex flex-col items-center gap-0.5 rounded-lg px-0.5 pb-1 pt-0.5 focus-ring ${
                lap.champions ? "text-ink-dim" : "text-ink-faint hover:text-ink-dim"
              }`}
            >
              {has ? (
                <SeasonLapMini
                  results={lap.results}
                  champions={lap.champions}
                  size={58}
                  className={lap.champions ? "cd-lit" : undefined}
                />
              ) : (
                <svg viewBox="0 0 80 80" width={58} height={58} aria-hidden className="opacity-50">
                  <circle cx="40" cy="40" r="25" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="2 5" />
                </svg>
              )}
              <span className={`stat-num text-[10px] leading-none ${lap.champions ? "text-gold/90" : ""}`}>
                {shortSeason(lap.season)}
              </span>
            </Link>
          </li>
        );
      })}
    </ol>
  );
}

function shortSeason(season: string): string {
  const [a, b] = season.split("-");
  return b ? `${a.slice(2)}–${b.slice(-2)}` : season;
}

function ordinal(n: number) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
