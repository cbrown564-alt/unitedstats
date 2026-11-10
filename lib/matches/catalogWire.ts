import type { MatchCatalogRow, MatchGoalEvent, MatchesCatalog } from "./catalogTypes";

export type WireGoal = [string, number | null, string | null, number | null, string | null, number | null, number | null];

type DictionaryColumn = { values: unknown[]; indices: number[] };
export type CatalogColumn = unknown[] | DictionaryColumn;

/** Versioned transport only; the browser restores the existing complete catalog. */
export interface MatchesCatalogWire extends Omit<MatchesCatalog, "matches"> {
  version: 2;
  players: string[];
  idOverrides: [number, string][];
  dates: number[];
  goals: { counts: number[]; columns: CatalogColumn[] };
  groups: { keys: (keyof MatchCatalogRow)[]; column: CatalogColumn }[];
  matches: {
    keys: (keyof MatchCatalogRow)[];
    count: number;
    columns: CatalogColumn[];
  };
}

function* catalogRows(wire: MatchesCatalogWire): Generator<MatchCatalogRow> {
  if (wire.version !== 2) throw new Error("Unsupported match catalog version");
  const { keys, count, columns } = wire.matches;
  if (columns.length !== keys.length) throw new Error("Incomplete match catalog");
  const expand = (column: CatalogColumn) => {
    if (Array.isArray(column)) return column;
    return column.indices.map((index) => {
      if (index < 0 || index >= column.values.length) throw new Error("Invalid match catalog reference");
      return column.values[index];
    });
  };
  const expanded = columns.map(expand);
  const goals = wire.goals.columns.map(expand);
  const groups = wire.groups.map((group) => ({ keys: group.keys, rows: expand(group.column) as unknown[][] }));
  if (expanded.some((column) => column.length !== count)) throw new Error("Incomplete match catalog rows");
  const overrides = new Map(wire.idOverrides);
  const player = (index: number | null) => index === null ? null : wire.players[index];
  let day = 0;
  let goalOffset = 0;
  for (let i = 0; i < count; i++) {
    const row = Object.fromEntries(keys.map((key, k) => [key, expanded[k][i]]));
    for (const group of groups) {
      group.keys.forEach((key, k) => { row[key] = group.rows[i][k]; });
    }
    day += wire.dates[i];
    row.date = new Date(day * 86_400_000).toISOString().slice(0, 10);
    const goalEvents: MatchGoalEvent[] = Array.from({ length: wire.goals.counts[i] }, () => {
      const [type, scorer, player_side, assist, assist_side, minute, added] = goals.map((column) => column[goalOffset]) as WireGoal;
      goalOffset++;
      return { type, player_id: player(scorer), player_side, assist_id: player(assist), assist_side, minute, added };
    });
    yield {
      ...row,
      id: overrides.get(i) ?? `${row.date}-${row.opponent_id}-${String(row.venue).toLowerCase()}`,
      starters: (row.starters as number[]).map((index) => wire.players[index]),
      goalEvents,
    } as MatchCatalogRow;
  }
}

/** Keep the full-record decode from becoming one uninterrupted browser task. */
export async function decodeMatchesCatalog(wire: MatchesCatalogWire): Promise<MatchesCatalog> {
  const matches: MatchCatalogRow[] = [];
  for (const row of catalogRows(wire)) {
    matches.push(row);
    if (matches.length % 256 === 0) {
      const taskScheduler = (globalThis as typeof globalThis & { scheduler?: { yield: () => Promise<void> } }).scheduler;
      if (taskScheduler?.yield) await taskScheduler.yield();
      else await new Promise<void>((resolve) => setTimeout(resolve, 0));
    }
  }
  return { matches, seasons: wire.seasons, seasonTotals: wire.seasonTotals, playerNames: wire.playerNames, options: wire.options };
}
