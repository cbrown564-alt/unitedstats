import type { OpponentSeasonSpark } from "@/lib/queries";

export type OpponentSeasonRow = OpponentSeasonSpark & {
  p: number;
  winPct: number;
  ppg: number;
};

export function enrichOpponentSeasons(rows: OpponentSeasonSpark[]): OpponentSeasonRow[] {
  return rows.map((s) => {
    const p = s.w + s.d + s.l;
    return {
      ...s,
      p,
      winPct: p > 0 ? (s.w / p) * 100 : 0,
      ppg: p > 0 ? (3 * s.w + s.d) / p : 0,
    };
  });
}

export function peakWinRateSeasons(seasons: OpponentSeasonRow[]): OpponentSeasonRow[] {
  const max = Math.max(0, ...seasons.map((s) => s.winPct));
  if (max <= 0) return [];
  return seasons.filter((s) => s.p > 0 && s.winPct === max);
}

export function peakPpgSeasons(seasons: OpponentSeasonRow[]): OpponentSeasonRow[] {
  const max = Math.max(0, ...seasons.map((s) => s.ppg));
  if (max <= 0) return [];
  return seasons.filter((s) => s.p > 0 && s.ppg === max);
}

/** Best win-rate season against this opponent — for the hero span pip. */
export function opponentBestSeason(seasons: OpponentSeasonRow[]): OpponentSeasonRow | null {
  const peaks = peakWinRateSeasons(seasons);
  if (peaks.length === 0) return null;
  return peaks[peaks.length - 1]!;
}

export { seasonDecade, seasonSpanAnchor } from "@/lib/managerSeasonHighlights";
