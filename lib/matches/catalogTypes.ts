import type { FacetOptions } from "../matchFacets";
import type { MatchRow } from "../queries";

export interface MatchGoalEvent {
  type: string;
  player_id: string | null;
  player_side: string | null;
  assist_id: string | null;
  assist_side: string | null;
  minute: number | null;
  added: number | null;
}

export type MatchCatalogRow = MatchRow & {
  starters: string[];
  goalEvents: MatchGoalEvent[];
};

export interface MatchesCatalog {
  matches: MatchCatalogRow[];
  seasons: string[];
  seasonTotals: Record<string, number>;
  playerNames: Record<string, string>;
  options: FacetOptions;
}
