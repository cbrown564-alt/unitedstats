/**
 * Integrity checks on canonical data. Exits non-zero on any error.
 * Runs in CI and as the gate before the update pipeline commits.
 */
import path from "node:path";
import fs from "node:fs";
import {
  CANONICAL, MATCHES_DIR, SeasonFile,
  listSeasonFiles, readJson, seasonOfDate,
} from "./lib";

interface Ref { id: string }
const competitions = new Set(
  readJson<{ competitions: Ref[] }>(path.join(CANONICAL, "competitions.json")).competitions.map((c) => c.id),
);
const stadiums = new Set(
  readJson<{ stadiums: Ref[] }>(path.join(CANONICAL, "stadiums.json")).stadiums.map((s) => s.id),
);
const players = new Set(
  readJson<{ players: Ref[] }>(path.join(CANONICAL, "players.json")).players.map((p) => p.id),
);
const playerRecordsFile = path.join(CANONICAL, "player-records.json");
if (fs.existsSync(playerRecordsFile)) {
  for (const record of readJson<{ records: { playerId: string }[] }>(playerRecordsFile).records) {
    players.add(record.playerId);
  }
}
const sources = new Set(
  readJson<{ sources: Ref[] }>(path.join(CANONICAL, "sources.json")).sources.map((s) => s.id),
);
const managerData = readJson<{
  managers: { id: string; tenures: { from: string; to: string | null }[] }[];
}>(path.join(CANONICAL, "managers.json")).managers;
const playerShirtsFile = path.join(CANONICAL, "player-shirts.json");

const errors: string[] = [];
const warnings: string[] = [];
const seenIds = new Set<string>();
let matchCount = 0;

for (const file of listSeasonFiles()) {
  const sf = readJson<SeasonFile>(path.join(MATCHES_DIR, file));
  const expectSeason = file.replace(".json", "");
  if (sf.season !== expectSeason) {
    errors.push(`${file}: season field "${sf.season}" != filename`);
  }
  let prevDate = "";
  for (const m of sf.matches) {
    matchCount++;
    const ctx = `${file} ${m.id}`;
    if (!m.id || !m.date || !m.opponent || !m.opponentId) {
      errors.push(`${ctx}: missing required field`);
      continue;
    }
    if (seenIds.has(m.id)) errors.push(`${ctx}: duplicate match id`);
    seenIds.add(m.id);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(m.date)) errors.push(`${ctx}: bad date`);
    if (seasonOfDate(m.date) !== sf.season) {
      // June boundary edge cases (e.g. late-season tours) are warnings only
      warnings.push(`${ctx}: date ${m.date} outside nominal season window`);
    }
    if (m.date < prevDate) errors.push(`${ctx}: not date-ordered`);
    prevDate = m.date;
    if (!competitions.has(m.competition)) errors.push(`${ctx}: unknown competition "${m.competition}"`);
    if (!["H", "A", "N"].includes(m.venue)) errors.push(`${ctx}: bad venue`);
    if (m.stadium && !stadiums.has(m.stadium)) errors.push(`${ctx}: unknown stadium "${m.stadium}"`);
    if (!Array.isArray(m.sources) || m.sources.length === 0) {
      errors.push(`${ctx}: missing sources`);
    } else {
      for (const s of m.sources) {
        if (!sources.has(s)) errors.push(`${ctx}: unknown source "${s}"`);
      }
    }
    const ft = m.score?.ft;
    if (!ft || ft.length !== 2 || ft.some((g) => !Number.isInteger(g) || g < 0 || g > 30)) {
      errors.push(`${ctx}: bad score`);
    }
    if (m.attendance != null && (m.attendance < 0 || m.attendance > 200000)) {
      errors.push(`${ctx}: implausible attendance ${m.attendance}`);
    }
    let goalsInEvents = 0;
    let goalsAgainstInEvents = 0;
    for (const e of m.events ?? []) {
      if (e.minute != null && (e.minute < 0 || e.minute > 125)) {
        errors.push(`${ctx}: bad minute ${e.minute}`);
      }
      if (e.addedTime != null) {
        if (!Number.isInteger(e.addedTime) || e.addedTime < 1 || e.addedTime > 30) {
          errors.push(`${ctx}: bad added time ${e.addedTime}`);
        }
        if (e.minute == null) errors.push(`${ctx}: added time without a minute`);
        else if (![45, 90, 105, 120].includes(e.minute)) {
          errors.push(`${ctx}: added time on minute ${e.minute} (not a period boundary)`);
        }
      }
      if (e.player && !players.has(e.player)) errors.push(`${ctx}: unknown player "${e.player}"`);
      if (e.assist && !players.has(e.assist)) errors.push(`${ctx}: unknown assist player "${e.assist}"`);
      if (e.playerSide && !["united", "opponent"].includes(e.playerSide)) errors.push(`${ctx}: bad event player side "${e.playerSide}"`);
      if (e.assistSide && !["united", "opponent"].includes(e.assistSide)) errors.push(`${ctx}: bad event assist side "${e.assistSide}"`);
      if ((e.type === "opp-goal" || e.playerSide === "opponent") && !e.playerName && !e.detail) {
        warnings.push(`${ctx}: opposition event without display name`);
      }
      if (["goal", "pen-goal", "own-goal-for"].includes(e.type)) goalsInEvents++;
      if (["opp-goal", "own-goal-against"].includes(e.type)) goalsAgainstInEvents++;
    }
    if (m.eventsComplete && ft && goalsInEvents !== ft[0]) {
      errors.push(`${ctx}: eventsComplete but ${goalsInEvents} scoring events != ${ft[0]} goals`);
    }
    if (ft && goalsAgainstInEvents > ft[1]) {
      errors.push(`${ctx}: ${goalsAgainstInEvents} opposition scoring events > ${ft[1]} goals against`);
    }
    const lineupPlayers = new Set<string>();
    for (const l of m.lineup ?? []) {
      const side = l.playerSide ?? "united";
      if (!["united", "opponent"].includes(side)) errors.push(`${ctx}: bad lineup side "${side}"`);
      if (side === "united") {
        if (!l.player) errors.push(`${ctx}: United lineup row missing player id`);
        else if (!players.has(l.player)) errors.push(`${ctx}: unknown lineup player "${l.player}"`);
      }
      const lineupKey = `${side}|${l.player ?? l.providerId ?? l.playerName ?? ""}`;
      if (lineupPlayers.has(lineupKey)) errors.push(`${ctx}: duplicate lineup player "${lineupKey}"`);
      lineupPlayers.add(lineupKey);
      if (l.shirt != null && (!Number.isInteger(l.shirt) || l.shirt < 1 || l.shirt > 99)) {
        errors.push(`${ctx}: bad shirt number ${l.shirt} for "${l.player ?? l.playerName}"`);
      }
      if (l.on != null && (l.on < 0 || l.on > 125)) errors.push(`${ctx}: bad sub-on minute ${l.on}`);
      if (l.off != null && (l.off < 0 || l.off > 125)) errors.push(`${ctx}: bad sub-off minute ${l.off}`);
      if (!l.start && !l.bench && l.on == null) warnings.push(`${ctx}: substitute "${l.player ?? l.playerName}" has no sub-on minute`);
    }
    const unitedLineupRows = (m.lineup ?? []).filter((l) => (l.playerSide ?? "united") === "united");
    const starters = unitedLineupRows.filter((l) => l.start).length;
    if (unitedLineupRows.length > 0 && starters !== 11) {
      errors.push(`${ctx}: ${starters} starters (expected 11)`);
    }
  }
}

// manager tenures must not overlap
const spans = managerData
  .flatMap((m) => m.tenures.map((t) => ({ id: m.id, ...t })))
  .sort((a, b) => a.from.localeCompare(b.from));
for (let i = 1; i < spans.length; i++) {
  const prev = spans[i - 1];
  if (prev.to !== null && spans[i].from <= prev.to) {
    errors.push(`manager tenure overlap: ${prev.id} and ${spans[i].id} around ${spans[i].from}`);
  }
}

if (fs.existsSync(playerShirtsFile)) {
  const playerShirts = readJson<{
    records: {
      playerId: string;
      shirt: number;
      decade: string;
      apps: number;
      firstDate: string;
      lastDate: string;
      sourceId: string;
    }[];
  }>(playerShirtsFile).records;
  const seenShirtRows = new Set<string>();
  for (const row of playerShirts) {
    const ctx = `player-shirts ${row.playerId} #${row.shirt} ${row.decade}`;
    if (!players.has(row.playerId)) errors.push(`${ctx}: unknown player`);
    if (!sources.has(row.sourceId)) errors.push(`${ctx}: unknown source "${row.sourceId}"`);
    if (!Number.isInteger(row.shirt) || row.shirt < 1 || row.shirt > 99) {
      errors.push(`${ctx}: bad shirt number`);
    }
    if (!Number.isInteger(row.apps) || row.apps < 1) errors.push(`${ctx}: bad apps count`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(row.firstDate) || !/^\d{4}-\d{2}-\d{2}$/.test(row.lastDate)) {
      errors.push(`${ctx}: bad date range`);
    }
    if (row.firstDate > row.lastDate) errors.push(`${ctx}: first date after last date`);
    if (!/^\d{3}0s$/.test(row.decade)) errors.push(`${ctx}: bad decade`);
    const key = `${row.playerId}|${row.shirt}|${row.decade}|${row.sourceId}`;
    if (seenShirtRows.has(key)) errors.push(`${ctx}: duplicate row`);
    seenShirtRows.add(key);
  }
}

if (warnings.length) {
  console.warn(`${warnings.length} warning(s):`);
  for (const w of warnings.slice(0, 20)) console.warn("  ~ " + w);
}
if (errors.length) {
  console.error(`VALIDATION FAILED — ${errors.length} error(s):`);
  for (const e of errors.slice(0, 50)) console.error("  ✗ " + e);
  process.exit(1);
}
console.log(`validate: OK — ${matchCount} matches across ${listSeasonFiles().length} seasons, 0 errors, ${warnings.length} warnings`);
