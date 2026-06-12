/**
 * Ingest Manchester United season articles from Wikipedia (wikitext API).
 *
 * Season articles contain per-competition wikitables:
 *   Date | Round | Opponents | H/A | Result F-A | Scorers | Attendance
 * (column order varies; resolved via the header row of each table).
 *
 * Usage:
 *   tsx scripts/ingest/wikipedia.ts 1967-68            one season
 *   tsx scripts/ingest/wikipedia.ts 1956-57 2025-26    inclusive range
 *
 * Behaviour per parsed row:
 *  - competitions we already hold result-level (league, FA Cup): enrich the
 *    existing match (attendance, round, scorers->events) — never duplicate.
 *  - other competitions (Europe, League Cup, Charity Shield, ...): add the
 *    match if missing, enrich if present.
 * New players found in scorer cells are appended to players.json.
 * Raw wikitext is cached in data/raw/wikipedia/ (gitignored).
 */
import fs from "node:fs";
import path from "node:path";
import {
  AliasFile, CANONICAL, Match, MatchEvent, RAW, Venue,
  loadSeasonFile, matchId, opponentIdFor, readJson, saveSeasonFile,
  seasonKey, slugify, writeJson,
} from "../lib";
import { fetchArticle, linkTarget, parseWikiDate, splitCells, stripWiki } from "./wiki-utils";

const CACHE = path.join(RAW, "wikipedia");
const REPARSE = process.argv.includes("--reparse");
const { aliases } = readJson<AliasFile>(path.join(CANONICAL, "opponent-aliases.json"));

// ---------------------------------------------------------------- fetching

function titleCandidates(season: string): string[] {
  const startYear = parseInt(season.slice(0, 4), 10);
  const end = season.slice(5);
  const dash = "–";
  // century rollover uses the full year: "1999–2000"
  const yr = end === "00" ? `${startYear}${dash}${startYear + 1}` : `${startYear}${dash}${end}`;
  if (startYear < 1902) {
    return [
      `${yr} Newton Heath F.C. season`,
      `${yr} Newton Heath LYR F.C. season`,
      `${yr} Manchester United F.C. season`,
    ];
  }
  return [`${yr} Manchester United F.C. season`];
}

function fetchWikitext(season: string): Promise<string | null> {
  return fetchArticle(titleCandidates(season), path.join(CACHE, `${season}.wikitext`));
}

// ------------------------------------------------------- competition mapping

function competitionFor(heading: string, startYear: number): string | "league" | null {
  const h = heading.toLowerCase();
  if (/pre-season|friendl|tour(?!nament)|squad|transfer|statistic|reference|note|see also|external|kit|award/.test(h)) return null;
  if (/champions league|european cup(?! winners)/.test(h)) {
    return startYear >= 1992 ? "champions-league" : "european-cup";
  }
  if (/cup winners/.test(h)) return "cup-winners-cup";
  if (/europa league/.test(h)) return "europa-league";
  if (/uefa cup/.test(h)) return "uefa-cup";
  if (/fairs cup/.test(h)) return "inter-cities-fairs-cup";
  if (/league cup|efl cup|milk cup|littlewoods|rumbelows|coca-cola|worthington|carling cup|capital one|carabao/.test(h)) return "league-cup";
  if (/charity shield|community shield/.test(h)) return "charity-shield";
  if (/intercontinental/.test(h)) return "intercontinental-cup";
  if (/club world/.test(h)) return "fifa-club-world-cup";
  if (/super cup/.test(h)) return "uefa-super-cup";
  if (/fa cup/.test(h)) return "fa-cup";
  if (/test match/.test(h)) return "test-match";
  if (/premier league|first division|second division|football league|division one|division two|^league$|^matches$|results/.test(h)) return "league";
  return null;
}

// --------------------------------------------------------------- scorers

interface PlayerRef { id: string; name: string }

function parseScorers(
  rawCell: string,
  knownPlayers: Map<string, PlayerRef>,
  newPlayers: Map<string, PlayerRef>,
): MatchEvent[] {
  const events: MatchEvent[] = [];
  const cleaned = rawCell.replace(/<ref[^>]*\/>/g, "").replace(/<ref[^>]*>[\s\S]*?<\/ref>/g, "");
  if (!stripWiki(cleaned) || /^[-—–\s]*$/.test(stripWiki(cleaned))) return events;
  let lastPid: string | null = null; // carries across "Rooney 12', 34'" comma splits
  for (const chunk of splitCells(cleaned, ",")) {
    const text = stripWiki(chunk);
    if (!text) continue;
    const og = /o\.?g\.?|own goal/i.test(chunk);
    const pen = /pen|\(p\)/i.test(chunk);
    // skip non-player wikilinks like [[Penalty kick|pen.]] or [[Own goal|o.g.]]
    const cleanedChunk = chunk.replace(/\[\[(?:Penalty kick|Own goal|Penalty \(football\))(?:\|[^\]]*)?\]\]/gi, "");
    const target = linkTarget(cleanedChunk);
    const displayName =
      target ?? stripWiki(cleanedChunk).replace(/\s*\(.*$/, "").replace(/\s*\d+.*$/, "").trim();

    // minutes: "23'", "45+2'", possibly several
    const minutes = [...chunk.matchAll(/(\d+)(?:\+(\d+))?'/g)].map(
      (m) => parseInt(m[1], 10) + (m[2] ? parseInt(m[2], 10) : 0),
    );

    if (!displayName) {
      // bare minutes after a comma belong to the previous scorer
      if (lastPid && minutes.length > 0) {
        for (const min of minutes) {
          events.push({ type: pen ? "pen-goal" : "goal", player: lastPid, minute: min });
        }
      }
      continue;
    }

    // multiplier: "(2)" not containing pen/og
    const mult = text.match(/\((\d+)\)/);
    const count = minutes.length > 0 ? minutes.length : mult ? parseInt(mult[1], 10) : 1;

    if (og) {
      for (let i = 0; i < count; i++) {
        events.push({ type: "own-goal-for", player: null, minute: minutes[i] ?? null, detail: `${displayName} (og)` });
      }
      lastPid = null;
      continue;
    }
    const pid = slugify(displayName);
    lastPid = pid;
    if (!knownPlayers.has(pid) && !newPlayers.has(pid)) {
      newPlayers.set(pid, { id: pid, name: displayName });
    }
    for (let i = 0; i < count; i++) {
      events.push({
        type: pen && count === 1 ? "pen-goal" : "goal",
        player: pid,
        minute: minutes[i] ?? null,
      });
    }
  }
  return events;
}

// --------------------------------------------------------------- main parse

interface ParsedRow {
  competition: string | "league";
  date: string;
  round: string | null;
  opponent: string;
  venue: Venue;
  gf: number;
  ga: number;
  aet: boolean;
  pens: [number, number] | null;
  scorersRaw: string | null;
  attendance: number | null;
}

function parseArticle(wikitext: string, startYear: number): { rows: ParsedRow[]; warnings: string[] } {
  const rows: ParsedRow[] = [];
  const warnings: string[] = [];
  const lines = wikitext.split("\n");
  let comp: string | "league" | null = null;
  let compLevel = 0;
  let inTable = false;
  let header: string[] = [];
  let pendingRow: string[] = [];

  const flushRow = () => {
    if (!pendingRow.length || !comp) { pendingRow = []; return; }
    const cells = pendingRow;
    pendingRow = [];
    if (!header.length) return;
    const idx = (names: string[]) =>
      header.findIndex((h) => names.some((n) => h.includes(n)));
    const iDate = idx(["date"]);
    const iOpp = idx(["opponent", "opposition"]);
    const iVenue = idx(["h / a", "h/a", "venue", "ground"]);
    const iResult = idx(["result", "score", "f–a", "f-a"]);
    const iScorers = idx(["scorer", "goalscorer"]);
    const iAtt = idx(["attendance"]);
    const iRound = idx(["round"]);
    if (iDate < 0 || iOpp < 0 || iResult < 0) return;
    const date = parseWikiDate(cells[iDate] ?? "");
    if (!date) return;
    const oppRaw = cells[iOpp] ?? "";
    const opponent = (linkTarget(oppRaw) ?? stripWiki(oppRaw)).replace(/\s+A?\.?F\.?C\.?$/i, "").trim();
    if (!opponent) return;
    const resultText = stripWiki(cells[iResult] ?? "");
    const score = resultText.match(/(\d+)\s*[–\-:]\s*(\d+)/);
    if (!score) { warnings.push(`unparsed result "${resultText}" on ${date}`); return; }
    const venueText = iVenue >= 0 ? stripWiki(cells[iVenue] ?? "").toUpperCase() : "";
    const venue: Venue = venueText.startsWith("N") ? "N" : venueText.startsWith("A") ? "A" : "H";
    const aet = /a\.?e\.?t\.?/i.test(resultText);
    let pens: [number, number] | null = null;
    const penM = resultText.match(/(\d+)\s*[–\-]\s*(\d+)\s*(?:p|pens?|penalt)/i)
      ?? (stripWiki(cells[iRound] ?? "") + " " + resultText).match(/penalt[^\d]*(\d+)\s*[–\-]\s*(\d+)/i);
    if (penM) pens = [parseInt(penM[1], 10), parseInt(penM[2], 10)];
    const attText = iAtt >= 0 ? stripWiki(cells[iAtt] ?? "").replace(/[,. ]/g, "") : "";
    const attendance = /^\d{2,6}$/.test(attText) ? parseInt(attText, 10) : null;
    rows.push({
      competition: comp,
      date,
      round: iRound >= 0 ? stripWiki(cells[iRound] ?? "").replace(/\s+/g, " ") || null : null,
      opponent,
      venue,
      gf: parseInt(score[1], 10),
      ga: parseInt(score[2], 10),
      aet,
      pens,
      scorersRaw: iScorers >= 0 ? (cells[iScorers] ?? null) : null,
      attendance,
    });
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    const hm = line.match(/^(={2,})\s*(.+?)\s*=+\s*$/);
    if (hm) {
      flushRow();
      const level = hm[1].length;
      const mapped = competitionFor(stripWiki(hm[2]), startYear);
      if (mapped !== null) {
        comp = mapped;
        compLevel = level;
      } else if (level <= compLevel) {
        comp = null;
      }
      continue;
    }
    if (line.startsWith("{|")) { inTable = true; header = []; pendingRow = []; continue; }
    if (line.startsWith("|}")) { flushRow(); inTable = false; continue; }
    if (!inTable) continue;
    if (line.startsWith("!")) {
      const cellsText = line.slice(1);
      for (const c of splitCells(cellsText, "!!")) {
        header.push(stripWiki(c.replace(/^[^|]*\|(?!\|)/, "")).toLowerCase());
      }
      continue;
    }
    if (line.startsWith("|-")) { flushRow(); continue; }
    if (line.startsWith("|")) {
      const content = line.slice(1);
      for (const c of splitCells(content, "||")) pendingRow.push(c);
    }
  }
  flushRow();
  return { rows, warnings };
}

// ----------------------------------------------------------------- merging

interface PlayersFile { players: { id: string; name: string; positions?: string[]; nationality?: string; born?: string }[] }

async function processSeason(
  season: string,
  knownPlayers: Map<string, PlayerRef>,
  newPlayers: Map<string, PlayerRef>,
): Promise<{ added: number; enriched: number; warnings: string[] } | null> {
  const wikitext = await fetchWikitext(season);
  if (!wikitext) return null;
  const startYear = parseInt(season.slice(0, 4), 10);
  const { rows, warnings } = parseArticle(wikitext, startYear);
  const sf = loadSeasonFile(season);
  const byDateOpp = new Map(sf.matches.map((m) => [`${m.date}|${m.opponentId}`, m]));
  let added = 0;
  let enriched = 0;

  for (const r of rows) {
    const oppId = opponentIdFor(r.opponent, aliases);
    const existing = byDateOpp.get(`${r.date}|${oppId}`);
    const events = r.scorersRaw ? parseScorers(r.scorersRaw, knownPlayers, newPlayers) : [];
    const goalEvents = events.filter((e) => ["goal", "pen-goal", "own-goal-for"].includes(e.type)).length;

    if (existing) {
      let touched = false;
      if (existing.attendance == null && r.attendance != null) { existing.attendance = r.attendance; touched = true; }
      if (!existing.round && r.round) { existing.round = r.round; touched = true; }
      const mayWrite = REPARSE
        ? events.length > 0 // reparse: replace wikipedia-derived events wholesale
        : (!existing.events || existing.events.length === 0) && events.length > 0;
      if (mayWrite && JSON.stringify(existing.events) !== JSON.stringify(events)) {
        existing.events = events;
        existing.eventsComplete = goalEvents === existing.score.ft[0];
        touched = true;
      }
      if (touched && !existing.sources.includes("wikipedia")) existing.sources.push("wikipedia");
      if (touched) enriched++;
      continue;
    }

    // never create league/FA Cup matches from Wikipedia (we hold those
    // result-complete from engsoccerdata); date mismatches would duplicate
    if (r.competition === "league") { warnings.push(`league row not matched: ${r.date} v ${r.opponent}`); continue; }
    if (r.competition === "fa-cup" && startYear >= 1889 && startYear <= 2018) {
      warnings.push(`fa-cup row not matched: ${r.date} v ${r.opponent}`);
      continue;
    }
    const match: Match = {
      id: matchId(r.date, oppId, r.venue),
      date: r.date,
      competition: r.competition,
      round: r.round,
      opponent: r.opponent,
      opponentId: oppId,
      venue: r.venue,
      stadium: null,
      attendance: r.attendance,
      score: { ft: [r.gf, r.ga], aet: r.aet || undefined, pens: r.pens },
      eventsComplete: events.length > 0 ? goalEvents === r.gf : undefined,
      events: events.length > 0 ? events : undefined,
      sources: ["wikipedia"],
    };
    sf.matches.push(match);
    byDateOpp.set(`${r.date}|${oppId}`, match);
    added++;
  }

  if (added > 0 || enriched > 0) saveSeasonFile(sf);
  return { added, enriched, warnings };
}

async function main() {
  let args = process.argv.slice(2).filter((a) => /^\d{4}-\d{2}$/.test(a));
  if (process.argv.includes("current")) {
    const now = new Date();
    const y = now.getUTCMonth() + 1 >= 7 ? now.getUTCFullYear() : now.getUTCFullYear() - 1;
    args = [seasonKey(y)];
    // the article changes weekly during a season: don't serve a stale cache
    fs.rmSync(path.join(CACHE, `${args[0]}.wikitext`), { force: true });
  }
  if (args.length === 0) {
    console.error("usage: tsx scripts/ingest/wikipedia.ts <season> [<endSeason>] | current [--reparse]");
    process.exit(1);
  }
  const startYear = parseInt(args[0].slice(0, 4), 10);
  const endYear = args[1] ? parseInt(args[1].slice(0, 4), 10) : startYear;

  const playersFile = readJson<PlayersFile>(path.join(CANONICAL, "players.json"));
  const knownPlayers = new Map(playersFile.players.map((p) => [p.id, { id: p.id, name: p.name }]));
  const newPlayers = new Map<string, PlayerRef>();

  let totAdded = 0;
  let totEnriched = 0;
  for (let y = startYear; y <= endYear; y++) {
    if ((y >= 1915 && y <= 1918) || (y >= 1939 && y <= 1944)) continue; // wartime
    const season = seasonKey(y);
    const res = await processSeason(season, knownPlayers, newPlayers);
    if (!res) { console.log(`${season}: no article found`); continue; }
    console.log(
      `${season}: +${res.added} added, ${res.enriched} enriched` +
      (res.warnings.length ? `, ${res.warnings.length} warning(s)` : ""),
    );
    for (const w of res.warnings.slice(0, 5)) console.log(`    ~ ${w}`);
    totAdded += res.added;
    totEnriched += res.enriched;
    // persist new players after every season so canonical data is never
    // left referencing players that were only held in memory
    if (newPlayers.size > 0) {
      for (const p of newPlayers.values()) {
        playersFile.players.push({ id: p.id, name: p.name });
        knownPlayers.set(p.id, p);
      }
      playersFile.players.sort((a, b) => a.id.localeCompare(b.id));
      writeJson(path.join(CANONICAL, "players.json"), playersFile);
      newPlayers.clear();
    }
  }
  console.log(`TOTAL: +${totAdded} matches, ${totEnriched} enriched, ${newPlayers.size} new players`);
}

main();
