/**
 * Enrich existing United goal events with assists from MUFCInfo match pages.
 *
 * This is the Phase B assist backfill lane (see docs/ASSISTS-PLAN.md). It reuses
 * the same cached MUFCInfo match pages as scripts/ingest/mufcinfo-lineups.ts
 *   https://www.mufcinfo.com/manupag/match_data/match_sql.php?my_match_date=YYYY-MM-DD
 * and the same conservative player-resolution approach (players.json +
 * player-records.json, slug / wiki-title / nickname / career-window matching).
 *
 * It is deliberately additive and non-destructive:
 *   - it only ATTACHES an assist to an EXISTING United goal / pen-goal event,
 *   - only when the assister resolves to a known United player id,
 *   - never creating, removing, or re-scoring events, and never touching the
 *     opposition. Goal scorers themselves stay owned by the scorer lanes.
 *
 * The goals-section HTML format on MUFCInfo match pages is not yet pinned down
 * in a checked-in fixture, so the goal/assist parser (GOAL_KEYWORDS,
 * ASSIST_KEYWORDS, parseGoals) is a first cut. Run `--inspect <date>` against a
 * cached page first: it dumps every region that carries a minute marker, a
 * player-archive link, or an assist keyword, so the exact format can be
 * confirmed and the parser adjusted in one pass. Until that is confirmed on a
 * real page, run without `--write` and review the dry-run output.
 *
 * Usage:
 *   npm run ingest:mufcinfo-assists -- --inspect 1999-05-26
 *   npm run ingest:mufcinfo-assists -- 1998-99
 *   npm run ingest:mufcinfo-assists -- 1992-93 2011-12 --write
 *   npm run ingest:mufcinfo-assists -- --date 1999-05-26
 */
import fs from "node:fs";
import path from "node:path";
import {
  CANONICAL, Match, MatchEvent, RAW, SeasonFile,
  loadSeasonFile, parseSeasonArgs, readJson, saveSeasonFile, seasonOfDate, userAgent,
} from "../lib";
import {
  createPlayerResolver, displayName, htmlDecode, normalizedSlug,
  type PlayerRecord, type PlayersFile, type ResolvedPlayer,
} from "../player-resolver";

const SOURCE_ID = "mufcinfo-match-lineups";
const BASE_URL = "https://www.mufcinfo.com/manupag/match_data/match_sql.php";
const USER_AGENT = userAgent("mufcinfo-assist-ingest");
const CACHE = path.join(RAW, "mufcinfo", "matches");
const WRITE = process.argv.includes("--write");
const REFRESH = process.argv.includes("--refresh");
const CONCURRENCY = numberArg("--concurrency", 6);
const LIMIT = numberArg("--limit", 0);
const DATE = stringArg("--date");
const INSPECT = stringArg("--inspect");

// MUFCInfo exposes a handful of 1899-00 fixtures one day after the canonical
// Saturday date; mirror the alias table used by the lineup ingester so both
// read the same cached pages.
const MUFCINFO_DATE_ALIASES: Record<string, string> = {
  "1900-01-06": "1900-01-07",
  "1900-01-13": "1900-01-14",
  "1900-02-03": "1900-02-04",
  "1900-02-10": "1900-02-11",
  "1900-02-17": "1900-02-18",
  "1900-02-24": "1900-02-25",
};

// Goal lines on the page carry a minute marker; assists are introduced by one
// of these phrasings. Both lists are intentionally easy to widen after an
// `--inspect` run confirms the real wording.
const ASSIST_KEYWORDS = [
  "assist", "assisted by", "made by", "set up by", "setup by",
  "created by", "from a pass by", "pass by", "passed by", "cross by", "crossed by",
];
const GOAL_KEYWORDS = ["goal", "scored", "penalty", "pen.", "header", "tap"];

interface ParsedGoal {
  scorerName: string;
  scorerSlug: string;
  scorerHref: string | null;
  minute: number | null;
  assistName: string | null;
  assistSlug: string | null;
  assistHref: string | null;
}

interface MatchJob {
  season: string;
  match: Match;
}

interface ImportStats {
  checked: number;
  noEvents: number;
  noRows: number;
  parsedGoals: number;
  parsedAssists: number;
  attached: number;
  unmatchedGoal: number;
  unresolvedAssister: number;
  alreadyHadAssist: number;
  touchedMatches: number;
  written: number;
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
    "usage: tsx scripts/ingest/mufcinfo-events.ts <season> [<endSeason>] | current | all " +
      "[--date YYYY-MM-DD] [--inspect YYYY-MM-DD] [--write] [--refresh]",
  );
  process.exit(1);
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
  const res = await fetch(`${BASE_URL}?my_match_date=${sourceDate}`, { headers: { "user-agent": USER_AGENT } });
  if (!res.ok) throw new Error(`MUFCInfo ${res.status} ${res.statusText}: ${date}`);
  const html = await res.text();
  fs.writeFileSync(file, html, "utf8");
  return html;
}

const PLAYER_ANCHOR = /<a href="([^"]*a-z_player_archive[^"]*?)"[^>]*>\s*([\s\S]*?)\s*<\/a>/gi;
const MINUTE = /(\d{1,3})\s*(?:’|'|&#039;|&rsquo;|min)/;

interface Anchor { hrefKey: string; name: string; slug: string; index: number; end: number; }

function anchorsIn(segment: string): Anchor[] {
  const anchors: Anchor[] = [];
  let m: RegExpExecArray | null;
  PLAYER_ANCHOR.lastIndex = 0;
  while ((m = PLAYER_ANCHOR.exec(segment)) !== null) {
    const name = displayName(m[2]);
    if (!name) continue;
    anchors.push({
      hrefKey: path.basename(m[1], ".html"),
      name,
      slug: normalizedSlug(name),
      index: m.index,
      end: m.index + m[0].length,
    });
  }
  return anchors;
}

/**
 * Best-effort parse of the goal lines. The page lists each goal in a cell that
 * carries the scorer's player-archive link and a minute; an assist, when
 * present, appears as a second player-archive link tagged by one of
 * ASSIST_KEYWORDS in the same cell. Confirm the real shape with `--inspect`.
 */
function parseGoals(html: string): ParsedGoal[] {
  const goals: ParsedGoal[] = [];
  // Work cell by cell so a scorer and "assisted by" stay associated.
  const cells = html.split(/<\/td>/i);
  for (const cell of cells) {
    const text = htmlDecode(cell).toLowerCase();
    const minuteMatch = htmlDecode(cell).match(MINUTE);
    const anchors = anchorsIn(cell);
    if (anchors.length === 0 || !minuteMatch) continue;
    const looksLikeGoal = GOAL_KEYWORDS.some((k) => text.includes(k)) || anchors.length >= 1;
    if (!looksLikeGoal) continue;

    const [scorer, ...rest] = anchors;
    let assist: Anchor | null = null;
    for (const candidate of rest) {
      const between = htmlDecode(cell.slice(scorer.end, candidate.index)).toLowerCase();
      if (ASSIST_KEYWORDS.some((k) => between.includes(k))) { assist = candidate; break; }
    }
    if (!assist) {
      const tail = text.slice(text.indexOf(scorer.slug.split("-")[0]));
      if (rest.length === 1 && ASSIST_KEYWORDS.some((k) => tail.includes(k))) assist = rest[0];
    }
    goals.push({
      scorerName: scorer.name,
      scorerSlug: scorer.slug,
      scorerHref: scorer.hrefKey,
      minute: Number(minuteMatch[1]),
      assistName: assist?.name ?? null,
      assistSlug: assist?.slug ?? null,
      assistHref: assist?.hrefKey ?? null,
    });
  }
  return goals;
}

function unitedGoalEvents(match: Match): MatchEvent[] {
  return (match.events ?? []).filter(
    (e) => (e.type === "goal" || e.type === "pen-goal") && e.playerSide !== "opponent",
  );
}

/** Find the existing United goal event a parsed goal refers to. */
function matchEvent(
  events: MatchEvent[],
  goal: ParsedGoal,
  resolve: (name: string, href: string | null, year: number) => ResolvedPlayer | null,
  year: number,
): MatchEvent | null {
  const scorer = resolve(goal.scorerName, goal.scorerHref, year);
  const byPlayer = events.filter((e) => scorer && e.player === scorer.playerId);
  const pool = byPlayer.length ? byPlayer : events;
  if (goal.minute != null) {
    const exact = pool.find((e) => e.minute === goal.minute);
    if (exact) return exact;
  }
  return byPlayer.length === 1 ? byPlayer[0] : null;
}

function inspect(date: string, html: string): void {
  console.log(`\n=== MUFCInfo page ${date} (${html.length} bytes) ===`);
  const cells = html.split(/<\/td>/i);
  let hits = 0;
  for (const cell of cells) {
    const text = htmlDecode(cell);
    const hasMinute = MINUTE.test(text);
    const anchors = anchorsIn(cell);
    const hasAssistWord = ASSIST_KEYWORDS.some((k) => text.toLowerCase().includes(k));
    if (!hasMinute && anchors.length === 0 && !hasAssistWord) continue;
    hits++;
    console.log(
      `\n[cell] minute=${hasMinute} anchors=${anchors.length} assistWord=${hasAssistWord}\n` +
        `  text: ${text.slice(0, 240)}\n` +
        (anchors.length ? `  links: ${anchors.map((a) => `${a.name} (${a.hrefKey})`).join(" | ")}` : ""),
    );
  }
  const parsed = parseGoals(html);
  console.log(`\n--- parseGoals() found ${parsed.length} candidate goal(s) ---`);
  for (const g of parsed) {
    console.log(`  ${g.minute ?? "?"}' ${g.scorerName}${g.assistName ? `  <- assist ${g.assistName}` : ""}`);
  }
  if (hits === 0) console.log("(no cells with minute / player link / assist keyword — format differs; widen the patterns)");
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
  const playersFile = readJson<PlayersFile>(path.join(CANONICAL, "players.json"));
  const playerRecords = readJson<{ records: PlayerRecord[] }>(path.join(CANONICAL, "player-records.json")).records;
  const { resolve } = createPlayerResolver(playersFile, playerRecords);

  if (INSPECT) {
    inspect(INSPECT, await matchHtml(INSPECT));
    return;
  }

  const seasons = seasonsFromArgs();
  const { jobs, seasonFiles } = plannedJobs(seasons);
  const stats: ImportStats = {
    checked: 0, noEvents: 0, noRows: 0, parsedGoals: 0, parsedAssists: 0,
    attached: 0, unmatchedGoal: 0, unresolvedAssister: 0, alreadyHadAssist: 0,
    touchedMatches: 0, written: 0, failed: 0,
  };
  const touchedSeasons = new Set<string>();
  let cursor = 0;

  async function worker() {
    while (cursor < jobs.length) {
      const job = jobs[cursor++];
      const match = job.match;
      stats.checked++;
      const events = unitedGoalEvents(match);
      if (events.length === 0) { stats.noEvents++; continue; }
      try {
        const goals = parseGoals(await matchHtml(match.date));
        if (goals.length === 0) { stats.noRows++; continue; }
        stats.parsedGoals += goals.length;
        const year = Number(match.date.slice(0, 4));
        let matchTouched = false;
        for (const goal of goals) {
          if (!goal.assistName) continue;
          stats.parsedAssists++;
          const event = matchEvent(events, goal, resolve, year);
          if (!event) { stats.unmatchedGoal++; continue; }
          if (event.assist || event.assistName) { stats.alreadyHadAssist++; continue; }
          const assister = resolve(goal.assistName, goal.assistHref, year);
          if (!assister || !assister.inPlayers) { stats.unresolvedAssister++; continue; }
          stats.attached++;
          matchTouched = true;
          if (WRITE) {
            event.assist = assister.playerId;
            event.assistName = assister.name;
            event.assistSide = "united";
          }
          console.log(`${WRITE ? "write" : "dry"} ${match.id}: ${goal.minute ?? "?"}' ${goal.scorerName} <- ${assister.name}`);
        }
        if (matchTouched) {
          stats.touchedMatches++;
          if (WRITE) {
            if (!match.sources.includes(SOURCE_ID)) match.sources.push(SOURCE_ID);
            touchedSeasons.add(job.season);
            stats.written++;
          }
        }
      } catch (error) {
        stats.failed++;
        console.warn(`${match.id}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }

  await Promise.all(Array.from({ length: Math.max(1, CONCURRENCY) }, () => worker()));

  if (WRITE) {
    for (const season of touchedSeasons) {
      const sf = seasonFiles.get(season);
      if (sf) saveSeasonFile(sf);
    }
  }

  console.log(
    `mufcinfo-assists ${WRITE ? "write" : "dry-run"}: ${stats.checked} matches checked, ` +
      `${stats.attached} assists ${WRITE ? "attached" : "attachable"} across ${stats.touchedMatches} matches; ` +
      `${stats.parsedGoals} goals parsed (${stats.parsedAssists} with an assist phrase), ` +
      `${stats.noEvents} matches without United goal events, ${stats.noRows} pages without parseable goals, ` +
      `${stats.unmatchedGoal} goals unmatched to an event, ${stats.unresolvedAssister} assisters unresolved, ` +
      `${stats.alreadyHadAssist} already had an assist, ${stats.failed} failed`,
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
