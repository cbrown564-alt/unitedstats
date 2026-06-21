import { getDb } from "./db";
import {
  CUP_WON_PREDICATE, managerById, managerHonours, playerById,
} from "./queries";

/**
 * Side-by-side comparison on shared, coverage-aware metrics — player vs player,
 * manager vs manager, era vs era. Every builder returns the same {@link Comparison}
 * shape so one component renders all three modes, and each metric can carry its
 * own coverage caveat (assists before the curated lane, scorer-sparse early eras)
 * so a comparison never implies a fairer like-for-like than the record supports.
 */

export type CompareMode = "players" | "managers" | "eras";

export interface CompareSide {
  id: string;
  label: string;
  /** Career span / era years / tenure — secondary identity line. */
  sublabel?: string;
  href?: string;
  thumb?: string | null;
}

export interface CompareMetric {
  label: string;
  a: number | null;
  b: number | null;
  fmt: "int" | "pct" | "dec2";
  /** Direction of "leads" for the highlight; omit for a neutral, un-judged metric. */
  better?: "higher" | "lower";
  /** Per-metric coverage caveat, surfaced under the label. */
  note?: string;
}

export interface Comparison {
  mode: CompareMode;
  a: CompareSide;
  b: CompareSide;
  metrics: CompareMetric[];
  /** Module-level coverage note. */
  coverage?: string;
  /** Evidence links — "the matches behind each side". */
  evidence?: { label: string; href: string }[];
}

// ----------------------------------------------------------------- players

export function comparePlayers(idA: string, idB: string): Comparison | null {
  const a = playerById(idA);
  const b = playerById(idB);
  if (!a || !b || a.player_id === b.player_id) return null;

  const span = (p: typeof a): string =>
    p.career ?? (p.first_year && p.last_year ? `${p.first_year}–${p.last_year}` : "");
  const perApp = (goals: number, apps: number): number | null => (apps > 0 ? goals / apps : null);

  return {
    mode: "players",
    a: { id: a.player_id, label: a.name, sublabel: span(a), href: `/player/${a.player_id}`, thumb: a.player_thumb_url ?? a.player_image_url },
    b: { id: b.player_id, label: b.name, sublabel: span(b), href: `/player/${b.player_id}`, thumb: b.player_thumb_url ?? b.player_image_url },
    metrics: [
      { label: "Appearances", a: a.apps, b: b.apps, fmt: "int", better: "higher" },
      { label: "Goals", a: a.goals, b: b.goals, fmt: "int", better: "higher" },
      { label: "Goals per appearance", a: perApp(a.goals, a.apps), b: perApp(b.goals, b.apps), fmt: "dec2", better: "higher" },
      {
        label: "Assists", a: a.assists, b: b.assists, fmt: "int", better: "higher",
        note: "Curated 1987-88–2014-15 lane plus match events after; assists before 1987-88 are unrecorded.",
      },
    ],
    coverage:
      "Appearances and goals are the official club record (Wikipedia's List of Manchester United F.C. players). Assists combine the curated lane with match events, so the two careers are only fully like-for-like from 2012-13 on.",
    evidence: [
      { label: `${a.name}'s matches →`, href: `/player/${a.player_id}` },
      { label: `${b.name}'s matches →`, href: `/player/${b.player_id}` },
    ],
  };
}

// ----------------------------------------------------------------- managers

/** Trophies per manager (league titles + cups won), summed from {@link managerHonours}. */
function trophyCounts(): Map<string, number> {
  const out = new Map<string, number>();
  for (const h of managerHonours()) out.set(h.manager_id, (out.get(h.manager_id) ?? 0) + h.n);
  return out;
}

export function compareManagers(idA: string, idB: string): Comparison | null {
  const a = managerById(idA);
  const b = managerById(idB);
  if (!a || !b || a.id === b.id) return null;

  const trophies = trophyCounts();
  const ppg = (r: typeof a): number | null => (r.p > 0 ? (3 * r.w + r.d) / r.p : null);
  const winPct = (r: typeof a): number | null => (r.p > 0 ? (100 * r.w) / r.p : null);
  const per = (n: number, p: number): number | null => (p > 0 ? n / p : null);
  const span = (r: typeof a): string =>
    r.first && r.last ? `${r.first.slice(0, 4)}–${r.last.slice(0, 4)}` : "";

  return {
    mode: "managers",
    a: { id: a.id, label: a.name, sublabel: span(a), href: `/manager/${a.id}`, thumb: a.thumb_url ?? a.image_url },
    b: { id: b.id, label: b.name, sublabel: span(b), href: `/manager/${b.id}`, thumb: b.thumb_url ?? b.image_url },
    metrics: [
      { label: "Matches in charge", a: a.p, b: b.p, fmt: "int" },
      { label: "Win rate", a: winPct(a), b: winPct(b), fmt: "pct", better: "higher" },
      { label: "Points per game", a: ppg(a), b: ppg(b), fmt: "dec2", better: "higher", note: "Three points for a win applied across all eras, a modern convention." },
      { label: "Goals per game", a: per(a.gf, a.p), b: per(b.gf, b.p), fmt: "dec2", better: "higher" },
      { label: "Conceded per game", a: per(a.ga, a.p), b: per(b.ga, b.p), fmt: "dec2", better: "lower" },
      { label: "Trophies", a: trophies.get(a.id) ?? 0, b: trophies.get(b.id) ?? 0, fmt: "int", better: "higher" },
    ],
    coverage:
      "Records cover every competitive match. Points per game restates older eras in three-points-for-a-win terms; trophies count league titles and the cups whose deciding final was won.",
    evidence: [
      { label: `${a.name}'s matches →`, href: `/matches?manager=${a.id}` },
      { label: `${b.name}'s matches →`, href: `/matches?manager=${b.id}` },
    ],
  };
}

// ----------------------------------------------------------------- eras

export interface EraDef {
  key: string;
  label: string;
  /** Inclusive start year, exclusive end year (calendar years of the appointments). */
  from: number;
  to: number;
}

/**
 * Named eras bounded by the two longest reigns (Busby, Ferguson) — the same frame
 * as the managers index — plus every decade, so an era comparison can be the broad
 * historical sweep or a decade-on-decade cut. Boundaries are by calendar year of
 * the appointment, matching the managers-index reading aid.
 */
export const ERA_CATALOGUE: EraDef[] = [
  { key: "secretaries", label: "Secretary-managers (pre-1945)", from: 1886, to: 1945 },
  { key: "busby", label: "The Busby era (1945–1969)", from: 1945, to: 1969 },
  { key: "between", label: "Between Busby & Ferguson (1969–1986)", from: 1969, to: 1986 },
  { key: "ferguson", label: "The Ferguson era (1986–2013)", from: 1986, to: 2013 },
  { key: "after", label: "After Ferguson (2013–now)", from: 2013, to: 2100 },
  ...[1890, 1900, 1910, 1920, 1930, 1940, 1950, 1960, 1970, 1980, 1990, 2000, 2010, 2020].map((d) => ({
    key: `${d}s`,
    label: `The ${d}s`,
    from: d,
    to: d + 10,
  })),
];

function eraByKey(key: string): EraDef | undefined {
  return ERA_CATALOGUE.find((e) => e.key === key);
}

interface EraRecord {
  p: number;
  w: number;
  d: number;
  l: number;
  gf: number;
  ga: number;
}

/** Aggregate official-match record for an era's date span, plus trophies won in it. */
function eraRecord(era: EraDef): EraRecord & { trophies: number } {
  const db = getDb();
  const lo = `${era.from}-01-01`;
  const hi = `${era.to}-01-01`;
  const rec = db
    .prepare(
      `SELECT COUNT(*) p, COALESCE(SUM(result='W'),0) w, COALESCE(SUM(result='D'),0) d,
              COALESCE(SUM(result='L'),0) l, COALESCE(SUM(gf),0) gf, COALESCE(SUM(ga),0) ga
       FROM matches m JOIN competitions c ON c.id = m.competition_id
       WHERE c.type != 'unofficial' AND m.date >= ? AND m.date < ?`,
    )
    .get(lo, hi) as EraRecord;
  const trophies = (
    db
      .prepare(
        `WITH won AS (
           SELECT m.date FROM matches m
           JOIN competitions c ON c.id = m.competition_id
           JOIN season_summaries ss ON ss.season = m.season AND ss.competition_id = m.competition_id
           WHERE c.type = 'league' AND c.name IN ('First Division','Premier League') AND ss.position = 1
             AND m.date = (SELECT MAX(m2.date) FROM matches m2 WHERE m2.season = m.season AND m2.competition_id = m.competition_id)
           UNION ALL
           SELECT m.date FROM matches m JOIN competitions c ON c.id = m.competition_id WHERE ${CUP_WON_PREDICATE}
         )
         SELECT COUNT(*) n FROM won WHERE date >= ? AND date < ?`,
      )
      .get(lo, hi) as { n: number }
  ).n;
  return { ...rec, trophies };
}

export function compareEras(keyA: string, keyB: string): Comparison | null {
  const eraA = eraByKey(keyA);
  const eraB = eraByKey(keyB);
  if (!eraA || !eraB || eraA.key === eraB.key) return null;

  const ra = eraRecord(eraA);
  const rb = eraRecord(eraB);
  const winPct = (r: EraRecord): number | null => (r.p > 0 ? (100 * r.w) / r.p : null);
  const ppg = (r: EraRecord): number | null => (r.p > 0 ? (3 * r.w + r.d) / r.p : null);
  const per = (n: number, p: number): number | null => (p > 0 ? n / p : null);
  const hrefFor = (era: EraDef): string => `/matches?from=${era.from}&to=${era.to - 1}&sort=oldest`;

  return {
    mode: "eras",
    a: { id: eraA.key, label: eraA.label, sublabel: `${eraA.from}–${eraA.to === 2100 ? "now" : eraA.to}`, href: hrefFor(eraA) },
    b: { id: eraB.key, label: eraB.label, sublabel: `${eraB.from}–${eraB.to === 2100 ? "now" : eraB.to}`, href: hrefFor(eraB) },
    metrics: [
      { label: "Matches played", a: ra.p, b: rb.p, fmt: "int" },
      { label: "Win rate", a: winPct(ra), b: winPct(rb), fmt: "pct", better: "higher" },
      { label: "Points per game", a: ppg(ra), b: ppg(rb), fmt: "dec2", better: "higher", note: "Three points for a win applied across all eras." },
      { label: "Goals per game", a: per(ra.gf, ra.p), b: per(rb.gf, rb.p), fmt: "dec2", better: "higher" },
      { label: "Conceded per game", a: per(ra.ga, ra.p), b: per(rb.ga, rb.p), fmt: "dec2", better: "lower" },
      { label: "Trophies", a: ra.trophies, b: rb.trophies, fmt: "int", better: "higher" },
    ],
    coverage:
      "Official matches only (friendlies and wartime excluded). Eras are bounded by the calendar year of the appointment, so a few matches around a handover fall to the adjacent era; points per game restates older eras in three-points terms.",
    evidence: [
      { label: `${eraA.label} matches →`, href: hrefFor(eraA) },
      { label: `${eraB.label} matches →`, href: hrefFor(eraB) },
    ],
  };
}
