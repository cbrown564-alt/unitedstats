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
 * Usage:
 *   tsx scripts/ingest/final-lineups.ts            all finals without lineups
 *   tsx scripts/ingest/final-lineups.ts --reparse  re-derive even when present
 */
import path from "node:path";
import {
  CANONICAL, LineupEntry, RAW,
  listSeasonFiles, loadSeasonFile, readJson, saveSeasonFile, slugify, writeJson,
} from "../lib";
import { fetchArticle, linkTarget, parseWikiDate, splitCells, stripWiki } from "./wiki-utils";

const CACHE = path.join(RAW, "wikipedia", "finals");
const REPARSE = process.argv.includes("--reparse");

// ------------------------------------------------------------ article titles

function articleTitles(competition: string, date: string): string[] | null {
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
  };
  const titles = base[competition];
  if (!titles) return null;
  // Wikipedia mixes "final" and "Final" in titles; redirects usually cover
  // both, but try both casings to be safe.
  return titles.flatMap((t) => [t, t.replace(/final$/, "Final")]);
}

// ------------------------------------------------------------------- parsing

interface ParsedLineup {
  date: string | null;
  unitedFirst: boolean;
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
function parseFinalArticle(wikitext: string): ParsedLineup[] {
  const lines = wikitext.split("\n");
  const blocks: { start: number; date: string | null; unitedFirst: boolean }[] = [];

  // locate football boxes and their date/team1 params
  let inBox = false;
  let depth = 0;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!inBox && /\{\{\s*football\s?box/i.test(line)) {
      inBox = true;
      depth = 0;
      blocks.push({ start: i, date: null, unitedFirst: false });
    }
    if (!inBox) continue;
    const blk = blocks[blocks.length - 1];
    const dm = line.match(/^\s*\|\s*date\s*=\s*(.+)$/i);
    if (dm && !blk.date) blk.date = parseWikiDate(dm[1]);
    const tm = line.match(/^\s*\|\s*team1\s*=\s*(.+)$/i);
    if (tm) blk.unitedFirst = /manchester united|newton heath/i.test(tm[1]);
    depth += (line.match(/\{\{/g) ?? []).length;
    depth -= (line.match(/\}\}/g) ?? []).length;
    if (depth <= 0) inBox = false;
  }

  const results: ParsedLineup[] = [];
  for (let b = 0; b < blocks.length; b++) {
    const from = blocks[b].start;
    const to = b + 1 < blocks.length ? blocks[b + 1].start : lines.length;
    const teams = extractLineupTables(lines.slice(from, to));
    results.push({ date: blocks[b].date, unitedFirst: blocks[b].unitedFirst, teams });
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
    if (/'''\s*Substitutes/i.test(joined)) { t.afterSubs = true; return; }
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

// ------------------------------------------------------------------- merging

interface PlayersFile {
  players: { id: string; name: string; positions?: string[]; nationality?: string; born?: string }[];
}

async function main() {
  const playersFile = readJson<PlayersFile>(path.join(CANONICAL, "players.json"));
  const known = new Set(playersFile.players.map((p) => p.id));
  let newPlayers = 0;
  let written = 0;
  let skipped = 0;

  for (const file of listSeasonFiles()) {
    const season = file.replace(".json", "");
    const sf = loadSeasonFile(season);
    let touched = false;

    for (const m of sf.matches) {
      if (!/final/i.test(m.round ?? "")) continue;
      if (m.lineup && m.lineup.length > 0 && !REPARSE) continue;
      const titles = articleTitles(m.competition, m.date);
      if (!titles) continue;
      const cacheFile = path.join(CACHE, `${slugify(titles[0])}.wikitext`);
      const wikitext = await fetchArticle(titles, cacheFile);
      if (!wikitext) { console.log(`${m.id}: no article found (${titles[0]})`); skipped++; continue; }

      const blocks = parseFinalArticle(wikitext);
      const withDate = blocks.filter((blk) => blk.teams.length >= 2);
      const block =
        withDate.find((blk) => blk.date === m.date) ??
        (withDate.length === 1 && blocks.length === 1 ? withDate[0] : undefined);
      if (!block) { console.log(`${m.id}: no lineup block for ${m.date} in ${titles[0]}`); skipped++; continue; }

      const rows = block.unitedFirst ? block.teams[0] : block.teams[block.teams.length - 1];
      const starters = rows.filter((r) => r.start);
      if (starters.length !== 11) {
        console.log(`${m.id}: parsed ${starters.length} starters, skipping`);
        skipped++;
        continue;
      }

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

    if (touched) saveSeasonFile(sf);
  }

  if (newPlayers > 0) {
    playersFile.players.sort((a, b) => a.id.localeCompare(b.id));
    writeJson(path.join(CANONICAL, "players.json"), playersFile);
  }
  console.log(`TOTAL: lineups written for ${written} matches, ${skipped} skipped, ${newPlayers} new players`);
}

main();
