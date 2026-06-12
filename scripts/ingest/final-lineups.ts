/**
 * Ingest full lineups for cup finals from dedicated Wikipedia final articles
 * ("1999 UEFA Champions League final", "1909 FA Cup final", ...).
 *
 * Those articles carry a standardized match-details block:
 *   {{football box}} with |date=, |team1=, |team2=
 *   followed by two lineup tables (team1 first), rows like
 *     |GK ||'''1''' ||{{flagicon|DEN}} [[Peter Schmeichel]] ([[Captain...|c]])
 *   with {{suboff|67}} / {{subon|67}} markers, a '''Substitutes:''' divider
 *   and a '''Manager:'''/'''Coach:''' footer.
 *
 * One article can hold several matches (1983/1990 final + replay): each
 * football box is matched to a canonical match by its parsed date.
 *
 * Unused substitutes are NOT written to the lineup: appearance totals are
 * computed from match_lineups, so only players who took the field count.
 *
 * The football box's |goals1=/|goals2= scorer lists are also used to fill in
 * opposition scorers (opp-goal / own-goal-against events) for finals that
 * have none, but only when the parsed list exactly matches goals conceded.
 *
 * Usage:
 *   tsx scripts/ingest/final-lineups.ts            all finals without lineups
 *   tsx scripts/ingest/final-lineups.ts --reparse  re-derive even when present
 */
import path from "node:path";
import {
  CANONICAL, LineupEntry, MatchEvent, RAW,
  listSeasonFiles, loadSeasonFile, readJson, saveSeasonFile, slugify, writeJson,
} from "../lib";
import { fetchArticle, linkTarget, parseWikiDate, splitCells, stripWiki } from "./wiki-utils";

export const CACHE = path.join(RAW, "wikipedia", "finals");
const REPARSE = process.argv.includes("--reparse");

// ------------------------------------------------------------ article titles

export function articleTitles(competition: string, date: string): string[] | null {
  const year = date.slice(0, 4);
  const base: Record<string, string[]> = {
    "fa-cup": [`${year} FA Cup final`],
    "league-cup": [`${year} Football League Cup final`, `${year} EFL Cup final`],
    "european-cup": [`${year} European Cup final`],
    "champions-league": [`${year} UEFA Champions League final`],
    "cup-winners-cup": [`${year} European Cup Winners' Cup final`],
    "europa-league": [`${year} UEFA Europa League final`],
    "uefa-cup": [`${year} UEFA Cup final`],
    "fifa-club-world-cup": [`${year} FIFA Club World Cup final`],
    "intercontinental-cup": [`${year} Intercontinental Cup`],
    "charity-shield": [`${year} FA Charity Shield`, `${year} FA Community Shield`],
    "uefa-super-cup": [`${year} UEFA Super Cup`, `${year} European Super Cup`],
  };
  const titles = base[competition];
  if (!titles) return null;
  // Wikipedia mixes "final" and "Final" in titles; redirects usually cover
  // both, but try both casings to be safe.
  return titles.flatMap((t) => [t, t.replace(/final$/, "Final")]);
}

/** One-off competitions where the match itself is the final and `round` is empty. */
const ONE_OFF_FINALS = new Set(["charity-shield", "uefa-super-cup"]);

// ------------------------------------------------------------------- parsing

interface ParsedLineup {
  date: string | null;
  unitedFirst: boolean;
  sideKnown: boolean; // exactly one of team1/team2 matched United
  goals: [string, string]; // raw goals1/goals2 wikitext
  teams: LineupRow[][]; // lineup tables in document order
}

interface LineupRow {
  role: string;
  shirt: number | null;
  name: string;
  on: number | null;
  off: number | null;
  start: boolean;
}

const POSITION = /^[A-Z]{1,3}$/; // GK, RB, CH, OL, ... (covers 2-3-5 era codes)

/**
 * Split the article into {{football box}} blocks and collect the lineup
 * tables that follow each block (until the next block).
 */
export function parseFinalArticle(wikitext: string): ParsedLineup[] {
  const lines = wikitext.split("\n");
  const blocks: {
    start: number; date: string | null;
    team1United: boolean; team2United: boolean;
    goals: [string, string];
  }[] = [];

  // locate football boxes and their date/team/goals params
  let inBox = false;
  let depth = 0;
  let param: string | null = null; // current multi-line box param ("goals1"/"goals2")
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!inBox && /\{\{\s*football\s?box/i.test(line)) {
      inBox = true;
      depth = 0;
      param = null;
      blocks.push({ start: i, date: null, team1United: false, team2United: false, goals: ["", ""] });
    }
    if (!inBox) continue;
    const blk = blocks[blocks.length - 1];
    const dm = line.match(/^\s*\|\s*date\s*=\s*(.+)$/i);
    if (dm && !blk.date) blk.date = parseWikiDate(dm[1]);
    const tm = line.match(/^\s*\|\s*team(1|2)\s*=\s*(.+)$/i);
    if (tm) {
      const united = /manchester united|newton heath/i.test(tm[2]);
      if (tm[1] === "1") blk.team1United = united;
      else blk.team2United = united;
    }
    // goals1/goals2 lists usually continue on following "*"-bulleted lines
    const pm = line.match(/^\s*\|\s*([a-z0-9_]+)\s*=\s*(.*)$/i);
    if (pm) {
      param = pm[1].toLowerCase();
      if (param === "goals1") blk.goals[0] += pm[2] + "\n";
      if (param === "goals2") blk.goals[1] += pm[2] + "\n";
    } else if (param === "goals1" || param === "goals2") {
      blk.goals[param === "goals1" ? 0 : 1] += line + "\n";
    }
    depth += (line.match(/\{\{/g) ?? []).length;
    depth -= (line.match(/\}\}/g) ?? []).length;
    if (depth <= 0) { inBox = false; param = null; }
  }

  const results: ParsedLineup[] = [];
  for (let b = 0; b < blocks.length; b++) {
    const from = blocks[b].start;
    const to = b + 1 < blocks.length ? blocks[b + 1].start : lines.length;
    const teams = extractLineupTables(lines.slice(from, to));
    results.push({
      date: blocks[b].date,
      unitedFirst: blocks[b].team1United,
      sideKnown: blocks[b].team1United !== blocks[b].team2United,
      goals: blocks[b].goals,
      teams,
    });
  }
  return results;
}

/** All tables in the region that look like lineup tables, in order. */
function extractLineupTables(lines: string[]): LineupRow[][] {
  const found: LineupRow[][] = [];
  // stack of in-progress tables; rows are attributed to the innermost one
  const stack: { rows: LineupRow[]; afterSubs: boolean; done: boolean; pending: string[] }[] = [];

  const flush = (t: (typeof stack)[number]) => {
    if (!t.pending.length || t.done) { t.pending = []; return; }
    const cells = t.pending;
    t.pending = [];
    const joined = cells.join("||");
    // "Substitute:", "Substitutes:", "Substitution(s):" all appear across eras
    if (/'''\s*Substitut/i.test(joined)) { t.afterSubs = true; return; }
    if (/'''\s*(Manager|Coach|Head coach)/i.test(joined)) { t.done = true; return; }
    const pos = stripWiki(cells[0] ?? "").replace(/ /g, "").trim();
    if (!POSITION.test(pos)) return;
    const name = linkTarget(joined);
    if (!name) return;
    const shirtText = stripWiki(cells[1] ?? "").replace(/\D/g, "");
    const on = joined.match(/\{\{\s*sub\s?on\s*\|\s*(\d+)/i);
    const off = joined.match(/\{\{\s*sub\s?off\s*\|\s*(\d+)/i);
    t.rows.push({
      role: pos,
      shirt: shirtText ? parseInt(shirtText, 10) : null,
      name,
      on: on ? parseInt(on[1], 10) : null,
      off: off ? parseInt(off[1], 10) : null,
      start: !t.afterSubs,
    });
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (line.startsWith("{|")) { stack.push({ rows: [], afterSubs: false, done: false, pending: [] }); continue; }
    if (line.startsWith("|}")) {
      const t = stack.pop();
      if (t) {
        flush(t);
        if (t.rows.filter((r) => r.start).length >= 7) found.push(t.rows);
      }
      continue;
    }
    const t = stack[stack.length - 1];
    if (!t) continue;
    if (line.startsWith("|-")) { flush(t); continue; }
    if (line.startsWith("!")) continue;
    if (line.startsWith("|")) {
      for (const c of splitCells(line.slice(1), "||")) t.pending.push(c);
    }
  }
  return found;
}

interface GoalEntry {
  name: string;
  minute: number | null;
  og: boolean;
}

/**
 * Parse a football-box goals param ("*[[Mario Basler|Basler]] {{goal|6}}")
 * into one entry per goal. {{goal}} takes minute params ("90+1") optionally
 * followed by a note param ("pen.", "o.g."); a single template can carry
 * several minutes. Pre-template articles fall back to "Basler 6'" minutes.
 */
function parseGoalList(text: string): GoalEntry[] {
  const entries: GoalEntry[] = [];
  for (const seg of text.split(/\n|<br\s*\/?\s*>/i)) {
    const chunk = seg.replace(/^\s*\*+\s*/, "").trim();
    if (!chunk || chunk === "}}") continue;
    const name = linkTarget(chunk) ?? (stripWiki(chunk).replace(/\d.*$/, "").trim() || null);
    if (!name) continue;
    const goals: { minute: number | null; note: string }[] = [];
    for (const t of chunk.matchAll(/\{\{\s*goal\s*\|([^{}]*)\}\}/gi)) {
      for (const p of t[1].split("|").map((s) => s.trim())) {
        const mm = p.match(/^(\d+)(?:\+(\d+))?$/);
        if (mm) goals.push({ minute: parseInt(mm[1], 10) + (mm[2] ? parseInt(mm[2], 10) : 0), note: "" });
        else if (goals.length) goals[goals.length - 1].note += p.toLowerCase();
      }
    }
    if (!goals.length) {
      for (const mm of chunk.matchAll(/(\d+)(?:\+(\d+))?'/g)) {
        goals.push({ minute: parseInt(mm[1], 10) + (mm[2] ? parseInt(mm[2], 10) : 0), note: "" });
      }
    }
    if (!goals.length) goals.push({ minute: null, note: "" });
    for (const g of goals) entries.push({ name, minute: g.minute, og: /o\.?\s?g/.test(g.note) });
  }
  return entries;
}

// ------------------------------------------------------------------- merging

interface PlayersFile {
  players: { id: string; name: string; positions?: string[]; nationality?: string; born?: string }[];
}

async function main() {
  const playersFile = readJson<PlayersFile>(path.join(CANONICAL, "players.json"));
  const known = new Set(playersFile.players.map((p) => p.id));
  let newPlayers = 0;
  let written = 0;
  let oppGoalsWritten = 0;
  let skipped = 0;

  for (const file of listSeasonFiles()) {
    const season = file.replace(".json", "");
    const sf = loadSeasonFile(season);
    let touched = false;

    for (const m of sf.matches) {
      const oneOff = ONE_OFF_FINALS.has(m.competition) && !/group/i.test(m.round ?? "");
      // ^final only: "Semi-final"/"Quarter-final" must not match the final's article
      if (!/^final/i.test(m.round ?? "") && !oneOff) continue;

      const needLineup = !(m.lineup && m.lineup.length > 0) || REPARSE;
      const goalsAgainst = m.score.ft?.[1] ?? 0;
      const existingAgainst = (m.events ?? []).filter(
        (e) => e.type === "opp-goal" || e.type === "own-goal-against",
      ).length;
      const needOppGoals = goalsAgainst > 0 && existingAgainst === 0;
      if (!needLineup && !needOppGoals) continue;

      const titles = articleTitles(m.competition, m.date);
      if (!titles) continue;
      const cacheFile = path.join(CACHE, `${slugify(titles[0])}.wikitext`);
      const wikitext = await fetchArticle(titles, cacheFile);
      if (!wikitext) { console.log(`${m.id}: no article found (${titles[0]})`); skipped++; continue; }

      const blocks = parseFinalArticle(wikitext);

      if (needLineup) {
        const withDate = blocks.filter((blk) => blk.teams.length >= 2);
        const block =
          withDate.find((blk) => blk.date === m.date) ??
          (withDate.length === 1 && blocks.length === 1 ? withDate[0] : undefined);
        if (!block) { console.log(`${m.id}: no lineup block for ${m.date} in ${titles[0]}`); skipped++; }
        else if (!block.sideKnown) { console.log(`${m.id}: United not identified in football box, skipping`); skipped++; }
        else {
          const rows = block.unitedFirst ? block.teams[0] : block.teams[block.teams.length - 1];
          const starters = rows.filter((r) => r.start);
          if (starters.length !== 11) {
            console.log(`${m.id}: parsed ${starters.length} starters, skipping`);
            skipped++;
          } else {
            const lineup: LineupEntry[] = [];
            const inLineup = new Set<string>();
            for (const r of rows) {
              if (!r.start && r.on == null) continue; // unused substitute
              const pid = slugify(r.name);
              if (inLineup.has(pid)) continue;
              inLineup.add(pid);
              if (!known.has(pid)) {
                playersFile.players.push({ id: pid, name: r.name });
                known.add(pid);
                newPlayers++;
              }
              lineup.push({
                player: pid,
                shirt: r.shirt,
                role: r.role,
                start: r.start,
                on: r.start ? null : r.on,
                off: r.off,
              });
            }
            m.lineup = lineup;
            if (!m.sources.includes("wikipedia")) m.sources.push("wikipedia");
            touched = true;
            written++;
            console.log(`${m.id}: ${starters.length} starters + ${lineup.length - 11} subs used`);
          }
        }
      }

      if (needOppGoals) {
        const block =
          blocks.find((blk) => blk.date === m.date) ??
          (blocks.length === 1 ? blocks[0] : undefined);
        if (block && block.sideKnown) {
          const entries = parseGoalList(block.unitedFirst ? block.goals[1] : block.goals[0]);
          // only write when the list accounts for every goal conceded
          if (entries.length === goalsAgainst) {
            const events: MatchEvent[] = entries.map((g) => {
              if (g.og) {
                // own goal in the opposition's list: scored by a United player
                const pid = slugify(g.name);
                return {
                  type: "own-goal-against",
                  player: known.has(pid) ? pid : null,
                  playerName: g.name,
                  playerSide: "united",
                  minute: g.minute,
                  detail: "og",
                };
              }
              return {
                type: "opp-goal",
                player: null,
                playerName: g.name,
                playerSide: "opponent",
                minute: g.minute,
              };
            });
            m.events = [...(m.events ?? []), ...events];
            if (!m.sources.includes("wikipedia")) m.sources.push("wikipedia");
            touched = true;
            oppGoalsWritten++;
            console.log(`${m.id}: +${events.length} opposition scorer(s)`);
          } else if (entries.length > 0) {
            console.log(`${m.id}: ${entries.length} opposition goal entries != ${goalsAgainst} conceded, skipping`);
          }
        }
      }
    }

    if (touched) saveSeasonFile(sf);
  }

  if (newPlayers > 0) {
    playersFile.players.sort((a, b) => a.id.localeCompare(b.id));
    writeJson(path.join(CANONICAL, "players.json"), playersFile);
  }
  console.log(
    `TOTAL: lineups written for ${written} matches, opposition scorers for ${oppGoalsWritten}, ` +
    `${skipped} skipped, ${newPlayers} new players`,
  );
}

if (require.main === module) main();
