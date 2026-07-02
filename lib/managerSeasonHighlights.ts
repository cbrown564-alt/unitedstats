import type { ManagerCareerSpark } from "@/lib/queries";

export type ManagerSeasonRow = ManagerCareerSpark & {
  p: number;
  winPct: number;
  ppg: number;
};

export function enrichManagerSeasons(rows: ManagerCareerSpark[]): ManagerSeasonRow[] {
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

export function peakWinRateSeasons(seasons: ManagerSeasonRow[]): ManagerSeasonRow[] {
  const max = Math.max(0, ...seasons.map((s) => s.winPct));
  if (max <= 0) return [];
  return seasons.filter((s) => s.p > 0 && s.winPct === max);
}

export function peakPpgSeasons(seasons: ManagerSeasonRow[]): ManagerSeasonRow[] {
  const max = Math.max(0, ...seasons.map((s) => s.ppg));
  if (max <= 0) return [];
  return seasons.filter((s) => s.p > 0 && s.ppg === max);
}

/** Opening-year anchor for placing a season on the tenure span (August kick-off). */
export function seasonSpanAnchor(season: string): number | null {
  const y = Number(season.slice(0, 4));
  return Number.isFinite(y) ? y + 8 / 12 : null;
}

export { seasonDecade } from "@/lib/playerSeasonHighlights";
