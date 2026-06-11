/**
 * Compute Manchester United's final league position for every season from the
 * full engsoccerdata league results (all clubs), plus openfootball for seasons
 * engsoccerdata lacks (2022-23, 2025-26). Writes
 * data/canonical/league-positions.json.
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

const MU = "Manchester United";

function fromEngsoccerdata(): PositionEntry[] {
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
  const out: PositionEntry[] = [];
  for (const [seasonStr, tier] of muTier) {
    const startYear = parseInt(seasonStr, 10);
    const rowsFor = grouped.get(`${seasonStr}|${tier}`)!;
    const t = table(rowsFor, startYear);
    const pos = t.findIndex((r) => r.team === MU) + 1;
    if (pos === 0) continue;
    out.push({
      season: seasonKey(startYear),
      competition: tier === 2 ? "second-division" : startYear >= 1992 ? "premier-league" : "first-division",
      position: pos,
      teams: t.length,
      pts: t[pos - 1].pts,
    });
  }
  return out;
}

async function fromOpenfootball(season: string): Promise<PositionEntry | null> {
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
    season,
    competition: "premier-league",
    position: pos,
    teams: t.length,
    pts: t[pos - 1].pts,
    note: "computed from openfootball",
  };
}

async function main() {
  const entries = fromEngsoccerdata();
  const have = new Set(entries.map((e) => e.season));
  for (const season of ["2022-23", "2025-26"]) {
    if (have.has(season)) continue;
    const e = await fromOpenfootball(season);
    if (e) entries.push(e);
    else console.warn(`WARN: could not compute position for ${season}`);
  }
  entries.sort((a, b) => a.season.localeCompare(b.season));
  writeJson(path.join(CANONICAL, "league-positions.json"), { positions: entries });
  console.log(`league-positions: ${entries.length} seasons written`);
}

main();
