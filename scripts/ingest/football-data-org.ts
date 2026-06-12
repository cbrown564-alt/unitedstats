/**
 * Enrich canonical matches from football-data.org v4.
 *
 * The importer is intentionally conservative:
 *   - requires FOOTBALL_DATA_TOKEN unless a cached response already exists
 *   - dry-runs by default; pass --write to mutate canonical JSON
 *   - matches existing fixtures by date plus opponent name
 *   - stores opposition players as display names/provider ids, not United ids
 *   - records bench rows separately so unused substitutes do not count as apps
 *
 * Usage:
 *   tsx scripts/ingest/football-data-org.ts 2025-26
 *   tsx scripts/ingest/football-data-org.ts 2024-25 2025-26 --write
 *   tsx scripts/ingest/football-data-org.ts current --write
 */
import fs from "node:fs";
import path from "node:path";
import {
  CANONICAL, LineupEntry, Match, MatchEvent, RAW,
  loadSeasonFile, readJson, saveSeasonFile, seasonKey, slugify, writeJson,
} from "../lib";

const BASE_URL = "https://api.football-data.org/v4";
const CACHE = path.join(RAW, "football-data-org");
const SOURCE_ID = "football-data-org";
const TOKEN = process.env.FOOTBALL_DATA_TOKEN;
const UNITED_TEAM_ID = Number(process.env.FOOTBALL_DATA_TEAM_ID ?? 66);
const COMPETITION_CODES = (process.env.FOOTBALL_DATA_COMPETITIONS ?? "PL,CL,EL,FAC,EFL")
  .split(",")
  .map((c) => c.trim())
  .filter(Boolean);
const WRITE = process.argv.includes("--write");
const REPARSE = process.argv.includes("--reparse");

interface ProviderPerson {
  id: number | null;
  name: string | null;
  position?: string | null;
  shirtNumber?: number | null;
}

interface ProviderTeam {
  id: number;
  name: string;
  shortName?: string | null;
  tla?: string | null;
  lineup?: ProviderPerson[];
  bench?: ProviderPerson[];
}

interface ProviderGoal {
  minute: number | null;
  injuryTime?: number | null;
  type?: string | null;
  team: { id: number | null; name: string | null };
  scorer: ProviderPerson | null;
  assist: ProviderPerson | null;
}

interface ProviderBooking {
  minute: number | null;
  team: { id: number | null; name: string | null };
  player: ProviderPerson | null;
  card: "YELLOW" | "YELLOW_RED" | "RED" | string;
}

interface ProviderSubstitution {
  minute: number | null;
  team: { id: number | null; name: string | null };
  playerOut: ProviderPerson | null;
  playerIn: ProviderPerson | null;
}

interface ProviderMatch {
  id: number;
  utcDate: string;
  status: string;
  attendance?: number | null;
  homeTeam: ProviderTeam;
  awayTeam: ProviderTeam;
  goals?: ProviderGoal[];
  bookings?: ProviderBooking[];
  substitutions?: ProviderSubstitution[];
}

interface TeamMatchesResponse {
  matches: ProviderMatch[];
}

class HttpStatusError extends Error {
  constructor(
    readonly status: number,
    readonly statusText: string,
    readonly url: string,
  ) {
    super(`football-data.org ${status} ${statusText}: ${url}`);
  }
}

interface PlayersFile {
  players: {
    id: string;
    name: string;
    positions?: string[] | null;
    nationality?: string | null;
    born?: string | null;
  }[];
}

function usage(): never {
  console.error("usage: tsx scripts/ingest/football-data-org.ts <season> [<endSeason>] | current [--write] [--reparse]");
  process.exit(1);
}

function seasonsFromArgs(): string[] {
  const args = process.argv.slice(2).filter((a) => /^\d{4}-\d{2}$/.test(a) || a === "current");
  if (args.includes("current")) {
    const now = new Date();
    const startYear = now.getUTCMonth() + 1 >= 7 ? now.getUTCFullYear() : now.getUTCFullYear() - 1;
    return [seasonKey(startYear)];
  }
  if (args.length === 0) usage();
  const start = parseInt(args[0].slice(0, 4), 10);
  const end = args[1] ? parseInt(args[1].slice(0, 4), 10) : start;
  const seasons: string[] = [];
  for (let y = start; y <= end; y++) seasons.push(seasonKey(y));
  return seasons;
}

function seasonBounds(season: string): { from: string; to: string } {
  const start = parseInt(season.slice(0, 4), 10);
  return { from: `${start}-07-01`, to: `${start + 1}-06-30` };
}

function normalizeName(name: string): string {
  return slugify(
    name
      .replace(/\b(FC|F\.C\.|AFC|A\.F\.C\.|CF|C\.F\.)\b/gi, "")
      .replace(/\bManchester United\b/gi, "Manchester United")
      .trim(),
  );
}

function opponentNameFor(provider: ProviderMatch): string {
  const team = provider.homeTeam.id === UNITED_TEAM_ID ? provider.awayTeam : provider.homeTeam;
  return team.shortName || team.name;
}

function providerDate(provider: ProviderMatch): string {
  return provider.utcDate.slice(0, 10);
}

async function readOrFetch<T>(url: string, cacheFile: string): Promise<T> {
  if (fs.existsSync(cacheFile) && !REPARSE) return readJson<T>(cacheFile);
  if (!TOKEN) {
    throw new Error(`FOOTBALL_DATA_TOKEN is required for ${url} because ${cacheFile} is not cached`);
  }
  const res = await fetch(url, {
    headers: {
      "X-Auth-Token": TOKEN,
      "X-Unfold-Lineups": "true",
      "X-Unfold-Bookings": "true",
      "X-Unfold-Subs": "true",
      "X-Unfold-Goals": "true",
    },
  });
  if (!res.ok) throw new HttpStatusError(res.status, res.statusText, url);
  const json = (await res.json()) as T;
  writeJson(cacheFile, json);
  return json;
}

async function fetchSeason(season: string): Promise<ProviderMatch[]> {
  const { from, to } = seasonBounds(season);
  const teamCacheFile = path.join(CACHE, `${season}-team-${UNITED_TEAM_ID}.json`);
  const teamUrl = `${BASE_URL}/teams/${UNITED_TEAM_ID}/matches?dateFrom=${from}&dateTo=${to}&status=FINISHED`;
  try {
    const payload = await readOrFetch<TeamMatchesResponse>(teamUrl, teamCacheFile);
    return payload.matches ?? [];
  } catch (err) {
    if (!(err instanceof HttpStatusError) || ![403, 404].includes(err.status)) throw err;
    console.log(`team endpoint unavailable (${err.status}); falling back to competition feeds`);
  }

  const all: ProviderMatch[] = [];
  for (const code of COMPETITION_CODES) {
    const cacheFile = path.join(CACHE, `${season}-${code}.json`);
    const url = `${BASE_URL}/competitions/${code}/matches?season=${season.slice(0, 4)}&status=FINISHED`;
    try {
      const payload = await readOrFetch<TeamMatchesResponse>(url, cacheFile);
      const unitedRows = (payload.matches ?? []).filter((m) =>
        m.homeTeam.id === UNITED_TEAM_ID ||
        m.awayTeam.id === UNITED_TEAM_ID ||
        normalizeName(m.homeTeam.name) === "manchester-united" ||
        normalizeName(m.awayTeam.name) === "manchester-united",
      );
      console.log(`${code}: ${unitedRows.length} United rows`);
      all.push(...unitedRows);
    } catch (err) {
      if (err instanceof HttpStatusError && [403, 404].includes(err.status)) {
        console.log(`${code}: skipped (${err.status})`);
        continue;
      }
      throw err;
    }
  }

  const byId = new Map<number, ProviderMatch>();
  for (const m of all) byId.set(m.id, m);
  return [...byId.values()].sort((a, b) => a.utcDate.localeCompare(b.utcDate));
}

function playerRef(
  person: ProviderPerson | null | undefined,
  side: "united" | "opponent",
  knownPlayers: Map<string, string>,
  newPlayers: Map<string, string>,
): Pick<MatchEvent, "player" | "playerName" | "playerProviderId" | "playerSide"> {
  if (!person?.name) return { player: null, playerName: null, playerProviderId: null, playerSide: side };
  if (side === "opponent") {
    return { player: null, playerName: person.name, playerProviderId: person.id, playerSide: side };
  }
  const id = slugify(person.name);
  if (!knownPlayers.has(id) && !newPlayers.has(id)) newPlayers.set(id, person.name);
  return { player: id, playerName: person.name, playerProviderId: person.id, playerSide: side };
}

function assistRef(
  person: ProviderPerson | null | undefined,
  side: "united" | "opponent",
  knownPlayers: Map<string, string>,
  newPlayers: Map<string, string>,
): Pick<MatchEvent, "assist" | "assistName" | "assistProviderId" | "assistSide"> {
  if (!person?.name) return { assist: null, assistName: null, assistProviderId: null, assistSide: null };
  if (side === "opponent") {
    return { assist: null, assistName: person.name, assistProviderId: person.id, assistSide: side };
  }
  const id = slugify(person.name);
  if (!knownPlayers.has(id) && !newPlayers.has(id)) newPlayers.set(id, person.name);
  return { assist: id, assistName: person.name, assistProviderId: person.id, assistSide: side };
}

function eventMinute(minute: number | null, injuryTime?: number | null): number | null {
  if (minute == null) return null;
  return minute + (injuryTime ?? 0);
}

function eventsFromProvider(
  provider: ProviderMatch,
  knownPlayers: Map<string, string>,
  newPlayers: Map<string, string>,
): MatchEvent[] {
  const events: MatchEvent[] = [];
  for (const g of provider.goals ?? []) {
    const side = g.team.id === UNITED_TEAM_ID ? "united" : "opponent";
    const ownGoal = (g.type ?? "").toUpperCase() === "OWN_GOAL";
    const type: MatchEvent["type"] =
      side === "united"
        ? ownGoal ? "own-goal-for" : (g.type ?? "").toUpperCase() === "PENALTY" ? "pen-goal" : "goal"
        : ownGoal ? "own-goal-against" : "opp-goal";
    events.push({
      type,
      ...playerRef(g.scorer, side, knownPlayers, newPlayers),
      ...assistRef(g.assist, side, knownPlayers, newPlayers),
      minute: eventMinute(g.minute, g.injuryTime),
      providerEventId: `${provider.id}:goal:${events.length}`,
      sourceConfidence: "complete",
      detail: g.scorer?.name ?? null,
    });
  }
  for (const b of provider.bookings ?? []) {
    const side = b.team.id === UNITED_TEAM_ID ? "united" : "opponent";
    events.push({
      type: b.card === "RED" || b.card === "YELLOW_RED" ? "card-red" : "card-yellow",
      ...playerRef(b.player, side, knownPlayers, newPlayers),
      minute: b.minute,
      providerEventId: `${provider.id}:booking:${events.length}`,
      sourceConfidence: "partial",
      detail: b.card,
    });
  }
  return events;
}

function lineupRef(
  person: ProviderPerson,
  side: "united" | "opponent",
  start: boolean,
  bench: boolean,
  knownPlayers: Map<string, string>,
  newPlayers: Map<string, string>,
): LineupEntry | null {
  if (!person.name) return null;
  const player = side === "united" ? slugify(person.name) : null;
  if (player && !knownPlayers.has(player) && !newPlayers.has(player)) newPlayers.set(player, person.name);
  return {
    player,
    playerName: person.name,
    playerSide: side,
    providerId: person.id,
    shirt: person.shirtNumber ?? null,
    role: person.position ?? null,
    start,
    bench,
    on: null,
    off: null,
  };
}

function lineupsFromProvider(
  provider: ProviderMatch,
  knownPlayers: Map<string, string>,
  newPlayers: Map<string, string>,
): LineupEntry[] {
  const rows: LineupEntry[] = [];
  const byProvider = new Map<string, LineupEntry>();
  const add = (team: ProviderTeam, side: "united" | "opponent", people: ProviderPerson[] | undefined, start: boolean, bench: boolean) => {
    for (const person of people ?? []) {
      const entry = lineupRef(person, side, start, bench, knownPlayers, newPlayers);
      if (!entry) continue;
      const key = `${side}|${person.id ?? person.name}`;
      byProvider.set(key, entry);
      rows.push(entry);
    }
  };

  const united = provider.homeTeam.id === UNITED_TEAM_ID ? provider.homeTeam : provider.awayTeam;
  add(united, "united", united.lineup, true, false);
  add(united, "united", united.bench, false, true);

  for (const sub of provider.substitutions ?? []) {
    if (sub.team.id !== UNITED_TEAM_ID) continue;
    const inKey = `united|${sub.playerIn?.id ?? sub.playerIn?.name}`;
    let entrant = byProvider.get(inKey);
    if (!entrant && sub.playerIn?.name) {
      entrant = lineupRef(sub.playerIn, "united", false, false, knownPlayers, newPlayers) ?? undefined;
      if (entrant) {
        byProvider.set(inKey, entrant);
        rows.push(entrant);
      }
    }
    if (entrant) {
      entrant.bench = false;
      entrant.start = false;
      entrant.on = sub.minute;
    }
    const outKey = `united|${sub.playerOut?.id ?? sub.playerOut?.name}`;
    const departed = byProvider.get(outKey);
    if (departed) departed.off = sub.minute;
  }

  return rows;
}

function eventKey(e: MatchEvent): string {
  return [
    e.type,
    e.minute ?? "",
    e.player ?? e.playerProviderId ?? e.playerName ?? e.detail ?? "",
  ].join("|");
}

function mergeEvents(existing: MatchEvent[] | undefined, incoming: MatchEvent[]): { events: MatchEvent[]; changed: boolean } {
  if (REPARSE || !existing || existing.length === 0) return { events: incoming, changed: incoming.length > 0 };
  let changed = false;
  const merged = [...existing];
  const byKey = new Map(merged.map((e) => [eventKey(e), e]));
  for (const next of incoming) {
    const key = eventKey(next);
    const cur = byKey.get(key);
    if (!cur) {
      merged.push(next);
      byKey.set(key, next);
      changed = true;
      continue;
    }
    if (!cur.assist && next.assist) { cur.assist = next.assist; changed = true; }
    if (!cur.assistName && next.assistName) { cur.assistName = next.assistName; changed = true; }
    if (!cur.assistProviderId && next.assistProviderId) { cur.assistProviderId = next.assistProviderId; changed = true; }
  }
  return { events: merged, changed };
}

function mergeLineup(existing: LineupEntry[] | undefined, incoming: LineupEntry[]): { lineup: LineupEntry[]; changed: boolean } {
  if (REPARSE || !existing || existing.length === 0) return { lineup: incoming, changed: incoming.length > 0 };
  const hasBench = existing.some((l) => l.bench);
  if (hasBench || !incoming.some((l) => l.bench)) return { lineup: existing, changed: false };
  const merged = [...existing];
  const known = new Set(existing.map((l) => l.player ?? l.providerId ?? l.playerName).filter(Boolean));
  for (const row of incoming.filter((l) => l.bench)) {
    const key = row.player ?? row.providerId ?? row.playerName;
    if (key && known.has(key)) continue;
    merged.push(row);
  }
  return { lineup: merged, changed: merged.length !== existing.length };
}

function providerMatchesCanonical(provider: ProviderMatch, canonical: Match): boolean {
  if (providerDate(provider) !== canonical.date) return false;
  const providerOpponent = normalizeName(opponentNameFor(provider));
  const canonicalOpponent = normalizeName(canonical.opponent);
  return providerOpponent === canonicalOpponent ||
    providerOpponent.includes(canonicalOpponent) ||
    canonicalOpponent.includes(providerOpponent);
}

async function main() {
  const seasons = seasonsFromArgs();
  const playersFile = readJson<PlayersFile>(path.join(CANONICAL, "players.json"));
  const knownPlayers = new Map(playersFile.players.map((p) => [p.id, p.name]));
  const newPlayers = new Map<string, string>();
  let touchedMatches = 0;
  let matchedRows = 0;
  let unmatchedRows = 0;

  for (const season of seasons) {
    const providerMatches = await fetchSeason(season);
    const sf = loadSeasonFile(season);
    let seasonTouched = false;

    for (const m of sf.matches) {
      const provider = providerMatches.find((p) => providerMatchesCanonical(p, m));
      if (!provider) continue;
      matchedRows++;
      let changed = false;
      if (m.attendance == null && provider.attendance != null) {
        m.attendance = provider.attendance;
        changed = true;
      }
      const incomingEvents = eventsFromProvider(provider, knownPlayers, newPlayers);
      const mergedEvents = mergeEvents(m.events, incomingEvents);
      if (mergedEvents.changed) {
        m.events = mergedEvents.events;
        const unitedGoals = m.events.filter((e) => ["goal", "pen-goal", "own-goal-for"].includes(e.type)).length;
        m.eventsComplete = unitedGoals === m.score.ft[0];
        changed = true;
      }
      const incomingLineup = lineupsFromProvider(provider, knownPlayers, newPlayers);
      const mergedLineup = mergeLineup(m.lineup, incomingLineup);
      if (mergedLineup.changed) {
        m.lineup = mergedLineup.lineup;
        changed = true;
      }
      if (changed && !m.sources.includes(SOURCE_ID)) m.sources.push(SOURCE_ID);
      if (changed) {
        seasonTouched = true;
        touchedMatches++;
        console.log(`${WRITE ? "write" : "dry"} ${m.id}: +${incomingEvents.length} events, +${incomingLineup.length} lineup rows`);
      }
    }

    unmatchedRows += providerMatches.filter((p) => !sf.matches.some((m) => providerMatchesCanonical(p, m))).length;
    if (WRITE && seasonTouched) saveSeasonFile(sf);
  }

  if (WRITE && newPlayers.size > 0) {
    for (const [id, name] of newPlayers) playersFile.players.push({ id, name });
    playersFile.players.sort((a, b) => a.id.localeCompare(b.id));
    writeJson(path.join(CANONICAL, "players.json"), playersFile);
  }

  console.log(
    `football-data.org ${WRITE ? "write" : "dry-run"}: ${matchedRows} matched, ${touchedMatches} enriched, ` +
      `${unmatchedRows} provider rows unmatched, ${newPlayers.size} new United players${WRITE ? "" : " (not written)"}`,
  );
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
