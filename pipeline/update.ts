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

function currentSeason(now = new Date()): { key: string; openfootballDir: string } {
  const y = now.getUTCFullYear();
  const startYear = now.getUTCMonth() + 1 >= 7 ? y : y - 1;
  const endShort = String((startYear + 1) % 100).padStart(2, "0");
  return {
    key: `${startYear}-${endShort}`,
    openfootballDir: `${startYear}-${endShort.length === 2 ? endShort : endShort}`,
  };
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

interface ParsedFixture {
  date: string;
  home: string;
  away: string;
  ftHome: number;
  ftAway: number;
  htHome: number | null;
  htAway: number | null;
}

/**
 * Parse openfootball fixture text. Format (indentation-based):
 *   ▪ Matchday 1            (or » Round / ▪ Round-of-16 etc.)
 *   Sat Aug 16 2025         (year optional on subsequent dates)
 *     15:00  Home FC  v  Away FC   2-1 (1-0)
 *            Home FC  v  Away FC   2-1
 */
export function parseOpenfootball(text: string, seasonStartYear: number): ParsedFixture[] {
  const fixtures: ParsedFixture[] = [];
  let curDate: string | null = null;
  let lastYear = seasonStartYear;
  for (const rawLine of text.split("\n")) {
    const line = rawLine.replace(/\r$/, "");
    const dateMatch = line.match(
      /^\s*(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)\s+([A-Z][a-z]{2})\s+(\d{1,2})(?:\s+(\d{4}))?\s*$/,
    );
    if (dateMatch) {
      const mon = MONTHS[dateMatch[1]];
      const day = parseInt(dateMatch[2], 10);
      let year = dateMatch[3] ? parseInt(dateMatch[3], 10) : mon >= 7 ? seasonStartYear : seasonStartYear + 1;
      if (dateMatch[3]) lastYear = year;
      else if (mon >= 7) year = lastYear; // tours/qualifiers edge: keep simple
      curDate = `${year}-${String(mon).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      continue;
    }
    // result line: optional kickoff time, "Team v Team", score "x-y" with optional "(a-b)"
    const m = line.match(
      /^\s+(?:\d{1,2}[:.]\d{2}\s+)?(.+?)\s+v\s+(.+?)\s{2,}(\d+)-(\d+)(?:\s+\((\d+)-(\d+)\))?\s*$/,
    );
    if (m && curDate) {
      fixtures.push({
        date: curDate,
        home: m[1].trim(),
        away: m[2].trim(),
        ftHome: parseInt(m[3], 10),
        ftAway: parseInt(m[4], 10),
        htHome: m[5] ? parseInt(m[5], 10) : null,
        htAway: m[6] ? parseInt(m[6], 10) : null,
      });
    }
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
  const { key: season } = currentSeason();
  const startYear = parseInt(season.slice(0, 4), 10);
  const { aliases } = readJson<AliasFile>(path.join(CANONICAL, "opponent-aliases.json"));
  const sf = loadSeasonFile(season);
  const known = new Set(sf.matches.map((m) => m.id));
  let added = 0;

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

    for (const f of parseOpenfootball(text, startYear)) {
      const isHome = MU_NAMES.includes(f.home);
      const isAway = MU_NAMES.includes(f.away);
      if (!isHome && !isAway) continue;
      if (f.date > new Date().toISOString().slice(0, 10)) continue; // fixture, not result
      const oppName = isHome ? f.away : f.home;
      const oppId = opponentIdFor(oppName, aliases);
      const venue: Venue = isHome ? "H" : "A";
      const id = matchId(f.date, oppId, venue);
      if (known.has(id)) continue;
      const gf = isHome ? f.ftHome : f.ftAway;
      const ga = isHome ? f.ftAway : f.ftHome;
      const ht: [number, number] | null =
        f.htHome != null && f.htAway != null
          ? (isHome ? [f.htHome, f.htAway!] : [f.htAway!, f.htHome])
          : null;
      const match: Match = {
        id,
        date: f.date,
        competition: src.competition,
        round: null,
        opponent: oppName.replace(/\s+(FC|AFC)$/, "").replace(/^AFC\s+/, "AFC "),
        opponentId: oppId,
        venue,
        stadium: null,
        attendance: null,
        score: { ft: [gf, ga], ht },
        sources: ["openfootball"],
      };
      sf.matches.push(match);
      known.add(id);
      added++;
      console.log(`+ ${f.date} ${isHome ? "v" : "@"} ${oppName} ${gf}-${ga} (${src.competition})`);
    }
  }

  if (added > 0) saveSeasonFile(sf);
  console.log(added > 0 ? `${added} new match(es) added to ${season}` : "no new matches");
  console.log(`NEW_MATCHES=${added}`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
