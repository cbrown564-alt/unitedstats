/**
 * Enrich canonical matches from MUFCInfo match pages.
 *
 * MUFCInfo exposes one match page per date:
 *   https://www.mufcinfo.com/manupag/match_data/match_sql.php?my_match_date=YYYY-MM-DD
 *
 * The lineup section contains 11 starter rows plus substituted-on players when
 * applicable. This importer is conservative: it only writes a match when all
 * starters and used substitutes resolve to canonical United player ids.
 *
 * Usage:
 *   npm run ingest:mufcinfo-lineups -- 1992-93
 *   npm run ingest:mufcinfo-lineups -- 1992-93 1998-99 --write
 *   npm run ingest:mufcinfo-lineups -- --date 1992-09-23
 *   npm run ingest:mufcinfo-lineups -- all --limit 100
 */
import fs from "node:fs";
import path from "node:path";
import {
  CANONICAL, LineupEntry, Match, RAW, SeasonFile,
  loadSeasonFile, parseSeasonArgs, readJson, saveSeasonFile, seasonOfDate, slugify, userAgent, writeJson,
} from "../lib";

const SOURCE_ID = "mufcinfo-match-lineups";
const BASE_URL = "https://www.mufcinfo.com/manupag/match_data/match_sql.php";
const USER_AGENT = userAgent("mufcinfo-lineup-ingest");
const CACHE = path.join(RAW, "mufcinfo", "matches");
const WRITE = process.argv.includes("--write");
const REPARSE = process.argv.includes("--reparse");
const REFRESH = process.argv.includes("--refresh");
const CONCURRENCY = numberArg("--concurrency", 6);
const LIMIT = numberArg("--limit", 0);
const DATE = stringArg("--date");

const MUFCINFO_DATE_ALIASES: Record<string, string> = {
  // MUFCInfo exposes these 1899-00 fixtures one day later than the
  // canonical Saturday dates used by engsoccerdata and the local schedule.
  "1900-01-06": "1900-01-07",
  "1900-01-13": "1900-01-14",
  "1900-02-03": "1900-02-04",
  "1900-02-10": "1900-02-11",
  "1900-02-17": "1900-02-18",
  "1900-02-24": "1900-02-25",
};

interface PlayerRecord {
  playerId: string;
  name: string;
  wikiTitle?: string | null;
  firstYear?: number | null;
  lastYear?: number | null;
}

interface PlayersFile {
  players: { id: string; name: string; positions?: string[] | null; nationality?: string | null; born?: string | null }[];
}

interface ResolvedPlayer {
  playerId: string;
  name: string;
  inPlayers: boolean;
}

interface MufcInfoRow {
  date: string;
  shirt: number;
  displayName: string;
  displaySlug: string;
  hrefKey: string;
  start: boolean;
  bench: boolean;
  on: number | null;
  offName: string | null;
  resolved?: ResolvedPlayer | null;
}

interface MatchJob {
  season: string;
  match: Match;
}

interface ImportStats {
  checked: number;
  existing: number;
  noRows: number;
  badStarterCount: number;
  unresolvedStarters: number;
  unresolvedSubs: number;
  duplicates: number;
  wouldWrite: number;
  written: number;
  failed: number;
}

const HREF_ALIASES: Record<string, string> = {
  anderson: "anderson",
  anderson_oliveira: "anderson",
  bennion_samuel: "ray-bennion",
  astley_john: "joe-astley",
  bayindir_altay: "altay-bay-nd-r",
  bebe_tiago: "bebe",
  birkett_clifford: "cliff-birkett",
  black_arthur: "dick-black",
  bradbury_leonard: "len-bradbury",
  brown_robert: "berry-brown",
  brown_william: "rimmer-brown",
  brown_wesley: "wes-brown",
  buckley_franklin: "frank-buckley",
  bryant_william_02: "billy-bryant",
  buckle_edward: "ted-buckle",
  caine_james: "james-caine",
  capper_alfred: "freddy-capper",
  casimiro_carlos: "casemiro",
  cassidy_laurence: "laurie-cassidy",
  chalmers_william: "stewart-chalmers",
  chester_reginald: "reg-chester",
  chisnall_phillip: "phil-chisnall",
  collinson_clifford: "cliff-collinson",
  connaughton_patrick: "john-connaughton",
  connor_edward: "ted-connor",
  cole_andrew: "andy-cole",
  da_silva_fabio: "fabio-pereira-da-silva",
  da_silva_rafael: "rafael",
  dalton_edward: "ted-dalton",
  davies_ronald: "ron-davies",
  donaghy_bernard: "mal-donaghy",
  donnelly_anthony: "tony-donnelly",
  dong_fangzhou: "dong-fangzhuo",
  draycott_levi: "billy-draycott",
  dos_santos_antony: "antony",
  duxbury_michael: "mike-duxbury",
  farman_alfred: "alf-farman",
  feehan_john: "sonny-feehan",
  ferguson_daniel: "danny-ferguson",
  ferrier_ronald: "ron-ferrier",
  fitton_george: "arthur-fitton",
  fred: "fred",
  fryers_ezekiel: "zeki-fryers",
  gardner_charles: "dick-gardner",
  gibson_thomas: "don-gibson",
  goldthorpe_ernest: "ernie-goldthorpe",
  green_robert: "eddie-green",
  grimshaw_anthony: "tony-grimshaw",
  halton_reginald: "reg-halton",
  hamill_michael: "mickey-hamill",
  haworth_ronald: "ron-haworth",
  hawksworth_anthony: "tony-hawksworth",
  heathcote_joseph: "joe-heathcote",
  hilditch_clarence: "lal-hilditch",
  hine_ernest: "ernie-hine",
  hunter_john: "reg-hunter",
  jenkyns_ceaser: "caesar-jenkyns",
  johnson_edward: "eddie-johnson",
  jones_ernest: "peter-jones",
  jones_thomas: "tom-jones",
  jones_thomas_john: "tommy-jones",
  kleberson_jose_pereira: "jose-kleberson",
  langford_leonard: "len-langford",
  lappin_hubert: "harry-lappin",
  lawson_reginald: "reg-lawson",
  lawton_norbert: "nobby-lawton",
  lewis_edward: "eddie-lewis",
  lynn_samuel: "sammy-lynn",
  macdonald_kenneth: "ken-macdonald",
  maiorana_guiliano: "giuliano-maiorana",
  mcfetridge_david: "david-mcfetridge",
  mcilvenny_edward: "ed-mcilvenny",
  mcmillan_samuel: "sammy-mcmillan",
  montgomery_archibald: "archie-montgomery",
  morton_benjamin: "ben-morton",
  mulryne_philip: "phil-mulryne",
  nani: "nani",
  neville_phillip: "phil-neville",
  paterson_steven: "steve-paterson",
  pepper_francis: "frank-pepper",
  pinner_michael: "mike-pinner",
  pique_gerard: "gerard-pique",
  ricardo_lopez_felipe: "ricardo",
  rennox_clatworthy: "charlie-rennox",
  roberts_w_f: "bogie-roberts",
  richardson_lancelot: "lance-richardson",
  roughton_william: "george-roughton",
  savage_robert: "ted-savage",
  smith_william: "stockport-smith",
  taylor_christopher: "chris-taylor",
  thomson_william: "william-thomson",
  tomlinson_greame: "graeme-tomlinson",
  tranter_wilfred: "wilf-tranter",
  tyler_sidney: "syd-tyler",
  wedge_francis: "frank-wedge",
  wellens_richard: "richie-wellens",
  whitefoot_jefferey: "jeff-whitefoot",
  williams_rees: "rees-williams",
  woodcock_wilfred: "wilf-woodcock",
  worrall_harold: "harry-worrall",
  zaha_wilfred: "wilfried-zaha",
};

const NAME_ALIASES: Record<string, string> = {
  "alexander-stepney": "alex-stepney",
  "alfred-steward": "alf-steward",
  "andrew-cole": "andy-cole",
  "andrey-kanchelskis": "andrei-kanchelskis",
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
  sandy: ["alex", "alexander"],
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
  return Number.isFinite(value) && value >= 0 ? value : fallback;
}

function stringArg(flag: string): string | null {
  const index = process.argv.indexOf(flag);
  if (index < 0) return null;
  const value = process.argv[index + 1];
  return value && !value.startsWith("--") ? value : null;
}

function usage(): never {
  console.error("usage: tsx scripts/ingest/mufcinfo-lineups.ts <season> [<endSeason>] | current | all [--date YYYY-MM-DD] [--write] [--reparse] [--refresh]");
  process.exit(1);
}

function htmlDecode(value: string): string {
  return value
    .replace(/&quot;/g, "\"")
    .replace(/&#039;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanPersonName(name: string): string {
  return name
    .replace(/"/g, "")
    .replace(/\bJnr\b\.?/i, "Jr")
    .replace(/\bSnr\b\.?/i, "Sr")
    .replace(/\s+/g, " ")
    .trim();
}

function displayName(lastFirst: string): string {
  const cleaned = cleanPersonName(htmlDecode(lastFirst));
  const parts = cleaned.split(",").map((part) => part.trim()).filter(Boolean);
  return parts.length >= 2 ? `${parts.slice(1).join(" ")} ${parts[0]}` : cleaned;
}

function normalizedSlug(name: string): string {
  return slugify(
    cleanPersonName(name)
      .replace(/æ/g, "ae")
      .replace(/Æ/g, "Ae")
      .replace(/ø/g, "o")
      .replace(/Ø/g, "O")
      .replace(/ð/g, "d")
      .replace(/Ð/g, "D")
      .replace(/þ/g, "th")
      .replace(/Þ/g, "Th"),
  );
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

function hrefSlug(hrefKey: string): string | null {
  const parts = hrefKey.split("_").filter(Boolean);
  if (parts.length < 2) return null;
  const suffix = /^\d+$/.test(parts[parts.length - 1]) ? parts.slice(1, -1) : parts.slice(1);
  return normalizedSlug([...suffix, parts[0]].join(" "));
}

function subOffName(text: string): { name: string; minute: number } | null {
  const match = text.match(/\bON\s+for\s+(.+?)\s+(\d+)'/i);
  if (!match) return null;
  return { name: cleanPersonName(match[1]), minute: Number(match[2]) };
}

function parseRows(date: string, html: string): MufcInfoRow[] {
  const rows: MufcInfoRow[] = [];
  const rowPattern =
    /<tr>\s*<td[^>]*>[\s\S]*?alt="(?:Manchester United|Newton Heath) squad number\s+(\d+)"[\s\S]*?<\/tr>/gi;
  let match: RegExpExecArray | null;
  while ((match = rowPattern.exec(html)) !== null) {
    const rawRow = match[0];
    const link = rawRow.match(/<td class="articles_main_text"[^>]*>\s*<a href="([^"]+)"[^>]*>\s*([\s\S]*?)\s*<\/a>/i);
    if (!link) continue;
    const display = displayName(link[2]);
    const text = htmlDecode(rawRow);
    const sub = subOffName(text);
    const index = rows.length;
    rows.push({
      date,
      shirt: Number(match[1]),
      displayName: display,
      displaySlug: normalizedSlug(display),
      hrefKey: path.basename(link[1], ".html"),
      start: index < 11 && sub == null,
      bench: index >= 11 && sub == null,
      on: sub?.minute ?? null,
      offName: sub?.name ?? null,
    });
  }
  return rows;
}

function matchesOffName(row: MufcInfoRow, name: string): boolean {
  const needle = normalizedSlug(name);
  const display = row.displaySlug;
  if (display === needle || display.endsWith(`-${needle}`)) return true;
  const parts = display.split("-");
  return parts[parts.length - 1] === needle;
}

function seasonsFromArgs(): string[] {
  if (DATE) return [seasonOfDate(DATE)];
  return parseSeasonArgs(process.argv.slice(2), { allowAll: true }) ?? usage();
}

function cacheFile(date: string): string {
  return path.join(CACHE, `${date}.html`);
}

async function matchHtml(date: string): Promise<string> {
  const sourceDate = MUFCINFO_DATE_ALIASES[date] ?? date;
  const file = cacheFile(sourceDate);
  if (fs.existsSync(file) && !REFRESH) return fs.readFileSync(file, "utf8");
  fs.mkdirSync(CACHE, { recursive: true });
  const res = await fetch(`${BASE_URL}?my_match_date=${sourceDate}`, {
    headers: { "user-agent": USER_AGENT },
  });
  if (!res.ok) throw new Error(`MUFCInfo ${res.status} ${res.statusText}: ${date}`);
  const html = await res.text();
  fs.writeFileSync(file, html, "utf8");
  return html;
}

function buildResolver(playersFile: PlayersFile, records: PlayerRecord[]): (row: MufcInfoRow) => ResolvedPlayer | null {
  const inPlayers = new Set(playersFile.players.map((p) => p.id));
  const people = new Map<string, ResolvedPlayer>();
  for (const player of playersFile.players) {
    people.set(player.id, { playerId: player.id, name: player.name, inPlayers: true });
    people.set(normalizedSlug(player.name), { playerId: player.id, name: player.name, inPlayers: true });
  }
  for (const record of records) {
    const resolved = {
      playerId: record.playerId,
      name: record.name,
      inPlayers: inPlayers.has(record.playerId),
    };
    people.set(record.playerId, resolved);
    people.set(normalizedSlug(record.name), resolved);
    if (record.wikiTitle) {
      people.set(normalizedSlug(record.wikiTitle.replace(/\(.+\)$/, "")), resolved);
    }
  }

  const directFor = (id: string | null | undefined): ResolvedPlayer | null => {
    if (!id) return null;
    return people.get(id) ?? people.get(normalizedSlug(id)) ?? null;
  };

  return (row: MufcInfoRow): ResolvedPlayer | null => {
    const explicitAlias = HREF_ALIASES[row.hrefKey] ?? NAME_ALIASES[row.displaySlug];
    if (explicitAlias) {
      return directFor(explicitAlias) ?? {
        playerId: explicitAlias,
        name: row.displayName,
        inPlayers: false,
      };
    }

    const direct =
      directFor(row.displaySlug) ??
      directFor(hrefSlug(row.hrefKey));
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
    return candidates.length === 1 ? directFor(candidates[0].playerId) : null;
  };
}

function lineupFromRows(rows: MufcInfoRow[]): { lineup: LineupEntry[]; reason: keyof ImportStats | null } {
  const starters = rows.filter((row) => row.start);
  const usedSubs = rows.filter((row) => !row.start && !row.bench);
  if (starters.length !== 11) return { lineup: [], reason: "badStarterCount" };
  if (starters.some((row) => !row.resolved)) return { lineup: [], reason: "unresolvedStarters" };
  if (usedSubs.some((row) => !row.resolved)) return { lineup: [], reason: "unresolvedSubs" };

  const seen = new Set<string>();
  const lineup: LineupEntry[] = [];
  for (const row of rows) {
    if (!row.resolved) continue;
    const key = row.resolved.playerId;
    if (seen.has(key)) return { lineup: [], reason: "duplicates" };
    seen.add(key);
    lineup.push({
      player: row.resolved.playerId,
      playerName: row.resolved.name,
      playerSide: "united",
      providerId: `mufcinfo:${row.hrefKey}`,
      shirt: row.shirt,
      role: null,
      start: row.start,
      bench: row.bench,
      on: row.on,
      off: null,
    });
  }

  for (const sub of usedSubs) {
    if (sub.offName == null || sub.on == null) continue;
    const offRow = starters.find((row) => matchesOffName(row, sub.offName ?? ""));
    if (!offRow?.resolved) continue;
    const offEntry = lineup.find((entry) => entry.player === offRow.resolved?.playerId);
    if (offEntry) offEntry.off = sub.on;
  }

  return { lineup, reason: null };
}

function addMissingPlayers(playersFile: PlayersFile, rows: MufcInfoRow[]): number {
  const known = new Set(playersFile.players.map((p) => p.id));
  let added = 0;
  for (const row of rows) {
    const resolved = row.resolved;
    if (!resolved || known.has(resolved.playerId)) continue;
    playersFile.players.push({ id: resolved.playerId, name: resolved.name });
    known.add(resolved.playerId);
    added++;
  }
  return added;
}

function plannedJobs(seasons: string[]): { jobs: MatchJob[]; seasonFiles: Map<string, SeasonFile> } {
  const jobs: MatchJob[] = [];
  const seasonFiles = new Map<string, SeasonFile>();
  for (const season of seasons) {
    const sf = loadSeasonFile(season);
    seasonFiles.set(season, sf);
    for (const match of sf.matches) {
      if (DATE && match.date !== DATE) continue;
      jobs.push({ season, match });
    }
  }
  return { jobs: LIMIT > 0 ? jobs.slice(0, LIMIT) : jobs, seasonFiles };
}

async function main() {
  const seasons = seasonsFromArgs();
  const playersFile = readJson<PlayersFile>(path.join(CANONICAL, "players.json"));
  const playerRecords = readJson<{ records: PlayerRecord[] }>(path.join(CANONICAL, "player-records.json")).records;
  const resolvePlayer = buildResolver(playersFile, playerRecords);
  const { jobs, seasonFiles } = plannedJobs(seasons);
  const stats: ImportStats = {
    checked: 0,
    existing: 0,
    noRows: 0,
    badStarterCount: 0,
    unresolvedStarters: 0,
    unresolvedSubs: 0,
    duplicates: 0,
    wouldWrite: 0,
    written: 0,
    failed: 0,
  };
  const touchedSeasons = new Set<string>();
  let cursor = 0;
  let newPlayers = 0;

  async function worker() {
    while (cursor < jobs.length) {
      const job = jobs[cursor++];
      const match = job.match;
      stats.checked++;
      if (!REPARSE && match.lineup && match.lineup.length > 0) {
        stats.existing++;
        continue;
      }
      try {
        const rows = parseRows(match.date, await matchHtml(match.date));
        if (rows.length === 0) {
          stats.noRows++;
          continue;
        }
        for (const row of rows) row.resolved = resolvePlayer(row);
        const result = lineupFromRows(rows);
        if (result.reason) {
          stats[result.reason]++;
          const unresolved = rows
            .filter((row) => !row.resolved && (row.start || row.on != null))
            .map((row) => `${row.displayName} (${row.hrefKey})`);
          const detail = unresolved.length ? `: ${unresolved.slice(0, 4).join(", ")}` : "";
          console.log(`skip ${match.id}: ${result.reason}${detail}`);
          continue;
        }
        stats.wouldWrite++;
        const starters = result.lineup.filter((row) => row.start).length;
        const subs = result.lineup.filter((row) => !row.start && !row.bench).length;
        if (WRITE) {
          newPlayers += addMissingPlayers(playersFile, rows);
          match.lineup = result.lineup;
          if (!match.sources.includes(SOURCE_ID)) match.sources.push(SOURCE_ID);
          touchedSeasons.add(job.season);
          stats.written++;
        }
        console.log(`${WRITE ? "write" : "dry"} ${match.id}: ${starters} starters + ${subs} used subs`);
      } catch (error) {
        stats.failed++;
        console.warn(`${match.id}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }

  await Promise.all(Array.from({ length: Math.max(1, CONCURRENCY) }, () => worker()));

  if (WRITE) {
    if (newPlayers > 0) {
      playersFile.players.sort((a, b) => a.id.localeCompare(b.id));
      writeJson(path.join(CANONICAL, "players.json"), playersFile);
    }
    for (const season of touchedSeasons) {
      const sf = seasonFiles.get(season);
      if (sf) saveSeasonFile(sf);
    }
  }

  console.log(
    `mufcinfo-lineups ${WRITE ? "write" : "dry-run"}: ` +
      `${stats.checked} checked, ${stats.written || stats.wouldWrite} enrichable, ` +
      `${stats.existing} existing skipped, ${stats.noRows} no rows, ` +
      `${stats.unresolvedStarters} unresolved starters, ${stats.unresolvedSubs} unresolved subs, ` +
      `${stats.badStarterCount} bad starter counts, ${stats.duplicates} duplicates, ` +
      `${stats.failed} failed, ${newPlayers} players added`,
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
