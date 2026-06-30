/**
 * The recurring update job: fetch latest Manchester United results and append
 * any new ones to the canonical season file. Idempotent — re-runs are no-ops
 * until a new result appears upstream.
 *
 * Primary source: openfootball/england (community-maintained plain text,
 * no API key). Exits 0 with "no new matches" when there is nothing to do.
 * Prints `::set-output`-style marker NEW_MATCHES=<n> for the GitHub workflow.
 */
import {
  AliasFile, CANONICAL, Match, Venue,
  loadSeasonFile, matchId, opponentIdFor, readJson, saveSeasonFile,
} from "../scripts/lib";
import path from "node:path";

const MU_NAMES = ["Manchester United FC", "Manchester United"];

/** Season to update: --season 2022-23 to backfill, else derived from today. */
function targetSeason(now = new Date()): string {
  const argIdx = process.argv.indexOf("--season");
  if (argIdx !== -1 && process.argv[argIdx + 1]) return process.argv[argIdx + 1];
  const y = now.getUTCFullYear();
  const startYear = now.getUTCMonth() + 1 >= 7 ? y : y - 1;
  return `${startYear}-${String((startYear + 1) % 100).padStart(2, "0")}`;
}

interface SourceSpec {
  file: string; // path within openfootball/england/<season>/
  competition: string;
}
// League is always present; cup files appear in the repo when the season's
// data exists. Missing files are skipped silently.
const SOURCES: SourceSpec[] = [
  { file: "1-premierleague.txt", competition: "premier-league" },
  { file: "facup.txt", competition: "fa-cup" },
  { file: "eflcup.txt", competition: "league-cup" },
  { file: "leaguecup.txt", competition: "league-cup" },
];

const MONTHS: Record<string, number> = {
  Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6,
  Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12,
};

interface ParsedScore {
  ft: [number, number];
  ht: [number, number] | null;
  aet: boolean;
  pens: [number, number] | null;
}

interface ParsedFixture extends ParsedScore {
  date: string;
  home: string;
  away: string;
  round: string | null;
}

/**
 * Score grammar (home-team-first):
 *   "2-1 (1-0)"                          ft + ht
 *   "2-1"                                ft
 *   "1-1 a.e.t. (1-1, 0-0)"              aet; ft is the 120' score
 *   "6-7 pen. 0-0 a.e.t. (0-0)"          shootout; ft is the 120' score
 */
function parseScore(s: string): ParsedScore | null {
  const pens = s.match(/^(\d+)-(\d+)\s+pen\.\s+(\d+)-(\d+)\s+a\.e\.t\.(?:\s+\((\d+)-(\d+)[^)]*\))?$/);
  if (pens) {
    return {
      ft: [+pens[3], +pens[4]],
      ht: pens[5] ? [+pens[5], +pens[6]] : null,
      aet: true,
      pens: [+pens[1], +pens[2]],
    };
  }
  const aet = s.match(/^(\d+)-(\d+)\s+a\.e\.t\.(?:\s+\((\d+)-(\d+)[^)]*\))?$/);
  if (aet) {
    return { ft: [+aet[1], +aet[2]], ht: aet[3] ? [+aet[3], +aet[4]] : null, aet: true, pens: null };
  }
  const ft = s.match(/^(\d+)-(\d+)(?:\s+\((\d+)-(\d+)\))?$/);
  if (ft) {
    return { ft: [+ft[1], +ft[2]], ht: ft[3] ? [+ft[3], +ft[4]] : null, aet: false, pens: null };
  }
  return null;
}

function normalizeRound(header: string): string | null {
  const h = header.trim();
  if (/^Matchday/i.test(h)) return null;
  if (/^Quarter-?finals?$/i.test(h)) return "Quarter-final";
  if (/^Semi-?finals?$/i.test(h)) return "Semi-final";
  if (/^Final$/i.test(h)) return "Final";
  if (/^Round of 16$/i.test(h)) return "Round of 16";
  const r = h.match(/^Round (\d+)$/i);
  if (r) return `Round ${r[1]}`;
  return h;
}

/**
 * Parse openfootball fixture text. Two result-line layouts exist across
 * seasons, both indentation-based under round/date headers:
 *   15:00  Home FC  v  Away FC   <score>
 *   15:00  Home FC   <score>   Away FC
 */
export function parseOpenfootball(text: string, seasonStartYear: number): ParsedFixture[] {
  const fixtures: ParsedFixture[] = [];
  let curDate: string | null = null;
  let curRound: string | null = null;
  const SCORE = String.raw`\d+-\d+(?:\s+pen\.\s+\d+-\d+\s+a\.e\.t\.|\s+a\.e\.t\.)?(?:\s+\(\d+-\d+[^)]*\))?`;
  const vLine = new RegExp(String.raw`^\s+(?:\d{1,2}[:.]\d{2}\s+)?(.+?)\s+v\s+(.+?)\s{2,}(${SCORE})\s*$`);
  const midLine = new RegExp(String.raw`^\s+(?:\d{1,2}[:.]\d{2}\s+)?(\S.*?)\s{2,}(${SCORE})\s{2,}(\S.*?)\s*$`);

  for (const rawLine of text.split("\n")) {
    const line = rawLine.replace(/\r$/, "");
    const header = line.match(/^[▪»]\s*(.+)$/);
    if (header) {
      curRound = normalizeRound(header[1]);
      continue;
    }
    const dateMatch = line.match(
      /^\s*(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)\s+([A-Z][a-z]{2})\s+(\d{1,2})(?:\s+(\d{4}))?\s*$/,
    );
    if (dateMatch) {
      const mon = MONTHS[dateMatch[1]];
      const day = parseInt(dateMatch[2], 10);
      // No explicit year: Aug-Dec = season start year, Jan-Jul = the year
      // after (July covers COVID-extended 2019-20 style run-ins).
      const year = dateMatch[3]
        ? parseInt(dateMatch[3], 10)
        : mon >= 8 ? seasonStartYear : seasonStartYear + 1;
      curDate = `${year}-${String(mon).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      continue;
    }
    if (!curDate) continue;
    let home: string | null = null;
    let away: string | null = null;
    let scoreText: string | null = null;
    const v = line.match(vLine);
    if (v) { home = v[1]; away = v[2]; scoreText = v[3]; }
    else {
      const mid = line.match(midLine);
      if (mid) { home = mid[1]; away = mid[3]; scoreText = mid[2]; }
    }
    if (!home || !away || !scoreText) continue;
    const score = parseScore(scoreText.trim());
    if (!score) continue;
    fixtures.push({ date: curDate, home: home.trim(), away: away.trim(), round: curRound, ...score });
  }
  return fixtures;
}

async function fetchText(url: string): Promise<string | null> {
  const res = await fetch(url, { headers: { "user-agent": "unitedstats-pipeline" } });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`${res.status} fetching ${url}`);
  return res.text();
}

async function run() {
  const season = targetSeason();
  const startYear = parseInt(season.slice(0, 4), 10);
  const { aliases } = readJson<AliasFile>(path.join(CANONICAL, "opponent-aliases.json"));
  const sf = loadSeasonFile(season);
  const known = new Set(sf.matches.map((m) => m.id));
  // League sides meet once per venue per season, so opponent+venue dedupes
  // even when sources disagree on the exact date of the same fixture.
  const knownLeague = new Set(
    sf.matches
      .filter((m) => m.competition === "premier-league")
      .map((m) => `${m.opponentId}|${m.venue}`),
  );
  let added = 0;
  const addedIds: string[] = [];

  for (const src of SOURCES) {
    const url = `https://raw.githubusercontent.com/openfootball/england/master/${season}/${src.file}`;
    let text: string | null;
    try {
      text = await fetchText(url);
    } catch (err) {
      console.error(`WARN: ${src.file}: ${err}`);
      continue;
    }
    if (text === null) continue; // file doesn't exist (yet) for this season

    const isCup = src.competition !== "premier-league";
    for (const f of parseOpenfootball(text, startYear)) {
      const isHome = MU_NAMES.includes(f.home);
      const isAway = MU_NAMES.includes(f.away);
      if (!isHome && !isAway) continue;
      if (f.date > new Date().toISOString().slice(0, 10)) continue; // fixture, not result
      const rawOpp = isHome ? f.away : f.home;
      // strip trailing FC/AFC before alias lookup so "Reading FC" -> reading
      const oppName = rawOpp.replace(/\s+(FC|AFC)$/, "");
      const oppId = opponentIdFor(aliases[rawOpp] ? rawOpp : oppName, aliases);
      // finals (and modern FA Cup semi-finals) are at neutral venues
      const neutral =
        isCup && (f.round === "Final" || (src.competition === "fa-cup" && f.round === "Semi-final"));
      const venue: Venue = neutral ? "N" : isHome ? "H" : "A";
      const id = matchId(f.date, oppId, venue);
      if (known.has(id)) continue;
      if (!isCup && knownLeague.has(`${oppId}|${venue}`)) continue;
      const flip = <T,>(pair: [T, T]): [T, T] => (isHome ? pair : [pair[1], pair[0]]);
      const match: Match = {
        id,
        date: f.date,
        competition: src.competition,
        round: isCup ? f.round : null,
        opponent: oppName,
        opponentId: oppId,
        venue,
        stadium: neutral ? "wembley" : null,
        attendance: null,
        score: {
          ft: flip(f.ft),
          ht: f.ht ? flip(f.ht) : null,
          aet: f.aet || undefined,
          pens: f.pens ? flip(f.pens) : null,
        },
        sources: ["openfootball"],
      };
      sf.matches.push(match);
      known.add(id);
      if (!isCup) knownLeague.add(`${oppId}|${venue}`);
      added++;
      addedIds.push(id);
      const [gf, ga] = match.score.ft;
      console.log(`+ ${f.date} ${isHome ? "v" : "@"} ${oppName} ${gf}-${ga}${f.pens ? ` (${match.score.pens!.join("-")} pens)` : ""} (${src.competition}${f.round ? ", " + f.round : ""})`);
    }
  }

  if (added > 0) saveSeasonFile(sf);
  console.log(added > 0 ? `${added} new match(es) added to ${season}` : "no new matches");
  console.log(`NEW_MATCHES=${added}`);
  if (addedIds.length > 0) console.log(`NEW_MATCH_IDS=${addedIds.join(",")}`);
}

// only run when executed directly (the parser is imported elsewhere)
if (process.argv[1] && /update\.(ts|js)$/.test(process.argv[1].replace(/\\/g, "/"))) {
  run().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
