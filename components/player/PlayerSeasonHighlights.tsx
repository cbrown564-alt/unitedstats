import Link from "next/link";
import { fmtNum, fmtSeasonShort } from "@/lib/format";
import type { DefensiveSeasonSplit, SeasonSplit } from "@/lib/playerSeasonHighlights";

/**
 * One-line orientation above the season ledger — peak goal returns and best
 * goal involvement before the user scans the full table.
 */
export function PlayerSeasonHighlights({
  goalPeaks,
  gaPeak,
  cleanSheetPeaks,
  fewestConceded,
}: {
  goalPeaks?: SeasonSplit[];
  gaPeak?: SeasonSplit | null;
  cleanSheetPeaks?: DefensiveSeasonSplit[];
  fewestConceded?: DefensiveSeasonSplit | null;
}) {
  const defensive = cleanSheetPeaks != null || fewestConceded != null;
  if (!defensive) {
    const peaks = goalPeaks ?? [];
    if (peaks.length === 0 && !gaPeak) return null;

    const sameAsGoalPeakOnly =
      gaPeak &&
      peaks.length === 1 &&
      gaPeak.season === peaks[0]!.season &&
      gaPeak.goals === peaks[0]!.goals &&
      gaPeak.assists === peaks[0]!.assists;

    return (
      <p className="flex flex-wrap items-baseline gap-x-4 gap-y-1 text-sm text-ink-dim">
        {peaks.length > 0 && (
          <span>
            <span className="font-medium text-ink">Peak goals</span>
            {" — "}
            {peaks.map((s, i) => (
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

  const csPeaks = cleanSheetPeaks ?? [];
  if (csPeaks.length === 0 && !fewestConceded) return null;

  const sameAsCsPeakOnly =
    fewestConceded &&
    csPeaks.length === 1 &&
    fewestConceded.season === csPeaks[0]!.season;

  return (
    <p className="flex flex-wrap items-baseline gap-x-4 gap-y-1 text-sm text-ink-dim">
      {csPeaks.length > 0 && (
        <span>
          <span className="font-medium text-ink">Peak clean sheets</span>
          {" — "}
          {csPeaks.map((s, i) => (
            <span key={s.season}>
              {i > 0 && " · "}
              <Link href={`/seasons/${s.season}`} className="stat-num text-devil-bright hover:underline focus-ring">
                {fmtSeasonShort(s.season)}
              </Link>
              {" · "}
              <span className="stat-num text-ink">{fmtNum(s.cleanSheets)} clean sheets</span>
            </span>
          ))}
        </span>
      )}
      {fewestConceded && fewestConceded.starts > 0 && !sameAsCsPeakOnly && (
        <span>
          <span className="font-medium text-ink">Fewest conceded</span>
          {" — "}
          <Link href={`/seasons/${fewestConceded.season}`} className="stat-num text-gold hover:underline focus-ring">
            {fmtSeasonShort(fewestConceded.season)}
          </Link>
          {" · "}
          <span className="stat-num text-ink">{fmtNum(fewestConceded.goalsConceded)} goals</span>
        </span>
      )}
    </p>
  );
}
