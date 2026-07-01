export type SeasonSplit = {
  season: string;
  apps: number;
  starts: number;
  goals: number;
  assists: number;
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

export function seasonDecade(season: string): number {
  return Math.floor(Number(season.slice(0, 4)) / 10) * 10;
}

export function showSeasonDecadeHeaders(seasons: SeasonSplit[]): boolean {
  return seasons.length >= PLAYER_SEASON_DECADE_MIN;
}
