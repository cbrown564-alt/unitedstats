/**
 * Integrity checks on canonical data. Exits non-zero on any error.
 * Runs in CI and as the gate before the update pipeline commits.
 */
import path from "node:path";
import fs from "node:fs";
import {
  CANONICAL, MATCHES_DIR, SeasonFile,
  listSeasonFiles, readJson, seasonOfDate, transferSeasonOfDate,
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
const opponents = new Set(
  readJson<{ opponents: Ref[] }>(path.join(CANONICAL, "opponents.json")).opponents.map((o) => o.id),
);
const managerData = readJson<{
  managers: { id: string; tenures: { from: string; to: string | null }[] }[];
}>(path.join(CANONICAL, "managers.json")).managers;

/** Manager ids whose tenure window contains `date` (mirrors build-db's managerFor). */
function managersCovering(date: string): string[] {
  return managerData
    .filter((m) => m.tenures.some((t) => date >= t.from && (t.to === null || date <= t.to)))
    .map((m) => m.id);
}
// Earliest recorded tenure. Before this, the side was run by committee and a null
// manager is correct; on or after it, every match must map to a manager — a hole
// means a stale or mis-dated tenure (e.g. a succession that was never recorded).
const earliestTenureFrom = managerData
  .flatMap((m) => m.tenures.map((t) => t.from))
  .reduce((a, b) => (a < b ? a : b));
const playerShirtsFile = path.join(CANONICAL, "player-shirts.json");

const errors: string[] = [];
const warnings: string[] = [];
const seenIds = new Set<string>();
let matchCount = 0;
// Latest date each United player actually featured (started or came on), used to
// catch departures dated before a player who was demonstrably still playing.
const lastAppearance = new Map<string, string>();

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
    // opponents.json is supplementary metadata (country + coordinates for travel
    // maps), not a hard FK — build-db derives the opponents table from matches and
    // fills the rest with null coords. So a missing entry only degrades the travel
    // map; warn rather than fail.
    if (!opponents.has(m.opponentId)) warnings.push(`${ctx}: opponent "${m.opponentId}" not in opponents.json (no coords/country)`);
    if (!["H", "A", "N"].includes(m.venue)) errors.push(`${ctx}: bad venue`);
    if (m.stadium && !stadiums.has(m.stadium)) errors.push(`${ctx}: unknown stadium "${m.stadium}"`);
    // Every match in the managerial era must map to a manager, or build-db credits
    // it to none (manager_id = null). Overlaps are reported separately below, so
    // here only an uncovered date within the era is fatal.
    if (m.date >= earliestTenureFrom && managersCovering(m.date).length === 0) {
      errors.push(`${ctx}: no manager tenure covers ${m.date}`);
    }
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
        else if (l.start || l.on != null) {
          const prev = lastAppearance.get(l.player);
          if (!prev || m.date > prev) lastAppearance.set(l.player, m.date);
        }
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

const transfersFile = path.join(CANONICAL, "transfers.json");
if (fs.existsSync(transfersFile)) {
  const transfers = readJson<{
    transfers: {
      id: string;
      player: string | null;
      playerName: string;
      direction: string;
      date: string | null;
      datePrecision: string | null;
      season: string | null;
      fee: { gbp: number | null; kind: string };
      type: string;
      sources: string[];
    }[];
  }>(transfersFile).transfers;
  const seenTransferIds = new Set<string>();
  for (const t of transfers) {
    const ctx = `transfer ${t.id}`;
    if (seenTransferIds.has(t.id)) errors.push(`${ctx}: duplicate id`);
    seenTransferIds.add(t.id);
    if (!t.playerName) errors.push(`${ctx}: missing player name`);
    if (t.player && !players.has(t.player)) errors.push(`${ctx}: unknown player "${t.player}"`);
    if (!["in", "out"].includes(t.direction)) errors.push(`${ctx}: bad direction "${t.direction}"`);
    if (!["permanent", "loan", "youth", "released", "retired"].includes(t.type)) {
      errors.push(`${ctx}: bad type "${t.type}"`);
    }
    if (!["fee", "free", "undisclosed", "unknown", "none"].includes(t.fee.kind)) {
      errors.push(`${ctx}: bad fee kind "${t.fee.kind}"`);
    }
    // A fee value only makes sense for a "fee" kind, and never as zero/negative.
    if (t.fee.kind === "fee" && (t.fee.gbp == null || t.fee.gbp <= 0)) {
      errors.push(`${ctx}: fee kind without a positive amount`);
    }
    if (t.fee.kind !== "fee" && t.fee.gbp != null) errors.push(`${ctx}: ${t.fee.kind} fee carries an amount`);
    if (t.date !== null) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(t.date)) errors.push(`${ctx}: bad date "${t.date}"`);
      else if (t.season && transferSeasonOfDate(t.date) !== t.season) {
        errors.push(`${ctx}: season "${t.season}" != ${transferSeasonOfDate(t.date)} for ${t.date}`);
      }
    }
    for (const s of t.sources) if (!sources.has(s)) errors.push(`${ctx}: unknown source "${s}"`);
  }

  // A permanent exit can't be followed by appearances for United. For each player,
  // take their last permanent departure (loans return, so they don't count) and,
  // unless a later "in" re-signed them, no later match may feature them. Catches a
  // departure dated a season early — a contract end logged a year before the player
  // actually left, while he was demonstrably still in the team (e.g. Casemiro).
  //
  // Precision matters: a day-precise exit is checked against the exact match date,
  // but month/year-only dates are padded (to -01 / -07-01) and aren't real days, so
  // an appearance later in the *same* season is just date fuzz, not a contradiction.
  // For those we only flag an appearance in a strictly later season.
  // Known legacy name-collisions: two distinct players share one slug because the
  // resolver can't tell same-named men decades apart (e.g. an 1899 signing and a
  // 1920s namesake). Their merged appearances span an impossible range; that's an
  // identity-disambiguation problem tracked separately, not a transfer-date error,
  // so it's exempt from this check rather than masking the real recent cases.
  const COLLISION_EXEMPT = new Set(["james-bain", "john-scott"]);
  const PERMANENT_EXIT = new Set(["permanent", "released", "retired"]);
  const startYear = (season: string | null) => (season ? parseInt(season.slice(0, 4), 10) : NaN);
  const lastExit = new Map<string, { date: string; precision: string | null; season: string | null; name: string }>();
  const lastReturn = new Map<string, string>();
  for (const t of transfers) {
    if (!t.player || !t.date) continue;
    if (t.direction === "out" && PERMANENT_EXIT.has(t.type)) {
      const prev = lastExit.get(t.player);
      if (!prev || t.date > prev.date) {
        lastExit.set(t.player, { date: t.date, precision: t.datePrecision, season: t.season, name: t.playerName });
      }
    } else if (t.direction === "in") {
      const prev = lastReturn.get(t.player);
      if (!prev || t.date > prev) lastReturn.set(t.player, t.date);
    }
  }
  for (const [player, exit] of lastExit) {
    if (COLLISION_EXEMPT.has(player)) continue;
    const returned = lastReturn.get(player);
    if (returned && returned > exit.date) continue; // re-signed after leaving
    const seen = lastAppearance.get(player);
    if (!seen) continue;
    if (exit.precision === "day") {
      if (seen > exit.date) {
        errors.push(`transfer: ${exit.name} left on ${exit.date} but features in a lineup on ${seen}`);
      }
    } else if (startYear(seasonOfDate(seen)) > startYear(exit.season)) {
      errors.push(`transfer: ${exit.name} left in ${exit.season} but features in a lineup on ${seen}`);
    }
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
