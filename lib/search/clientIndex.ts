import { getDb } from "../db";
import { allIndexRows, type IndexRow } from "./resolve";

interface SearchDateHit {
  id: string;
  opponent_name: string;
  gf: number;
  ga: number;
}

/** Build-time search dump: entity rows plus an exact-date → match map. */
export interface SearchIndex {
  rows: IndexRow[];
  dates: Record<string, SearchDateHit[]>;
}

export function buildSearchIndex(): SearchIndex {
  const rows = allIndexRows();
  const dates: Record<string, SearchDateHit[]> = {};
  const matches = getDb()
    .prepare("SELECT id, date, opponent_name, gf, ga FROM matches")
    .all() as (SearchDateHit & { date: string })[];
  for (const match of matches) {
    const list = dates[match.date] ?? [];
    list.push({
      id: match.id,
      opponent_name: match.opponent_name,
      gf: match.gf,
      ga: match.ga,
    });
    dates[match.date] = list;
  }
  return { rows, dates };
}
