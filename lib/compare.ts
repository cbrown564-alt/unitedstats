import { getDb } from "./db";
import {
  CUP_WON_PREDICATE, managerById, managerHonours, playerById, playerSplitsBySeason,
} from "./queries";

/**
 * Side-by-side comparison on shared, coverage-aware metrics — player vs player,
 * manager vs manager, era vs era. Every builder returns the same {@link Comparison}
 * shape so one component renders all three modes, and each metric can carry its
 * own coverage caveat (assists before the curated lane, scorer-sparse early eras)
 * so a comparison never implies a fairer like-for-like than the record supports.
 *
 * Beyond the shared metrics, each mode carries a {@link CompareSignature}: the one
 * artifact from its own world that actually carries the story — a career-arc duel
 * for players, a trophy cabinet for managers, a league-finish skyline for eras.
 */

export type CompareMode = "players" | "managers" | "eras";

/** A curated head-to-head: a labelled fixture between two resolvable subjects. */
export interface CuratedDebate {
  label: string;
  /** Subject ids/keys that resolve exactly: player ids, manager ids, era keys. */
  a: string;
  b: string;
  hook: string;
}

/**
 * Curated head-to-heads per mode — the "great debates". The /compare empty state
 * leads with these rather than a blank form, and the /explore discovery home pulls
 * its Compare launcher from the same list, so the two surfaces never drift. Every
 * id/key resolves exactly (players by canonical id, managers by id, eras by
 * ERA_CATALOGUE key), so a suggestion is never a dead end.
 */
export const CURATED_DEBATES: Record<CompareMode, CuratedDebate[]> = {
  players: [
    { label: "Rooney vs Charlton", a: "wayne-rooney", b: "bobby-charlton", hook: "The two men at the top of the all-time scoring charts." },
    { label: "Ronaldo vs Best", a: "cristiano-ronaldo", b: "george-best", hook: "Two No. 7s, two icons — a generation apart." },
    { label: "Giggs vs Scholes", a: "ryan-giggs", b: "paul-scholes", hook: "The academy spine that ran through every Ferguson side." },
    { label: "Cantona vs Van Persie", a: "eric-cantona", b: "robin-van-persie", hook: "Two imports who arrived and tilted a title race." },
  ],
  managers: [
    { label: "Ferguson vs Busby", a: "alex-ferguson", b: "matt-busby", hook: "The two architects, a quarter-century each in charge." },
    { label: "Ferguson vs Mourinho", a: "alex-ferguson", b: "jose-mourinho", hook: "A 27-year reign against a stormy three." },
    { label: "Busby vs Mangnall", a: "matt-busby", b: "ernest-mangnall", hook: "The club's first two dynasty-builders." },
  ],
  eras: [
    { label: "Busby era vs Ferguson era", a: "busby", b: "ferguson", hook: "The two golden ages, side by side." },
    { label: "1990s vs 2010s", a: "1990s", b: "2010s", hook: "The title machine against the post-Ferguson rebuild." },
    { label: "1950s vs 2000s", a: "1950s", b: "2000s", hook: "The Busby Babes against the Ronaldo-era champions." },
  ],
};

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

// ---- signatures: the per-mode hero visualisation -------------------------

/** One season of a player's United career, indexed from their first (n = 1). */
export interface CareerSeason {
  n: number;
  season: string;
  goals: number;
  apps: number;
}

/** A trophy count for one competition category (only categories actually won). */
interface TrophyCategory {
  key: string;
  label: string;
  n: number;
}

export interface TrophyHaul {
  total: number;
  categories: TrophyCategory[];
}

/** A season's top-flight league finish (or a lower-tier season, topFlight=false). */
export interface EraFinish {
  season: string;
  position: number | null;
  topFlight: boolean;
  champion: boolean;
}

export type CompareSignature =
  | { kind: "career"; a: CareerSeason[]; b: CareerSeason[] }
  | { kind: "trophies"; a: TrophyHaul; b: TrophyHaul }
  | { kind: "skyline"; a: EraFinish[]; b: EraFinish[] };

export interface Comparison {
  mode: CompareMode;
  a: CompareSide;
  b: CompareSide;
  metrics: CompareMetric[];
  /** The mode's hero artifact. */
  signature?: CompareSignature;
  /** One-line plain-language verdict, leading with the most dramatic difference. */
  headline?: string;
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
  const arc = (id: string): CareerSeason[] =>
    playerSplitsBySeason(id).map((s, i) => ({ n: i + 1, season: s.season, goals: s.goals, apps: s.apps }));

  const aArc = arc(a.player_id);
  const bArc = arc(b.player_id);

  const goalLeader = a.goals === b.goals ? null : a.goals > b.goals ? a : b;
  const headline = goalLeader
    ? `${goalLeader.name} out-scored ${(goalLeader === a ? b : a).name} ${Math.max(a.goals, b.goals)}–${Math.min(a.goals, b.goals)}.`
    : `${a.name} and ${b.name} are level on goals — ${a.goals} apiece.`;

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
    signature: aArc.length || bArc.length ? { kind: "career", a: aArc, b: bArc } : undefined,
    headline,
    coverage:
      "Appearances and goals are the official club record (Wikipedia's List of Manchester United F.C. players); the career graph plots match-attributed goals per season, so its totals can sit just under the official figure where early matches are unrecorded. Assists combine the curated lane with match events, so the two careers are only fully like-for-like from 2012-13 on.",
    evidence: [
      { label: `${a.name}'s matches →`, href: `/player/${a.player_id}` },
      { label: `${b.name}'s matches →`, href: `/player/${b.player_id}` },
    ],
  };
}

// ----------------------------------------------------------------- managers

/** Display order + labels for trophy categories. */
const TROPHY_CATS: { key: string; label: string }[] = [
  { key: "league", label: "League titles" },
  { key: "european", label: "European" },
  { key: "domestic-cup", label: "FA Cup" },
  { key: "league-cup", label: "League Cup" },
  { key: "super-cup", label: "Shields & Super Cups" },
  { key: "world", label: "World" },
];

function buildHaul(rows: { cat: string; n: number }[]): TrophyHaul {
  const byKey = new Map(rows.map((r) => [r.cat, r.n]));
  const categories = TROPHY_CATS.map((c) => ({ key: c.key, label: c.label, n: byKey.get(c.key) ?? 0 })).filter(
    (c) => c.n > 0,
  );
  return { total: categories.reduce((s, c) => s + c.n, 0), categories };
}

/** Trophies a manager won, split by competition category. League titles attribute
 *  to whoever managed the last league match of the title season; cups to the
 *  winning-final manager (the shared {@link CUP_WON_PREDICATE}). */
function managerTrophies(id: string): TrophyHaul {
  const rows = getDb()
    .prepare(
      `WITH honours AS (
         SELECT 'league' cat,
                (SELECT m.manager_id FROM matches m JOIN competitions lc ON lc.id = m.competition_id
                 WHERE lc.type = 'league' AND m.season = ss.season ORDER BY m.date DESC LIMIT 1) manager_id
         FROM season_summaries ss JOIN competitions c ON c.id = ss.competition_id
         WHERE c.type = 'league' AND ss.position = 1 AND c.name IN ('First Division','Premier League')
         UNION ALL
         SELECT c.type cat, m.manager_id
         FROM matches m JOIN competitions c ON c.id = m.competition_id
         WHERE ${CUP_WON_PREDICATE}
       )
       SELECT cat, COUNT(*) n FROM honours WHERE manager_id = ? GROUP BY cat`,
    )
    .all(id) as { cat: string; n: number }[];
  return buildHaul(rows);
}

/** Trophies per manager (league titles + cups won), summed from {@link managerHonours}. */
function trophyCounts(): Map<string, number> {
  const out = new Map<string, number>();
  for (const h of managerHonours()) out.set(h.manager_id, (out.get(h.manager_id) ?? 0) + h.n);
  return out;
}

/** A trophy-led verdict: the silverware gap as a multiple, the most evocative cut. */
function trophyHeadline(
  aLabel: string,
  bLabel: string,
  aTot: number,
  bTot: number,
  aWin: number | null,
  bWin: number | null,
): string {
  const [hi, lo, hiName] = aTot >= bTot ? [aTot, bTot, aLabel] : [bTot, aTot, bLabel];
  if (hi === 0) {
    const [wHi, wLo, wName] = (aWin ?? 0) >= (bWin ?? 0) ? [aWin ?? 0, bWin ?? 0, aLabel] : [bWin ?? 0, aWin ?? 0, bLabel];
    return `Neither lifted a trophy here — ${wName} edges it on win rate, ${wHi.toFixed(1)}% to ${wLo.toFixed(1)}%.`;
  }
  if (lo === 0) return `${hiName} won every trophy between them — ${hi} to none.`;
  const ratio = hi / lo;
  return ratio >= 1.15
    ? `${hiName} won ${ratio.toFixed(1)}× the silverware — ${hi} trophies to ${lo}.`
    : `${hiName} shades the silverware, ${hi} trophies to ${lo}.`;
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

  const aTot = trophies.get(a.id) ?? 0;
  const bTot = trophies.get(b.id) ?? 0;

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
      { label: "Trophies", a: aTot, b: bTot, fmt: "int", better: "higher" },
    ],
    signature: { kind: "trophies", a: managerTrophies(a.id), b: managerTrophies(b.id) },
    headline: trophyHeadline(a.name, b.name, aTot, bTot, winPct(a), winPct(b)),
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

/** Aggregate official-match record for an era's date span. */
function eraRecord(era: EraDef): EraRecord {
  const db = getDb();
  return db
    .prepare(
      `SELECT COUNT(*) p, COALESCE(SUM(result='W'),0) w, COALESCE(SUM(result='D'),0) d,
              COALESCE(SUM(result='L'),0) l, COALESCE(SUM(gf),0) gf, COALESCE(SUM(ga),0) ga
       FROM matches m JOIN competitions c ON c.id = m.competition_id
       WHERE c.type != 'unofficial' AND m.date >= ? AND m.date < ?`,
    )
    .get(`${era.from}-01-01`, `${era.to}-01-01`) as EraRecord;
}

/** Trophies won within an era's span, split by competition category. */
function eraTrophies(era: EraDef): TrophyHaul {
  const rows = getDb()
    .prepare(
      `WITH honours AS (
         SELECT 'league' cat,
                (SELECT MAX(m.date) FROM matches m WHERE m.season = ss.season AND m.competition_id = ss.competition_id) date
         FROM season_summaries ss JOIN competitions c ON c.id = ss.competition_id
         WHERE c.type = 'league' AND ss.position = 1 AND c.name IN ('First Division','Premier League')
         UNION ALL
         SELECT c.type cat, m.date FROM matches m JOIN competitions c ON c.id = m.competition_id WHERE ${CUP_WON_PREDICATE}
       )
       SELECT cat, COUNT(*) n FROM honours WHERE date >= ? AND date < ? GROUP BY cat`,
    )
    .all(`${era.from}-01-01`, `${era.to}-01-01`) as { cat: string; n: number }[];
  return buildHaul(rows);
}

/** Season-by-season league finish across an era (top-flight on the main scale,
 *  lower divisions flagged) — the raw material for the finish skyline. */
function eraFinishes(era: EraDef): EraFinish[] {
  const rows = getDb()
    .prepare(
      `SELECT ss.season, ss.position, c.name
       FROM season_summaries ss JOIN competitions c ON c.id = ss.competition_id
       WHERE c.type = 'league'
         AND CAST(substr(ss.season,1,4) AS INTEGER) >= ? AND CAST(substr(ss.season,1,4) AS INTEGER) < ?
       ORDER BY ss.season`,
    )
    .all(era.from, era.to) as { season: string; position: number | null; name: string }[];
  return rows.map((r) => {
    const topFlight = r.name === "First Division" || r.name === "Premier League";
    return { season: r.season, position: r.position, topFlight, champion: topFlight && r.position === 1 };
  });
}

export function compareEras(keyA: string, keyB: string): Comparison | null {
  const eraA = eraByKey(keyA);
  const eraB = eraByKey(keyB);
  if (!eraA || !eraB || eraA.key === eraB.key) return null;

  const ra = eraRecord(eraA);
  const rb = eraRecord(eraB);
  const haulA = eraTrophies(eraA);
  const haulB = eraTrophies(eraB);
  const winPct = (r: EraRecord): number | null => (r.p > 0 ? (100 * r.w) / r.p : null);
  const ppg = (r: EraRecord): number | null => (r.p > 0 ? (3 * r.w + r.d) / r.p : null);
  const per = (n: number, p: number): number | null => (p > 0 ? n / p : null);
  const hrefFor = (era: EraDef): string => `/matches?from=${era.from}&to=${era.to - 1}&sort=oldest`;
  const shortLabel = (era: EraDef): string => era.label.replace(/\s*\(.*\)$/, "");

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
      { label: "Trophies", a: haulA.total, b: haulB.total, fmt: "int", better: "higher" },
    ],
    signature: { kind: "skyline", a: eraFinishes(eraA), b: eraFinishes(eraB) },
    headline: trophyHeadline(shortLabel(eraA), shortLabel(eraB), haulA.total, haulB.total, winPct(ra), winPct(rb)),
    coverage:
      "Official matches only (friendlies and wartime excluded). Eras are bounded by the calendar year of the appointment, so a few matches around a handover fall to the adjacent era; the skyline shows top-flight league finishes (lower-division seasons sit below the line); points per game restates older eras in three-points terms.",
    evidence: [
      { label: `${eraA.label} matches →`, href: hrefFor(eraA) },
      { label: `${eraB.label} matches →`, href: hrefFor(eraB) },
    ],
  };
}
