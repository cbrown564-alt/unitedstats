/**
 * Capture own goals scored FOR United (opponents netting into their own goal)
 * from MUFCInfo match pages — both the minute and, where the event is missing
 * entirely, the goal itself.
 *
 * The scoreboard block credits an own goal to United's tally with the opposition
 * scorer's name, the minute, and an "(o.g.)" tag, in the same stable format the
 * other MUFCInfo lanes read:
 *
 *   <tr><td class="articles_main_text" colspan="2">Lou Macari 8', Steve Powell 60' (o.g.)</td></tr>
 *
 * Two things get filled, both additive and gated on the full United tally
 * reconciling against the recorded score:
 *   1. minute — stamped onto an existing `own-goal-for` event matched to the
 *      parsed scorer by name, when it currently has none;
 *   2. the event itself — created (type `own-goal-for`, `playerSide` opponent,
 *      the scorer in `playerName`, with its minute) for matches that are short of
 *      United goal events by exactly the parsed own-goal count.
 *
 * The synthetic `own-goal` player id is attached by the separate normalisation
 * step (scripts/ingest/own-goal-player.ts), so this lane stays in step with the
 * existing 227 own-goal-for events, which carry only `playerName`.
 *
 * Pages are read from the shared cache (data/raw/mufcinfo/matches/<date>.html);
 * nothing is fetched unless a page is missing and --refresh is passed.
 *
 * Usage:
 *   tsx scripts/ingest/mufcinfo-own-goals.ts --inspect 1977-02-05
 *   tsx scripts/ingest/mufcinfo-own-goals.ts all              # dry run
 *   tsx scripts/ingest/mufcinfo-own-goals.ts all --write
 */
import fs from "node:fs";
import path from "node:path";
import {
  Match, MatchEvent, RAW, SeasonFile,
  loadSeasonFile, parseSeasonArgs, saveSeasonFile, seasonOfDate, userAgent,
} from "../lib";
import { displayName, htmlDecode, normalizedSlug } from "../player-resolver";

const SOURCE_ID = "mufcinfo-goal-minutes";
const BASE_URL = "https://www.mufcinfo.com/manupag/match_data/match_sql.php";
const USER_AGENT = userAgent("mufcinfo-own-goals-ingest");
const CACHE = path.join(RAW, "mufcinfo", "matches");
const WRITE = process.argv.includes("--write");
const REFRESH = process.argv.includes("--refresh");
const CONCURRENCY = numberArg("--concurrency", 6);
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

const UNITED_NAMES = new Set(["manchester united", "newton heath", "newton heath lyr"]);
const UNITED_GOAL_TYPES = new Set<MatchEvent["type"]>(["goal", "pen-goal", "own-goal-for"]);

interface ParsedGoal {
  name: string;
  slug: string;
  minute: number;
  added: number | null;
  og: boolean;
}

interface MatchJob {
  season: string;
  match: Match;
}

interface ImportStats {
  checked: number;
  noBoard: number;
  unreconciled: number;
  minuteStamped: number;
  eventsCreated: number;
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
    "usage: tsx scripts/ingest/mufcinfo-own-goals.ts <season> [<endSeason>] | current | all " +
      "[--date YYYY-MM-DD] [--inspect YYYY-MM-DD] [--write] [--refresh]",
  );
  process.exit(1);
}

function seasonsFromArgs(): string[] {
  if (DATE) return [seasonOfDate(DATE)];
  return parseSeasonArgs(process.argv.slice(2), { allowAll: true }) ?? usage();
}

async function matchHtml(date: string): Promise<string> {
  const sourceDate = MUFCINFO_DATE_ALIASES[date] ?? date;
  const file = path.join(CACHE, `${sourceDate}.html`);
  if (fs.existsSync(file) && !REFRESH) return fs.readFileSync(file, "utf8");
  fs.mkdirSync(CACHE, { recursive: true });
  const res = await fetch(`${BASE_URL}?my_match_date=${sourceDate}`, { headers: { "user-agent": USER_AGENT } });
  if (!res.ok) throw new Error(`MUFCInfo ${res.status} ${res.statusText}: ${date}`);
  const html = await res.text();
  fs.writeFileSync(file, html, "utf8");
  return html;
}

// One scoreboard scorer line into a flat, ordered list of goals. A name (any
// alphabetic chunk) opens a scorer that subsequent bare minutes carry; the
// trailing "(o.g.)" / "(pen)" tag annotates the minute it follows. Stoppage time
// is written after the apostrophe ("90'+7"): the boundary minute (90) and the
// added amount (7) are kept separately.
const GOAL_TOKEN =
  /([A-Za-z][^\d()]*?)?\s*(\d{1,3})\s*(?:'|’)\s*(?:\+\s*(\d{1,2}))?\s*(\([^)]*\))?/g;

function parseUnitedGoals(line: string): ParsedGoal[] {
  const text = htmlDecode(line);
  const goals: ParsedGoal[] = [];
  let currentName: string | null = null;
  let m: RegExpExecArray | null;
  GOAL_TOKEN.lastIndex = 0;
  while ((m = GOAL_TOKEN.exec(text)) !== null) {
    const rawName = m[1] ? displayName(m[1].trim()) : "";
    if (rawName && /[a-z]/i.test(rawName)) currentName = rawName;
    if (!currentName) continue;
    const annotation = (m[4] ?? "").toLowerCase();
    goals.push({
      name: currentName,
      slug: normalizedSlug(currentName),
      minute: Number(m[2]),
      added: m[3] ? Number(m[3]) : null,
      og: annotation.includes("o.g") || annotation.includes("og"),
    });
  }
  return goals;
}

// The United scoreboard block: a team-header row, then the scorer line. Read both
// blocks and pick out the United one by name (United may be home or away).
const SCOREBOARD_PAIR =
  /Team_Header_match_page">\s*<td[^>]*>([^<]+)<\/td>\s*<td[^>]*>(\d+)<\/td>\s*<\/tr>\s*<tr>\s*<td class="articles_main_text"[^>]*>([\s\S]*?)<\/td>/gi;

function parseUnitedScoreboard(html: string): ParsedGoal[] | null {
  let m: RegExpExecArray | null;
  SCOREBOARD_PAIR.lastIndex = 0;
  while ((m = SCOREBOARD_PAIR.exec(html)) !== null) {
    if (UNITED_NAMES.has(htmlDecode(m[1]).trim().toLowerCase())) return parseUnitedGoals(m[3]);
  }
  return null;
}

function slugMatches(a: string, b: string): boolean {
  if (!a || !b) return false;
  if (a === b) return true;
  if (a.endsWith(`-${b}`) || b.endsWith(`-${a}`)) return true;
  return a.split("-").pop() === b.split("-").pop();
}

/**
 * The scorer of an existing own goal, however it was recorded: cleanly in
 * `playerName` for modern events, or in `detail` for older ones ("Gary Gillespie
 * (og)"), with the odd transfermarkt ", Own-goal" marker to discard.
 */
function eventScorerSlug(event: MatchEvent): string {
  const raw = event.playerName ?? event.detail ?? "";
  const name = raw.replace(/,?\s*own[\s-]*goal/gi, " ").replace(/\([^)]*\)/g, " ").trim();
  return name ? normalizedSlug(name) : "";
}

function unitedGoalEvents(match: Match): MatchEvent[] {
  return (match.events ?? []).filter((e) => UNITED_GOAL_TYPES.has(e.type));
}

function inspect(date: string, html: string): void {
  console.log(`\n=== MUFCInfo page ${date} ===`);
  const goals = parseUnitedScoreboard(html);
  if (!goals) { console.log("  (no United scoreboard block found)"); return; }
  for (const g of goals) {
    console.log(`  ${g.minute}'${g.added ? `+${g.added}` : ""} ${g.name}${g.og ? "  (o.g.)" : ""}`);
  }
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
  if (INSPECT) {
    inspect(INSPECT, await matchHtml(INSPECT));
    return;
  }

  const seasons = seasonsFromArgs();
  const { jobs, seasonFiles } = plannedJobs(seasons);
  const stats: ImportStats = {
    checked: 0, noBoard: 0, unreconciled: 0, minuteStamped: 0,
    eventsCreated: 0, touchedMatches: 0, written: 0, failed: 0,
  };
  const touchedSeasons = new Set<string>();
  let cursor = 0;

  async function worker() {
    while (cursor < jobs.length) {
      const job = jobs[cursor++];
      const match = job.match;
      stats.checked++;
      const gf = match.score.ft[0];
      const existing = unitedGoalEvents(match);

      try {
        const parsed = parseUnitedScoreboard(await matchHtml(match.date));
        if (!parsed) { stats.noBoard++; continue; }
        const parsedOgs = parsed.filter((g) => g.og);
        if (parsedOgs.length === 0) continue;
        const reconciles = parsed.length === gf; // scoreboard fully accounts for the score

        let touched = false;

        // 1) Stamp minutes onto existing own-goal-for events matched to a parsed
        // own goal by scorer name. Non-destructive (only fills a null minute), so
        // a clean per-scorer name match is enough — no full-tally gate required.
        const ogEvents = (match.events ?? []).filter((e) => e.type === "own-goal-for");
        const claimedParsed = new Set<ParsedGoal>();
        for (const event of ogEvents) {
          const evSlug = eventScorerSlug(event);
          const candidates = parsedOgs.filter((g) => !claimedParsed.has(g) && slugMatches(g.slug, evSlug));
          if (candidates.length !== 1) continue; // skip ambiguous matches
          const hit = candidates[0];
          claimedParsed.add(hit);
          if (event.minute == null) {
            stats.minuteStamped++;
            touched = true;
            if (WRITE) {
              event.minute = hit.minute;
              if (hit.added != null) event.addedTime = hit.added;
            }
          }
        }

        // 2) Create own-goal-for events the canonical record is missing — gated on
        // the full United tally reconciling and the shortfall being exactly the
        // unclaimed own-goal count, so we never invent a goal the score can't
        // account for.
        const shortfall = gf - existing.length;
        const unclaimed = parsedOgs.filter((g) => !claimedParsed.has(g));
        if (reconciles && shortfall > 0 && unclaimed.length === shortfall) {
          for (const g of unclaimed) {
            stats.eventsCreated++;
            touched = true;
            if (WRITE) {
              const ev: MatchEvent = {
                type: "own-goal-for",
                player: null,
                playerName: g.name,
                playerSide: "opponent",
                minute: g.minute,
                sourceConfidence: "supporting",
              };
              if (g.added != null) ev.addedTime = g.added;
              (match.events ??= []).push(ev);
            }
          }
        } else if (shortfall > 0 && unclaimed.length > 0) {
          // The page shows an own goal the record is missing, but the tally does
          // not reconcile cleanly — left for manual review rather than guessed.
          stats.unreconciled++;
        }

        if (touched) {
          stats.touchedMatches++;
          const created = unclaimed.length === shortfall && shortfall > 0 ? ` +${unclaimed.length} created` : "";
          console.log(
            `${WRITE ? "write" : "dry"} ${match.id}: ${parsedOgs.map((g) => `${g.name} ${g.minute}'(og)`).join(", ")}${created}`,
          );
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
    `mufcinfo-own-goals ${WRITE ? "write" : "dry-run"}: ${stats.checked} matches checked, ` +
      `${stats.minuteStamped} own-goal minutes ${WRITE ? "stamped" : "stampable"}, ` +
      `${stats.eventsCreated} own-goal events ${WRITE ? "created" : "creatable"} across ${stats.touchedMatches} matches; ` +
      `${stats.noBoard} pages without a United scoreboard, ${stats.unreconciled} matches whose tally did not reconcile, ${stats.failed} failed`,
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
