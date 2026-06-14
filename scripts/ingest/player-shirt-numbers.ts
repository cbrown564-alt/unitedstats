/**
 * Derive primary shirt-number evidence for the appearance-ranked player list.
 *
 * MUFCInfo match pages carry historical Manchester United lineups with shirt
 * number images and player archive links. This script caches those pages and
 * rolls them up into a compact canonical player-shirt summary, without
 * rewriting per-match canonical JSON.
 *
 * Usage:
 *   npm run ingest:player-shirts
 *   npm run ingest:player-shirts -- --limit 500 --refresh
 */
import fs from "node:fs";
import path from "node:path";
import {
  CANONICAL, MATCHES_DIR, RAW, listSeasonFiles, readJson, writeJson,
} from "../lib";
import { displayName, normalizedSlug } from "../player-resolver";

const SOURCE_ID = "mufcinfo-match-lineups";
const USER_AGENT = "unitedstats/1.0 player-shirt ingest";
const CACHE = path.join(RAW, "mufcinfo", "matches");
const LIMIT = numberArg("--limit", 500);
const REFRESH = process.argv.includes("--refresh");
const CONCURRENCY = numberArg("--concurrency", 8);

interface PlayerRecord {
  playerId: string;
  name: string;
  wikiTitle?: string | null;
  career: string;
  firstYear?: number | null;
  lastYear?: number | null;
  starts: number;
  subs: number;
  apps: number;
  goals: number;
}

interface MatchDate {
  date: string;
}

interface ShirtRow {
  date: string;
  shirt: number;
  displayName: string;
  displaySlug: string;
  hrefKey: string;
}

interface ShirtCount {
  playerId: string;
  name: string;
  shirt: number;
  decade: string;
  apps: number;
  firstDate: string;
  lastDate: string;
  sourceId: string;
}

const HREF_ALIASES: Record<string, string> = {
  anderson: "anderson",
  anderson_oliveira: "anderson",
  bennion_samuel: "ray-bennion",
  bryant_william_02: "billy-bryant",
  buckle_edward: "ted-buckle",
  chalmers_william: "stewart-chalmers",
  chisnall_phillip: "phil-chisnall",
  brown_wesley: "wes-brown",
  cole_andrew: "andy-cole",
  da_silva_fabio: "fabio-pereira-da-silva",
  da_silva_rafael: "rafael",
  donnelly_anthony: "tony-donnelly",
  dos_santos_antony: "antony",
  duxbury_michael: "mike-duxbury",
  fred: "fred",
  gibson_thomas: "don-gibson",
  goldthorpe_ernest: "ernie-goldthorpe",
  hamill_michael: "mickey-hamill",
  hilditch_clarence: "lal-hilditch",
  hine_ernest: "ernie-hine",
  kleberson_jose_pereira: "jose-kleberson",
  lappin_hubert: "harry-lappin",
  lawton_norbert: "nobby-lawton",
  lewis_edward: "eddie-lewis",
  nani: "nani",
  neville_phillip: "phil-neville",
  pique_gerard: "gerard-pique",
  rennox_clatworthy: "charlie-rennox",
  richardson_lancelot: "lance-richardson",
  roughton_william: "george-roughton",
  taylor_christopher: "chris-taylor",
  whitefoot_jefferey: "jeff-whitefoot",
  williams_rees: "rees-williams",
  woodcock_wilfred: "wilf-woodcock",
};

const NAME_ALIASES: Record<string, string> = {
  "alexander-stepney": "alex-stepney",
  "alfred-steward": "alf-steward",
  "andrey-kanchelskis": "andrei-kanchelskis",
  "andrew-cole": "andy-cole",
  "da-silva-fabio": "fabio-pereira-da-silva",
  "da-silva-rafael": "rafael",
  "fredico-fred-rodrigues": "fred",
  "ji-sung-park": "park-ji-sung",
  "john-aston-jnr": "john-aston-jr",
  "john-sutcliffe": "john-willie-sutcliffe",
  "luis-nani": "nani",
  "ole-gunnar-solskjaer": "ole-gunnar-solskj-r",
  "pat-crerand": "paddy-crerand",
  "phillip-neville": "phil-neville",
  "ron-cope": "ronnie-cope",
  "wesley-brown": "wes-brown",
  "william-foulkes": "bill-foulkes",
};

const NICKNAMES: Record<string, string[]> = {
  alex: ["alexander", "sandy"],
  alf: ["alfred"],
  andy: ["andrew"],
  bert: ["albert", "herbert", "robert", "thomas"],
  bill: ["billy", "will", "william", "willie"],
  billy: ["bill", "will", "william", "willie"],
  bob: ["robert"],
  bobby: ["bob", "robert"],
  charlie: ["charles"],
  dick: ["ernest", "richard"],
  fred: ["frederick"],
  freddie: ["frederick"],
  harry: ["henry"],
  jack: ["john"],
  jackie: ["jack", "john"],
  jim: ["james", "jimmy"],
  jimmy: ["james", "jim"],
  joe: ["joseph"],
  johnny: ["john"],
  matthew: ["matt"],
  pat: ["patrick", "paddy"],
  paddy: ["pat", "patrick"],
  ray: ["raymond"],
  ronnie: ["ron", "ronald"],
  teddy: ["edward", "ted"],
  tom: ["thomas", "tommy"],
  tommy: ["thomas", "tom"],
  will: ["bill", "billy", "william", "willie"],
  william: ["bill", "billy", "will", "willie"],
  willie: ["bill", "billy", "will", "william"],
};

function numberArg(flag: string, fallback: number): number {
  const index = process.argv.indexOf(flag);
  if (index < 0) return fallback;
  const value = Number(process.argv[index + 1]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function nameParts(name: string): { first: string; last: string } | null {
  const parts = normalizedSlug(name).split("-").filter(Boolean);
  if (parts.length < 2) return null;
  return { first: parts[0], last: parts[parts.length - 1] };
}

function compatibleFirstNames(a: string, b: string): boolean {
  if (a === b) return true;
  return (NICKNAMES[a] ?? []).includes(b) || (NICKNAMES[b] ?? []).includes(a);
}

function careerContains(record: PlayerRecord, year: number): boolean {
  const first = record.firstYear ?? 0;
  const last = record.lastYear ?? 9999;
  return year >= first - 1 && year <= last + 1;
}

function parseRows(date: string, html: string): ShirtRow[] {
  const rows: ShirtRow[] = [];
  const rowPattern =
    /<tr>\s*<td[^>]*>[\s\S]*?alt="Manchester United squad number (\d+)"[\s\S]*?<td class="articles_main_text"[^>]*>\s*<a href="([^"]+)"[^>]*>\s*([\s\S]*?)\s*<\/a>[\s\S]*?<\/tr>/g;
  let match: RegExpExecArray | null;
  while ((match = rowPattern.exec(html)) !== null) {
    const display = displayName(match[3]);
    const hrefKey = path.basename(match[2], ".html");
    rows.push({
      date,
      shirt: Number(match[1]),
      displayName: display,
      displaySlug: normalizedSlug(display),
      hrefKey,
    });
  }
  return rows;
}

function matchDates(): string[] {
  const dates = new Set<string>();
  for (const file of listSeasonFiles()) {
    const seasonFile = readJson<{ matches: MatchDate[] }>(path.join(MATCHES_DIR, file));
    for (const match of seasonFile.matches) dates.add(match.date);
  }
  return [...dates].sort();
}

function cacheFile(date: string): string {
  return path.join(CACHE, `${date}.html`);
}

async function matchHtml(date: string): Promise<string> {
  const file = cacheFile(date);
  if (fs.existsSync(file) && !REFRESH) return fs.readFileSync(file, "utf8");
  fs.mkdirSync(CACHE, { recursive: true });
  const url = `https://www.mufcinfo.com/manupag/match_data/match_sql.php?my_match_date=${date}`;
  const res = await fetch(url, { headers: { "user-agent": USER_AGENT } });
  if (!res.ok) throw new Error(`MUFCInfo ${res.status} ${res.statusText}: ${date}`);
  const html = await res.text();
  fs.writeFileSync(file, html, "utf8");
  return html;
}

function buildResolver(records: PlayerRecord[]): (row: ShirtRow) => string | null {
  const bySlug = new Map<string, PlayerRecord>();
  for (const record of records) {
    bySlug.set(record.playerId, record);
    bySlug.set(normalizedSlug(record.name), record);
    if (record.wikiTitle) {
      bySlug.set(normalizedSlug(record.wikiTitle.replace(/\(.+\)$/, "")), record);
    }
  }

  return (row: ShirtRow): string | null => {
    const direct =
      HREF_ALIASES[row.hrefKey] ??
      NAME_ALIASES[row.displaySlug] ??
      bySlug.get(row.displaySlug)?.playerId;
    if (direct) return direct;

    const parsed = nameParts(row.displayName);
    if (!parsed) return null;
    const year = Number(row.date.slice(0, 4));
    const candidates = records.filter((record) => {
      if (!careerContains(record, year)) return false;
      const recordParts = nameParts(record.name);
      if (!recordParts) return false;
      return parsed.last === recordParts.last && compatibleFirstNames(parsed.first, recordParts.first);
    });
    return candidates.length === 1 ? candidates[0].playerId : null;
  };
}

function addCount(counts: Map<string, ShirtCount>, row: ShirtRow, player: PlayerRecord): void {
  const decade = `${row.date.slice(0, 3)}0s`;
  const key = `${player.playerId}|${row.shirt}|${decade}`;
  const current = counts.get(key) ?? {
    playerId: player.playerId,
    name: player.name,
    shirt: row.shirt,
    decade,
    apps: 0,
    firstDate: row.date,
    lastDate: row.date,
    sourceId: SOURCE_ID,
  };
  current.apps++;
  if (row.date < current.firstDate) current.firstDate = row.date;
  if (row.date > current.lastDate) current.lastDate = row.date;
  counts.set(key, current);
}

async function main() {
  const playerRecords = readJson<{ records: PlayerRecord[] }>(
    path.join(CANONICAL, "player-records.json"),
  ).records;
  const ranked = playerRecords
    .map((record, index) => ({ record, index }))
    .sort((a, b) => b.record.apps - a.record.apps || a.index - b.index)
    .map(({ record }) => record);
  const targetRecords = ranked.slice(0, LIMIT);
  const targetIds = new Set(targetRecords.map((record) => record.playerId));
  const targetById = new Map(targetRecords.map((record) => [record.playerId, record]));
  const resolvePlayerId = buildResolver(playerRecords);
  const dates = matchDates();
  const counts = new Map<string, ShirtCount>();
  const unmatched = new Map<string, { displayName: string; hrefKey: string; dates: string[] }>();
  let parsedPages = 0;
  let noLineupPages = 0;
  let completed = 0;
  let cursor = 0;
  const startedAt = Date.now();

  async function worker() {
    while (cursor < dates.length) {
      const date = dates[cursor++];
      try {
        const rows = parseRows(date, await matchHtml(date));
        if (rows.length > 0) parsedPages++;
        else noLineupPages++;
        for (const row of rows) {
          const playerId = resolvePlayerId(row);
          if (!playerId) {
            const key = `${row.hrefKey}|${row.displaySlug}`;
            const current = unmatched.get(key) ?? { displayName: row.displayName, hrefKey: row.hrefKey, dates: [] };
            if (current.dates.length < 5) current.dates.push(date);
            unmatched.set(key, current);
            continue;
          }
          if (!targetIds.has(playerId)) continue;
          const player = targetById.get(playerId);
          if (player) addCount(counts, row, player);
        }
      } catch (error) {
        noLineupPages++;
        console.warn(`${date}: ${error instanceof Error ? error.message : String(error)}`);
      }
      completed++;
      if (completed % 500 === 0) {
        const seconds = Math.round((Date.now() - startedAt) / 1000);
        console.log(`parsed ${completed}/${dates.length} match pages in ${seconds}s`);
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));

  const coveredPlayers = new Set([...counts.values()].map((record) => record.playerId));
  const missingTopPlayers = targetRecords
    .filter((record) => !coveredPlayers.has(record.playerId))
    .map((record) => ({
      rank: ranked.findIndex((candidate) => candidate.playerId === record.playerId) + 1,
      playerId: record.playerId,
      name: record.name,
      apps: record.apps,
      career: record.career,
      note: record.lastYear != null && record.lastYear <= 1902
        ? "No numbered MUFCInfo match pages in this player's era."
        : "No matched shirt-number rows found.",
    }));

  const records = [...counts.values()].sort(
    (a, b) => a.playerId.localeCompare(b.playerId) || a.shirt - b.shirt || a.decade.localeCompare(b.decade),
  );

  writeJson(path.join(CANONICAL, "player-shirts.json"), {
    generatedAt: new Date().toISOString(),
    sourceId: SOURCE_ID,
    sourceName: "MUFCInfo match lineups",
    sourceUrl: "https://www.mufcinfo.com/manupag/match_data/match_sql.php",
    ranking: `Top ${LIMIT} players by verified competitive appearances in data/canonical/player-records.json; ties preserve source order.`,
    notes: [
      "Counts are derived from MUFCInfo match pages that expose Manchester United shirt-number rows.",
      "Rows are grouped by player, shirt number, and decade; substitute appearances are included when MUFCInfo lists the player in the match lineup section.",
      "Some Newton Heath-era players predate the numbered-shirt coverage available in MUFCInfo match pages.",
    ],
    coverage: {
      requestedPlayers: targetRecords.length,
      coveredPlayers: coveredPlayers.size,
      missingPlayers: missingTopPlayers.length,
      matchPages: dates.length,
      parsedPages,
      noLineupPages,
      unmatchedNames: unmatched.size,
    },
    missingTopPlayers,
    records,
  });

  console.log(
    `wrote ${records.length} player-shirt rows for ${coveredPlayers.size}/${targetRecords.length} players ` +
    `(${missingTopPlayers.length} missing)`,
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
