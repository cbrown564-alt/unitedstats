/**
 * Enrich canonical matches from dcaribou/transfermarkt-datasets.
 *
 * The public dataset is Transfermarkt-derived and published as CC0 by the
 * dataset project. It currently gives strong modern coverage for Manchester
 * United: match metadata, goals, cards, substitutions, and full lineups.
 *
 * Usage:
 *   tsx scripts/ingest/transfermarkt-datasets.ts 2024-25
 *   tsx scripts/ingest/transfermarkt-datasets.ts 2013-14 2025-26 --write
 *   tsx scripts/ingest/transfermarkt-datasets.ts current --write --refresh
 */
import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";
import { Readable } from "node:stream";
import zlib from "node:zlib";
import {
  CANONICAL, LineupEntry, Match, MatchEvent, RAW,
  loadSeasonFile, parseCsvLine, parseSeasonArgs, readJson, saveSeasonFile,
  seasonKey, seasonOfDate, slugify, userAgent, writeJson,
} from "../lib";

const BASE_URL = "https://pub-e682421888d945d684bcae8890b0ec20.r2.dev/data";
const CACHE = path.join(RAW, "transfermarkt-datasets");
const SOURCE_ID = "transfermarkt-datasets";
const UNITED_CLUB_ID = process.env.TRANSFERMARKT_UNITED_CLUB_ID ?? "985";
const WRITE = process.argv.includes("--write");
const REPARSE = process.argv.includes("--reparse");
const REFRESH = process.argv.includes("--refresh");
const USER_AGENT = userAgent("transfermarkt-datasets ingest");

const TABLES = ["clubs", "games", "players", "game_events", "game_lineups"] as const;
type Table = typeof TABLES[number];

interface PlayersFile {
  players: {
    id: string;
    name: string;
    positions?: string[] | null;
    nationality?: string | null;
    born?: string | null;
  }[];
}

interface ProviderGame {
  gameId: string;
  season: string;
  date: string;
  competitionId: string;
  round: string | null;
  homeClubId: string;
  awayClubId: string;
  homeClubName: string;
  awayClubName: string;
  homeGoals: number;
  awayGoals: number;
  attendance: number | null;
}

interface ProviderEvent {
  gameEventId: string;
  gameId: string;
  minute: number | null;
  type: string;
  clubId: string;
  clubName: string;
  playerId: string | null;
  playerInId: string | null;
  playerAssistId: string | null;
  description: string;
}

interface ProviderLineup {
  gameLineupsId: string;
  gameId: string;
  playerId: string;
  clubId: string;
  playerName: string;
  type: string;
  position: string | null;
  number: number | null;
}

interface ProviderBundle {
  games: ProviderGame[];
  playerNames: Map<string, string>;
  eventsByGame: Map<string, ProviderEvent[]>;
  lineupsByGame: Map<string, ProviderLineup[]>;
}

function usage(): never {
  console.error(
    "usage: tsx scripts/ingest/transfermarkt-datasets.ts <season> [<endSeason>] | current [--write] [--reparse] [--refresh]",
  );
  process.exit(1);
}

function seasonsFromArgs(): string[] {
  return parseSeasonArgs(process.argv.slice(2)) ?? usage();
}

function cacheFile(table: Table): string {
  return path.join(CACHE, `${table}.csv.gz`);
}

async function ensureCached(table: Table): Promise<void> {
  const file = cacheFile(table);
  if (fs.existsSync(file) && !REFRESH) return;
  fs.mkdirSync(CACHE, { recursive: true });
  const res = await fetch(`${BASE_URL}/${table}.csv.gz`, { headers: { "user-agent": USER_AGENT } });
  if (!res.ok || !res.body) throw new Error(`transfermarkt-datasets ${res.status} ${res.statusText}: ${table}`);
  const temp = `${file}.tmp`;
  fs.rmSync(temp, { force: true });
  await new Promise<void>((resolve, reject) => {
    Readable.fromWeb(res.body as never)
      .on("error", reject)
      .pipe(fs.createWriteStream(temp))
      .on("error", reject)
      .on("finish", resolve);
  });
  fs.renameSync(temp, file);
}

async function eachCsvRow(table: Table, visit: (row: Record<string, string>) => void | Promise<void>): Promise<void> {
  const input = fs.createReadStream(cacheFile(table)).pipe(zlib.createGunzip());
  const rl = readline.createInterface({ input, crlfDelay: Infinity });
  let header: string[] | null = null;
  for await (const line of rl) {
    if (header === null) {
      header = parseCsvLine(line);
      continue;
    }
    const cells = parseCsvLine(line);
    const row: Record<string, string> = {};
    header.forEach((h, i) => { row[h] = cells[i] ?? ""; });
    await visit(row);
  }
}

function parseIntOrNull(value: string): number | null {
  if (!/^\d+$/.test(value)) return null;
  return parseInt(value, 10);
}

function providerSeason(row: Record<string, string>): string {
  const raw = parseInt(row.season, 10);
  if (row.competition_id === "CGB" && /^\d{4}-\d{2}-\d{2}$/.test(row.date)) {
    return seasonOfDate(row.date);
  }
  if (!Number.isNaN(raw)) return seasonKey(raw);
  return row.date ? seasonKey(parseInt(row.date.slice(0, 4), 10)) : "";
}

function simplifyClubName(name: string): string {
  return name
    .replace(/\bAssociation Football Club\b/gi, "")
    .replace(/\bFootball Club\b/gi, "")
    .replace(/\bAFC\b/gi, "")
    .replace(/\bFC\b/gi, "")
    .replace(/\bF\.C\.\b/gi, "")
    .replace(/\bC\.F\.\b/gi, "")
    .replace(/\bCF\b/gi, "")
    .trim();
}

function normalizeClubName(name: string): string {
  return slugify(simplifyClubName(name));
}

function opponentNameFor(game: ProviderGame): string {
  return game.homeClubId === UNITED_CLUB_ID ? game.awayClubName : game.homeClubName;
}

function providerVenue(game: ProviderGame): "H" | "A" {
  return game.homeClubId === UNITED_CLUB_ID ? "H" : "A";
}

function scoreForUnited(game: ProviderGame): [number, number] {
  return game.homeClubId === UNITED_CLUB_ID
    ? [game.homeGoals, game.awayGoals]
    : [game.awayGoals, game.homeGoals];
}

function providerScoreMatches(game: ProviderGame, canonical: Match): boolean {
  const [gf, ga] = scoreForUnited(game);
  if (canonical.score.ft[0] === gf && canonical.score.ft[1] === ga) return true;
  const pens = canonical.score.pens;
  if (!pens) {
    return canonical.score.ft[0] === canonical.score.ft[1] &&
      gf > canonical.score.ft[0] &&
      ga > canonical.score.ft[1] &&
      gf - canonical.score.ft[0] <= 20 &&
      ga - canonical.score.ft[1] <= 20;
  }
  return canonical.score.ft[0] + pens[0] === gf && canonical.score.ft[1] + pens[1] === ga;
}

function inferredPens(game: ProviderGame, canonical: Match): [number, number] | null {
  if (canonical.score.pens) return null;
  const [gf, ga] = scoreForUnited(game);
  if (
    canonical.score.ft[0] === canonical.score.ft[1] &&
    gf > canonical.score.ft[0] &&
    ga > canonical.score.ft[1]
  ) {
    return [gf - canonical.score.ft[0], ga - canonical.score.ft[1]];
  }
  return null;
}

function providerMatchesCanonical(game: ProviderGame, canonical: Match): boolean {
  if (game.date !== canonical.date) return false;
  if (!providerScoreMatches(game, canonical)) return false;
  const providerOpponent = normalizeClubName(opponentNameFor(game));
  const canonicalOpponent = normalizeClubName(canonical.opponent);
  return providerOpponent === canonicalOpponent ||
    providerOpponent.includes(canonicalOpponent) ||
    canonicalOpponent.includes(providerOpponent) ||
    canonical.venue === "N" ||
    providerVenue(game) === canonical.venue;
}

function playerName(playerId: string | null, names: Map<string, string>): string | null {
  return playerId ? names.get(playerId) ?? null : null;
}

function addKnownUnitedPlayer(
  providerId: string | null,
  displayName: string | null,
  knownPlayers: Map<string, string>,
  newPlayers: Map<string, string>,
): string | null {
  if (!displayName) return null;
  const id = slugify(displayName);
  if (!knownPlayers.has(id) && !newPlayers.has(id)) newPlayers.set(id, displayName);
  return id;
}

function playerRef(
  providerId: string | null,
  side: "united" | "opponent",
  names: Map<string, string>,
  knownPlayers: Map<string, string>,
  newPlayers: Map<string, string>,
): Pick<MatchEvent, "player" | "playerName" | "playerProviderId" | "playerSide"> {
  const name = playerName(providerId, names);
  if (side === "united") {
    return {
      player: addKnownUnitedPlayer(providerId, name, knownPlayers, newPlayers),
      playerName: name,
      playerProviderId: providerId,
      playerSide: side,
    };
  }
  return { player: null, playerName: name, playerProviderId: providerId, playerSide: side };
}

function assistRef(
  providerId: string | null,
  side: "united" | "opponent",
  names: Map<string, string>,
  knownPlayers: Map<string, string>,
  newPlayers: Map<string, string>,
): Pick<MatchEvent, "assist" | "assistName" | "assistProviderId" | "assistSide"> {
  const name = playerName(providerId, names);
  if (!name) return { assist: null, assistName: null, assistProviderId: providerId, assistSide: null };
  if (side === "united") {
    return {
      assist: addKnownUnitedPlayer(providerId, name, knownPlayers, newPlayers),
      assistName: name,
      assistProviderId: providerId,
      assistSide: side,
    };
  }
  return { assist: null, assistName: name, assistProviderId: providerId, assistSide: side };
}

function eventsFromProvider(
  game: ProviderGame,
  events: ProviderEvent[],
  names: Map<string, string>,
  knownPlayers: Map<string, string>,
  newPlayers: Map<string, string>,
): MatchEvent[] {
  const incoming: MatchEvent[] = [];
  for (const e of events) {
    const side = e.clubId === UNITED_CLUB_ID ? "united" : "opponent";
    if (e.type === "Goals") {
      const ownGoal = /own-goal/i.test(e.description);
      const playerSide = ownGoal ? (side === "united" ? "opponent" : "united") : side;
      const type: MatchEvent["type"] =
        ownGoal
          ? side === "united" ? "own-goal-for" : "own-goal-against"
          : side === "united" && /penalty/i.test(e.description) ? "pen-goal"
            : side === "united" ? "goal" : "opp-goal";
      incoming.push({
        type,
        ...playerRef(e.playerId, playerSide, names, knownPlayers, newPlayers),
        ...assistRef(e.playerAssistId, side, names, knownPlayers, newPlayers),
        minute: e.minute,
        providerEventId: e.gameEventId,
        sourceConfidence: "complete",
        detail: e.description || null,
      });
    } else if (e.type === "Cards") {
      incoming.push({
        type: /red card|second yellow/i.test(e.description) ? "card-red" : "card-yellow",
        ...playerRef(e.playerId, side, names, knownPlayers, newPlayers),
        minute: e.minute,
        providerEventId: e.gameEventId,
        sourceConfidence: "supporting",
        detail: e.description || null,
      });
    }
  }
  return incoming.sort((a, b) => (a.minute ?? 999) - (b.minute ?? 999));
}

function lineupRef(
  row: ProviderLineup,
  side: "united" | "opponent",
  start: boolean,
  bench: boolean,
  knownPlayers: Map<string, string>,
  newPlayers: Map<string, string>,
): LineupEntry {
  const player = side === "united"
    ? addKnownUnitedPlayer(row.playerId, row.playerName, knownPlayers, newPlayers)
    : null;
  return {
    player,
    playerName: row.playerName || null,
    playerSide: side,
    providerId: row.playerId,
    shirt: row.number,
    role: row.position,
    start,
    bench,
    on: null,
    off: null,
  };
}

function lineupsFromProvider(
  rows: ProviderLineup[],
  events: ProviderEvent[],
  names: Map<string, string>,
  knownPlayers: Map<string, string>,
  newPlayers: Map<string, string>,
): LineupEntry[] {
  const lineups: LineupEntry[] = [];
  const byProvider = new Map<string, LineupEntry>();
  for (const row of rows) {
    if (!row.playerId || !row.playerName) continue;
    const side = row.clubId === UNITED_CLUB_ID ? "united" : "opponent";
    const start = row.type === "starting_lineup";
    const bench = row.type === "substitutes";
    const entry = lineupRef(row, side, start, bench, knownPlayers, newPlayers);
    byProvider.set(`${side}|${row.playerId}`, entry);
    lineups.push(entry);
  }

  for (const sub of events.filter((e) => e.type === "Substitutions")) {
    const side = sub.clubId === UNITED_CLUB_ID ? "united" : "opponent";
    const outKey = `${side}|${sub.playerId ?? ""}`;
    const departed = byProvider.get(outKey);
    if (departed) departed.off = sub.minute;

    if (!sub.playerInId) continue;
    const inKey = `${side}|${sub.playerInId}`;
    let entrant = byProvider.get(inKey);
    if (!entrant) {
      const name = playerName(sub.playerInId, names);
      if (!name) continue;
      entrant = lineupRef({
        gameLineupsId: `${sub.gameEventId}:in`,
        gameId: sub.gameId,
        playerId: sub.playerInId,
        clubId: sub.clubId,
        playerName: name,
        type: "substitutes",
        position: null,
        number: null,
      }, side, false, false, knownPlayers, newPlayers);
      byProvider.set(inKey, entrant);
      lineups.push(entrant);
    }
    entrant.start = false;
    entrant.bench = false;
    entrant.on = sub.minute;
  }

  const unitedStarters = lineups.filter((l) => l.playerSide === "united" && l.start).length;
  if (unitedStarters !== 11) return [];

  return lineups.sort((a, b) =>
    (a.playerSide ?? "").localeCompare(b.playerSide ?? "") ||
    Number(b.start) - Number(a.start) ||
    (a.shirt ?? 999) - (b.shirt ?? 999) ||
    String(a.playerName ?? "").localeCompare(String(b.playerName ?? "")),
  );
}

function eventKey(e: MatchEvent): string {
  return [
    e.type,
    e.minute ?? "",
    e.playerProviderId ?? e.player ?? e.playerName ?? e.detail ?? "",
  ].join("|");
}

function countGoals(events: MatchEvent[]): { united: number; opponent: number } {
  return {
    united: events.filter((e) => ["goal", "pen-goal", "own-goal-for"].includes(e.type)).length,
    opponent: events.filter((e) => ["opp-goal", "own-goal-against"].includes(e.type)).length,
  };
}

function mergeEvents(match: Match, incoming: MatchEvent[]): { events: MatchEvent[] | undefined; changed: boolean } {
  if (incoming.length === 0) return { events: match.events, changed: false };
  const incomingGoals = countGoals(incoming);
  const incomingComplete = incomingGoals.united === match.score.ft[0] && incomingGoals.opponent === match.score.ft[1];
  if (REPARSE || !match.events || match.events.length === 0 || match.sources.includes(SOURCE_ID) || incomingComplete) {
    return { events: incoming, changed: JSON.stringify(match.events ?? []) !== JSON.stringify(incoming) };
  }

  const merged = [...match.events];
  const byKey = new Map(merged.map((e) => [eventKey(e), e]));
  let changed = false;
  for (const next of incoming) {
    const cur = byKey.get(eventKey(next));
    if (!cur) {
      merged.push(next);
      changed = true;
      continue;
    }
    if (!cur.assist && next.assist) { cur.assist = next.assist; changed = true; }
    if (!cur.assistName && next.assistName) { cur.assistName = next.assistName; changed = true; }
    if (!cur.assistProviderId && next.assistProviderId) { cur.assistProviderId = next.assistProviderId; changed = true; }
    if (!cur.providerEventId && next.providerEventId) { cur.providerEventId = next.providerEventId; changed = true; }
  }
  return { events: merged, changed };
}

function lineupKey(l: LineupEntry): string {
  return `${l.playerSide ?? "united"}|${l.player ?? l.providerId ?? l.playerName ?? ""}`;
}

function mergeLineup(existing: LineupEntry[] | undefined, incoming: LineupEntry[]): { lineup: LineupEntry[] | undefined; changed: boolean } {
  if (incoming.length === 0) return { lineup: existing, changed: false };
  if (REPARSE || !existing || existing.length === 0) return { lineup: incoming, changed: JSON.stringify(existing ?? []) !== JSON.stringify(incoming) };
  const merged = [...existing];
  const byKey = new Map(merged.map((l) => [lineupKey(l), l]));
  let changed = false;
  for (const row of incoming) {
    const key = lineupKey(row);
    const cur = byKey.get(key);
    if (!cur) {
      merged.push(row);
      changed = true;
      continue;
    }
    for (const field of ["providerId", "shirt", "role", "on", "off"] as const) {
      if (cur[field] == null && row[field] != null) {
        (cur[field] as string | number | null | undefined) = row[field];
        changed = true;
      }
    }
    if (cur.bench && !row.bench) { cur.bench = false; changed = true; }
  }
  return { lineup: merged, changed };
}

async function loadProviderBundle(seasons: Set<string>): Promise<ProviderBundle> {
  for (const table of TABLES) await ensureCached(table);

  const playerNames = new Map<string, string>();
  await eachCsvRow("players", (row) => {
    if (row.player_id && row.name) playerNames.set(row.player_id, row.name);
  });

  const games: ProviderGame[] = [];
  const gameIds = new Set<string>();
  await eachCsvRow("games", (row) => {
    if (row.home_club_id !== UNITED_CLUB_ID && row.away_club_id !== UNITED_CLUB_ID) return;
    const season = providerSeason(row);
    if (!seasons.has(season)) return;
    const homeGoals = parseInt(row.home_club_goals, 10);
    const awayGoals = parseInt(row.away_club_goals, 10);
    if (Number.isNaN(homeGoals) || Number.isNaN(awayGoals)) return;
    const game: ProviderGame = {
      gameId: row.game_id,
      season,
      date: row.date,
      competitionId: row.competition_id,
      round: row.round || null,
      homeClubId: row.home_club_id,
      awayClubId: row.away_club_id,
      homeClubName: simplifyClubName(row.home_club_name),
      awayClubName: simplifyClubName(row.away_club_name),
      homeGoals,
      awayGoals,
      attendance: parseIntOrNull(row.attendance),
    };
    games.push(game);
    gameIds.add(game.gameId);
  });

  const eventsByGame = new Map<string, ProviderEvent[]>();
  await eachCsvRow("game_events", (row) => {
    if (!gameIds.has(row.game_id)) return;
    const event: ProviderEvent = {
      gameEventId: row.game_event_id,
      gameId: row.game_id,
      minute: parseIntOrNull(row.minute),
      type: row.type,
      clubId: row.club_id,
      clubName: simplifyClubName(row.club_name),
      playerId: row.player_id || null,
      playerInId: row.player_in_id || null,
      playerAssistId: row.player_assist_id || null,
      description: row.description,
    };
    const bucket = eventsByGame.get(event.gameId) ?? [];
    bucket.push(event);
    eventsByGame.set(event.gameId, bucket);
  });

  const lineupsByGame = new Map<string, ProviderLineup[]>();
  await eachCsvRow("game_lineups", (row) => {
    if (!gameIds.has(row.game_id)) return;
    const lineup: ProviderLineup = {
      gameLineupsId: row.game_lineups_id,
      gameId: row.game_id,
      playerId: row.player_id,
      clubId: row.club_id,
      playerName: row.player_name,
      type: row.type,
      position: row.position || null,
      number: parseIntOrNull(row.number),
    };
    const bucket = lineupsByGame.get(lineup.gameId) ?? [];
    bucket.push(lineup);
    lineupsByGame.set(lineup.gameId, bucket);
  });

  games.sort((a, b) => a.date.localeCompare(b.date) || a.gameId.localeCompare(b.gameId));
  return { games, playerNames, eventsByGame, lineupsByGame };
}

async function main() {
  const seasons = seasonsFromArgs();
  const seasonSet = new Set(seasons);
  const playersFile = readJson<PlayersFile>(path.join(CANONICAL, "players.json"));
  const knownPlayers = new Map(playersFile.players.map((p) => [p.id, p.name]));
  const newPlayers = new Map<string, string>();
  const provider = await loadProviderBundle(seasonSet);
  let matchedRows = 0;
  let unmatchedRows = 0;
  let touchedMatches = 0;
  const assistsBySeason = new Map<string, number>();

  for (const season of seasons) {
    const sf = loadSeasonFile(season);
    let seasonTouched = false;
    const providerGames = provider.games.filter((g) => g.season === season);

    for (const game of providerGames) {
      const match = sf.matches.find((m) => providerMatchesCanonical(game, m));
      if (!match) {
        unmatchedRows++;
        continue;
      }
      matchedRows++;
      let changed = false;
      if (match.attendance == null && game.attendance != null) {
        match.attendance = game.attendance;
        changed = true;
      }
      if (!match.round && game.round) {
        match.round = game.round;
        changed = true;
      }
      const pens = inferredPens(game, match);
      if (pens) {
        match.score.pens = pens;
        changed = true;
      }

      const rawEvents = provider.eventsByGame.get(game.gameId) ?? [];
      const incomingEvents = eventsFromProvider(game, rawEvents, provider.playerNames, knownPlayers, newPlayers);
      const incomingAssists = incomingEvents.filter((e) => e.assist || e.assistName).length;
      if (incomingAssists > 0) assistsBySeason.set(season, (assistsBySeason.get(season) ?? 0) + incomingAssists);
      const mergedEvents = mergeEvents(match, incomingEvents);
      if (mergedEvents.changed) {
        match.events = mergedEvents.events;
        const goals = countGoals(match.events ?? []);
        match.eventsComplete = goals.united === match.score.ft[0];
        changed = true;
      }

      const incomingLineup = lineupsFromProvider(
        provider.lineupsByGame.get(game.gameId) ?? [],
        rawEvents,
        provider.playerNames,
        knownPlayers,
        newPlayers,
      );
      const mergedLineup = mergeLineup(match.lineup, incomingLineup);
      if (mergedLineup.changed) {
        match.lineup = mergedLineup.lineup;
        changed = true;
      }

      if (changed && !match.sources.includes(SOURCE_ID)) match.sources.push(SOURCE_ID);
      if (changed) {
        seasonTouched = true;
        touchedMatches++;
        console.log(
          `${WRITE ? "write" : "dry"} ${match.id}: ${incomingEvents.length} events, ${incomingLineup.length} lineup rows`,
        );
      }
    }

    if (WRITE && seasonTouched) saveSeasonFile(sf);
  }

  if (WRITE && newPlayers.size > 0) {
    for (const [id, name] of newPlayers) {
      playersFile.players.push({ id, name });
      knownPlayers.set(id, name);
    }
    playersFile.players.sort((a, b) => a.id.localeCompare(b.id));
    writeJson(path.join(CANONICAL, "players.json"), playersFile);
  }

  const totalAssists = [...assistsBySeason.values()].reduce((a, b) => a + b, 0);
  const assistBreakdown = [...assistsBySeason.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([s, n]) => `${s}:${n}`)
    .join(" ");
  console.log(
    `transfermarkt-datasets ${WRITE ? "write" : "dry-run"}: ${matchedRows} matched, ` +
    `${touchedMatches} enriched, ${unmatchedRows} provider rows unmatched, ` +
    `${newPlayers.size} new United players${WRITE ? "" : " (not written)"}`,
  );
  console.log(
    `provider assists available: ${totalAssists}${assistBreakdown ? ` (by season: ${assistBreakdown})` : ""}`,
  );
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
