export type SeasonSplit = {
  season: string;
  apps: number;
  starts: number;
  goals: number;
  assists: number;
};

export type DefensiveSeasonSplit = SeasonSplit & {
  cleanSheets: number;
  goalsConceded: number;
};

const PLAYER_SEASON_DECADE_MIN = 15;

export function peakGoalSeasons(seasons: SeasonSplit[]): SeasonSplit[] {
  const max = Math.max(0, ...seasons.map((s) => s.goals));
  if (max <= 0) return [];
  return seasons.filter((s) => s.goals === max);
}

export function peakAssistSeasons(seasons: SeasonSplit[]): SeasonSplit[] {
  const max = Math.max(0, ...seasons.map((s) => s.assists));
  if (max <= 0) return [];
  return seasons.filter((s) => s.assists === max);
}

export function peakGaSeason(seasons: SeasonSplit[]): SeasonSplit | null {
  let best: SeasonSplit | null = null;
  let bestGa = 0;
  for (const s of seasons) {
    const ga = s.goals + s.assists;
    if (ga > bestGa) {
      bestGa = ga;
      best = s;
    }
  }
  return best;
}

export function peakCleanSheetSeasons(seasons: DefensiveSeasonSplit[]): DefensiveSeasonSplit[] {
  const max = Math.max(0, ...seasons.map((s) => s.cleanSheets));
  if (max <= 0) return [];
  return seasons.filter((s) => s.cleanSheets === max);
}

/** Season with the fewest goals conceded among seasons with at least one start. */
export function fewestConcededSeason(seasons: DefensiveSeasonSplit[]): DefensiveSeasonSplit | null {
  const started = seasons.filter((s) => s.starts > 0);
  if (!started.length) return null;
  return started.reduce((best, s) => (s.goalsConceded < best.goalsConceded ? s : best), started[0]!);
}

export function cleanSheetPct(cleanSheets: number, starts: number): number | null {
  return starts > 0 ? (100 * cleanSheets) / starts : null;
}

export function mergeSeasonDefense(
  seasons: SeasonSplit[],
  defensive: { season: string; cleanSheets: number; goalsConceded: number }[],
): DefensiveSeasonSplit[] {
  const defBySeason = new Map(defensive.map((d) => [d.season, d]));
  return seasons.map((s) => {
    const d = defBySeason.get(s.season);
    return {
      ...s,
      cleanSheets: d?.cleanSheets ?? 0,
      goalsConceded: d?.goalsConceded ?? 0,
    };
  });
}

export function seasonDecade(season: string): number {
  return Math.floor(Number(season.slice(0, 4)) / 10) * 10;
}

export function showSeasonDecadeHeaders(seasons: SeasonSplit[]): boolean {
  return seasons.length >= PLAYER_SEASON_DECADE_MIN;
}
