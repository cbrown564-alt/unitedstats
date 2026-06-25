import { getDb } from "./db";
import { cachedQuery } from "./queryCache";
import { roundFilterPredicate, type RoundFilterKey } from "./matchRounds";

/** Reference indexes change only on deploy; prod DB is read-only — 5m is safe. */
const STATIC_REF_TTL_MS = 300_000;

export interface MatchRow {
  id: string;
  season: string;
  date: string;
  competition_id: string;
  competition_name: string;
  competition_type: string;
  round: string | null;
  opponent_id: string;
  opponent_name: string;
  venue: "H" | "A" | "N";
  stadium_id: string | null;
  stadium_name: string | null;
  attendance: number | null;
  gf: number;
  ga: number;
  ht_gf: number | null;
  ht_ga: number | null;
  aet: number;
  pen_gf: number | null;
  pen_ga: number | null;
  result: "W" | "D" | "L";
  outcome: "W" | "D" | "L";
  manager_id: string | null;
  manager_name: string | null;
  events_complete: number;
  has_lineup: number;
  notes: string | null;
}

export const MATCH_SELECT = `
  SELECT m.*, c.name AS competition_name, c.type AS competition_type, s.name AS stadium_name, mg.name AS manager_name
  FROM matches m
  JOIN competitions c ON c.id = m.competition_id
  LEFT JOIN stadiums s ON s.id = m.stadium_id
  LEFT JOIN managers mg ON mg.id = m.manager_id
`;

export function getMeta(): Record<string, string> {
  const rows = getDb().prepare("SELECT key, value FROM meta").all() as { key: string; value: string }[];
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}

export interface Record_ { p: number; w: number; d: number; l: number; gf: number; ga: number }

/**
 * Coalesced played/W/D/L/goals columns matching the `Record_` shape. `result`,
 * `gf`, and `ga` live only on `matches`, so this stays unambiguous across joins.
 * COALESCE keeps empty groups returning 0 rather than NULL.
 */
const RECORD_COLS = `COUNT(*) p,
  COALESCE(SUM(result='W'),0) w, COALESCE(SUM(result='D'),0) d, COALESCE(SUM(result='L'),0) l,
  COALESCE(SUM(gf),0) gf, COALESCE(SUM(ga),0) ga`;

export function allTimeRecord(): Record_ {
  return getDb()
    .prepare(`SELECT ${RECORD_COLS} FROM matches`)
    .get() as Record_;
}

export function recordByCompetitionType(): (Record_ & { type: string })[] {
  return getDb()
    .prepare(
      `SELECT c.type, ${RECORD_COLS}
       FROM matches m JOIN competitions c ON c.id = m.competition_id
       GROUP BY c.type ORDER BY p DESC`,
    )
    .all() as (Record_ & { type: string })[];
}

export function recentMatches(limit = 10): MatchRow[] {
  return getDb()
    .prepare(`${MATCH_SELECT} ORDER BY m.date DESC LIMIT ?`)
    .all(limit) as MatchRow[];
}

export function matchById(id: string): MatchRow | undefined {
  return getDb().prepare(`${MATCH_SELECT} WHERE m.id = ?`).get(id) as MatchRow | undefined;
}

/** Every match id, for build-time static generation of /match/[id]. */
export function allMatchIds(): string[] {
  return (getDb().prepare("SELECT id FROM matches").all() as { id: string }[]).map((r) => r.id);
}

export interface EventRow {
  seq: number;
  type: string;
  player_id: string | null;
  player_name: string | null;
  player_display_name: string | null;
  player_side: "united" | "opponent";
  player_provider_id: string | null;
  minute: number | null;
  added_time: number | null;
  assist_player_id: string | null;
  assist_name: string | null;
  assist_display_name: string | null;
  assist_side: "united" | "opponent" | null;
  assist_provider_id: string | null;
  detail: string | null;
}

export function eventsForMatch(matchId: string): EventRow[] {
  return getDb()
    .prepare(
      `SELECT e.seq, e.type, e.player_id, p.name AS player_name,
              COALESCE(p.name, e.player_name, e.detail) AS player_display_name,
              e.player_side, e.player_provider_id, e.minute, e.added_time,
              e.assist_player_id, ap.name AS assist_name,
              COALESCE(ap.name, e.assist_name) AS assist_display_name,
              e.assist_side, e.assist_provider_id, e.detail
       FROM match_events e
       LEFT JOIN players p ON p.id = e.player_id
       LEFT JOIN players ap ON ap.id = e.assist_player_id
       WHERE e.match_id = ? ORDER BY COALESCE(e.minute, 999), e.seq`,
    )
    .all(matchId) as EventRow[];
}

export interface LineupRow {
  player_id: string | null;
  player_name: string | null;
  player_display_name: string;
  player_side: "united" | "opponent";
  provider_id: string | null;
  shirt: number | null;
  role: string | null;
  /** GK/DEF/MID/FWD from the player's career position (Wikidata); used to place
   * a player on the pitch when the per-match role is missing. */
  career_band: string | null;
  started: number;
  bench: number;
  sub_on: number | null;
  sub_off: number | null;
}

export function lineupForMatch(matchId: string): LineupRow[] {
  return getDb()
    .prepare(
      `SELECT l.player_id, p.name AS player_name, COALESCE(p.name, l.player_name, l.provider_id) AS player_display_name,
              l.player_side, l.provider_id, l.shirt, l.role, pp.bucket AS career_band, l.started, l.bench, l.sub_on, l.sub_off
       FROM match_lineups l
       LEFT JOIN players p ON p.id = l.player_id
       LEFT JOIN player_positions pp ON pp.player_id = l.player_id
       WHERE l.match_id = ? ORDER BY l.player_side DESC, l.bench, l.started DESC, l.shirt, l.seq`,
    )
    .all(matchId) as LineupRow[];
}

export function eloForMatch(matchId: string):
  | { elo_pre: number; elo_post: number; opp_elo_pre: number; expected: number }
  | undefined {
  return getDb()
    .prepare("SELECT elo_pre, elo_post, opp_elo_pre, expected FROM elo_history WHERE match_id = ?")
    .get(matchId) as { elo_pre: number; elo_post: number; opp_elo_pre: number; expected: number } | undefined;
}

/** Head-to-head vs an opponent strictly before a date (for match context). */
export function h2hBefore(opponentId: string, date: string): Record_ {
  return getDb()
    .prepare(
      `SELECT ${RECORD_COLS} FROM matches WHERE opponent_id = ? AND date < ?`,
    )
    .get(opponentId, date) as Record_;
}

export function formBefore(date: string, n = 6): MatchRow[] {
  return getDb()
    .prepare(`${MATCH_SELECT} WHERE m.date < ? ORDER BY m.date DESC LIMIT ?`)
    .all(date, n) as MatchRow[];
}

// ---------------------------------------------------------------- seasons

export interface SeasonSummary {
  season: string;
  competition_id: string;
  competition_name: string;
  type: string;
  p: number; w: number; d: number; l: number; gf: number; ga: number;
  furthest_round: string | null;
  position: number | null;
  league_size: number | null;
}

export function seasonsIndex(): SeasonSummary[] {
  return getDb()
    .prepare(
      `SELECT ss.*, c.name AS competition_name, c.type
       FROM season_summaries ss JOIN competitions c ON c.id = ss.competition_id
       ORDER BY ss.season DESC, ss.p DESC`,
    )
    .all() as SeasonSummary[];
}

export interface LeagueStanding {
  position: number;
  team: string;
  p: number; w: number; d: number; l: number; gf: number; ga: number; pts: number;
  is_united: number;
  /** The club's head-to-head id, where it resolves to one United has faced. */
  opponent_id: string | null;
}

export interface SeasonLeagueTable {
  competition_id: string;
  competition_name: string;
  rows: LeagueStanding[];
}

/**
 * The full final league table United played in that season — every club, ranked
 * 1st to last — computed from the complete engsoccerdata results (see
 * {@link file://scripts/ingest/league-positions.ts}). Returns null for seasons
 * with no stored standings (a cup-only season, or the rare gap the sources lack).
 * The two-tier seasons (1893-94 Test Matches aside) only ever sat in one division,
 * so a season maps to a single league table.
 */
export function seasonLeagueTable(season: string): SeasonLeagueTable | null {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT position, team, p, w, d, l, gf, ga, pts, is_united, opponent_id
       FROM league_standings WHERE season = ? ORDER BY position`,
    )
    .all(season) as LeagueStanding[];
  if (rows.length === 0) return null;
  const comp = db
    .prepare(
      `SELECT ls.competition_id, c.name AS competition_name
       FROM league_standings ls JOIN competitions c ON c.id = ls.competition_id
       WHERE ls.season = ? LIMIT 1`,
    )
    .get(season) as { competition_id: string; competition_name: string };
  return { competition_id: comp.competition_id, competition_name: comp.competition_name, rows };
}

export interface SeasonCupResult {
  season: string;
  competition_id: string;
  /** 'W' | 'D' | 'L' — outcome of the deciding (last-dated) match. */
  last_outcome: string;
}

/**
 * The outcome of the *last* match each non-league competition reached per season.
 * The seasons index reads a cup verdict from this (won the final vs runners-up)
 * without loading every match; it mirrors the cups-won detection in
 * {@link decadeBriefs} and the season detail — the deciding match is the
 * latest-dated one of that competition that season.
 */
export function seasonCupLastResults(): SeasonCupResult[] {
  return getDb()
    .prepare(
      `SELECT m.season, m.competition_id, m.outcome AS last_outcome
       FROM matches m JOIN competitions c ON c.id = m.competition_id
       WHERE c.type <> 'league'
         AND m.date = (
           SELECT MAX(m2.date) FROM matches m2
           WHERE m2.season = m.season AND m2.competition_id = m.competition_id
         )`,
    )
    .all() as SeasonCupResult[];
}

export function seasonMatches(season: string): MatchRow[] {
  return getDb()
    .prepare(`${MATCH_SELECT} WHERE m.season = ? ORDER BY m.date`)
    .all(season) as MatchRow[];
}

export function allSeasons(): string[] {
  return cachedQuery("allSeasons", STATIC_REF_TTL_MS, () =>
    (
      getDb().prepare("SELECT DISTINCT season FROM matches ORDER BY season DESC").all() as {
        season: string;
      }[]
    ).map((r) => r.season),
  );
}

// ---------------------------------------------------------------- matches browser

export interface MatchFilter {
  competition?: string;
  opponent?: string;
  manager?: string;
  season?: string;
  venue?: string;
  result?: string;
  /** Competition type; "cup" matches every official cup competition. */
  type?: string;
  /** Knockout round stage — search-created only (see {@link matchRounds}). */
  round?: RoundFilterKey;
  /** A specific ground (stadiums.id), e.g. from a search result. */
  stadium?: string;
  /** A city — every ground in it (stadiums.city), e.g. "Madrid", "London". */
  city?: string;
  /** Matches where this United player scored. */
  scorer?: string;
  /** Matches where this United player assisted a recorded goal. */
  assister?: string;
  /** Matches where this United player appears in the lineup coverage. */
  player?: string;
  /** Matches that went to extra time. */
  aet?: boolean;
  /** Named window for recorded United goal events. */
  goalWindow?: "firstHalf" | "secondHalf" | "late" | "stoppage" | "extraTime";
  /** Inclusive minute bounds for recorded United goal events. */
  goalFrom?: number;
  goalTo?: number;
  /** Inclusive ISO date bounds, so era/decade aggregates can link to their matches. */
  from?: string;
  to?: string;
  q?: string;
  /** Result ordering. Defaults to newest date first. */
  sort?: "date-desc" | "date-asc" | "gd-desc" | "gd-asc";
  limit?: number;
  offset?: number;
}

const MATCH_ORDER: Record<NonNullable<MatchFilter["sort"]>, string> = {
  "date-desc": "m.date DESC",
  "date-asc": "m.date ASC",
  "gd-desc": "(m.gf - m.ga) DESC, m.gf DESC, m.date DESC",
  "gd-asc": "(m.gf - m.ga) ASC, m.ga DESC, m.date DESC",
};

function hasGoalEventFilter(f: MatchFilter): boolean {
  return Boolean(f.scorer || f.assister || f.goalWindow || f.goalFrom != null || f.goalTo != null);
}

function goalEventConditions(
  f: MatchFilter,
  params: Record<string, string | number>,
  e = "e",
  m = "m",
): string[] {
  const where: string[] = [];
  if (f.scorer) {
    where.push(`${e}.player_id = @scorer`);
    where.push(`${e}.player_side = 'united'`);
    where.push(`${e}.type IN ('goal','pen-goal')`);
    params.scorer = f.scorer;
  } else {
    where.push(`${e}.type IN ('goal','pen-goal','own-goal-for')`);
  }
  if (f.assister) {
    where.push(`${e}.assist_player_id = @assister`);
    where.push(`${e}.assist_side = 'united'`);
    where.push(`${e}.type IN ('goal','pen-goal')`);
    params.assister = f.assister;
  }
  if (f.goalWindow || f.goalFrom != null || f.goalTo != null) {
    where.push(`${e}.minute IS NOT NULL`);
  }
  if (f.goalWindow === "firstHalf") {
    where.push(`${e}.minute BETWEEN 1 AND 45`);
  } else if (f.goalWindow === "secondHalf") {
    where.push(`${e}.minute >= 46`);
  } else if (f.goalWindow === "late") {
    where.push(`${e}.minute >= 86`);
  } else if (f.goalWindow === "stoppage") {
    where.push(`(COALESCE(${e}.added_time, 0) > 0 OR (${m}.aet = 0 AND ${e}.minute > 90))`);
  } else if (f.goalWindow === "extraTime") {
    where.push(`${m}.aet = 1`);
    where.push(`${e}.minute > 90`);
  }
  if (f.goalFrom != null) {
    where.push(`${e}.minute >= @goalFrom`);
    params.goalFrom = f.goalFrom;
  }
  if (f.goalTo != null) {
    where.push(`${e}.minute <= @goalTo`);
    params.goalTo = f.goalTo;
  }
  return where;
}

/** Shared filter compilation so the list, its summary, and its spine read the same slice. */
export function matchWhere(f: MatchFilter): { cond: string; params: Record<string, string | number> } {
  const where: string[] = [];
  const params: Record<string, string | number> = {};
  if (f.competition) { where.push("m.competition_id = @competition"); params.competition = f.competition; }
  if (f.opponent) { where.push("m.opponent_id = @opponent"); params.opponent = f.opponent; }
  if (f.manager) { where.push("m.manager_id = @manager"); params.manager = f.manager; }
  if (f.season) { where.push("m.season = @season"); params.season = f.season; }
  if (f.venue) { where.push("m.venue = @venue"); params.venue = f.venue; }
  if (f.result) { where.push("m.result = @result"); params.result = f.result; }
  if (f.aet) { where.push("m.aet = 1"); }
  if (f.type === "cup") {
    where.push("c.type NOT IN ('league','unofficial')");
  } else if (f.type) {
    where.push("c.type = @type");
    params.type = f.type;
  }
  if (f.round) {
    where.push(roundFilterPredicate(f.round));
  }
  if (f.stadium) { where.push("m.stadium_id = @stadium"); params.stadium = f.stadium; }
  if (f.city) { where.push("m.stadium_id IN (SELECT id FROM stadiums WHERE city = @city)"); params.city = f.city; }
  if (hasGoalEventFilter(f)) {
    const eventWhere = goalEventConditions(f, params).join(" AND ");
    where.push(
      `EXISTS (
        SELECT 1 FROM match_events e
        WHERE e.match_id = m.id
          AND ${eventWhere}
      )`,
    );
  }
  if (f.player) {
    where.push(
      `EXISTS (
        SELECT 1 FROM match_lineups l
        WHERE l.match_id = m.id
          AND l.player_id = @player
          AND l.player_side = 'united'
          AND l.bench = 0
      )`,
    );
    params.player = f.player;
  }
  if (f.from) { where.push("m.date >= @from"); params.from = f.from; }
  if (f.to) { where.push("m.date <= @to"); params.to = f.to; }
  if (f.q) { where.push("m.opponent_name LIKE @q"); params.q = `%${f.q}%`; }
  return { cond: where.length ? `WHERE ${where.join(" AND ")}` : "", params };
}

function minuteLabel(minute: number | null, added: number | null): string {
  if (minute == null) return "?";
  return added && added > 0 ? `${minute}+${added}` : String(minute);
}

/** Per-match goal/assist annotation for a scorer/timing slice: the matching
 * events' minute labels, plus how many and whether they were goals or assists. */
export type MatchEventBadge = { count: number; noun: string; minutes: string[] };

export function matchEventBadges(
  matchIds: string[],
  f: Pick<MatchFilter, "scorer" | "assister" | "goalWindow" | "goalFrom" | "goalTo">,
): Map<string, MatchEventBadge> {
  if (matchIds.length === 0 || !hasGoalEventFilter(f)) return new Map();
  const params: Record<string, string | number> = {};
  const ids = matchIds.map((_, i) => `@id${i}`);
  matchIds.forEach((id, i) => { params[`id${i}`] = id; });
  const eventWhere = goalEventConditions(f, params).join(" AND ");
  const rows = getDb()
    .prepare(
      `SELECT e.match_id, e.minute, e.added_time, p.name scorer_name, ap.name assister_name
       FROM match_events e
       JOIN matches m ON m.id = e.match_id
       LEFT JOIN players p ON p.id = e.player_id
       LEFT JOIN players ap ON ap.id = e.assist_player_id
       WHERE e.match_id IN (${ids.join(",")}) AND ${eventWhere}
       ORDER BY e.match_id, COALESCE(e.minute, 999), e.seq`,
    )
    .all(params) as {
      match_id: string;
      minute: number | null;
      added_time: number | null;
      scorer_name: string | null;
      assister_name: string | null;
    }[];
  const grouped = new Map<string, typeof rows>();
  for (const row of rows) grouped.set(row.match_id, [...(grouped.get(row.match_id) ?? []), row]);
  const labels = new Map<string, MatchEventBadge>();
  for (const [matchId, items] of grouped) {
    const minutes = items.map((e) => minuteLabel(e.minute, e.added_time));
    const noun = f.assister && !f.scorer ? "assist" : "goal";
    labels.set(matchId, { count: items.length, noun, minutes });
  }
  return labels;
}

/** Name + city of a single ground, for labelling a stadium-filtered slice. */
export function stadiumById(id: string): { id: string; name: string; city: string | null } | undefined {
  return getDb()
    .prepare("SELECT id, name, city FROM stadiums WHERE id = ?")
    .get(id) as { id: string; name: string; city: string | null } | undefined;
}

export function stadiumsList(): { id: string; name: string; city: string | null; n: number }[] {
  return cachedQuery("stadiumsList", STATIC_REF_TTL_MS, () =>
    getDb()
      .prepare(
        `SELECT s.id, s.name, s.city, COUNT(m.id) n
         FROM stadiums s JOIN matches m ON m.stadium_id = s.id
         GROUP BY s.id ORDER BY n DESC, s.name`,
      )
      .all() as { id: string; name: string; city: string | null; n: number }[],
  );
}

export function matchCitiesList(): { city: string; n: number }[] {
  return cachedQuery("matchCitiesList", STATIC_REF_TTL_MS, () =>
    getDb()
      .prepare(
        `SELECT s.city, COUNT(m.id) n
         FROM stadiums s JOIN matches m ON m.stadium_id = s.id
         WHERE s.city IS NOT NULL AND s.city != ''
         GROUP BY s.city ORDER BY n DESC, s.city`,
      )
      .all() as { city: string; n: number }[],
  );
}

export function findMatches(f: MatchFilter): { rows: MatchRow[]; total: number } {
  const { cond, params } = matchWhere(f);
  const total = (
    getDb()
      .prepare(`SELECT COUNT(*) n FROM matches m JOIN competitions c ON c.id = m.competition_id ${cond}`)
      .get(params) as { n: number }
  ).n;
  const orderBy = MATCH_ORDER[f.sort ?? "date-desc"] ?? MATCH_ORDER["date-desc"];
  const rows = getDb()
    .prepare(`${MATCH_SELECT} ${cond} ORDER BY ${orderBy} LIMIT @limit OFFSET @offset`)
    .all({ ...params, limit: f.limit ?? 50, offset: f.offset ?? 0 }) as MatchRow[];
  return { rows, total };
}

/** Decade buckets with fixture counts, for the chronological jump rail. */
/**
 * Decade buckets for the matches navigator, counted within the current slice.
 * Pass a filter with its `from`/`to` (decade range) stripped: the chips then show
 * how the rest of the slice spreads across decades, so picking one decade doesn't
 * collapse the navigator to a single chip. Decades with no matches are dropped.
 */
export function matchDecades(f?: MatchFilter): { decade: string; from: number; to: number; n: number }[] {
  const { cond, params } = f ? matchWhere(f) : { cond: "", params: {} };
  const rows = getDb()
    .prepare(
      `SELECT substr(m.date,1,3) || '0' AS start, COUNT(*) n
       FROM matches m JOIN competitions c ON c.id = m.competition_id ${cond}
       GROUP BY 1 ORDER BY 1`,
    )
    .all(params) as { start: string; n: number }[];
  return rows.map((r) => {
    const from = parseInt(r.start, 10);
    return { decade: `${from}s`, from, to: from + 9, n: r.n };
  });
}

export interface MatchesSummary extends Record_ {
  first: string | null;
  last: string | null;
  avg_home_att: number | null;
}

/** Aggregate record for the whole filtered set, independent of pagination. */
export function matchesSummary(f: MatchFilter): MatchesSummary {
  const { cond, params } = matchWhere(f);
  return getDb()
    .prepare(
      `SELECT ${RECORD_COLS},
              MIN(date) first, MAX(date) last,
              ROUND(AVG(CASE WHEN venue='H' THEN attendance END)) avg_home_att
       FROM matches m JOIN competitions c ON c.id = m.competition_id ${cond}`,
    )
    .get(params) as MatchesSummary;
}

/** One categorical facet's option→count map within a slice, as a GROUP BY. */
function facetColumnCounts(col: string, f: MatchFilter, join = ""): Record<string, number> {
  const { cond, params } = matchWhere(f);
  const rows = getDb()
    .prepare(
      `SELECT ${col} v, COUNT(*) n FROM matches m
       JOIN competitions c ON c.id = m.competition_id ${join} ${cond}
       GROUP BY ${col}`,
    )
    .all(params) as { v: string | null; n: number }[];
  const out: Record<string, number> = {};
  for (const r of rows) if (r.v != null) out[String(r.v)] = r.n;
  return out;
}

/**
 * Contextual option counts for the categorical facets, so the filter UI can show
 * how many matches each option still yields and hide the ones that lead nowhere.
 * Each facet is counted with its *own* constraint removed (standard faceted
 * semantics) — so picking an opponent narrows the competition options, but the
 * opponent list still shows every opponent. Event/lineup facets (scorer,
 * assister, goal timing, player) are omitted: they stay type-ahead, uncounted.
 */
export function matchFacetCounts(f: MatchFilter): Record<string, Record<string, number>> {
  const without = (key: keyof MatchFilter): MatchFilter => ({ ...f, [key]: undefined });
  const typeRaw = facetColumnCounts("c.type", without("type"));
  // "cup" is an umbrella over every official cup type (see matchWhere).
  const cupTotal = Object.entries(typeRaw)
    .filter(([t]) => t !== "league" && t !== "unofficial")
    .reduce((sum, [, n]) => sum + n, 0);
  return {
    opponent: facetColumnCounts("m.opponent_id", without("opponent")),
    competition: facetColumnCounts("m.competition_id", without("competition")),
    season: facetColumnCounts("m.season", without("season")),
    venue: facetColumnCounts("m.venue", without("venue")),
    result: facetColumnCounts("m.result", without("result")),
    manager: facetColumnCounts("m.manager_id", without("manager")),
    stadium: facetColumnCounts("m.stadium_id", without("stadium")),
    city: facetColumnCounts("s.city", without("city"), "JOIN stadiums s ON s.id = m.stadium_id"),
    type: cupTotal > 0 ? { ...typeRaw, cup: cupTotal } : typeRaw,
  };
}

export function competitionsList(): { id: string; name: string; type: string; n: number }[] {
  return cachedQuery("competitionsList", STATIC_REF_TTL_MS, () =>
    getDb()
      .prepare(
        `SELECT c.id, c.name, c.type, COUNT(m.id) n
         FROM competitions c JOIN matches m ON m.competition_id = c.id
         GROUP BY c.id ORDER BY n DESC`,
      )
      .all() as { id: string; name: string; type: string; n: number }[],
  );
}

// ---------------------------------------------------------------- opponents

export interface OpponentRecord extends Record_ {
  id: string;
  name: string;
  country: string | null;
  first: string;
  last: string;
}

export function opponentsIndex(): OpponentRecord[] {
  return cachedQuery("opponentsIndex", STATIC_REF_TTL_MS, () =>
    getDb()
      .prepare(
        `SELECT o.id, o.name, o.country, COUNT(*) p,
                SUM(result='W') w, SUM(result='D') d, SUM(result='L') l,
                SUM(gf) gf, SUM(ga) ga, MIN(date) first, MAX(date) last
         FROM matches m JOIN opponents o ON o.id = m.opponent_id
         GROUP BY o.id ORDER BY p DESC`,
      )
      .all() as OpponentRecord[],
  );
}

export function opponentById(id: string): OpponentRecord | undefined {
  return getDb()
    .prepare(
      `SELECT o.id, o.name, o.country, COUNT(*) p,
              SUM(result='W') w, SUM(result='D') d, SUM(result='L') l,
              SUM(gf) gf, SUM(ga) ga, MIN(date) first, MAX(date) last
       FROM matches m JOIN opponents o ON o.id = m.opponent_id
       WHERE o.id = ? GROUP BY o.id`,
    )
    .get(id) as OpponentRecord | undefined;
}

/** Every recorded meeting with this opponent, newest first — the full grouped archive. */
export function opponentMatches(id: string): MatchRow[] {
  return getDb()
    .prepare(`${MATCH_SELECT} WHERE m.opponent_id = ? ORDER BY m.date DESC`)
    .all(id) as MatchRow[];
}

// ---------------------------------------------------------------- managers

export interface ManagerRecord extends Record_ {
  id: string;
  name: string;
  nationality: string | null;
  role: string | null;
  first: string | null;
  last: string | null;
  thumb_url: string | null;
  image_url: string | null;
}

export function managersIndex(): ManagerRecord[] {
  return cachedQuery("managersIndex", STATIC_REF_TTL_MS, () =>
    getDb()
      .prepare(
        `SELECT mg.id, mg.name, mg.nationality, mg.role,
                COUNT(m.id) p, COALESCE(SUM(m.result='W'),0) w, COALESCE(SUM(m.result='D'),0) d,
                COALESCE(SUM(m.result='L'),0) l, COALESCE(SUM(m.gf),0) gf, COALESCE(SUM(m.ga),0) ga,
                MIN(m.date) first, MAX(m.date) last,
                mm.thumb_url, mm.image_url
         FROM managers mg LEFT JOIN matches m ON m.manager_id = mg.id
         LEFT JOIN manager_media mm ON mm.manager_id = mg.id
         GROUP BY mg.id ORDER BY first`,
      )
      .all() as ManagerRecord[],
  );
}

export function managerById(id: string): ManagerRecord | undefined {
  return managersIndex().find((m) => m.id === id);
}

export function managerTenures(id: string): { date_from: string; date_to: string | null; note: string | null }[] {
  return getDb()
    .prepare("SELECT date_from, date_to, note FROM manager_tenures WHERE manager_id = ? ORDER BY date_from")
    .all(id) as { date_from: string; date_to: string | null; note: string | null }[];
}

/** Every competitive match under this manager, newest first — the full grouped archive. */
export function managerMatches(id: string): MatchRow[] {
  return getDb()
    .prepare(`${MATCH_SELECT} WHERE m.manager_id = ? ORDER BY m.date DESC`)
    .all(id) as MatchRow[];
}

// ---------------------------------------------------------------- players

export interface PlayerTotals {
  player_id: string;
  name: string;
  apps: number;
  starts: number;
  subs: number;
  goals: number;
  assists: number;
  recorded_assists: number;
  curated_assists: number;
  lineup_apps: number;
  lineup_starts: number;
  recorded_goals: number;
  record_apps: number | null;
  record_starts: number | null;
  record_subs: number | null;
  record_goals: number | null;
  record_source_id: string | null;
  record_source_url: string | null;
  record_stats_as_of: string | null;
  career: string | null;
  first_year: number | null;
  last_year: number | null;
  primary_shirt: number | null;
  primary_shirt_decade: string | null;
  primary_shirt_apps: number | null;
  player_image_url: string | null;
  player_thumb_url: string | null;
  player_image_page_url: string | null;
  player_image_license: string | null;
  first_date: string | null;
  last_date: string | null;
  position_bucket: string | null;
  position_label: string | null;
}

// ---- canonical "assists" definition -------------------------------------
// Assists come from two non-overlapping lanes: the curated Tableau lane covers
// 1987-88 through CURATED_ASSISTS_LAST_SEASON, and match-event assists take over
// after it. Every assist *total* in the app must combine them through these
// builders so the figure is identical on the players index, the player header,
// the season table, and the API. (Match-coverage stats and scorer↔assister
// partnerships are deliberately match-event only — curated rows are not
// match-attributed and cannot be linked to a specific goal.)
const CURATED_ASSISTS_LAST_SEASON = "2014-15";

/** Curated assist count for the player named by `ref` (e.g. "p.id" or "?"), optionally one season. */
function curatedAssistsExpr(ref: string, seasonExpr?: string): string {
  return `COALESCE((SELECT SUM(tga.count) FROM tableau_goals_assists tga
            WHERE tga.player_id = ${ref} AND tga.kind = 'assist'${seasonExpr ? ` AND tga.season = ${seasonExpr}` : ""}), 0)`;
}

/** Match-event assist count for the player named by `ref`, restricted by `seasonPred`. */
function matchAssistsExpr(ref: string, seasonPred: string): string {
  return `COALESCE((SELECT COUNT(*) FROM match_events e JOIN matches m ON m.id = e.match_id
            WHERE e.assist_player_id = ${ref} AND e.assist_side = 'united'
              AND e.type IN ('goal','pen-goal') AND ${seasonPred}), 0)`;
}

/** Combined career assists (curated through the boundary + match events after it). */
function combinedAssistsExpr(ref: string): string {
  return `(${curatedAssistsExpr(ref)} + ${matchAssistsExpr(ref, `m.season > '${CURATED_ASSISTS_LAST_SEASON}'`)})`;
}

const PLAYER_TOTALS_WITH = `
  WITH local_shirt_decade_counts AS (
    SELECT l.player_id, l.shirt, substr(m.date,1,3) || '0s' AS decade,
           COUNT(*) apps, SUM(l.started = 1) starts,
           MIN(m.date) first_date, MAX(m.date) last_date
    FROM match_lineups l
    JOIN matches m ON m.id = l.match_id
    WHERE l.player_side = 'united'
      AND l.bench = 0
      AND l.shirt IS NOT NULL
    GROUP BY l.player_id, l.shirt, decade
  ),
  shirt_decade_counts AS (
    SELECT player_id, shirt, decade, apps, 0 starts, first_date, last_date
    FROM player_shirts
    UNION ALL
    SELECT local.player_id, local.shirt, local.decade, local.apps, local.starts, local.first_date, local.last_date
    FROM local_shirt_decade_counts local
    WHERE NOT EXISTS (
      SELECT 1 FROM player_shirts ps WHERE ps.player_id = local.player_id
    )
  ),
  shirt_totals AS (
    SELECT player_id, shirt, SUM(apps) apps, MAX(last_date) last_date
    FROM shirt_decade_counts
    GROUP BY player_id, shirt
  ),
  shirt_decade_ranked AS (
    SELECT shirt_decade_counts.*,
           ROW_NUMBER() OVER (
             PARTITION BY player_id, shirt
             ORDER BY apps DESC, last_date DESC, decade DESC
           ) decade_rank
    FROM shirt_decade_counts
  ),
  primary_shirts AS (
    SELECT player_id, shirt, decade, apps
    FROM (
      SELECT sdr.player_id, sdr.shirt, sdr.decade, st.apps,
             ROW_NUMBER() OVER (
               PARTITION BY sdr.player_id
               ORDER BY st.apps DESC, st.last_date DESC, sdr.shirt
             ) rn
      FROM shirt_decade_ranked sdr
      JOIN shirt_totals st ON st.player_id = sdr.player_id AND st.shirt = sdr.shirt
      WHERE sdr.decade_rank = 1
    )
    WHERE rn = 1
  )
`;

const PLAYER_TOTALS_SELECT = `
  SELECT p.id AS player_id, p.name,
         COALESCE(pr.apps, pt.apps, 0) apps,
         COALESCE(pr.starts, pt.starts, 0) starts,
         COALESCE(pr.subs, 0) subs,
         COALESCE(pr.goals, pt.goals, 0) goals,
         ${combinedAssistsExpr("p.id")} assists,
         COALESCE(pt.assists, 0) recorded_assists,
         ${curatedAssistsExpr("p.id")} curated_assists,
         COALESCE(pt.apps, 0) lineup_apps,
         COALESCE(pt.starts, 0) lineup_starts,
         COALESCE(pt.goals, 0) recorded_goals,
         pr.apps record_apps,
         pr.starts record_starts,
         pr.subs record_subs,
         pr.goals record_goals,
         pr.source_id record_source_id,
         pr.source_url record_source_url,
         pr.stats_as_of record_stats_as_of,
         pr.career,
         pr.first_year,
         pr.last_year,
         ps.shirt primary_shirt,
         ps.decade primary_shirt_decade,
         ps.apps primary_shirt_apps,
         pm.image_url player_image_url,
         pm.thumb_url player_thumb_url,
         pm.page_url player_image_page_url,
         pm.license player_image_license,
         pp.bucket position_bucket,
         pp.position_label position_label,
         COALESCE(
           pt.first_date,
           (SELECT MIN(m.date) FROM match_events e JOIN matches m ON m.id=e.match_id WHERE e.player_id = p.id AND e.player_side = 'united'),
           CASE WHEN pr.first_year IS NOT NULL THEN printf('%04d-01-01', pr.first_year) END
         ) first_date,
         COALESCE(
           pt.last_date,
           (SELECT MAX(m.date) FROM match_events e JOIN matches m ON m.id=e.match_id WHERE e.player_id = p.id AND e.player_side = 'united'),
           CASE WHEN pr.last_year IS NOT NULL THEN printf('%04d-12-31', pr.last_year) END
         ) last_date
  FROM players p
  LEFT JOIN player_totals pt ON pt.player_id = p.id AND pt.scope = 'all'
  LEFT JOIN player_records pr ON pr.player_id = p.id
  LEFT JOIN primary_shirts ps ON ps.player_id = p.id
  LEFT JOIN player_media pm ON pm.player_id = p.id
  LEFT JOIN player_positions pp ON pp.player_id = p.id
`;

export function playersIndex(): PlayerTotals[] {
  return cachedQuery("playersIndex", STATIC_REF_TTL_MS, () =>
    getDb()
      .prepare(
        `${PLAYER_TOTALS_WITH}
         ${PLAYER_TOTALS_SELECT}
         WHERE pr.player_id IS NOT NULL OR p.id = 'own-goal'
         ORDER BY goals DESC, apps DESC, starts DESC`,
      )
      .all() as PlayerTotals[],
  );
}

export function playerById(id: string): PlayerTotals | undefined {
  return getDb()
    .prepare(
      `${PLAYER_TOTALS_WITH}
       ${PLAYER_TOTALS_SELECT}
       WHERE p.id = ?`,
    )
    .get(id) as PlayerTotals | undefined;
}

export interface PlayerShirtNumber {
  decade: string;
  shirt: number;
  apps: number;
  starts: number;
  first_date: string;
  last_date: string;
}

export function playerShirtNumbersByDecade(id: string): PlayerShirtNumber[] {
  return getDb()
    .prepare(
      `WITH source_rows AS (
         SELECT decade, shirt, apps, 0 starts, first_date, last_date
         FROM player_shirts
         WHERE player_id = ?
       ),
       local_rows AS (
         SELECT substr(m.date,1,3) || '0s' decade, l.shirt,
                COUNT(*) apps, SUM(l.started = 1) starts,
                MIN(m.date) first_date, MAX(m.date) last_date
         FROM match_lineups l
         JOIN matches m ON m.id = l.match_id
         WHERE l.player_id = ?
           AND l.player_side = 'united'
           AND l.bench = 0
           AND l.shirt IS NOT NULL
         GROUP BY decade, l.shirt
       )
       SELECT * FROM source_rows
       UNION ALL
       SELECT * FROM local_rows
       WHERE NOT EXISTS (SELECT 1 FROM source_rows)
       ORDER BY decade, apps DESC, shirt`,
    )
    .all(id, id) as PlayerShirtNumber[];
}

export function playerSplitsBySeason(id: string): {
  season: string;
  apps: number;
  starts: number;
  goals: number;
  assists: number;
}[] {
  return getDb()
    .prepare(
      `WITH seasons AS (
         SELECT season FROM matches m JOIN match_lineups l ON l.match_id = m.id WHERE l.player_id = ? AND l.player_side = 'united' AND l.bench = 0
         UNION
         SELECT season FROM matches m JOIN match_events e ON e.match_id = m.id
         WHERE (e.player_id = ? AND e.player_side = 'united')
            OR (e.assist_player_id = ? AND e.assist_side = 'united')
         UNION
         SELECT season FROM tableau_goals_assists WHERE player_id = ?
       )
       SELECT s.season,
              COALESCE((SELECT COUNT(*) FROM match_lineups l JOIN matches m ON m.id=l.match_id
                        WHERE l.player_id = ? AND l.player_side = 'united' AND l.bench = 0 AND m.season = s.season), 0) apps,
              COALESCE((SELECT COUNT(*) FROM match_lineups l JOIN matches m ON m.id=l.match_id
                        WHERE l.player_id = ? AND l.player_side = 'united' AND l.started = 1 AND l.bench = 0 AND m.season = s.season), 0) starts,
              COALESCE((SELECT COUNT(*) FROM match_events e JOIN matches m ON m.id=e.match_id
                        WHERE e.player_id = ? AND e.player_side = 'united' AND e.type IN ('goal','pen-goal') AND m.season = s.season), 0) goals,
              -- assists: same combined definition as the headline figure
              CASE WHEN s.season <= '${CURATED_ASSISTS_LAST_SEASON}'
                THEN ${curatedAssistsExpr("?", "s.season")}
                ELSE ${matchAssistsExpr("?", "m.season = s.season")}
              END assists
       FROM seasons s ORDER BY s.season`,
    )
    .all(id, id, id, id, id, id, id, id, id) as {
      season: string;
      apps: number;
      starts: number;
      goals: number;
      assists: number;
    }[];
}

export interface PlayerCareerSpark {
  player_id: string;
  season: string;
  apps: number;
  goals: number;
}

/**
 * One batched, match-attributed apps+goals-per-season row for *every* player, in a
 * single grouped scan — the raw material for the index's career sparklines. Drawn
 * only from lineups (apps) and match events (goals), both of which are match-dated,
 * so a season bar means "we have the matches", not "we trust a career total". This
 * reconstructs the giants near-exactly (Charlton 757/758 apps, 249/249 goals) because
 * lineup/event coverage is broad across every decade; record-only fringe players with
 * no attributed matches simply return no rows and fall back to their span text.
 */
export function playerCareerSparks(): PlayerCareerSpark[] {
  return getDb()
    .prepare(
      `WITH apps AS (
         SELECT l.player_id pid, m.season season, COUNT(*) apps
         FROM match_lineups l JOIN matches m ON m.id = l.match_id
         WHERE l.player_side = 'united' AND l.bench = 0
         GROUP BY l.player_id, m.season
       ),
       goals AS (
         SELECT e.player_id pid, m.season season, COUNT(*) goals
         FROM match_events e JOIN matches m ON m.id = e.match_id
         WHERE e.player_side = 'united' AND e.type IN ('goal','pen-goal')
         GROUP BY e.player_id, m.season
       )
       SELECT COALESCE(a.pid, g.pid) player_id,
              COALESCE(a.season, g.season) season,
              COALESCE(a.apps, 0) apps,
              COALESCE(g.goals, 0) goals
       FROM apps a
       FULL OUTER JOIN goals g ON a.pid = g.pid AND a.season = g.season`,
    )
    .all() as PlayerCareerSpark[];
}

export interface ManagerCareerSpark {
  manager_id: string;
  season: string;
  w: number;
  d: number;
  l: number;
}

/**
 * Per-manager, per-season W/D/L for *every* manager in one grouped scan — the raw
 * material for the index's tenure sparkbars. Every competitive match is dated and
 * season-stamped, so a season bar means exactly "matches we hold under this man that
 * year"; managers with no season-stamped matches simply return no rows.
 */
export function managerCareerSparks(): ManagerCareerSpark[] {
  return getDb()
    .prepare(
      `SELECT manager_id, season,
              COALESCE(SUM(result='W'),0) w, COALESCE(SUM(result='D'),0) d,
              COALESCE(SUM(result='L'),0) l
       FROM matches
       WHERE manager_id IS NOT NULL AND season IS NOT NULL
       GROUP BY manager_id, season`,
    )
    .all() as ManagerCareerSpark[];
}

/**
 * SQL predicate (on `matches m` joined to `competitions c`) selecting the
 * trophy-deciding match of every cup United *won*: the latest-dated final won.
 * Extends the old round-name-only rule to also catch single-match finals stored
 * with a null round — the Charity/Community Shield, UEFA Super Cup, and the
 * world-club finals — while still excluding group/knockout exits (so a final-day
 * group win can't pose as a trophy), league, and wartime/friendly. Shared by
 * {@link managerHonours} and the seasons decade tally so the two can't drift.
 */
export const CUP_WON_PREDICATE = `c.type IN ('domestic-cup','league-cup','european','super-cup','world')
  AND m.outcome = 'W'
  AND m.date = (
    SELECT MAX(m2.date) FROM matches m2
    WHERE m2.season = m.season AND m2.competition_id = m.competition_id
  )
  AND ( (m.round LIKE '%final%' AND m.round NOT LIKE '%semi%' AND m.round NOT LIKE '%quarter%')
        OR (c.type IN ('super-cup','world') AND m.round IS NULL) )`;

export interface ManagerHonourSeason {
  manager_id: string;
  season: string;
  /** Trophies won that season (a season can yield several — a double, a treble). */
  n: number;
}

/**
 * Trophy-winning seasons per manager: top-flight league titles plus knockout cups
 * won (the deciding final won), each attributed to whoever managed the decisive
 * match — the season's last league game for a title, the winning final for a cup.
 * Drives the index sparkbar's gold trophy pips and each row's honours count.
 *
 * Cup detection is the shared {@link CUP_WON_PREDICATE} (so Ferguson's count
 * lands at the canonical 38, not 26); league, wartime/friendly, and promotion
 * play-offs are never trophies.
 */
export function managerHonours(): ManagerHonourSeason[] {
  return getDb()
    .prepare(
      `WITH honours AS (
         SELECT (SELECT m.manager_id FROM matches m JOIN competitions lc ON lc.id = m.competition_id
                 WHERE lc.type = 'league' AND m.season = ss.season ORDER BY m.date DESC LIMIT 1) manager_id,
                ss.season
         FROM season_summaries ss JOIN competitions c ON c.id = ss.competition_id
         WHERE c.type = 'league' AND ss.position = 1 AND c.name IN ('First Division','Premier League')
         UNION ALL
         SELECT m.manager_id, m.season
         FROM matches m JOIN competitions c ON c.id = m.competition_id
         WHERE ${CUP_WON_PREDICATE}
       )
       SELECT manager_id, season, COUNT(*) n
       FROM honours WHERE manager_id IS NOT NULL
       GROUP BY manager_id, season`,
    )
    .all() as ManagerHonourSeason[];
}

export function playerLineupMatches(id: string): (MatchRow & {
  started: number;
  sub_on: number | null;
  sub_off: number | null;
  role: string | null;
})[] {
  return getDb()
    .prepare(
      `SELECT m.*, c.name AS competition_name, c.type AS competition_type, s.name AS stadium_name, mg.name AS manager_name,
              l.started, l.sub_on, l.sub_off, l.role
       FROM match_lineups l
       JOIN matches m ON m.id = l.match_id
       JOIN competitions c ON c.id = m.competition_id
       LEFT JOIN stadiums s ON s.id = m.stadium_id
       LEFT JOIN managers mg ON mg.id = m.manager_id
       WHERE l.player_id = ? AND l.player_side = 'united' AND l.bench = 0 ORDER BY m.date DESC`,
    )
    .all(id) as (MatchRow & {
      started: number;
      sub_on: number | null;
      sub_off: number | null;
      role: string | null;
    })[];
}

export function playerGoalMatches(id: string): (MatchRow & { goals: number; minutes: string | null })[] {
  return getDb()
    .prepare(
      `SELECT m.*, c.name AS competition_name, c.type AS competition_type, NULL AS stadium_name, NULL AS manager_name,
              COUNT(*) goals,
              GROUP_CONCAT(COALESCE(e.minute, ''), ',') minutes
       FROM match_events e
       JOIN matches m ON m.id = e.match_id
       JOIN competitions c ON c.id = m.competition_id
       WHERE e.player_id = ? AND e.player_side = 'united' AND e.type IN ('goal','pen-goal')
       GROUP BY m.id ORDER BY m.date DESC`,
    )
    .all(id) as (MatchRow & { goals: number; minutes: string | null })[];
}

export function playerGoalMinutes(id: string): number[] {
  return (
    getDb()
      .prepare(
        `SELECT e.minute FROM match_events e
         WHERE e.player_id = ? AND e.player_side = 'united' AND e.type IN ('goal','pen-goal') AND e.minute IS NOT NULL`,
      )
      .all(id) as { minute: number }[]
  ).map((r) => r.minute);
}

/**
 * A player's goals by 5-minute regulation window, with stoppage-time goals (90+)
 * held out as a separate `stoppage` count — the per-player mirror of
 * {@link import("./trails").goalMinuteRidge}, so the player "shape of his scoring"
 * column chart stacks added-time goals on the final bar exactly like the
 * club-wide late-goals chart instead of folding them into a fat 86–90 bar.
 */
export function playerGoalMinuteBins(id: string): { bins: { lo: number; hi: number; n: number }[]; stoppage: number } {
  const db = getDb();
  const notStoppage = `NOT (e.minute > 90 OR (e.minute = 90 AND COALESCE(e.added_time, 0) > 0))`;
  const rows = db
    .prepare(
      `SELECT MIN((e.minute - 1) / 5, 17) AS bin, COUNT(*) n
       FROM match_events e
       WHERE e.player_id = ? AND e.player_side = 'united' AND e.type IN ('goal','pen-goal')
         AND e.minute IS NOT NULL AND e.minute >= 1 AND ${notStoppage}
       GROUP BY 1 ORDER BY 1`,
    )
    .all(id) as { bin: number; n: number }[];
  const bins = Array.from({ length: 18 }, (_, i) => ({ lo: i * 5, hi: i * 5 + 5, n: 0 }));
  for (const r of rows) if (bins[r.bin]) bins[r.bin].n = r.n;
  const { stoppage } = db
    .prepare(
      `SELECT COUNT(*) stoppage FROM match_events e
       WHERE e.player_id = ? AND e.player_side = 'united' AND e.type IN ('goal','pen-goal')
         AND e.minute IS NOT NULL AND NOT (${notStoppage})`,
    )
    .get(id) as { stoppage: number };
  return { bins, stoppage };
}

export interface PlayerOpponentGoals {
  opponent_id: string;
  opponent_name: string;
  goals: number;
  matches: number;
  last_date: string;
}

/** Opponents this player scored most recorded goals against. */
export function playerGoalsByOpponent(id: string, limit = 8): PlayerOpponentGoals[] {
  return getDb()
    .prepare(
      `SELECT m.opponent_id, m.opponent_name, COUNT(*) goals,
              COUNT(DISTINCT m.id) matches, MAX(m.date) last_date
       FROM match_events e JOIN matches m ON m.id = e.match_id
       WHERE e.player_id = ? AND e.player_side = 'united' AND e.type IN ('goal','pen-goal')
       GROUP BY m.opponent_id
       ORDER BY goals DESC, matches ASC, last_date DESC LIMIT ?`,
    )
    .all(id, limit) as PlayerOpponentGoals[];
}

/**
 * Where this player sits among players with a verified record, by headline
 * goals and apps. Null when the player has no verified record to rank.
 */
export function playerClubRanks(id: string): { goalRank: number; appRank: number; total: number } | null {
  const index = playersIndex();
  const goalRank = index.findIndex((p) => p.player_id === id) + 1; // index is goals-sorted
  if (goalRank === 0) return null;
  const appRank =
    [...index].sort((a, b) => b.apps - a.apps).findIndex((p) => p.player_id === id) + 1;
  return { goalRank, appRank, total: index.length };
}

export interface AssistPartnership {
  scorer_id: string;
  scorer_name: string;
  scorer_thumb: string | null;
  assister_id: string;
  assister_name: string;
  assister_thumb: string | null;
  goals: number;
  first_date: string;
  last_date: string;
}

export function topAssistPartnerships(limit = 20): AssistPartnership[] {
  return getDb()
    .prepare(
      `SELECT e.player_id scorer_id, sp.name scorer_name, spm.thumb_url scorer_thumb,
              e.assist_player_id assister_id, ap.name assister_name, apm.thumb_url assister_thumb,
              COUNT(*) goals, MIN(m.date) first_date, MAX(m.date) last_date
       FROM match_events e
       JOIN matches m ON m.id = e.match_id
       JOIN players sp ON sp.id = e.player_id
       JOIN players ap ON ap.id = e.assist_player_id
       LEFT JOIN player_media spm ON spm.player_id = sp.id
       LEFT JOIN player_media apm ON apm.player_id = ap.id
       WHERE e.type IN ('goal','pen-goal')
         AND e.player_side = 'united'
         AND e.assist_side = 'united'
         AND e.player_id IS NOT NULL
         AND e.assist_player_id IS NOT NULL
       GROUP BY e.player_id, e.assist_player_id
       ORDER BY goals DESC, last_date DESC LIMIT ?`,
    )
    .all(limit) as AssistPartnership[];
}

export function playerAssistPartnerships(id: string, limit = 12): AssistPartnership[] {
  return getDb()
    .prepare(
      `SELECT e.player_id scorer_id, sp.name scorer_name, spm.thumb_url scorer_thumb,
              e.assist_player_id assister_id, ap.name assister_name, apm.thumb_url assister_thumb,
              COUNT(*) goals, MIN(m.date) first_date, MAX(m.date) last_date
       FROM match_events e
       JOIN matches m ON m.id = e.match_id
       JOIN players sp ON sp.id = e.player_id
       JOIN players ap ON ap.id = e.assist_player_id
       LEFT JOIN player_media spm ON spm.player_id = sp.id
       LEFT JOIN player_media apm ON apm.player_id = ap.id
       WHERE e.type IN ('goal','pen-goal')
         AND e.player_side = 'united'
         AND e.assist_side = 'united'
         AND e.player_id IS NOT NULL
         AND e.assist_player_id IS NOT NULL
         AND (e.player_id = ? OR e.assist_player_id = ?)
       GROUP BY e.player_id, e.assist_player_id
       ORDER BY goals DESC, last_date DESC LIMIT ?`,
    )
    .all(id, id, limit) as AssistPartnership[];
}

// --------------------------------------------- curated Tableau season lane
// Hand-curated goals/assists/goal-types by season for 1987-88..2014-15. Not
// match-attributed; surfaced as its own labelled lane (docs/TABLEAU-GOALS-ASSISTS.md).

export interface CuratedTotals {
  goals: number;
  assists: number;
  seasons: number;
  from_season: string | null;
  to_season: string | null;
  source_id: string | null;
  source_url: string | null;
}

/** Curated goal/assist totals for a player, or null when the source has nothing. */
export function playerCuratedTotals(id: string): CuratedTotals | null {
  const row = getDb()
    .prepare(
      `SELECT
         COALESCE(SUM(CASE WHEN kind='goal' THEN count END), 0) goals,
         COALESCE(SUM(CASE WHEN kind='assist' THEN count END), 0) assists,
         COUNT(DISTINCT season) seasons,
         MIN(season) from_season, MAX(season) to_season,
         MIN(source_id) source_id
       FROM tableau_goals_assists WHERE player_id = ?`,
    )
    .get(id) as Omit<CuratedTotals, "source_url"> & { source_id: string | null };
  if (!row || (row.goals === 0 && row.assists === 0)) return null;
  const src = row.source_id
    ? (getDb().prepare("SELECT url FROM sources WHERE id = ?").get(row.source_id) as { url: string | null } | undefined)
    : undefined;
  return { ...row, source_url: src?.url ?? null };
}

export interface CuratedGoalType {
  goal_type: string;
  goals: number;
}

/** Goals broken down by body part / technique, most common first. */
export function playerCuratedGoalTypes(id: string): CuratedGoalType[] {
  return getDb()
    .prepare(
      `SELECT goal_type, SUM(count) goals
       FROM tableau_goal_types WHERE player_id = ?
       GROUP BY goal_type ORDER BY goals DESC, goal_type`,
    )
    .all(id) as CuratedGoalType[];
}

// ---------------------------------------------------------------- analytics

export function eloSeries(): { date: string; elo: number }[] {
  // one point per month keeps the payload small over 130+ years
  return getDb()
    .prepare(
      `SELECT substr(date,1,7) ym, date, elo_post elo FROM elo_history
       GROUP BY ym HAVING date = MAX(date) ORDER BY date`,
    )
    .all() as { date: string; elo: number }[];
}

export function seasonAggregates(): {
  season: string; p: number; w: number; d: number; l: number;
  gf: number; ga: number; win_pct: number; avg_att: number | null;
}[] {
  return getDb()
    .prepare(
      `SELECT season, ${RECORD_COLS},
              ROUND(100.0*SUM(result='W')/COUNT(*),1) win_pct,
              ROUND(AVG(CASE WHEN venue='H' THEN attendance END)) avg_att
       FROM matches GROUP BY season ORDER BY season`,
    )
    .all() as ReturnType<typeof seasonAggregates>;
}

/**
 * The seasons United won the *top-flight* title — First Division or Premier
 * League only. Deliberately excludes the two Second Division titles (1935-36,
 * 1974-75): winning the second tier is not a league championship, the same
 * honesty the seasons hero draws (a hollow ring, not solid gold). Used to gold-
 * cap the championship seasons on the homepage history skyline.
 */
export function championSeasons(): string[] {
  return getDb()
    .prepare(
      `SELECT ss.season
       FROM season_summaries ss JOIN competitions c ON c.id = ss.competition_id
       WHERE c.type = 'league' AND ss.position = 1
         AND c.name IN ('First Division','Premier League')
       ORDER BY ss.season`,
    )
    .all()
    .map((r) => (r as { season: string }).season);
}

export function topScorers(limit = 25): PlayerTotals[] {
  return playersIndex().slice(0, limit);
}

// ---------------------------------------------------------------- own goals for United

// Own goals scored FOR United carry the opposition scorer in player_name; older
// rows recorded no scorer at all ("own goal (og)") or a stray fragment ("s"), so
// a usable scorer name needs two consecutive letters and must not itself read as
// "own goal". Everything else collapses to an unknown scorer.
const OG_SCORER_NAME =
  `CASE WHEN e.player_name GLOB '*[A-Za-z][A-Za-z]*' AND lower(e.player_name) NOT LIKE '%own%goal%' THEN e.player_name END`;

export interface OwnGoalForEvent {
  match_id: string;
  date: string;
  season: string;
  opponent_id: string;
  opponent_name: string;
  venue: string;
  gf: number;
  ga: number;
  result: string;
  minute: number | null;
  scorer: string | null;
}

/** Every own goal scored FOR United, newest first, with the scorer resolved to null when unrecorded. */
export function ownGoalForEvents(): OwnGoalForEvent[] {
  return getDb()
    .prepare(
      `SELECT m.id match_id, m.date, m.season, m.opponent_id, m.opponent_name, m.venue,
              m.gf, m.ga, m.result, e.minute, ${OG_SCORER_NAME} scorer
       FROM match_events e JOIN matches m ON m.id = e.match_id
       WHERE e.type = 'own-goal-for' ORDER BY m.date DESC, m.id`,
    )
    .all() as OwnGoalForEvent[];
}

export interface OwnGoalSummary {
  total: number;
  named: number;
  unknown: number;
  scorers: number;
  first: string;
  last: string;
}

export function ownGoalSummary(): OwnGoalSummary {
  const r = getDb()
    .prepare(
      `SELECT COUNT(*) total,
              SUM(CASE WHEN ${OG_SCORER_NAME} IS NOT NULL THEN 1 ELSE 0 END) named,
              COUNT(DISTINCT ${OG_SCORER_NAME}) scorers,
              MIN(m.date) first, MAX(m.date) last
       FROM match_events e JOIN matches m ON m.id = e.match_id WHERE e.type = 'own-goal-for'`,
    )
    .get() as { total: number; named: number; scorers: number; first: string; last: string };
  return { total: r.total, named: r.named, unknown: r.total - r.named, scorers: r.scorers, first: r.first, last: r.last };
}

export interface OwnGoalScorer {
  name: string;
  n: number;
  first: string;
  last: string;
  recent_opponent: string;
  recent_opponent_id: string;
  recent_match_id: string;
  thumb_url: string | null;
  image_url: string | null;
}

/** Commons portrait per own-goal scorer name, where one resolved. */
function ownGoalScorerMedia(): Map<string, { thumb_url: string | null; image_url: string | null }> {
  const rows = getDb()
    .prepare("SELECT name, thumb_url, image_url FROM og_scorer_media")
    .all() as { name: string; thumb_url: string | null; image_url: string | null }[];
  return new Map(rows.map((r) => [r.name, { thumb_url: r.thumb_url, image_url: r.image_url }]));
}

/** Opposition players ranked by own goals gifted to United (named scorers only). */
export function ownGoalScorers(): OwnGoalScorer[] {
  const map = new Map<string, OwnGoalScorer>();
  for (const r of ownGoalForEvents()) {
    // rows arrive newest-first, so the first sighting of a name is its latest.
    if (!r.scorer) continue;
    const existing = map.get(r.scorer);
    if (existing) {
      existing.n++;
      if (r.date < existing.first) existing.first = r.date;
    } else {
      map.set(r.scorer, {
        name: r.scorer, n: 1, first: r.date, last: r.date,
        recent_opponent: r.opponent_name, recent_opponent_id: r.opponent_id, recent_match_id: r.match_id,
        thumb_url: null, image_url: null,
      });
    }
  }
  const media = ownGoalScorerMedia();
  for (const scorer of map.values()) {
    const m = media.get(scorer.name);
    if (m) {
      scorer.thumb_url = m.thumb_url;
      scorer.image_url = m.image_url;
    }
  }
  return [...map.values()].sort((a, b) => b.n - a.n || b.last.localeCompare(a.last) || a.name.localeCompare(b.name));
}

// ---------------------------------------------------------------- data/provenance

export interface SourceRecord {
  id: string;
  label: string;
  kind: string;
  url: string | null;
  coverage: string | null;
  notes: string | null;
}

export interface MatchSourceRecord extends SourceRecord {
  facet:
    | "result"
    | "united-scorers"
    | "opposition-goals"
    | "assists"
    | "starting-lineup"
    | "used-substitutes"
    | "bench"
    | "cards"
    | "attendance"
    | "notes";
  confidence: "complete" | "partial" | "supporting";
  source_note: string | null;
}

export function sourcesForMatch(matchId: string): MatchSourceRecord[] {
  return getDb()
    .prepare(
      `SELECT s.id, s.label, s.kind, s.url, s.coverage, s.notes,
              ms.facet, ms.confidence, ms.note AS source_note
       FROM match_sources ms
       JOIN sources s ON s.id = ms.source_id
       WHERE ms.match_id = ?
       ORDER BY ms.facet, s.label`,
    )
    .all(matchId) as MatchSourceRecord[];
}

/** EXISTS predicate: match `m` has at least one opposition goal recorded as an event. */
const OPP_GOALS_EXISTS = `EXISTS (
  SELECT 1 FROM match_events e WHERE e.match_id = m.id AND e.type IN ('opp-goal','own-goal-against')
)`;

/**
 * Per-match coverage facets — one boolean SUM per data facet — shared by the
 * overall and per-competition-type coverage queries so the two cannot drift.
 * The surrounding query must expose `m` (matches); callers add their own
 * leading columns (and GROUP BY for the per-type variant).
 */
const COVERAGE_FACETS = `
  SUM(CASE WHEN EXISTS (
    SELECT 1 FROM match_events e
    WHERE e.match_id = m.id AND e.type IN ('goal','pen-goal','own-goal-for')
  ) THEN 1 ELSE 0 END) withScorers,
  SUM(m.events_complete = 1) completeScorers,
  SUM(CASE WHEN ${OPP_GOALS_EXISTS} THEN 1 ELSE 0 END) withOppositionGoals,
  SUM(CASE WHEN EXISTS (
    SELECT 1 FROM match_events e
    WHERE e.match_id = m.id AND (e.assist_player_id IS NOT NULL OR e.assist_name IS NOT NULL)
  ) THEN 1 ELSE 0 END) withAssists,
  SUM(CASE WHEN EXISTS (
    SELECT 1 FROM match_lineups l
    WHERE l.match_id = m.id AND l.player_side = 'united' AND l.started = 1
  ) THEN 1 ELSE 0 END) withStartingLineups,
  SUM(CASE WHEN EXISTS (
    SELECT 1 FROM match_lineups l
    WHERE l.match_id = m.id AND l.player_side = 'united' AND l.started = 0 AND l.bench = 0
  ) THEN 1 ELSE 0 END) withUsedSubstitutes,
  SUM(CASE WHEN EXISTS (
    SELECT 1 FROM match_lineups l
    WHERE l.match_id = m.id AND l.bench = 1
  ) THEN 1 ELSE 0 END) withBenches,
  SUM(CASE WHEN EXISTS (
    SELECT 1 FROM match_events e
    WHERE e.match_id = m.id AND e.type IN ('card-yellow','card-red')
  ) THEN 1 ELSE 0 END) withCards,
  SUM(m.attendance IS NOT NULL) withAttendance`;

export function coverageOverview(): {
  matches: number;
  officialMatches: number;
  unofficialMatches: number;
  withScorers: number;
  completeScorers: number;
  withOppositionGoals: number;
  withAssists: number;
  withStartingLineups: number;
  withUsedSubstitutes: number;
  withBenches: number;
  withCards: number;
  withAttendance: number;
} {
  return getDb()
    .prepare(
      `SELECT
         COUNT(*) matches,
         SUM(CASE WHEN c.type != 'unofficial' THEN 1 ELSE 0 END) officialMatches,
         SUM(CASE WHEN c.type = 'unofficial' THEN 1 ELSE 0 END) unofficialMatches,
         ${COVERAGE_FACETS}
       FROM matches m
       JOIN competitions c ON c.id = m.competition_id`,
    )
    .get() as ReturnType<typeof coverageOverview>;
}

export function coverageByCompetitionType(): {
  type: string;
  matches: number;
  withScorers: number;
  completeScorers: number;
  withOppositionGoals: number;
  withAssists: number;
  withStartingLineups: number;
  withUsedSubstitutes: number;
  withBenches: number;
  withCards: number;
  withAttendance: number;
}[] {
  return getDb()
    .prepare(
      `SELECT c.type,
              COUNT(*) matches,
              ${COVERAGE_FACETS}
       FROM matches m
       JOIN competitions c ON c.id = m.competition_id
       GROUP BY c.type
       ORDER BY matches DESC`,
    )
    .all() as ReturnType<typeof coverageByCompetitionType>;
}

/**
 * Same facet booleans as {@link coverageOverview}, cut by decade — the time
 * axis of the coverage matrix. Every decade since United started playing carries
 * a row; the result spine is implicit (every match has one), so callers add it.
 */
export function coverageByDecade(): {
  decade: string;
  matches: number;
  withScorers: number;
  completeScorers: number;
  withOppositionGoals: number;
  withAssists: number;
  withStartingLineups: number;
  withUsedSubstitutes: number;
  withBenches: number;
  withCards: number;
  withAttendance: number;
}[] {
  return getDb()
    .prepare(
      `SELECT substr(m.date,1,3) || '0s' decade,
              COUNT(*) matches,
              ${COVERAGE_FACETS}
       FROM matches m
       GROUP BY 1
       ORDER BY 1`,
    )
    .all() as ReturnType<typeof coverageByDecade>;
}

export function sourceUsage(): (SourceRecord & { matches: number; facets: string })[] {
  return getDb()
    .prepare(
      `SELECT s.id, s.label, s.kind, s.url, s.coverage, s.notes,
              COUNT(DISTINCT ms.match_id) matches,
              GROUP_CONCAT(DISTINCT ms.facet) facets
       FROM sources s
       LEFT JOIN match_sources ms ON ms.source_id = s.id
       GROUP BY s.id
       ORDER BY matches DESC, s.label`,
    )
    .all() as (SourceRecord & { matches: number; facets: string })[];
}

export function dataGaps(limit = 12): {
  id: string;
  date: string;
  season: string;
  opponent_name: string;
  competition_name: string;
  gf: number;
  ga: number;
  gap: string;
}[] {
  return getDb()
    .prepare(
      `SELECT m.id, m.date, m.season, m.opponent_name, c.name AS competition_name, m.gf, m.ga,
              CASE
                WHEN m.gf > 0 AND m.events_complete = 0 THEN 'United goalscorers'
                WHEN m.ga > 0 AND NOT ${OPP_GOALS_EXISTS} THEN 'opposition goals'
                WHEN m.has_lineup = 0 THEN 'lineup'
                WHEN m.attendance IS NULL THEN 'attendance'
                ELSE 'source note'
              END gap
       FROM matches m
       JOIN competitions c ON c.id = m.competition_id
       WHERE c.type != 'unofficial'
         AND (
           (m.gf > 0 AND m.events_complete = 0)
           OR (m.ga > 0 AND NOT ${OPP_GOALS_EXISTS})
           OR m.has_lineup = 0
           OR m.attendance IS NULL
         )
       ORDER BY
         CASE
           WHEN m.date >= '1946-01-01' AND m.gf > 0 AND m.events_complete = 0 THEN 0
           WHEN m.date >= '1946-01-01' AND m.ga > 0 AND NOT ${OPP_GOALS_EXISTS} THEN 1
           ELSE 2
         END,
         m.date DESC
       LIMIT ?`,
    )
    .all(limit) as ReturnType<typeof dataGaps>;
}

// ================================================================= Transfers
//
// The transfer archive (mufcinfo-transfers) is the in/out spine, 1883–present.
// Fee aggregates count only rows whose fee is a known amount (fee_kind = 'fee');
// the many historical "undisclosed"/"unknown" fees are real records but carry no
// figure, so spend totals are always a documented floor, never a guess.

export interface TransferRow {
  id: string;
  player_id: string | null;
  player_name: string;
  direction: "in" | "out";
  date: string | null;
  date_precision: "day" | "month" | "year" | null;
  season: string | null;
  club: string | null;
  club_id: string | null;
  fee_gbp: number | null;
  fee_kind: string;
  market_value_eur: number | null;
  type: string;
  thumb_url: string | null;
}

const TRANSFER_SELECT = `
  SELECT t.id, t.player_id, COALESCE(p.name, t.player_name) player_name,
         t.direction, t.date, t.date_precision, t.season, t.club, t.club_id,
         t.fee_gbp, t.fee_kind, t.market_value_eur, t.type,
         pm.thumb_url
  FROM transfers t
  LEFT JOIN players p ON p.id = t.player_id
  LEFT JOIN player_media pm ON pm.player_id = t.player_id
`;

/**
 * Every transfer for one player, most recent first. Archival rows that carry no
 * date, no club and no real fee say nothing on a profile, so they are hidden here
 * (they stay in the canonical record and the dataset export).
 */
export function playerTransfers(playerId: string): TransferRow[] {
  return getDb()
    .prepare(
      `${TRANSFER_SELECT}
       WHERE t.player_id = ?
         AND NOT (t.date IS NULL AND t.club IS NULL AND t.fee_kind IN ('unknown', 'none'))
       ORDER BY t.date IS NULL, t.date DESC`,
    )
    .all(playerId) as TransferRow[];
}

/** The biggest known-fee transfers in a direction. */
export function topTransfersByFee(direction: "in" | "out", limit: number): TransferRow[] {
  return getDb()
    .prepare(
      `${TRANSFER_SELECT}
       WHERE t.direction = ? AND t.fee_kind = 'fee' AND t.fee_gbp IS NOT NULL
       ORDER BY t.fee_gbp DESC LIMIT ?`,
    )
    .all(direction, limit) as TransferRow[];
}

/** Every dated transfer, newest first — the source for the season-by-season archive. */
export function datedTransfers(): TransferRow[] {
  return getDb()
    .prepare(`${TRANSFER_SELECT} WHERE t.date IS NOT NULL ORDER BY t.date DESC, t.direction`)
    .all() as TransferRow[];
}

export interface TransferTotals {
  signings: number;
  departures: number;
  free_in: number;
  youth: number;
  gross_spend: number;
  gross_received: number;
  spend_rows: number;
  received_rows: number;
}

/** Headline aggregates across the whole archive. */
export function transferTotals(): TransferTotals {
  return getDb()
    .prepare(
      `SELECT
         SUM(direction = 'in') signings,
         SUM(direction = 'out') departures,
         SUM(direction = 'in' AND fee_kind = 'free') free_in,
         SUM(type = 'youth') youth,
         COALESCE(SUM(CASE WHEN direction = 'in' AND fee_kind = 'fee' THEN fee_gbp END), 0) gross_spend,
         COALESCE(SUM(CASE WHEN direction = 'out' AND fee_kind = 'fee' THEN fee_gbp END), 0) gross_received,
         SUM(direction = 'in' AND fee_kind = 'fee') spend_rows,
         SUM(direction = 'out' AND fee_kind = 'fee') received_rows
       FROM transfers`,
    )
    .get() as TransferTotals;
}

export interface SpendYear {
  year: number;
  spend: number;
  received: number;
  signings: number;
  departures: number;
}

/**
 * Known-fee spend and receipts plus the raw signing/departure counts, one row per
 * calendar year of the transfer date. Feeds the `SpendTide` hero: the fees draw
 * the modern money explosion, while the counts (recorded right back to Newton
 * Heath, long before any fee was published) carry the people-flow across the whole
 * timeline so the pre-fee century is busy, not blank.
 */
export function spendTideByYear(): SpendYear[] {
  return getDb()
    .prepare(
      `SELECT CAST(substr(date, 1, 4) AS INTEGER) year,
              COALESCE(SUM(CASE WHEN direction = 'in' AND fee_kind = 'fee' THEN fee_gbp END), 0) spend,
              COALESCE(SUM(CASE WHEN direction = 'out' AND fee_kind = 'fee' THEN fee_gbp END), 0) received,
              SUM(direction = 'in') signings,
              SUM(direction = 'out') departures
       FROM transfers
       WHERE date IS NOT NULL
       GROUP BY year
       ORDER BY year`,
    )
    .all() as SpendYear[];
}

export interface NetSpendBucket {
  bucket: string;
  bucket_id: string;
  spend: number;
  received: number;
  net: number;
  signings: number;
  departures: number;
}

/**
 * Known-fee spend, receipts and net by the manager in charge on the transfer
 * date (joined through manager_tenures, mirroring how matches map to managers).
 */
export function netSpendByManager(): NetSpendBucket[] {
  return getDb()
    .prepare(
      `SELECT mg.name bucket, mg.id bucket_id,
              COALESCE(SUM(CASE WHEN t.direction = 'in' AND t.fee_kind = 'fee' THEN t.fee_gbp END), 0) spend,
              COALESCE(SUM(CASE WHEN t.direction = 'out' AND t.fee_kind = 'fee' THEN t.fee_gbp END), 0) received,
              COALESCE(SUM(CASE WHEN t.direction = 'in' AND t.fee_kind = 'fee' THEN t.fee_gbp
                                WHEN t.direction = 'out' AND t.fee_kind = 'fee' THEN -t.fee_gbp END), 0) net,
              SUM(t.direction = 'in') signings,
              SUM(t.direction = 'out') departures
       FROM transfers t
       JOIN manager_tenures mt ON t.date >= mt.date_from AND (mt.date_to IS NULL OR t.date <= mt.date_to)
       JOIN managers mg ON mg.id = mt.manager_id
       WHERE t.date IS NOT NULL
       GROUP BY mg.id
       HAVING spend > 0 OR received > 0
       ORDER BY net DESC`,
    )
    .all() as NetSpendBucket[];
}

/** Net spend and signing/departure counts during one manager's tenure. */
export function managerTransferSummary(managerId: string): NetSpendBucket | undefined {
  return getDb()
    .prepare(
      `SELECT mg.name bucket, mg.id bucket_id,
              COALESCE(SUM(CASE WHEN t.direction = 'in' AND t.fee_kind = 'fee' THEN t.fee_gbp END), 0) spend,
              COALESCE(SUM(CASE WHEN t.direction = 'out' AND t.fee_kind = 'fee' THEN t.fee_gbp END), 0) received,
              COALESCE(SUM(CASE WHEN t.direction = 'in' AND t.fee_kind = 'fee' THEN t.fee_gbp
                                WHEN t.direction = 'out' AND t.fee_kind = 'fee' THEN -t.fee_gbp END), 0) net,
              SUM(t.direction = 'in') signings,
              SUM(t.direction = 'out') departures
       FROM transfers t
       JOIN manager_tenures mt ON t.date >= mt.date_from AND (mt.date_to IS NULL OR t.date <= mt.date_to)
       JOIN managers mg ON mg.id = mt.manager_id
       WHERE mg.id = ? AND t.date IS NOT NULL
       GROUP BY mg.id`,
    )
    .get(managerId) as NetSpendBucket | undefined;
}
