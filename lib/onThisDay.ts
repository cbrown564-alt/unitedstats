import { onThisDayRef } from "./citations";
import { getDb } from "./db";

interface OnThisDayMatch {
  id: string;
  date: string;
  year: string;
  season: string;
  opponent: string;
  opponentId: string;
  venue: "H" | "A" | "N";
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
  fallback: string | null;
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
              c.name AS competition_name, c.type AS competition_type, m.round
       FROM matches m
       JOIN competitions c ON c.id = m.competition_id
       WHERE substr(m.date, 6, 5) = ?
       ORDER BY m.date, m.id`,
    )
    .all(monthDay) as Row[];

  if (rows.length === 0) {
    return { ...base, lead: null, rest: [], rhythm: null, fallback: `No official United match is recorded on ${monthDayLabel(monthDay)}.` };
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

  return { ...base, lead, rest, rhythm, fallback: null };
}
