import fs from "node:fs";
import path from "node:path";

export const ROOT = path.resolve(__dirname, "..");
export const CANONICAL = path.join(ROOT, "data", "canonical");
export const MATCHES_DIR = path.join(CANONICAL, "matches");
export const RAW = path.join(ROOT, "data", "raw");
export const DB_PATH = path.join(ROOT, "data", "united.db");

export type Venue = "H" | "A" | "N";

export interface MatchEvent {
  type:
    | "goal"
    | "pen-goal"
    | "own-goal-for"
    | "own-goal-against"
    | "opp-goal"
    | "card-yellow"
    | "card-red";
  player?: string | null; // United player id when the event belongs to a known United player
  playerName?: string | null; // display name for opposition or source-only players
  playerSide?: "united" | "opponent" | null;
  playerProviderId?: string | number | null;
  minute: number | null;
  assist?: string | null; // United player id when the assister is known in players.json
  assistName?: string | null;
  assistSide?: "united" | "opponent" | null;
  assistProviderId?: string | number | null;
  providerEventId?: string | number | null;
  sourceConfidence?: "complete" | "partial" | "supporting" | null;
  detail?: string | null;
}

export interface LineupEntry {
  player?: string | null; // United player id when known
  playerName?: string | null;
  playerSide?: "united" | "opponent" | null;
  providerId?: string | number | null;
  shirt?: number | null;
  role?: string | null;
  start: boolean;
  bench?: boolean;
  on?: number | null;
  off?: number | null;
}

export interface Match {
  id: string;
  date: string; // YYYY-MM-DD
  competition: string;
  round?: string | null;
  opponent: string; // display name as it appeared
  opponentId: string; // canonical opponent id
  venue: Venue;
  stadium?: string | null; // stadium id when known
  attendance?: number | null;
  score: {
    ft: [number, number]; // United first, opponent second
    ht?: [number, number] | null;
    aet?: boolean;
    pens?: [number, number] | null;
  };
  eventsComplete?: boolean; // true when events fully account for all goals
  events?: MatchEvent[];
  lineup?: LineupEntry[];
  sources: string[];
  notes?: string | null;
}

export interface SeasonFile {
  season: string;
  matches: Match[];
}

export function slugify(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** engsoccerdata "Season" 1892 -> "1892-93"; 1999 -> "1999-00" */
export function seasonKey(startYear: number): string {
  const end = (startYear + 1) % 100;
  return `${startYear}-${String(end).padStart(2, "0")}`;
}

/** Season a given date belongs to (Jul 1 boundary). */
export function seasonOfDate(date: string): string {
  const [y, m] = date.split("-").map(Number);
  return seasonKey(m >= 7 ? y : y - 1);
}

export function matchId(date: string, opponentId: string, venue: Venue): string {
  return `${date}-${opponentId}-${venue.toLowerCase()}`;
}

/** Tiny CSV parser handling quoted fields with embedded commas. */
export function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field); field = "";
      if (row.length > 1 || row[0] !== "") rows.push(row);
      row = [];
    } else field += c;
  }
  if (field !== "" || row.length) { row.push(field); rows.push(row); }
  const header = rows[0];
  return rows.slice(1).map((r) => {
    const o: Record<string, string> = {};
    header.forEach((h, i) => (o[h] = r[i] ?? ""));
    return o;
  });
}

/** Shared User-Agent for outbound ingest fetches; `scope` names the lane. */
export function userAgent(scope: string): string {
  return `unitedstats/1.0 ${scope}`;
}

/** Split one CSV line into fields, honouring quoted fields with "" escapes. */
export function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQuotes) {
      if (c === '"') {
        if (line[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ",") { cells.push(field); field = ""; }
    else field += c;
  }
  cells.push(field);
  return cells;
}

/** Current season key using the Jul 1 boundary. */
function currentSeasonKey(now = new Date()): string {
  const startYear = now.getUTCMonth() + 1 >= 7 ? now.getUTCFullYear() : now.getUTCFullYear() - 1;
  return seasonKey(startYear);
}

/** Season keys (e.g. "1998-99") that have a canonical match file on disk. */
function seasonKeysOnDisk(): string[] {
  return listSeasonFiles()
    .filter((f) => /^\d{4}-\d{2}\.json$/.test(f))
    .map((f) => f.replace(".json", ""));
}

/**
 * Parse a season selection from CLI tokens: a single "YYYY-YY", an inclusive
 * "YYYY-YY YYYY-YY" range, "current", or (when allowAll) "all". Returns null
 * when no season-like token is present so callers can print their own usage.
 */
export function parseSeasonArgs(argv: string[], opts: { allowAll?: boolean } = {}): string[] | null {
  const tokens = argv.filter(
    (a) => /^\d{4}-\d{2}$/.test(a) || a === "current" || (opts.allowAll === true && a === "all"),
  );
  if (tokens.length === 0) return null;
  if (opts.allowAll === true && tokens.includes("all")) return seasonKeysOnDisk();
  if (tokens.includes("current")) return [currentSeasonKey()];
  const start = parseInt(tokens[0].slice(0, 4), 10);
  const end = tokens[1] ? parseInt(tokens[1].slice(0, 4), 10) : start;
  const seasons: string[] = [];
  for (let y = start; y <= end; y++) seasons.push(seasonKey(y));
  return seasons;
}

export function readJson<T>(file: string): T {
  return JSON.parse(fs.readFileSync(file, "utf8")) as T;
}

export function writeJson(file: string, data: unknown): void {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + "\n");
}

export function loadSeasonFile(season: string): SeasonFile {
  const file = path.join(MATCHES_DIR, `${season}.json`);
  if (!fs.existsSync(file)) return { season, matches: [] };
  return readJson<SeasonFile>(file);
}

export function saveSeasonFile(sf: SeasonFile): void {
  sf.matches.sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
  writeJson(path.join(MATCHES_DIR, `${sf.season}.json`), sf);
}

export function listSeasonFiles(): string[] {
  if (!fs.existsSync(MATCHES_DIR)) return [];
  return fs
    .readdirSync(MATCHES_DIR)
    .filter((f) => f.endsWith(".json"))
    .sort();
}

export interface AliasFile { aliases: Record<string, string> }

export function opponentIdFor(displayName: string, aliases: Record<string, string>): string {
  return aliases[displayName] ?? slugify(displayName);
}
