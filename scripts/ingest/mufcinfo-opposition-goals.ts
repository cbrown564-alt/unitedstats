/**
 * Capture opposition goals against United from MUFCInfo match pages — the
 * scorer, the minute (with stoppage time as "90+6"), and whether it was a
 * penalty or a United own goal — for matches whose opposition scorers the
 * canonical record is missing.
 *
 * This is the mirror image of scripts/ingest/mufcinfo-own-goals.ts: that lane
 * reads United's scoreboard tally; this one reads the OPPONENT's. The block has
 * the same stable shape the other MUFCInfo lanes parse:
 *
 *   <tr class="Team_Header_match_page"><td>Sheffield Wednesday</td><td>1</td></tr>
 *   <tr><td class="articles_main_text" colspan="2">John Sheridan 64' (pen)</td></tr>
 *
 * Each opponent-tally entry becomes one event:
 *   - a normal scorer        -> `opp-goal`            (playerName = opponent scorer)
 *   - a "(pen)" entry        -> `opp-goal`, detail "pen"
 *   - an "(o.g.)" entry      -> `own-goal-against`    (a United player's own goal,
 *                                                      credited to the opponent)
 *
 * Like the own-goal lane, two things get filled, both additive and gated:
 *   1. minute (and added time) — stamped onto an existing opposition event that
 *      currently has no minute, matched to the parsed scorer by name;
 *   2. the event itself — created for matches short of opposition goal events by
 *      exactly the parsed-but-unclaimed count, and only when the opponent tally
 *      reconciles 1:1 with the goals-against in the final score. A mismatch is
 *      left for manual review rather than guessed.
 *
 * Stoppage time normalises to the period boundary: "90'+6" is stored as
 * `minute: 90, addedTime: 6`, never `minute: 96`.
 *
 * Pages are read from the shared cache (data/raw/mufcinfo/matches/<date>.html);
 * nothing is fetched unless a page is missing and --refresh is passed.
 *
 * Usage:
 *   tsx scripts/ingest/mufcinfo-opposition-goals.ts --inspect 1993-04-10
 *   tsx scripts/ingest/mufcinfo-opposition-goals.ts all              # dry run
 *   tsx scripts/ingest/mufcinfo-opposition-goals.ts 1992-93 --write
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
const USER_AGENT = userAgent("mufcinfo-opposition-goals-ingest");
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
const OPP_GOAL_TYPES = new Set<MatchEvent["type"]>(["opp-goal", "own-goal-against"]);

interface ParsedGoal {
  name: string;
  slug: string;
  minute: number;
  added: number | null;
  pen: boolean;
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
    "usage: tsx scripts/ingest/mufcinfo-opposition-goals.ts <season> [<endSeason>] | current | all " +
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
// alphabetic chunk) opens a scorer that subsequent bare minutes carry; a trailing
// "(pen)" / "(o.g.)" tag annotates the minute it follows. Stoppage time ("90'+6")
// keeps the boundary minute (90) and the added amount (6) separately.
const GOAL_TOKEN =
  /([A-Za-z][^\d()]*?)?\s*(\d{1,3})\s*(?:'|’)\s*(?:\+\s*(\d{1,2}))?\s*(\([^)]*\))?/g;

function parseGoals(line: string): ParsedGoal[] {
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
      pen: annotation.includes("pen"),
      og: annotation.includes("o.g") || annotation.includes("og"),
    });
  }
  return goals;
}

// The scoreboard is a run of (team-header, scorer-line) pairs; the opposition is
// the first block whose team name is not United (United may be home or away).
const SCOREBOARD_PAIR =
  /Team_Header_match_page">\s*<td[^>]*>([^<]+)<\/td>\s*<td[^>]*>(\d+)<\/td>\s*<\/tr>\s*<tr>\s*<td class="articles_main_text"[^>]*>([\s\S]*?)<\/td>/gi;

function parseOpponentScoreboard(html: string): ParsedGoal[] | null {
  let m: RegExpExecArray | null;
  SCOREBOARD_PAIR.lastIndex = 0;
  while ((m = SCOREBOARD_PAIR.exec(html)) !== null) {
    if (!UNITED_NAMES.has(htmlDecode(m[1]).trim().toLowerCase())) return parseGoals(m[3]);
  }
  return null;
}

function slugMatches(a: string, b: string): boolean {
  if (!a || !b) return false;
  if (a === b) return true;
  if (a.endsWith(`-${b}`) || b.endsWith(`-${a}`)) return true;
  return a.split("-").pop() === b.split("-").pop();
}

/** The scorer of an existing opposition event, from playerName or older detail. */
function eventScorerSlug(event: MatchEvent): string {
  const raw = event.playerName ?? event.detail ?? "";
  const name = raw.replace(/,?\s*own[\s-]*goal/gi, " ").replace(/\([^)]*\)/g, " ").trim();
  return name ? normalizedSlug(name) : "";
}

function oppGoalEvents(match: Match): MatchEvent[] {
  return (match.events ?? []).filter((e) => OPP_GOAL_TYPES.has(e.type));
}

function newEvent(g: ParsedGoal): MatchEvent {
  const event: MatchEvent = {
    type: g.og ? "own-goal-against" : "opp-goal",
    player: null,
    playerName: g.name,
    playerSide: "opponent",
    minute: g.minute,
    detail: g.pen ? "pen" : null,
    sourceConfidence: "supporting",
  };
  if (g.added != null) event.addedTime = g.added;
  return event;
}

function describe(g: ParsedGoal): string {
  const clock = g.added ? `${g.minute}+${g.added}` : `${g.minute}`;
  const tag = g.og ? " (og)" : g.pen ? " (pen)" : "";
  return `${g.name} ${clock}'${tag}`;
}

function inspect(date: string, html: string): void {
  console.log(`\n=== MUFCInfo page ${date} ===`);
  const goals = parseOpponentScoreboard(html);
  if (!goals) { console.log("  (no opposition scoreboard block found)"); return; }
  for (const g of goals) console.log(`  ${describe(g)}`);
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
      const ga = match.score.ft[1];
      if (ga === 0) continue; // nothing conceded, nothing to record
      const existing = oppGoalEvents(match);

      try {
        const parsed = parseOpponentScoreboard(await matchHtml(match.date));
        if (!parsed || parsed.length === 0) { stats.noBoard++; continue; }
        const reconciles = parsed.length === ga; // tally fully accounts for goals against

        let touched = false;

        // 1) Stamp minute + added time onto existing opposition events that have no
        // minute, matched to a parsed scorer by name. Non-destructive, so a clean
        // per-scorer match is enough without the full-tally gate.
        const claimedParsed = new Set<ParsedGoal>();
        for (const event of existing) {
          const evSlug = eventScorerSlug(event);
          const candidates = parsed.filter((g) => !claimedParsed.has(g) && slugMatches(g.slug, evSlug));
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

        // 2) Create opposition events the canonical record is missing — gated on the
        // opponent tally reconciling and the shortfall being exactly the unclaimed
        // count, so we never invent a goal the score can't account for.
        const shortfall = ga - existing.length;
        const unclaimed = parsed.filter((g) => !claimedParsed.has(g));
        if (reconciles && shortfall > 0 && unclaimed.length === shortfall) {
          for (const g of unclaimed) {
            stats.eventsCreated++;
            touched = true;
            if (WRITE) (match.events ??= []).push(newEvent(g));
          }
        } else if (shortfall > 0 && unclaimed.length > 0) {
          stats.unreconciled++;
        }

        if (touched) {
          stats.touchedMatches++;
          const created = reconciles && unclaimed.length === shortfall && shortfall > 0
            ? ` +${unclaimed.length} created` : "";
          console.log(`${WRITE ? "write" : "dry"} ${match.id}: ${parsed.map(describe).join(", ")}${created}`);
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
    `mufcinfo-opposition-goals ${WRITE ? "write" : "dry-run"}: ${stats.checked} matches checked, ` +
      `${stats.minuteStamped} opposition minutes ${WRITE ? "stamped" : "stampable"}, ` +
      `${stats.eventsCreated} opposition events ${WRITE ? "created" : "creatable"} across ${stats.touchedMatches} matches; ` +
      `${stats.noBoard} pages without an opposition scoreboard, ${stats.unreconciled} matches whose tally did not reconcile, ${stats.failed} failed`,
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
