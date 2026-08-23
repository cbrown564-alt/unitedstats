import { getDb } from "../db";
import { buildMatchFacetOptions } from "../matchFacetOptions";
import { MATCH_SELECT, allSeasons, playersIndex, seasonAggregates, type MatchRow } from "../queries";
import type { MatchGoalEvent, MatchesCatalog } from "./catalogTypes";

export type { MatchesCatalog } from "./catalogTypes";
export { filterCatalogMatches } from "./filterCatalog";

export function buildMatchesCatalog(): MatchesCatalog {
  const matches = getDb().prepare(`${MATCH_SELECT} ORDER BY m.date DESC`).all() as MatchRow[];
  const events = getDb()
    .prepare(
      `SELECT match_id, type, player_id, player_side, assist_player_id AS assist_id, assist_side, minute, added_time AS added
       FROM match_events
       WHERE type IN ('goal','pen-goal','own-goal-for')`,
    )
    .all() as (MatchGoalEvent & { match_id: string })[];
  const lineups = getDb()
    .prepare(
      `SELECT match_id, player_id FROM match_lineups
       WHERE player_side = 'united' AND bench = 0`,
    )
    .all() as { match_id: string; player_id: string }[];

  const eventsByMatch = new Map<string, MatchGoalEvent[]>();
  for (const event of events) {
    const list = eventsByMatch.get(event.match_id) ?? [];
    list.push({
      type: event.type,
      player_id: event.player_id,
      player_side: event.player_side,
      assist_id: event.assist_id,
      assist_side: event.assist_side,
      minute: event.minute,
      added: event.added,
    });
    eventsByMatch.set(event.match_id, list);
  }
  const startersByMatch = new Map<string, string[]>();
  for (const row of lineups) {
    const list = startersByMatch.get(row.match_id) ?? [];
    list.push(row.player_id);
    startersByMatch.set(row.match_id, list);
  }

  const playerNames: Record<string, string> = {};
  for (const player of playersIndex()) playerNames[player.player_id] = player.name;

  return {
    matches: matches.map((match) => ({
      ...match,
      starters: startersByMatch.get(match.id) ?? [],
      goalEvents: eventsByMatch.get(match.id) ?? [],
    })),
    seasons: allSeasons(),
    seasonTotals: Object.fromEntries(seasonAggregates().map((season) => [season.season, season.p])),
    playerNames,
    options: buildMatchFacetOptions(),
  };
}
