import { seasonOfDate } from "../scripts/lib";

export interface RevalidationMatch {
  id: string;
  date: string;
  opponentId: string;
}

export interface RevalidationExtras {
  playerIds?: string[];
  managerId?: string | null;
}

/** Surfaces whose aggregates move when the live record advances. */
const STATIC_SURFACES = [
  "/",
  "/analytics",
  "/data",
  "/explore",
  "/managers",
  "/transfers",
  "/matches",
  "/players",
  "/seasons",
] as const;

/** Read-only API handlers that cache immutable-data responses. */
const API_SURFACES = [
  "/api/v1/meta",
  "/api/v1/matches",
  "/api/v1/matches/view",
  "/api/v1/matches/facets",
  "/api/v1/matches/facet-options",
  "/api/v1/matches/chip-counts",
  "/api/v1/players",
  "/api/v1/opponents",
  "/api/v1/managers",
  "/api/v1/seasons",
] as const;

function monthDay(date: string): string {
  return date.slice(5); // MM-DD
}

/**
 * Paths to invalidate after new result(s) land. Historical entity pages that
 * did not change are intentionally omitted — their HTML is still correct.
 */
export function revalidationPathsForMatches(
  matches: RevalidationMatch[],
  extras: RevalidationExtras = {},
): string[] {
  const paths = new Set<string>([...STATIC_SURFACES, ...API_SURFACES]);

  for (const match of matches) {
    paths.add(`/match/${match.id}`);
    paths.add(`/seasons/${seasonOfDate(match.date)}`);
    paths.add(`/opponent/${match.opponentId}`);
    paths.add(`/on-this-day/${monthDay(match.date)}`);
  }

  for (const playerId of extras.playerIds ?? []) {
    if (playerId) paths.add(`/player/${playerId}`);
  }

  if (extras.managerId) paths.add(`/manager/${extras.managerId}`);

  return [...paths].sort();
}
