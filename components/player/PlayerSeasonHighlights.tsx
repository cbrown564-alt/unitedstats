import Link from "next/link";
import { fmtNum, fmtSeasonShort } from "@/lib/format";
import type { SeasonSplit } from "@/lib/playerSeasonHighlights";

/**
 * One-line orientation above the season ledger — peak goal returns and best
 * goal involvement before the user scans the full table.
 */
export function PlayerSeasonHighlights({
  goalPeaks,
  gaPeak,
}: {
  goalPeaks: SeasonSplit[];
  gaPeak: SeasonSplit | null;
}) {
  if (goalPeaks.length === 0 && !gaPeak) return null;

  const sameAsGoalPeakOnly =
    gaPeak &&
    goalPeaks.length === 1 &&
    gaPeak.season === goalPeaks[0]!.season &&
    gaPeak.goals === goalPeaks[0]!.goals &&
    gaPeak.assists === goalPeaks[0]!.assists;

  return (
    <p className="flex flex-wrap items-baseline gap-x-4 gap-y-1 text-sm text-ink-dim">
      {goalPeaks.length > 0 && (
        <span>
          <span className="font-medium text-ink">Peak goals</span>
          {" — "}
          {goalPeaks.map((s, i) => (
            <span key={s.season}>
              {i > 0 && " · "}
              <Link href={`/seasons/${s.season}`} className="stat-num text-devil-bright hover:underline focus-ring">
                {fmtSeasonShort(s.season)}
              </Link>
              {" · "}
              <span className="stat-num text-ink">{fmtNum(s.goals)} goals</span>
            </span>
          ))}
        </span>
      )}
      {gaPeak && gaPeak.goals + gaPeak.assists > 0 && !sameAsGoalPeakOnly && (
        <span>
          <span className="font-medium text-ink">Best G+A</span>
          {" — "}
          <Link href={`/seasons/${gaPeak.season}`} className="stat-num text-gold hover:underline focus-ring">
            {fmtSeasonShort(gaPeak.season)}
          </Link>
          {" · "}
          <span className="stat-num text-ink">
            {fmtNum(gaPeak.goals + gaPeak.assists)} ({fmtNum(gaPeak.goals)}+{fmtNum(gaPeak.assists)})
          </span>
        </span>
      )}
    </p>
  );
}
