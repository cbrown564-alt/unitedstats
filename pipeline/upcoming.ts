/**
 * Schedule overlay from openfootball fixture text. Upcoming rows are not
 * results: they are overwritten each update and never enter matches/*.json.
 */
import { opponentIdFor, type Venue } from "../scripts/lib";

const MU_NAMES = new Set(["Manchester United FC", "Manchester United"]);

const MONTHS: Record<string, number> = {
  Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6,
  Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12,
};

const COMPETITION_NAMES: Record<string, string> = {
  "premier-league": "Premier League",
  "fa-cup": "FA Cup",
  "league-cup": "League Cup",
  "champions-league": "UEFA Champions League",
  "europa-league": "UEFA Europa League",
  "europa-conference-league": "UEFA Europa Conference League",
};

export interface ParsedScore {
  ft: [number, number];
  ht: [number, number] | null;
  aet: boolean;
  pens: [number, number] | null;
}

export interface OpenfootballLine {
  date: string;
  home: string;
  away: string;
  round: string | null;
  kickoff: string | null;
  score: ParsedScore | null;
}

export interface UpcomingFixture {
  date: string;
  competition: string;
  competitionName: string;
  round: string | null;
  opponent: string;
  opponentId: string;
  venue: Venue;
  kickoff: string | null;
}

export interface UpcomingOverlay {
  season: string;
  source: "openfootball";
  updatedAt: string;
  competitions: string[];
  fixtures: UpcomingFixture[];
}

export interface KnownResultKey {
  competition: string;
  opponentId: string;
  venue: Venue;
}

/**
 * Score grammar (home-team-first):
 *   "2-1 (1-0)"                          ft + ht
 *   "2-1"                                ft
 *   "1-1 a.e.t. (1-1, 0-0)"              aet; ft is the 120' score
 *   "6-7 pen. 0-0 a.e.t. (0-0)"          shootout; ft is the 120' score
 */
export function parseScore(s: string): ParsedScore | null {
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

const SCORE = String.raw`\d+-\d+(?:\s+pen\.\s+\d+-\d+\s+a\.e\.t\.|\s+a\.e\.t\.)?(?:\s+\(\d+-\d+[^)]*\))?`;
const KICKOFF = String.raw`(\d{1,2}[:.]\d{2})`;

/**
 * Parse openfootball fixture text, including rows that have no score yet.
 */
export function parseOpenfootballLines(text: string, seasonStartYear: number): OpenfootballLine[] {
  const fixtures: OpenfootballLine[] = [];
  let curDate: string | null = null;
  let curRound: string | null = null;
  const vScored = new RegExp(String.raw`^\s+(?:${KICKOFF}\s+)?(.+?)\s+v\s+(.+?)\s{2,}(${SCORE})\s*$`);
  const midScored = new RegExp(String.raw`^\s+(?:${KICKOFF}\s+)?(\S.*?)\s{2,}(${SCORE})\s{2,}(\S.*?)\s*$`);
  const vOpen = new RegExp(String.raw`^\s+(?:${KICKOFF}\s+)?(.+?)\s+v\s+(.+?)\s*$`);

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
      const year = dateMatch[3]
        ? parseInt(dateMatch[3], 10)
        : mon >= 8 ? seasonStartYear : seasonStartYear + 1;
      curDate = `${year}-${String(mon).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      continue;
    }
    if (!curDate) continue;

    const scoredV = line.match(vScored);
    if (scoredV) {
      const score = parseScore(scoredV[4].trim());
      if (score) {
        fixtures.push({
          date: curDate,
          home: scoredV[2].trim(),
          away: scoredV[3].trim(),
          round: curRound,
          kickoff: scoredV[1] ? scoredV[1].replace(".", ":") : null,
          score,
        });
      }
      continue;
    }

    const mid = line.match(midScored);
    if (mid) {
      const score = parseScore(mid[3].trim());
      if (score) {
        fixtures.push({
          date: curDate,
          home: mid[2].trim(),
          away: mid[4].trim(),
          round: curRound,
          kickoff: mid[1] ? mid[1].replace(".", ":") : null,
          score,
        });
      }
      continue;
    }

    const open = line.match(vOpen);
    if (open) {
      fixtures.push({
        date: curDate,
        home: open[2].trim(),
        away: open[3].trim(),
        round: curRound,
        kickoff: open[1] ? open[1].replace(".", ":") : null,
        score: null,
      });
    }
  }
  return fixtures;
}

/** Scored fixtures only — the result ingest contract. */
export function parseOpenfootball(text: string, seasonStartYear: number): (OpenfootballLine & ParsedScore)[] {
  return parseOpenfootballLines(text, seasonStartYear)
    .filter((f): f is OpenfootballLine & { score: ParsedScore } => f.score != null)
    .map((f) => ({ ...f, ...f.score }));
}

export interface UpcomingSource {
  competition: string;
  text: string;
}

export function buildUpcomingOverlay(input: {
  season: string;
  updatedAt: string;
  sources: UpcomingSource[];
  aliases: Record<string, string>;
  known: KnownResultKey[];
}): UpcomingOverlay {
  const startYear = parseInt(input.season.slice(0, 4), 10);
  const known = new Set(
    input.known.map((k) => `${k.competition}|${k.opponentId}|${k.venue}`),
  );
  const competitions: string[] = [];
  const fixtures: UpcomingFixture[] = [];

  for (const src of input.sources) {
    if (!competitions.includes(src.competition)) competitions.push(src.competition);
    const isCup = src.competition !== "premier-league";
    for (const line of parseOpenfootballLines(src.text, startYear)) {
      if (line.score) continue;
      const isHome = MU_NAMES.has(line.home);
      const isAway = MU_NAMES.has(line.away);
      if (!isHome && !isAway) continue;
      const rawOpp = isHome ? line.away : line.home;
      const oppName = rawOpp.replace(/\s+(FC|AFC)$/, "");
      const oppId = opponentIdFor(input.aliases[rawOpp] ? rawOpp : oppName, input.aliases);
      const neutral =
        isCup && (line.round === "Final" || (src.competition === "fa-cup" && line.round === "Semi-final"));
      const venue: Venue = neutral ? "N" : isHome ? "H" : "A";
      if (known.has(`${src.competition}|${oppId}|${venue}`)) continue;
      fixtures.push({
        date: line.date,
        competition: src.competition,
        competitionName: COMPETITION_NAMES[src.competition] ?? src.competition,
        round: isCup ? line.round : null,
        opponent: oppName,
        opponentId: oppId,
        venue,
        kickoff: line.kickoff,
      });
    }
  }

  fixtures.sort((a, b) => a.date.localeCompare(b.date) || a.opponentId.localeCompare(b.opponentId));
  return {
    season: input.season,
    source: "openfootball",
    updatedAt: input.updatedAt,
    competitions,
    fixtures,
  };
}

export function nextOpponent(overlay: UpcomingOverlay): UpcomingFixture | undefined {
  return overlay.fixtures[0];
}

export function upcomingVsOpponent(
  overlay: UpcomingOverlay,
  opponentId: string,
): UpcomingFixture | undefined {
  return overlay.fixtures.find((f) => f.opponentId === opponentId);
}
