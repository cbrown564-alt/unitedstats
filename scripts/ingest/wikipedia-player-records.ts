/**
 * Import verified Manchester United player appearance records from Wikipedia's
 * three player-list pages. These pages cover the competitive first-team scope
 * that the app should use for headline all-time apps/goals.
 *
 * Usage:
 *   npm run ingest:player-records
 */
import path from "node:path";
import { CANONICAL, slugify, writeJson } from "../lib";

const USER_AGENT = "unitedstats/1.0 player-record ingest";
const SOURCE_ID = "wikipedia-player-records";
const STATS_AS_OF = "2026-05-24";

const PLAYER_ID_OVERRIDES: Record<string, string> = {
  "alexander-robertson": "alex-robertson",
  "fabio": "fabio-pereira-da-silva",
  "hannibal-mejbri": "hannibal",
  "javier-hernandez": "chicharito",
  "johnny-downie": "john-downie",
  "jordi-cruyff": "jordi-cruijff",
  "kleberson": "jose-kleberson",
};

const PAGES = [
  {
    title: "List_of_Manchester_United_F.C._players",
    url: "https://en.wikipedia.org/wiki/List_of_Manchester_United_F.C._players",
    bucket: "100-plus",
  },
  {
    title: "List_of_Manchester_United_F.C._players_(25–99_appearances)",
    url: "https://en.wikipedia.org/wiki/List_of_Manchester_United_F.C._players_(25%E2%80%9399_appearances)",
    bucket: "25-99",
  },
  {
    title: "List_of_Manchester_United_F.C._players_(1–24_appearances)",
    url: "https://en.wikipedia.org/wiki/List_of_Manchester_United_F.C._players_(1%E2%80%9324_appearances)",
    bucket: "1-24",
  },
] as const;

interface ParsedRecord {
  sourceSlug: string;
  playerId: string;
  name: string;
  wikiTitle: string;
  career: string;
  firstYear: number | null;
  lastYear: number | null;
  starts: number;
  subs: number;
  apps: number;
  goals: number;
  sourceId: string;
  sourceUrl: string;
  sourcePage: string;
  sourceBucket: string;
  statsAsOf: string;
}

function cleanCell(cell: string): string {
  return cell
    .replace(/'''/g, "")
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function stripRefs(value: string): string {
  return value.replace(/<ref[\s\S]*$/i, "").trim();
}

function templateParam(raw: string, name: string): string | null {
  const match = raw.match(new RegExp(`(?:^|\\|)${name}=([^|}]+)`, "i"));
  return match?.[1]?.trim() ?? null;
}

function titleFromNameTemplate(raw: string, displayName: string): string {
  const dab = templateParam(raw, "dab");
  if (dab) return `${displayName} (${dab})`;
  return displayName;
}

function parseName(rawName: string): { name: string; wikiTitle: string } {
  const raw = stripRefs(rawName).replace(/'''/g, "").trim();
  const sortName = raw.match(/\{\{sortname\|([^|}]*)\|([^|}]+)(?:\|[^}]*)?\}\}/i);
  if (sortName) {
    const name = [sortName[1], sortName[2]]
      .filter(Boolean)
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
    return { name, wikiTitle: titleFromNameTemplate(raw, name) };
  }

  const sort = raw.match(/\{\{sort\|[^|}]+\|([^}]+)\}\}/i);
  const linked = sort ? sort[1] : raw;
  const pipedLink = linked.match(/\[\[([^|\]]+)\|([^\]]+)\]\]/);
  if (pipedLink) return { name: cleanCell(pipedLink[2]), wikiTitle: pipedLink[1].trim() };
  const plainLink = linked.match(/\[\[([^\]]+)\]\]/);
  if (plainLink) return { name: cleanCell(plainLink[1]), wikiTitle: plainLink[1].trim() };

  const name = cleanCell(linked.replace(/\{\{[^}]+\}\}/g, ""));
  return { name, wikiTitle: name };
}

function parseYears(career: string): { firstYear: number | null; lastYear: number | null } {
  const years = [...career.matchAll(/\d{4}/g)].map((m) => Number(m[0]));
  if (years.length === 0) return { firstYear: null, lastYear: null };
  return {
    firstYear: years[0],
    lastYear: career.trim().endsWith("–") || career.trim().endsWith("-") ? null : years[years.length - 1],
  };
}

function numberFromCell(cell: string): number {
  const match = cell.match(/\d+/);
  if (!match) throw new Error(`Could not parse numeric cell: ${cell}`);
  return Number(match[0]);
}

function extractMainTable(wikitext: string): string {
  const start = wikitext.indexOf('{| class="wikitable plainrowheaders sortable');
  if (start < 0) throw new Error("Could not find player table");
  const end = wikitext.indexOf("\n|}", start);
  if (end < 0) throw new Error("Could not find player table end");
  return wikitext.slice(start, end);
}

function cellsAfter(row: string, start: number): string[] {
  const cells: string[] = [];
  for (const line of row.slice(start).split("\n")) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("|") || trimmed.startsWith("|-") || trimmed.startsWith("|}")) continue;
    const body = trimmed.replace(/^\|\s*/, "");
    cells.push(...body.split("||").map((cell) => cell.trim()).filter(Boolean));
  }
  return cells;
}

function uniquePlayerId(baseId: string, career: string, used: Set<string>): string {
  const override = PLAYER_ID_OVERRIDES[baseId];
  if (override && !used.has(override)) {
    used.add(override);
    return override;
  }
  if (!used.has(baseId)) {
    used.add(baseId);
    return baseId;
  }
  const firstYear = parseYears(career).firstYear;
  const candidate = firstYear ? `${baseId}-${firstYear}` : `${baseId}-record`;
  if (!used.has(candidate)) {
    used.add(candidate);
    return candidate;
  }
  let suffix = 2;
  while (used.has(`${candidate}-${suffix}`)) suffix++;
  const id = `${candidate}-${suffix}`;
  used.add(id);
  return id;
}

function parseTable(wikitext: string, page: typeof PAGES[number], used: Set<string>): ParsedRecord[] {
  const table = extractMainTable(wikitext);
  const rows = table.split(/\n\|-\s*\n/);
  const parsed: ParsedRecord[] = [];

  for (const row of rows) {
    const nameMatch = row.match(/!\s*scope="row"[^|]*\|\s*([^\n]+)/i);
    if (!nameMatch) continue;
    const nameMatchIndex = nameMatch.index;
    if (nameMatchIndex == null) continue;

    const { name, wikiTitle } = parseName(nameMatch[1]);
    if (!name) continue;

    const cells = cellsAfter(row, nameMatchIndex + nameMatch[0].length);
    if (cells.length < 7) continue;

    const career = cleanCell(cells[2]);
    const { firstYear, lastYear } = parseYears(career);
    const sourceSlug = slugify(name);

    parsed.push({
      sourceSlug,
      playerId: uniquePlayerId(sourceSlug, career, used),
      name,
      wikiTitle,
      career,
      firstYear,
      lastYear,
      starts: numberFromCell(cells[3]),
      subs: numberFromCell(cells[4]),
      apps: numberFromCell(cells[5]),
      goals: numberFromCell(cells[6]),
      sourceId: SOURCE_ID,
      sourceUrl: page.url,
      sourcePage: page.title,
      sourceBucket: page.bucket,
      statsAsOf: STATS_AS_OF,
    });
  }

  return parsed;
}

async function fetchWikitext(pageTitle: string): Promise<string> {
  const url = new URL("https://en.wikipedia.org/w/api.php");
  url.searchParams.set("action", "parse");
  url.searchParams.set("page", pageTitle);
  url.searchParams.set("prop", "wikitext");
  url.searchParams.set("format", "json");
  url.searchParams.set("formatversion", "2");
  url.searchParams.set("origin", "*");

  const res = await fetch(url, { headers: { "user-agent": USER_AGENT } });
  if (!res.ok) throw new Error(`Wikipedia ${res.status} ${res.statusText}: ${pageTitle}`);
  const json = await res.json() as { parse?: { wikitext?: string }; error?: { info?: string } };
  if (json.error) throw new Error(`Wikipedia API error: ${json.error.info ?? "unknown"}`);
  if (!json.parse?.wikitext) throw new Error(`No wikitext returned for ${pageTitle}`);
  return json.parse.wikitext;
}

async function main() {
  const used = new Set<string>();
  const records: ParsedRecord[] = [];

  for (const page of PAGES) {
    const wikitext = await fetchWikitext(page.title);
    records.push(...parseTable(wikitext, page, used));
  }

  records.sort((a, b) => b.apps - a.apps || b.goals - a.goals || a.playerId.localeCompare(b.playerId));
  const duplicateNames = records.length - new Set(records.map((r) => r.sourceSlug)).size;
  const out = {
    generatedAt: new Date().toISOString(),
    statsAsOf: STATS_AS_OF,
    sourceId: SOURCE_ID,
    sourceName: "Wikipedia Manchester United player lists",
    sourceUrls: PAGES.map((p) => p.url),
    notes: [
      "Competitive first-team scope; wartime matches and the abandoned 1939-40 season are excluded by the source pages.",
      "Player IDs are generated from display names; same-name collisions receive a first-career-year suffix.",
    ],
    records,
  };

  writeJson(path.join(CANONICAL, "player-records.json"), out);
  console.log(`wrote ${records.length} player records (${duplicateNames} same-name collisions disambiguated)`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
