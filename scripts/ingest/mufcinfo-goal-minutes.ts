/**
 * Backfill goal MINUTES onto existing goal events from MUFCInfo match pages.
 *
 * Scorers are comprehensive in `data/canonical` across every era, but minutes
 * are not: they are effectively absent before the 1980s (see the coverage table
 * in docs/PIPELINE.md / the per-decade `allMinuted` count). MUFCInfo match pages
 * carry the missing piece — the scoreboard block lists each team's scorers with
 * the minute of every goal, in a format that is stable from the 1890s on:
 *
 *   <tr class="Team_Header_match_page"><td>Manchester United</td><td>4</td></tr>
 *   <tr><td class="articles_main_text" colspan="2">Lou Macari 5' 22', 83', Gordon Hill 75'</td></tr>
 *
 * This lane is deliberately additive and non-destructive, mirroring the assist
 * backfill (scripts/ingest/mufcinfo-events.ts):
 *   - it STAMPS a minute onto a goal event that has none, and adds stoppage time
 *     ("90'+6" -> addedTime 6) onto a goal whose base minute already agrees with
 *     MUFCInfo; it never creates, removes, re-scores, or re-types an event,
 *   - a base minute that DISAGREES with MUFCInfo is left alone unless --overwrite
 *     is passed (then it is corrected toward MUFCInfo, the dedicated minute source),
 *   - and only when the parsed scorers reconcile 1:1 with the recorded goals for
 *     that side (so a missing or extra scorer skips the match rather than
 *     guessing). Both the United and the opposition tallies are gated
 *     independently, so a clean side still gets filled when the other is messy.
 *
 * Minutes are read from the same cached pages as the lineup/assist lanes
 * (data/raw/mufcinfo/matches/<date>.html); nothing is fetched unless a page is
 * missing from the cache and --refresh is passed.
 *
 * Usage:
 *   tsx scripts/ingest/mufcinfo-goal-minutes.ts --inspect 1977-08-20
 *   tsx scripts/ingest/mufcinfo-goal-minutes.ts 1976-77            # dry run
 *   tsx scripts/ingest/mufcinfo-goal-minutes.ts 1950-51 1979-80 --write
 *   tsx scripts/ingest/mufcinfo-goal-minutes.ts all --write
 */
import fs from "node:fs";
import path from "node:path";
import {
  CANONICAL, Match, MatchEvent, RAW, SeasonFile,
  loadSeasonFile, parseSeasonArgs, readJson, saveSeasonFile, seasonOfDate, userAgent,
} from "../lib";
import {
  createPlayerResolver, displayName, htmlDecode, normalizedSlug,
  type PlayerRecord, type PlayersFile,
} from "../player-resolver";

const SOURCE_ID = "mufcinfo-goal-minutes";
const BASE_URL = "https://www.mufcinfo.com/manupag/match_data/match_sql.php";
const USER_AGENT = userAgent("mufcinfo-goal-minutes-ingest");
const CACHE = path.join(RAW, "mufcinfo", "matches");
const WRITE = process.argv.includes("--write");
const REFRESH = process.argv.includes("--refresh");
const OVERWRITE = process.argv.includes("--overwrite"); // also re-check minutes already present
const CONCURRENCY = numberArg("--concurrency", 6);
const LIMIT = numberArg("--limit", 0);
const DATE = stringArg("--date");
const INSPECT = stringArg("--inspect");

// MUFCInfo exposes a handful of 1899-00 fixtures one day after the canonical
// Saturday date; mirror the alias table the other MUFCInfo lanes use so all
// three read the same cached pages.
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
const OPP_GOAL_TYPES = new Set<MatchEvent["type"]>(["opp-goal", "own-goal-against"]);

interface ParsedScorer {
  name: string;
  slug: string;
  entries: { minute: number; added: number | null }[];
}

interface MatchJob {
  season: string;
  match: Match;
}

interface ImportStats {
  checked: number;
  noGoals: number;
  noScoreboard: number;
  unitedFilled: number;
  unitedSkipped: number;
  oppFilled: number;
  oppSkipped: number;
  minutesStamped: number;
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
    "usage: tsx scripts/ingest/mufcinfo-goal-minutes.ts <season> [<endSeason>] | current | all " +
      "[--date YYYY-MM-DD] [--inspect YYYY-MM-DD] [--write] [--refresh] [--overwrite]",
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

// One scoreboard scorer line, e.g. "Lou Macari 5' 22', 83', Gordon Hill 75'".
// A run of minute markers belongs to the most recent name; a fresh name (any
// alphabetic chunk) opens a new scorer. Parenthetical tags like "(pen)" and
// "(o.g.)" are stripped so they don't masquerade as names. Stoppage time is
// written after the apostrophe ("90'+6") and captured into `added`.
const SCORER_TOKEN = /([^\d]*?)(\d{1,3})\s*(?:'|’|&#039;|&rsquo;)\s*(?:\+\s*(\d{1,2}))?/g;

function cleanScorerName(raw: string): string {
  return displayName(raw.replace(/\([^)]*\)/g, " ").replace(/[,;]/g, " ")).trim();
}

function parseScorerLine(line: string): ParsedScorer[] {
  const text = htmlDecode(line);
  const scorers: ParsedScorer[] = [];
  let current: ParsedScorer | null = null;
  let m: RegExpExecArray | null;
  SCORER_TOKEN.lastIndex = 0;
  while ((m = SCORER_TOKEN.exec(text)) !== null) {
    const name = cleanScorerName(m[1]);
    const minute = Number(m[2]);
    const added = m[3] ? Number(m[3]) : null;
    if (name && /[a-z]/i.test(name)) {
      current = { name, slug: normalizedSlug(name), entries: [] };
      scorers.push(current);
    }
    if (current) current.entries.push({ minute, added });
  }
  return scorers.filter((s) => s.entries.length > 0);
}

interface Scoreboard {
  united: ParsedScorer[] | null;
  opponent: ParsedScorer[] | null;
}

// The scoreboard is a run of (team-header row, scorer-line row) pairs. Read both
// and bucket by team name, since the home team is listed first and United may be
// on either side.
const SCOREBOARD_PAIR =
  /Team_Header_match_page">\s*<td[^>]*>([^<]+)<\/td>\s*<td[^>]*>(\d+)<\/td>\s*<\/tr>\s*<tr>\s*<td class="articles_main_text"[^>]*>([\s\S]*?)<\/td>/gi;

function parseScoreboard(html: string): Scoreboard {
  const board: Scoreboard = { united: null, opponent: null };
  let m: RegExpExecArray | null;
  SCOREBOARD_PAIR.lastIndex = 0;
  while ((m = SCOREBOARD_PAIR.exec(html)) !== null) {
    const team = htmlDecode(m[1]).trim().toLowerCase();
    const scorers = parseScorerLine(m[3]);
    if (UNITED_NAMES.has(team)) board.united = scorers;
    else board.opponent ??= scorers; // first non-United block is the opposition
  }
  return board;
}

function countGoals(scorers: ParsedScorer[]): number {
  return scorers.reduce((a, s) => a + s.entries.length, 0);
}

/** Surname-aware slug comparison, matching the lineup lane's matchesOffName. */
function slugMatches(a: string, b: string): boolean {
  if (a === b) return true;
  if (a.endsWith(`-${b}`) || b.endsWith(`-${a}`)) return true;
  const aLast = a.split("-").pop();
  const bLast = b.split("-").pop();
  return !!aLast && aLast === bLast;
}

interface SideResult {
  /** event index -> minute (and stoppage time) to stamp */
  assignments: Map<number, { minute: number; added: number | null }>;
  reason: string | null; // non-null = could not reconcile, side skipped
}

/**
 * Reconcile a side's parsed scorers against its existing goal events and, when
 * they line up exactly, decide which minute lands on which event. Matching is by
 * player: every parsed scorer must map to a distinct set of events of the same
 * size, so a player's minutes attach to that same player's goals (sorted, so the
 * order within the event list is irrelevant). Anything ambiguous returns a reason
 * and stamps nothing.
 */
function reconcileSide(
  scorers: ParsedScorer[],
  events: { event: MatchEvent; index: number }[],
  resolveName: (name: string) => string | null,
): SideResult {
  const recorded = events.length;
  const parsed = countGoals(scorers);
  if (recorded === 0) return { assignments: new Map(), reason: null }; // nothing to fill
  if (parsed !== recorded) return { assignments: new Map(), reason: `count ${parsed}≠${recorded}` };

  // Group existing events by the player they belong to (id when known, else slug).
  const keyOf = (e: MatchEvent): string =>
    e.player ?? (e.playerName ? `name:${normalizedSlug(e.playerName)}` : "unknown");
  const byKey = new Map<string, { event: MatchEvent; index: number }[]>();
  for (const e of events) (byKey.get(keyOf(e.event)) ?? byKey.set(keyOf(e.event), []).get(keyOf(e.event))!).push(e);

  const assignments = new Map<number, { minute: number; added: number | null }>();
  const used = new Set<string>();
  for (const scorer of scorers) {
    // Find the event-group whose player matches this parsed scorer.
    const id = resolveName(scorer.name);
    let key: string | null = null;
    for (const [k, group] of byKey) {
      if (used.has(k)) continue;
      const ev = group[0].event;
      const evSlug = ev.playerName ? normalizedSlug(ev.playerName) : "";
      const matches =
        (id && ev.player === id) ||
        (evSlug && slugMatches(scorer.slug, evSlug)) ||
        k === `name:${scorer.slug}`;
      if (matches) { key = k; break; }
    }
    if (key == null) return { assignments: new Map(), reason: `no event for ${scorer.name}` };
    const group = byKey.get(key)!;
    if (group.length !== scorer.entries.length) {
      return { assignments: new Map(), reason: `${scorer.name} ${scorer.entries.length}≠${group.length} goals` };
    }
    used.add(key);
    const entries = [...scorer.entries].sort((a, b) => a.minute - b.minute);
    group.sort((a, b) => (a.event.minute ?? 999) - (b.event.minute ?? 999) || a.index - b.index);
    group.forEach((g, i) => assignments.set(g.index, entries[i]));
  }
  return { assignments, reason: null };
}

function unitedGoalEvents(match: Match): { event: MatchEvent; index: number }[] {
  return (match.events ?? [])
    .map((event, index) => ({ event, index }))
    .filter(({ event }) => UNITED_GOAL_TYPES.has(event.type) && event.playerSide !== "opponent");
}

function oppGoalEvents(match: Match): { event: MatchEvent; index: number }[] {
  return (match.events ?? [])
    .map((event, index) => ({ event, index }))
    .filter(({ event }) => OPP_GOAL_TYPES.has(event.type));
}

function inspect(date: string, html: string): void {
  console.log(`\n=== MUFCInfo page ${date} (${html.length} bytes) ===`);
  const board = parseScoreboard(html);
  for (const [side, scorers] of [["united", board.united], ["opponent", board.opponent]] as const) {
    if (!scorers) { console.log(`  ${side}: (no scoreboard block found)`); continue; }
    console.log(`  ${side} (${countGoals(scorers)} goals):`);
    for (const s of scorers) {
      console.log(`    ${s.name}  ${s.entries.map((e) => `${e.minute}'${e.added ? `+${e.added}` : ""}`).join(" ")}`);
    }
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
    checked: 0, noGoals: 0, noScoreboard: 0, unitedFilled: 0, unitedSkipped: 0,
    oppFilled: 0, oppSkipped: 0, minutesStamped: 0, touchedMatches: 0, written: 0, failed: 0,
  };
  const touchedSeasons = new Set<string>();
  let cursor = 0;

  async function worker() {
    while (cursor < jobs.length) {
      const job = jobs[cursor++];
      const match = job.match;
      stats.checked++;

      // Reconcile against ALL of a side's goals (not just minute-less ones) so the
      // parsed-vs-recorded count gate holds and added time can land on goals that
      // already carry a base minute. What actually gets written is decided per
      // event below.
      const united = unitedGoalEvents(match);
      const opp = oppGoalEvents(match);
      if (united.length === 0 && opp.length === 0) { stats.noGoals++; continue; }

      try {
        const board = parseScoreboard(await matchHtml(match.date));
        if (!board.united && !board.opponent) { stats.noScoreboard++; continue; }
        const year = Number(match.date.slice(0, 4));
        const resolveName = (name: string) => resolve(name, null, year)?.playerId ?? null;

        let matchTouched = false;
        const apply = (
          label: "united" | "opp",
          scorers: ParsedScorer[] | null,
          events: { event: MatchEvent; index: number }[],
        ) => {
          const skip = () => { if (label === "united") stats.unitedSkipped++; else stats.oppSkipped++; };
          if (events.length === 0) return;
          if (!scorers) { skip(); return; }
          const { assignments, reason } = reconcileSide(scorers, events, resolveName);
          if (reason || assignments.size === 0) {
            if (reason) {
              skip();
              console.log(`skip ${match.id} ${label}: ${reason}`);
            }
            return;
          }
          if (label === "united") stats.unitedFilled++; else stats.oppFilled++;
          for (const { event, index } of events) {
            const a = assignments.get(index);
            if (a == null) continue;
            // Default: fill a missing minute, or add stoppage time onto a goal whose
            // base minute already agrees with MUFCInfo. An existing base minute that
            // DISAGREES is only rewritten under --overwrite, so the lane never churns
            // a recorded minute toward MUFCInfo unless asked.
            const fillsMinute = event.minute == null;
            const addsStoppage =
              !fillsMinute && event.minute === a.minute && a.added != null && event.addedTime !== a.added;
            const correctsMinute = !fillsMinute && event.minute !== a.minute && OVERWRITE;
            if (!fillsMinute && !addsStoppage && !correctsMinute) continue;
            stats.minutesStamped++;
            matchTouched = true;
            if (WRITE) {
              event.minute = a.minute;
              if (a.added != null) event.addedTime = a.added;
            }
          }
        };

        apply("united", board.united, united);
        apply("opp", board.opponent, opp);

        if (matchTouched) {
          stats.touchedMatches++;
          const scorerLine = [...(board.united ?? [])]
            .map((s) => `${s.name} ${s.entries.map((e) => `${e.minute}'${e.added ? `+${e.added}` : ""}`).join(" ")}`)
            .join(", ");
          console.log(`${WRITE ? "write" : "dry"} ${match.id}: ${scorerLine}`);
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
    `mufcinfo-goal-minutes ${WRITE ? "write" : "dry-run"}: ${stats.checked} matches checked, ` +
      `${stats.minutesStamped} minutes ${WRITE ? "stamped" : "stampable"} across ${stats.touchedMatches} matches ` +
      `(${stats.unitedFilled} United sides, ${stats.oppFilled} opposition sides filled); ` +
      `${stats.noGoals} matches already minuted/without goals, ${stats.noScoreboard} pages without a scoreboard, ` +
      `${stats.unitedSkipped} United + ${stats.oppSkipped} opposition sides unreconciled, ${stats.failed} failed`,
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
