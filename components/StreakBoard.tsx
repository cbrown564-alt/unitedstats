import Link from "next/link";
import type { ClubRun, StreakKind } from "@/lib/streaks";
import { fmtMonthYear, scoreline, venuePrefix } from "@/lib/format";

export interface StreakGroup {
  kind: StreakKind;
  /** Card title, e.g. "Unbeaten". */
  title: string;
  /** Reads after the figure: "45 matches without defeat". */
  figureNoun: string;
  tone: "win" | "gold";
  runs: ClubRun[];
}

const TONE: Record<StreakGroup["tone"], string> = {
  win: "text-win",
  gold: "text-gold",
};

/** A run's evidence window — every run links back to the matches that made it. */
function runHref(r: ClubRun): string {
  return `/matches?from=${r.from}&to=${r.to}&sort=oldest`;
}

function spanLabel(r: ClubRun): string {
  const from = fmtMonthYear(r.from);
  const to = fmtMonthYear(r.to);
  return from === to ? from : `${from} – ${to}`;
}

/**
 * The great runs, one card per kind. Each card leads with its record run as a
 * big tinted figure, the span it covered, and the match that finally ended it
 * (or "still running"), then ladders the next-longest runs beneath as compact,
 * evidence-linked rows. The champion figure is itself the link to its window;
 * a kind with no qualifying run renders nothing rather than an empty shell.
 */
export function StreakBoard({ groups }: { groups: StreakGroup[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {groups.map((g) => {
        const [best, ...rest] = g.runs;
        if (!best) return null;
        return (
          <div key={g.kind} className="flex flex-col rounded-lg border border-line bg-panel-2 p-4">
            <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-faint">{g.title}</h3>
            <Link href={runHref(best)} className="group mt-2 block focus-ring">
              <span className="flex items-baseline gap-2">
                <span className={`stat-num text-4xl font-semibold leading-none ${TONE[g.tone]} group-hover:underline`}>
                  {best.length}
                </span>
                <span className="text-sm text-ink-dim">{g.figureNoun}</span>
              </span>
              <span className="stat-num mt-1.5 block text-xs text-ink-faint">{spanLabel(best)}</span>
            </Link>
            <p className="mt-1.5 text-xs text-ink-dim">
              {best.ongoing ? (
                <span className="text-win">Still running.</span>
              ) : best.ender ? (
                <>
                  Ended by a{" "}
                  <Link href={`/match/${best.ender.id}`} className="hover:text-devil-bright">
                    {scoreline(best.ender.gf, best.ender.ga)}{" "}
                    {best.ender.result === "W" ? "win" : best.ender.result === "D" ? "draw" : "defeat"}{" "}
                    <span className="text-ink-faint">{venuePrefix(best.ender.venue)}</span> {best.ender.opponent_name}
                  </Link>
                  , {fmtMonthYear(best.ender.date)}.
                </>
              ) : null}
            </p>
            {rest.length > 0 && (
              <ul className="mt-3 space-y-1 border-t border-line/70 pt-2.5">
                {rest.map((r) => (
                  <li key={r.from}>
                    <Link
                      href={runHref(r)}
                      className="group flex items-baseline justify-between gap-3 text-xs text-ink-dim transition-colors hover:text-ink focus-ring"
                    >
                      <span className="stat-num">
                        <span className="font-semibold text-ink">{r.length}</span>
                        <span className="text-ink-faint"> · {spanLabel(r)}</span>
                      </span>
                      <span className="text-devil-bright opacity-0 transition-opacity group-hover:opacity-100" aria-hidden>
                        →
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}
