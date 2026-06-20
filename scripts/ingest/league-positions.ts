/**
 * Compute Manchester United's final league position for every season from the
 * full engsoccerdata league results (all clubs), plus openfootball for seasons
 * engsoccerdata lacks (2022-23, 2025-26). Writes
 * data/canonical/league-positions.json (United's row) and
 * data/canonical/league-tables.json (the full final table — every club — for the
 * division United played in, so the season page can render the classic table).
 *
 * The full table and United's position come from the *same* computation, so the
 * two files can never disagree: United's stored position is just the rank of its
 * row in the table written alongside it.
 *
 * Era rules:
 *  - points: 2 per win through 1980-81, 3 per win from 1981-82
 *  - tiebreak: goal average (GF/GA) through 1975-76, goal difference after
 */
import fs from "node:fs";
import path from "node:path";
import { CANONICAL, RAW, parseCsv, seasonKey, writeJson } from "../lib";

interface TeamRow { p: number; w: number; d: number; l: number; gf: number; ga: number }

function table(results: { home: string; away: string; hg: number; ag: number }[], startYear: number) {
  const teams = new Map<string, TeamRow>();
  const get = (t: string) => {
    let r = teams.get(t);
    if (!r) { r = { p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0 }; teams.set(t, r); }
    return r;
  };
  for (const m of results) {
    const h = get(m.home);
    const a = get(m.away);
    h.p++; a.p++;
    h.gf += m.hg; h.ga += m.ag;
    a.gf += m.ag; a.ga += m.hg;
    if (m.hg > m.ag) { h.w++; a.l++; }
    else if (m.hg < m.ag) { a.w++; h.l++; }
    else { h.d++; a.d++; }
  }
  const ptsPerWin = startYear >= 1981 ? 3 : 2;
  const rows = [...teams.entries()].map(([team, r]) => ({
    team,
    ...r,
    pts: r.w * ptsPerWin + r.d,
    tiebreak: startYear >= 1976 ? r.gf - r.ga : r.ga === 0 ? r.gf : r.gf / r.ga,
  }));
  rows.sort((x, y) => y.pts - x.pts || y.tiebreak - x.tiebreak || y.gf - x.gf);
  return rows;
}

interface PositionEntry {
  season: string;
  competition: string;
  position: number;
  teams: number;
  pts: number;
  note?: string;
}

/** A single club's row in a final table, ranked by `position` (1 = champions). */
interface TableRow {
  position: number;
  team: string;
  p: number;
  w: number;
  d: number;
  l: number;
  gf: number;
  ga: number;
  pts: number;
}

/** The full final table of the division United played in, for one season. */
interface SeasonTable {
  season: string;
  competition: string;
  teams: number;
  rows: TableRow[];
}

const MU = "Manchester United";

/** Rank a computed (already-sorted) table into positioned rows, 1 = champions. */
function rankRows(sorted: ReturnType<typeof table>): TableRow[] {
  return sorted.map((r, i) => ({
    position: i + 1,
    team: r.team,
    p: r.p,
    w: r.w,
    d: r.d,
    l: r.l,
    gf: r.gf,
    ga: r.ga,
    pts: r.pts,
  }));
}

function fromEngsoccerdata(): { positions: PositionEntry[]; tables: SeasonTable[] } {
  const rows = parseCsv(fs.readFileSync(path.join(RAW, "england.csv"), "utf8"));
  // group by season+tier, but only tiers United played in
  const grouped = new Map<string, { home: string; away: string; hg: number; ag: number }[]>();
  const muTier = new Map<string, number>();
  for (const r of rows) {
    const key = `${r.Season}|${r.tier}`;
    let list = grouped.get(key);
    if (!list) { list = []; grouped.set(key, list); }
    list.push({ home: r.home, away: r.visitor, hg: parseInt(r.hgoal, 10), ag: parseInt(r.vgoal, 10) });
    if (r.home === MU || r.visitor === MU) muTier.set(r.Season, parseInt(r.tier, 10));
  }
  const positions: PositionEntry[] = [];
  const tables: SeasonTable[] = [];
  for (const [seasonStr, tier] of muTier) {
    const startYear = parseInt(seasonStr, 10);
    const rowsFor = grouped.get(`${seasonStr}|${tier}`)!;
    const t = table(rowsFor, startYear);
    const pos = t.findIndex((r) => r.team === MU) + 1;
    if (pos === 0) continue;
    const season = seasonKey(startYear);
    const competition =
      tier === 2 ? "second-division" : startYear >= 1992 ? "premier-league" : "first-division";
    positions.push({ season, competition, position: pos, teams: t.length, pts: t[pos - 1].pts });
    tables.push({ season, competition, teams: t.length, rows: rankRows(t) });
  }
  return { positions, tables };
}

async function fromOpenfootball(
  season: string,
): Promise<{ position: PositionEntry; table: SeasonTable } | null> {
  const url = `https://raw.githubusercontent.com/openfootball/england/master/${season}/1-premierleague.txt`;
  const res = await fetch(url, { headers: { "user-agent": "unitedstats-pipeline" } });
  if (!res.ok) return null;
  const text = await res.text();
  const startYear = parseInt(season.slice(0, 4), 10);
  // reuse the pipeline parser via a light inline parse (same two formats)
  const { parseOpenfootball } = await import("../../pipeline/update");
  const fixtures = parseOpenfootball(text, startYear).map((f) => ({
    home: f.home.replace(/\s+(FC|AFC)$/, "").replace(/^Manchester United$/, MU),
    away: f.away.replace(/\s+(FC|AFC)$/, "").replace(/^Manchester United$/, MU),
    hg: f.ft[0],
    ag: f.ft[1],
  }));
  if (fixtures.length < 100) return null; // incomplete season; skip
  const t = table(fixtures, startYear);
  const pos = t.findIndex((r) => r.team === MU) + 1;
  if (pos === 0) return null;
  return {
    position: {
      season,
      competition: "premier-league",
      position: pos,
      teams: t.length,
      pts: t[pos - 1].pts,
      note: "computed from openfootball",
    },
    table: { season, competition: "premier-league", teams: t.length, rows: rankRows(t) },
  };
}

async function main() {
  const { positions: entries, tables } = fromEngsoccerdata();
  const have = new Set(entries.map((e) => e.season));
  for (const season of ["2022-23", "2025-26"]) {
    if (have.has(season)) continue;
    const e = await fromOpenfootball(season);
    if (e) {
      entries.push(e.position);
      tables.push(e.table);
    } else console.warn(`WARN: could not compute position for ${season}`);
  }
  entries.sort((a, b) => a.season.localeCompare(b.season));
  tables.sort((a, b) => a.season.localeCompare(b.season));
  writeJson(path.join(CANONICAL, "league-positions.json"), { positions: entries });
  writeJson(path.join(CANONICAL, "league-tables.json"), { tables });
  console.log(`league-positions: ${entries.length} seasons; league-tables: ${tables.length} tables written`);
}

main();
