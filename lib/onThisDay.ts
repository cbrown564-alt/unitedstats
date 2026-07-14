import { onThisDayRef } from "./citations";
import { CURATED_NIGHTS } from "./curatedNights";
import { getDb } from "./db";

interface OnThisDayMatch {
  id: string;
  date: string;
  year: string;
  season: string;
  opponent: string;
  opponentId: string;
  venue: "H" | "A" | "N";
  stadium: string | null;
  gf: number;
  ga: number;
  margin: number;
  scoreline: string;
  result: "W" | "D" | "L";
  competition: string;
  competitionType: string;
  round: string | null;
  evidencePath: string;
  /** Why this match leads the date — set only on the lead. */
  note: string | null;
}

type CalendarMoment =
  | { kind: "match"; label: "On this day"; evidencePath: string; match: OnThisDayMatch }
  | {
      kind: "transfer";
      label: "Transfer on this day";
      evidencePath: string;
      date: string;
      year: string;
      playerId: string | null;
      playerName: string;
      direction: "in" | "out";
      club: string | null;
      season: string | null;
    }
  | {
      kind: "debut";
      label: "Debut on this day";
      evidencePath: string;
      date: string;
      year: string;
      playerId: string;
      playerName: string;
      opponent: string;
    }
  | {
      kind: "nearby-match";
      label: "Nearby anniversary";
      evidencePath: string;
      requestedMonthDay: string;
      actualMonthDay: string;
      distanceDays: number;
      match: OnThisDayMatch;
    };

interface OnThisDayRhythm {
  played: number;
  w: number;
  d: number;
  l: number;
  winRate: number;
  firstYear: string;
  lastYear: string;
  biggestWin: OnThisDayMatch | null;
  topOpponent: { name: string; id: string; count: number } | null;
}

export interface OnThisDayEntry {
  monthDay: string;
  label: string;
  ref: ReturnType<typeof onThisDayRef>;
  lead: OnThisDayMatch | null;
  /** Every other match on the date, most recent first. */
  rest: OnThisDayMatch[];
  rhythm: OnThisDayRhythm | null;
  prev: string;
  next: string;
  moment: CalendarMoment;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function monthDayKeys(): string[] {
  const keys: string[] = [];
  for (let month = 1; month <= 12; month++) {
    const days = new Date(Date.UTC(2024, month, 0)).getUTCDate();
    for (let day = 1; day <= days; day++) {
      keys.push(`${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`);
    }
  }
  return keys;
}

export function monthDayLabel(monthDay: string): string {
  const [month, day] = monthDay.split("-").map(Number);
  return `${day} ${MONTHS[month - 1]}`;
}

function isMonthDayKey(value: string): boolean {
  return monthDayKeys().includes(value);
}

function adjacent(monthDay: string): { prev: string; next: string } {
  const keys = monthDayKeys();
  const i = keys.indexOf(monthDay);
  return {
    prev: keys[(i - 1 + keys.length) % keys.length],
    next: keys[(i + 1) % keys.length],
  };
}

interface Row {
  id: string;
  date: string;
  season: string;
  opponent_id: string;
  opponent_name: string;
  venue: "H" | "A" | "N";
  stadium_name: string | null;
  gf: number;
  ga: number;
  result: "W" | "D" | "L";
  competition_name: string;
  competition_type: string;
  round: string | null;
}

function toMatch(row: Row): OnThisDayMatch {
  return {
    id: row.id,
    date: row.date,
    year: row.date.slice(0, 4),
    season: row.season,
    opponent: row.opponent_name,
    opponentId: row.opponent_id,
    venue: row.venue,
    stadium: row.stadium_name,
    gf: row.gf,
    ga: row.ga,
    margin: row.gf - row.ga,
    scoreline: `United ${row.gf}-${row.ga} ${row.opponent_name}`,
    result: row.result,
    competition: row.competition_name,
    competitionType: row.competition_type,
    round: row.round,
    evidencePath: `/match/${row.id}`,
    note: null,
  };
}

function isFinal(round: string | null): boolean {
  return !!round && /final/i.test(round) && !/semi|quarter/i.test(round);
}

/** Deterministic editorial weight: silverware rounds, then prestige competition,
 *  then margin, then recency. Picks the one match worth leading the date with. */
function significance(m: OnThisDayMatch): number {
  let score = 0;
  const round = (m.round ?? "").toLowerCase();
  if (isFinal(m.round)) score += 1000;
  else if (/semi/.test(round)) score += 500;
  else if (/quarter/.test(round)) score += 250;
  if (m.competitionType === "european" || m.competitionType === "world") score += 220;
  else if (m.competitionType === "super-cup") score += 120;
  score += Math.abs(m.margin) * 8;
  if (m.result === "W") score += 20;
  score += Number(m.year) / 10000; // recency tiebreak
  return score;
}

interface TransferMomentRow {
  id: string;
  player_id: string | null;
  player_name: string;
  direction: "in" | "out";
  date: string;
  season: string | null;
  club: string | null;
}

/**
 * Exact-date transfer tie-break: arrivals before departures, permanent before
 * other move types, then the highest recorded fee, newest year, and stable id.
 */
function transferMoment(monthDay: string): CalendarMoment | null {
  const row = getDb()
    .prepare(
      `SELECT id, player_id, player_name, direction, date, season, club
       FROM transfers
       WHERE date_precision = 'day' AND substr(date, 6, 5) = ?
       ORDER BY direction = 'in' DESC,
                type = 'permanent' DESC,
                COALESCE(fee_gbp, 0) DESC,
                date DESC,
                id
       LIMIT 1`,
    )
    .get(monthDay) as TransferMomentRow | undefined;
  if (!row) return null;
  return {
    kind: "transfer",
    label: "Transfer on this day",
    evidencePath: row.season ? `/transfers#txseason-${row.season}` : "/transfers",
    date: row.date,
    year: row.date.slice(0, 4),
    playerId: row.player_id,
    playerName: row.player_name,
    direction: row.direction,
    club: row.club,
    season: row.season,
  };
}

interface DebutMomentRow {
  player_id: string;
  player_name: string;
  match_id: string;
  date: string;
  opponent_name: string;
  apps: number;
}

/**
 * First recorded competitive appearance, with higher-volume careers first and
 * a stable id tie-break. The current data model derives every debut from a match,
 * so match-first selection normally consumes this date before this fallback.
 */
function debutMoment(monthDay: string): CalendarMoment | null {
  const row = getDb()
    .prepare(
      `SELECT l.player_id, COALESCE(p.name, l.player_name) player_name,
              m.id match_id, m.date, m.opponent_name, COALESCE(pr.apps, 0) apps
       FROM match_lineups l
       JOIN matches m ON m.id = l.match_id
       LEFT JOIN players p ON p.id = l.player_id
       LEFT JOIN player_records pr ON pr.player_id = l.player_id
       WHERE l.player_side = 'united' AND l.bench = 0 AND l.player_id IS NOT NULL
         AND substr(m.date, 6, 5) = ?
         AND m.date = (
           SELECT MIN(m2.date)
           FROM match_lineups l2
           JOIN matches m2 ON m2.id = l2.match_id
           WHERE l2.player_id = l.player_id AND l2.player_side = 'united' AND l2.bench = 0
         )
       ORDER BY apps DESC, m.date DESC, l.player_id
       LIMIT 1`,
    )
    .get(monthDay) as DebutMomentRow | undefined;
  if (!row) return null;
  return {
    kind: "debut",
    label: "Debut on this day",
    evidencePath: `/match/${row.match_id}`,
    date: row.date,
    year: row.date.slice(0, 4),
    playerId: row.player_id,
    playerName: row.player_name,
    opponent: row.opponent_name,
  };
}

function ordinal(monthDay: string): number {
  const [month, day] = monthDay.split("-").map(Number);
  return Math.floor((Date.UTC(2024, month - 1, day) - Date.UTC(2024, 0, 1)) / 86_400_000);
}

function nearbyMoment(monthDay: string): CalendarMoment {
  const requested = ordinal(monthDay);
  const curatedOrder = new Map(CURATED_NIGHTS.map((night, index) => [night.id, index]));
  const placeholders = CURATED_NIGHTS.map(() => "?").join(",");
  const rows = getDb()
    .prepare(
      `SELECT m.id, m.date, m.season, m.opponent_id, m.opponent_name, m.venue, m.gf, m.ga, m.result,
              c.name AS competition_name, c.type AS competition_type, m.round,
              s.name AS stadium_name
       FROM matches m
       JOIN competitions c ON c.id = m.competition_id
       LEFT JOIN stadiums s ON s.id = m.stadium_id
       WHERE m.id IN (${placeholders})`,
    )
    .all(...CURATED_NIGHTS.map((night) => night.id)) as Row[];
  const ranked = rows
    .map((row) => {
      const actualMonthDay = row.date.slice(5);
      const direct = Math.abs(requested - ordinal(actualMonthDay));
      return {
        row,
        actualMonthDay,
        distanceDays: Math.min(direct, 366 - direct),
        order: curatedOrder.get(row.id) ?? Number.MAX_SAFE_INTEGER,
      };
    })
    .sort((a, b) => a.distanceDays - b.distanceDays || a.order - b.order || a.row.id.localeCompare(b.row.id));
  const pick = ranked[0];
  if (!pick) throw new Error("nearby calendar fallback has no curated matches");
  const match = toMatch(pick.row);
  return {
    kind: "nearby-match",
    label: "Nearby anniversary",
    evidencePath: match.evidencePath,
    requestedMonthDay: monthDay,
    actualMonthDay: pick.actualMonthDay,
    distanceDays: pick.distanceDays,
    match,
  };
}

export function onThisDay(monthDay: string): OnThisDayEntry {
  if (!isMonthDayKey(monthDay)) throw new Error(`invalid month/day key: ${monthDay}`);
  const { prev, next } = adjacent(monthDay);
  const base = {
    monthDay,
    label: monthDayLabel(monthDay),
    ref: onThisDayRef(monthDay),
    prev,
    next,
  };

  const rows = getDb()
    .prepare(
      `SELECT m.id, m.date, m.season, m.opponent_id, m.opponent_name, m.venue, m.gf, m.ga, m.result,
              c.name AS competition_name, c.type AS competition_type, m.round,
              s.name AS stadium_name
       FROM matches m
       JOIN competitions c ON c.id = m.competition_id
       LEFT JOIN stadiums s ON s.id = m.stadium_id
       WHERE substr(m.date, 6, 5) = ?
       ORDER BY m.date, m.id`,
    )
    .all(monthDay) as Row[];

  if (rows.length === 0) {
    const moment = transferMoment(monthDay) ?? debutMoment(monthDay) ?? nearbyMoment(monthDay);
    return { ...base, lead: null, rest: [], rhythm: null, moment };
  }

  const matches = rows.map(toMatch);

  // Rhythm across every year on this date.
  const w = matches.filter((m) => m.result === "W").length;
  const d = matches.filter((m) => m.result === "D").length;
  const l = matches.filter((m) => m.result === "L").length;
  const wins = matches.filter((m) => m.result === "W");
  const biggestWin = wins.length
    ? wins.reduce((best, m) => (m.margin > best.margin || (m.margin === best.margin && m.date > best.date) ? m : best))
    : null;

  const oppCounts = new Map<string, { name: string; id: string; count: number }>();
  for (const m of matches) {
    const cur = oppCounts.get(m.opponentId) ?? { name: m.opponent, id: m.opponentId, count: 0 };
    cur.count += 1;
    oppCounts.set(m.opponentId, cur);
  }
  const mostFaced = [...oppCounts.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))[0];

  const rhythm: OnThisDayRhythm = {
    played: matches.length,
    w,
    d,
    l,
    winRate: Math.round((100 * w) / matches.length),
    firstYear: matches[0].year,
    lastYear: matches[matches.length - 1].year,
    biggestWin,
    topOpponent: mostFaced && mostFaced.count >= 2 ? mostFaced : null,
  };

  // The lead: the single most significant match. The note surfaces the reason it
  // leads *only* when the competition chip doesn't already (finals/semis show their
  // round there) — so it adds, never repeats.
  const lead = matches.reduce((best, m) => (significance(m) > significance(best) ? m : best));
  const mostRecent = matches[matches.length - 1];
  lead.note =
    biggestWin && lead.id === biggestWin.id && lead.margin >= 3
      ? "United's biggest win on this date"
      : lead.id === mostRecent.id && matches.length > 1
        ? "United's most recent match on this date"
        : null;

  const rest = matches.filter((m) => m.id !== lead.id).sort((a, b) => b.date.localeCompare(a.date));

  return {
    ...base,
    lead,
    rest,
    rhythm,
    moment: { kind: "match", label: "On this day", evidencePath: lead.evidencePath, match: lead },
  };
}
