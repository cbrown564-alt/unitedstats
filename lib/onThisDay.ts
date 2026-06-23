import { onThisDayRef } from "./citations";
import { fmtDateLong } from "./format";
import { getDb } from "./db";

interface OnThisDayFact {
  id: string;
  date: string;
  season: string;
  opponent: string;
  score: string;
  result: "W" | "D" | "L";
  competition: string;
  evidencePath: string;
  text: string;
}

export interface OnThisDayEntry {
  monthDay: string;
  ref: ReturnType<typeof onThisDayRef>;
  facts: OnThisDayFact[];
  fallback: string | null;
}

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

function isMonthDayKey(value: string): boolean {
  return monthDayKeys().includes(value);
}

export function onThisDay(monthDay: string): OnThisDayEntry {
  if (!isMonthDayKey(monthDay)) throw new Error(`invalid month/day key: ${monthDay}`);
  const rows = getDb()
    .prepare(
      `SELECT m.id, m.date, m.season, m.opponent_name, m.gf, m.ga, m.result, c.name AS competition_name
       FROM matches m
       JOIN competitions c ON c.id = m.competition_id
       WHERE substr(m.date, 6, 5) = ?
       ORDER BY m.date, m.id`,
    )
    .all(monthDay) as {
      id: string;
      date: string;
      season: string;
      opponent_name: string;
      gf: number;
      ga: number;
      result: "W" | "D" | "L";
      competition_name: string;
    }[];
  const facts = rows.slice(0, 8).map((row) => ({
    id: row.id,
    date: row.date,
    season: row.season,
    opponent: row.opponent_name,
    score: `${row.gf}-${row.ga}`,
    result: row.result,
    competition: row.competition_name,
    evidencePath: `/match/${row.id}`,
    text: `${fmtDateLong(row.date)}: United ${row.gf}-${row.ga} ${row.opponent_name}.`,
  }));
  return {
    monthDay,
    ref: onThisDayRef(monthDay),
    facts,
    fallback: facts.length === 0 ? `No official United match is recorded on ${monthDay}.` : null,
  };
}
