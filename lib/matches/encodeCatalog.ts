import { brotliCompressSync, constants } from "node:zlib";
import type { MatchCatalogRow, MatchesCatalog } from "./catalogTypes";
import type { CatalogColumn, MatchesCatalogWire, WireGoal } from "./catalogWire";

// Match the audit server's compression level when choosing a representation.
function compressedSize(value: unknown): number {
  return brotliCompressSync(Buffer.from(JSON.stringify(value)), {
    params: { [constants.BROTLI_PARAM_QUALITY]: 4 },
  }).length;
}

/** Build-only encoding: retain every field, row, event, and source verbatim. */
export function encodeMatchesCatalog(catalog: MatchesCatalog): MatchesCatalogWire {
  const players: string[] = [];
  const playerIds = new Map<string, number>();
  const ref = (id: string | null): number | null => {
    if (id === null) return null;
    let index = playerIds.get(id);
    if (index === undefined) {
      index = players.length;
      playerIds.set(id, index);
      players.push(id);
    }
    return index;
  };
  const idOverrides: [number, string][] = [];
  const dates: number[] = [];
  let previousDay = 0;
  const goalRows: WireGoal[] = [];
  const counts: number[] = [];
  const rows = catalog.matches.map(({ id, date, starters, goalEvents, ...row }, i) => {
    if (id !== `${date}-${row.opponent_id}-${row.venue.toLowerCase()}`) idOverrides.push([i, id]);
    const day = Date.parse(date) / 86_400_000;
    dates.push(day - previousDay);
    previousDay = day;
    counts.push(goalEvents.length);
    goalRows.push(...goalEvents.map((e): WireGoal => [e.type, ref(e.player_id), e.player_side, ref(e.assist_id), e.assist_side, e.minute, e.added]));
    return {
      ...row,
      starters: starters.map(ref),
    };
  });
  const keys = Object.keys(rows[0] ?? {}) as (keyof Omit<MatchCatalogRow, "id" | "date" | "goalEvents">)[];
  const pack = (column: unknown[]): CatalogColumn => {
    const values: unknown[] = [];
    const seen = new Map<string, number>();
    const indices = column.map((value) => {
      const serialized = JSON.stringify(value);
      let index = seen.get(serialized);
      if (index === undefined) {
        index = values.length;
        seen.set(serialized, index);
        values.push(value);
      }
      return index;
    });
    const dictionary = { values, indices };
    return compressedSize(dictionary) < compressedSize(column) ? dictionary : column;
  };
  // Correlated fields share one reference, rather than repeating the same
  // opponent/stadium/competition and result metadata independently per row.
  const groupKeys: (keyof typeof rows[number])[][] = [
    ["opponent_id", "opponent_name"],
    ["stadium_id", "stadium_name", "stadium_city", "stadium_country"],
    ["competition_id", "competition_name", "competition_type"],
    ["manager_id", "manager_name"],
    ["gf", "ga", "result", "outcome"],
  ];
  const grouped = new Set(groupKeys.flat());
  const remainingKeys = keys.filter((key) => !grouped.has(key));
  const columns = remainingKeys.map((key) => pack(rows.map((match) => match[key])));
  const groups = groupKeys.map((keys) => ({ keys, column: pack(rows.map((row) => keys.map((key) => row[key]))) }));
  const goals = { counts, columns: Array.from({ length: 7 }, (_, key) => pack(goalRows.map((row) => row[key]))) };
  return { ...catalog, version: 2, players, idOverrides, dates, goals, groups, matches: { keys: remainingKeys, count: rows.length, columns } };
}
