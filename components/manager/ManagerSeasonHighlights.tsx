import Link from "next/link";
import type { ManagerSeasonRow } from "@/lib/managerSeasonHighlights";
import { fmtNum, fmtSeasonShort, pct } from "@/lib/format";

/**
 * One-line orientation above the season ledger — best win-rate and PPG seasons
 * before the user scans the full table.
 */
export function ManagerSeasonHighlights({
  winPeaks,
  ppgPeaks,
}: {
  winPeaks: ManagerSeasonRow[];
  ppgPeaks: ManagerSeasonRow[];
}) {
  if (winPeaks.length === 0 && ppgPeaks.length === 0) return null;

  const samePeak =
    winPeaks.length === 1 &&
    ppgPeaks.length === 1 &&
    winPeaks[0]!.season === ppgPeaks[0]!.season;

  return (
    <p className="flex flex-wrap items-baseline gap-x-4 gap-y-1 text-sm text-ink-dim">
      {winPeaks.length > 0 && (
        <span>
          <span className="font-medium text-ink">Best win rate</span>
          {" — "}
          {winPeaks.map((s, i) => (
            <span key={s.season}>
              {i > 0 && " · "}
              <Link href={`/seasons/${s.season}`} className="stat-num text-win hover:underline focus-ring">
                {fmtSeasonShort(s.season)}
              </Link>
              {" · "}
              <span className="stat-num text-ink">{pct(s.w, s.p)}</span>
              <span className="text-ink-faint"> ({fmtNum(s.p)} matches)</span>
            </span>
          ))}
        </span>
      )}
      {ppgPeaks.length > 0 && !samePeak && (
        <span>
          <span className="font-medium text-ink">Best PPG</span>
          {" — "}
          {ppgPeaks.map((s, i) => (
            <span key={s.season}>
              {i > 0 && " · "}
              <Link href={`/seasons/${s.season}`} className="stat-num text-devil-bright hover:underline focus-ring">
                {fmtSeasonShort(s.season)}
              </Link>
              {" · "}
              <span className="stat-num text-ink">{s.ppg.toFixed(2)}</span>
            </span>
          ))}
        </span>
      )}
    </p>
  );
}
