/**
 * Enrich canonical matches with stadium ids from MUFCInfo Venue lines.
 *
 * MUFCInfo match pages expose the ground as:
 *   Venue: Elland Road (A)
 * and (on modern pages) JSON-LD `location.name`. Home grounds are already
 * resolved at DB build from stadiums.json date ranges; this lane fills the
 * away/neutral gap and also stamps home stadiums onto canonical JSON.
 *
 * Unknown grounds are appended to data/canonical/stadiums.json (name + optional
 * city/country; no lat/lng). Existing stadium ids are never overwritten when
 * they disagree with MUFCInfo — conflicts are reported and skipped.
 *
 * Pages are read from the shared cache (data/raw/mufcinfo/matches/<date>.html);
 * nothing is fetched unless a page is missing and --refresh is passed.
 *
 * Usage:
 *   npm run ingest:mufcinfo-stadiums -- all
 *   npm run ingest:mufcinfo-stadiums -- all --write
 *   npm run ingest:mufcinfo-stadiums -- 1998-99 --write
 *   npm run ingest:mufcinfo-stadiums -- --inspect 1999-05-26
 */
import fs from "node:fs";
import path from "node:path";
import {
  CANONICAL, Match, RAW, SeasonFile,
  loadSeasonFile, parseSeasonArgs, readJson, saveSeasonFile, seasonOfDate,
  userAgent, writeJson,
} from "../lib";
import {
  parseVenueFromHtml,
  resolveVenueId,
  splitVenueLabel,
  stadiumFromLabel,
  STADIUM_META,
  type StadiumEntry,
} from "../mufcinfoVenues";

const SOURCE_ID = "mufcinfo-match-stadiums";
const BASE_URL = "https://www.mufcinfo.com/manupag/match_data/match_sql.php";
const USER_AGENT = userAgent("mufcinfo-stadiums-ingest");
const CACHE = path.join(RAW, "mufcinfo", "matches");
const STADIUMS_PATH = path.join(CANONICAL, "stadiums.json");
const WRITE = process.argv.includes("--write");
const REFRESH = process.argv.includes("--refresh");
const CONCURRENCY = numberArg("--concurrency", 8);
const LIMIT = numberArg("--limit", 0);
const DATE = stringArg("--date");
const INSPECT = stringArg("--inspect");

const MUFCINFO_DATE_ALIASES: Record<string, string> = {
  "1900-01-06": "1900-01-07",
  "1900-01-13": "1900-01-14",
  "1900-02-03": "1900-02-04",
  "1900-02-10": "1900-02-11",
  "1900-02-17": "1900-02-18",
  "1900-02-24": "1900-02-25",
};

interface MatchJob {
  season: string;
  match: Match;
}

interface ImportStats {
  checked: number;
  noPage: number;
  noVenue: number;
  alreadySet: number;
  conflict: number;
  wouldWrite: number;
  written: number;
  stadiumsAdded: number;
  failed: number;
}

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
  console.error(
    "usage: tsx scripts/ingest/mufcinfo-stadiums.ts <season> [<endSeason>] | current | all " +
      "[--date YYYY-MM-DD] [--inspect YYYY-MM-DD] [--write] [--refresh]",
  );
  process.exit(1);
}

function seasonsFromArgs(): string[] {
  if (DATE || INSPECT) return [seasonOfDate((DATE ?? INSPECT)!)];
  return parseSeasonArgs(process.argv.slice(2), { allowAll: true }) ?? usage();
}

async function matchHtml(date: string): Promise<string | null> {
  const sourceDate = MUFCINFO_DATE_ALIASES[date] ?? date;
  const file = path.join(CACHE, `${sourceDate}.html`);
  if (fs.existsSync(file) && !REFRESH) return fs.readFileSync(file, "utf8");
  if (!REFRESH && !fs.existsSync(file)) return null;
  fs.mkdirSync(CACHE, { recursive: true });
  const res = await fetch(`${BASE_URL}?my_match_date=${sourceDate}`, {
    headers: { "user-agent": USER_AGENT },
  });
  if (!res.ok) throw new Error(`MUFCInfo ${res.status} ${res.statusText}: ${date}`);
  const html = await res.text();
  fs.writeFileSync(file, html, "utf8");
  return html;
}

function loadStadiums(): { stadiums: StadiumEntry[] } {
  return readJson<{ stadiums: StadiumEntry[] }>(STADIUMS_PATH);
}

function saveStadiums(file: { stadiums: StadiumEntry[] }): void {
  file.stadiums.sort((a, b) => a.id.localeCompare(b.id));
  writeJson(STADIUMS_PATH, file);
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

function inspect(date: string, html: string): void {
  const parsed = parseVenueFromHtml(html);
  console.log(`\n=== MUFCInfo venue ${date} ===`);
  if (!parsed) {
    console.log("  (no Venue line or JSON-LD location)");
    return;
  }
  const id = resolveVenueId(parsed.label);
  const split = splitVenueLabel(parsed.label);
  console.log(`  label:    ${parsed.label}`);
  console.log(`  H/A/N:    ${parsed.ha ?? "—"}`);
  console.log(`  id:       ${id}`);
  console.log(`  name:     ${split.name}`);
  console.log(`  city:     ${split.city ?? "—"}`);
  console.log(`  country:  ${split.country ?? "—"}`);
}

async function main() {
  if (INSPECT) {
    const html = await matchHtml(INSPECT);
    if (!html) {
      console.error(`No cached page for ${INSPECT} (pass --refresh to fetch)`);
      process.exit(1);
    }
    inspect(INSPECT, html);
    return;
  }

  const seasons = seasonsFromArgs();
  const { jobs, seasonFiles } = plannedJobs(seasons);
  const stadiumFile = loadStadiums();
  const byId = new Map(stadiumFile.stadiums.map((s) => [s.id, s]));
  const pendingStadiums = new Map<string, StadiumEntry>();
  const stats: ImportStats = {
    checked: 0, noPage: 0, noVenue: 0, alreadySet: 0, conflict: 0,
    wouldWrite: 0, written: 0, stadiumsAdded: 0, failed: 0,
  };
  const touchedSeasons = new Set<string>();
  const conflictSamples: string[] = [];
  let cursor = 0;

  async function worker() {
    while (cursor < jobs.length) {
      const job = jobs[cursor++];
      const match = job.match;
      stats.checked++;
      try {
        const html = await matchHtml(match.date);
        if (!html) { stats.noPage++; continue; }
        const parsed = parseVenueFromHtml(html);
        if (!parsed) { stats.noVenue++; continue; }

        const stadiumId = resolveVenueId(parsed.label);
        if (!byId.has(stadiumId) && !pendingStadiums.has(stadiumId)) {
          pendingStadiums.set(stadiumId, stadiumFromLabel(stadiumId, parsed.label));
        }

        if (match.stadium === stadiumId) {
          stats.alreadySet++;
          continue;
        }
        if (match.stadium != null && match.stadium !== stadiumId) {
          stats.conflict++;
          if (conflictSamples.length < 12) {
            conflictSamples.push(`${match.id}: canonical=${match.stadium} mufcinfo=${stadiumId} (${parsed.label})`);
          }
          continue;
        }

        stats.wouldWrite++;
        if (!WRITE) continue;

        match.stadium = stadiumId;
        if (!match.sources.includes(SOURCE_ID)) match.sources.push(SOURCE_ID);
        touchedSeasons.add(job.season);
        stats.written++;
      } catch (err) {
        stats.failed++;
        console.error(`fail ${match.id}:`, err instanceof Error ? err.message : err);
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, Math.max(jobs.length, 1)) }, () => worker()));

  if (WRITE && pendingStadiums.size > 0) {
    for (const stadium of pendingStadiums.values()) {
      stadiumFile.stadiums.push(stadium);
      byId.set(stadium.id, stadium);
      stats.stadiumsAdded++;
    }
  }

  // Fill city/country/name from curated meta onto any stadium still missing them.
  let metaEnriched = 0;
  if (WRITE) {
    for (const stadium of stadiumFile.stadiums) {
      const meta = STADIUM_META[stadium.id];
      if (!meta) continue;
      let touched = false;
      if (meta.name && stadium.name !== meta.name) { stadium.name = meta.name; touched = true; }
      if (meta.city && !stadium.city) { stadium.city = meta.city; touched = true; }
      if (meta.country && !stadium.country) { stadium.country = meta.country; touched = true; }
      if (meta.note && !stadium.note) { stadium.note = meta.note; touched = true; }
      if (touched) metaEnriched++;
    }
    if (pendingStadiums.size > 0 || metaEnriched > 0) saveStadiums(stadiumFile);
  } else {
    stats.stadiumsAdded = pendingStadiums.size;
  }

  if (WRITE) {
    for (const season of touchedSeasons) {
      const sf = seasonFiles.get(season);
      if (sf) saveSeasonFile(sf);
    }
  }

  console.log(
    `mufcinfo-stadiums: checked=${stats.checked} wouldWrite=${stats.wouldWrite} written=${stats.written} ` +
      `alreadySet=${stats.alreadySet} conflict=${stats.conflict} noPage=${stats.noPage} noVenue=${stats.noVenue} ` +
      `stadiumsAdded=${stats.stadiumsAdded} failed=${stats.failed}` +
      (WRITE ? " [--write]" : " [dry-run]"),
  );
  if (conflictSamples.length) {
    console.log("conflicts (canonical kept):");
    for (const sample of conflictSamples) console.log(`  ${sample}`);
  }
  if (!WRITE && stats.wouldWrite > 0) {
    console.log("Re-run with --write to apply.");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
