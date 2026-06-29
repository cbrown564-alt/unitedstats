import { getDb } from "./db";
import { matchWhere, type MatchFilter, type Record_ } from "./queries";
import { COMPETITION_TYPE_LABELS, fmtNum, resultLabel, venueLabel } from "./format";
import { queryString } from "./url";

/**
 * The Cut — the keystone of the discovery layer.
 *
 * A Cut is one serializable description of a slice of the record: filter the
 * fixtures, group them by a `dimension`, rank and headline them by a `metric`
 * (the lens), and grade the `coverage` behind the answer. `curated` marks the
 * registered cuts that earn an indexable canonical page; every other parameter
 * combination is a *fork* — a real shareable URL, but `noindex`, so forking can
 * be unbounded without spawning thin-content pages (the SEO guardrail).
 *
 * The same object expresses all three discovery surfaces: a question is a curated
 * Cut with prose, a comparison is a Cut with two subjects, a group is a Cut
 * grouped by a dimension. Only the group cut needs a *generic* renderer (because a
 * fork produces an arbitrary group), so that is what this engine computes; the
 * bespoke question/comparison renderers stay as they are and reuse the model only
 * for serialization, sharing, and the fork link.
 *
 * `coverage` is a *derived* member, computed by {@link runCut} from the filters and
 * metric — never read back from the URL, so a forked link can never lie about its
 * own completeness. It is the spec's coverage field, attached to the result.
 */

/** What a Cut counts: the team's match record, or players' output. The subject
 *  gates which dimensions and metrics are valid and which fact source is queried;
 *  everything downstream (ranking, the chart, coverage, the fork URL) is shared. */
export type CutSubject = "team" | "player";

export type CutDimension =
  // shared (match-based): valid for both subjects
  | "season" | "decade" | "type" | "competition" | "venue" | "opponent"
  // team-only
  | "result" | "manager"
  // player-only
  | "player";

/** The lens — the measure that ranks the ladder and supplies the headline figure. */
export type CutMetric =
  // team
  | "winrate" | "ppg" | "gd" | "matches"
  // player
  | "goals" | "apps" | "starts" | "goalsperapp";

/** The cut's slice — the subset of {@link MatchFilter} that round-trips through the URL. */
export type CutFilters = Pick<
  MatchFilter,
  "competition" | "opponent" | "manager" | "season" | "venue" | "result" | "type" | "from" | "to" | "q" | "player"
>;

export interface Cut {
  subject: CutSubject;
  dimension: CutDimension;
  filters: CutFilters;
  metric: CutMetric;
  /** True only when the cut matches a registered {@link CURATED_CUTS} entry. */
  curated: boolean;
}

// ---- dimensions ----------------------------------------------------------

interface DimMeta { key: CutDimension; label: string; short: string; noun: string }

const DIM_META: Record<CutDimension, DimMeta> = {
  season: { key: "season", label: "By season", short: "Season", noun: "seasons" },
  decade: { key: "decade", label: "By decade", short: "Decade", noun: "decades" },
  type: { key: "type", label: "By competition type", short: "Type", noun: "competition types" },
  competition: { key: "competition", label: "By competition", short: "Competition", noun: "competitions" },
  venue: { key: "venue", label: "By venue", short: "Venue", noun: "venues" },
  result: { key: "result", label: "By result", short: "Result", noun: "results" },
  opponent: { key: "opponent", label: "By opponent", short: "Opponent", noun: "opponents" },
  manager: { key: "manager", label: "By manager", short: "Manager", noun: "managers" },
  player: { key: "player", label: "By player", short: "Player", noun: "players" },
};

const DIM_ORDER: Record<CutSubject, CutDimension[]> = {
  team: ["decade", "season", "type", "competition", "venue", "result", "opponent", "manager"],
  player: ["player", "season", "decade", "competition", "type", "opponent", "venue"],
};

export function dimensionLabel(dim: CutDimension): string {
  return DIM_META[dim]?.short ?? dim;
}

/** Plural noun for a dimension's groups ("opponents"), singularised for a count of one. */
function dimensionNoun(dim: CutDimension, n: number): string {
  const plural = DIM_META[dim]?.noun ?? "groups";
  return n === 1 ? plural.replace(/s$/, "") : plural;
}

/** Chronological dimensions (decade, season) read in time order, not metric rank. */
const CHRONO_DIMS = new Set<CutDimension>(["decade", "season"]);
export function isChronological(dim: CutDimension): boolean {
  return CHRONO_DIMS.has(dim);
}

interface DimConfig {
  /** SQL expression yielding the group key. */
  groupExpr: string;
  /** SQL expression yielding the display label (may equal the key). */
  labelExpr: string;
  join?: string;
  /** Override the SQL label in JS, for coded keys (venue/result/type). */
  fmtLabel?: (key: string) => string;
  /** /matches params that select this group, merged over the base filter. */
  groupParam: (key: string, base: CutFilters) => Record<string, string | undefined>;
  /** Chronological dims read better in key order; the rest default to the metric. */
  naturalOrder: "label" | "metric";
}

const DIMS: Record<Exclude<CutDimension, "player">, DimConfig> = {
  decade: {
    groupExpr: "substr(m.date,1,3) || '0s'",
    labelExpr: "substr(m.date,1,3) || '0s'",
    groupParam: (key, base) => {
      // The decade window, intersected with any base date bounds, so the link
      // reproduces exactly the matches this row counted.
      const start = `${key.slice(0, 4)}-01-01`;
      const end = `${Number(key.slice(0, 4)) + 9}-12-31`;
      return {
        from: base.from && base.from > start ? base.from : start,
        to: base.to && base.to < end ? base.to : end,
      };
    },
    naturalOrder: "label",
  },
  season: {
    groupExpr: "m.season",
    labelExpr: "m.season",
    groupParam: (key) => ({ season: key }),
    naturalOrder: "label",
  },
  type: {
    groupExpr: "c.type",
    labelExpr: "c.type",
    fmtLabel: (key) => COMPETITION_TYPE_LABELS[key] ?? key,
    groupParam: (key) => ({ type: key }),
    naturalOrder: "metric",
  },
  competition: {
    groupExpr: "m.competition_id",
    labelExpr: "c.name",
    groupParam: (key) => ({ competition: key }),
    naturalOrder: "metric",
  },
  venue: {
    groupExpr: "m.venue",
    labelExpr: "m.venue",
    fmtLabel: (key) => venueLabel(key),
    groupParam: (key) => ({ venue: key }),
    naturalOrder: "metric",
  },
  result: {
    groupExpr: "m.result",
    labelExpr: "m.result",
    fmtLabel: (key) => resultLabel(key),
    groupParam: (key) => ({ result: key }),
    naturalOrder: "metric",
  },
  opponent: {
    groupExpr: "m.opponent_id",
    labelExpr: "m.opponent_name",
    groupParam: (key) => ({ opponent: key }),
    naturalOrder: "metric",
  },
  manager: {
    groupExpr: "m.manager_id",
    labelExpr: "mg.name",
    join: "LEFT JOIN managers mg ON mg.id = m.manager_id",
    groupParam: (key) => ({ manager: key }),
    naturalOrder: "metric",
  },
};

// ---- metrics (the lens) --------------------------------------------------

interface MetricMeta { key: CutMetric; label: string; short: string }

const METRIC_META: Record<CutMetric, MetricMeta> = {
  winrate: { key: "winrate", label: "Win rate", short: "Win %" },
  ppg: { key: "ppg", label: "Points per game", short: "PPG" },
  gd: { key: "gd", label: "Goal difference", short: "GD" },
  matches: { key: "matches", label: "Matches played", short: "Played" },
  goals: { key: "goals", label: "Goals", short: "Goals" },
  apps: { key: "apps", label: "Appearances", short: "Apps" },
  starts: { key: "starts", label: "Starts", short: "Starts" },
  goalsperapp: { key: "goalsperapp", label: "Goals per app", short: "G/app" },
};

const METRIC_ORDER: Record<CutSubject, CutMetric[]> = {
  team: ["winrate", "ppg", "gd", "matches"],
  player: ["goals", "apps", "starts", "goalsperapp"],
};

export function metricLabel(metric: CutMetric): string {
  return METRIC_META[metric]?.label ?? metric;
}

/** The metric's value for one team group's record, or null when undefined (rate over 0). */
function metricValue(r: Record_, metric: CutMetric): number | null {
  switch (metric) {
    case "winrate":
      return r.p > 0 ? (100 * r.w) / r.p : null;
    case "ppg":
      return r.p > 0 ? (3 * r.w + r.d) / r.p : null;
    case "gd":
      return r.gf - r.ga;
    case "matches":
      return r.p;
    default:
      return null; // player metrics are computed in runPlayerCut
  }
}

/** Format a metric value for display, matching the lens. */
export function metricFmt(value: number | null, metric: CutMetric): string {
  if (value === null) return "—";
  switch (metric) {
    case "winrate":
      return `${value.toFixed(0)}%`;
    case "ppg":
      return value.toFixed(1);
    case "goalsperapp":
      return value.toFixed(2);
    case "gd":
      return value > 0 ? `+${fmtNum(value)}` : fmtNum(value);
    case "matches":
    case "goals":
    case "apps":
    case "starts":
      return fmtNum(value);
  }
}

/** Rate metrics mislead on tiny groups (a 100% win rate over two games tops nothing
 *  meaningful). Below this many matches/appearances a rate figure is "thin": it is
 *  flagged, sunk to the bottom of the ladder, and never eligible to headline —
 *  matching the "met at least twenty times" convention the questions already use. */
const MIN_RATE_SAMPLE = 20;
const RATE_METRICS = new Set<CutMetric>(["winrate", "ppg", "goalsperapp"]);
/** Count metrics headline as "the most of N", not "the strongest". */
const COUNT_METRICS = new Set<CutMetric>(["matches", "goals", "apps", "starts"]);

// ---- the engine ----------------------------------------------------------

export interface CutGroup {
  key: string;
  label: string;
  /** Evidence link reproducing exactly this group within the base filter. */
  href: string;
  /** The active-metric value, already computed. */
  value: number | null;
  /** A rate figure standing on a small sample — flagged, not hidden. */
  thin: boolean;
  /** Primary volume for the group: matches (team) or appearances (player). */
  p: number;
  /** Pre-built context line for tooltips, e.g. "1,184 matches · 600W 300D 284L"
   *  (team) or "559 apps · 253 goals" (player) — keeps the chart subject-agnostic. */
  meta: string;
  // Team record fields (zero for player groups); drive the form-bar baselines.
  w: number;
  d: number;
  l: number;
  gf: number;
  ga: number;
}

type CutGrade = "complete" | "partial" | "empty";

interface CutCoverage {
  grade: CutGrade;
  /** Plain-language basis for the grade, shown at the trust point. */
  basis: string;
}

interface CutHeadline {
  /** The standout group's key — lets the ladder accent the row it refers to. */
  key: string;
  /** The standout group's label. */
  subject: string;
  /** Its metric figure, formatted. */
  figure: string;
  /** The metric, lower-cased for the sentence ("win rate"). */
  metric: string;
  /** Trailing context: "the best of 14 decades, across 6,000 matches". */
  gloss: string;
  /** Evidence link to that group's matches. */
  href: string;
}

export interface CutResult {
  cut: Cut;
  groups: CutGroup[];
  /** Group count before the display cap. */
  total: number;
  /** Volume across the whole slice: matches (team) or appearances (player). */
  played: number;
  /** Slice-wide average for the lens — a contextual baseline drawn behind the chart;
   *  null for count metrics (matches, goals, apps, starts) where no line is meaningful. */
  baseline: number | null;
  /** The standout group for the active metric, or null over an empty slice. */
  headline: CutHeadline | null;
  coverage: CutCoverage;
}

/** The base-filter params carried into every row's /matches evidence link. */
function baseParams(f: CutFilters): Record<string, string | undefined> {
  return {
    competition: f.competition, opponent: f.opponent, manager: f.manager, season: f.season,
    venue: f.venue, result: f.result, type: f.type, from: f.from, to: f.to, q: f.q, player: f.player,
  };
}

/**
 * Run a Cut: aggregate the filtered record by its dimension, rank by its metric,
 * grade coverage, and pick the standout group for the headline. Null-keyed groups
 * (e.g. matches with no recorded manager) are dropped; the result is capped so a
 * high-cardinality cut (every opponent) stays readable, with the true count kept.
 */
export function runCut(cut: Cut, cap = 60): CutResult {
  return cut.subject === "player" ? runPlayerCut(cut, cap) : runTeamCut(cut, cap);
}

/** The team record, grouped by a match dimension and measured by a result metric. */
function runTeamCut(cut: Cut, cap: number): CutResult {
  const cfg = DIMS[cut.dimension as Exclude<CutDimension, "player">];
  const { cond, params } = matchWhere(cut.filters);
  const rows = getDb()
    .prepare(
      `SELECT ${cfg.groupExpr} AS gkey, ${cfg.labelExpr} AS glabel,
              COUNT(*) p, COALESCE(SUM(m.result='W'),0) w, COALESCE(SUM(m.result='D'),0) d,
              COALESCE(SUM(m.result='L'),0) l, COALESCE(SUM(m.gf),0) gf, COALESCE(SUM(m.ga),0) ga
       FROM matches m JOIN competitions c ON c.id = m.competition_id ${cfg.join ?? ""}
       ${cond}
       GROUP BY gkey
       HAVING gkey IS NOT NULL`,
    )
    .all(params) as (Record_ & { gkey: string; glabel: string })[];

  const base = baseParams(cut.filters);
  const t = rows.reduce(
    (a, r) => ({ p: a.p + r.p, w: a.w + r.w, d: a.d + r.d, gf: a.gf + r.gf, ga: a.ga + r.ga }),
    { p: 0, w: 0, d: 0, gf: 0, ga: 0 },
  );

  const groups: CutGroup[] = rows.map((r) => ({
    key: r.gkey,
    label: cfg.fmtLabel ? cfg.fmtLabel(r.gkey) : r.glabel,
    href: `/matches${queryString({ ...base, ...cfg.groupParam(r.gkey, cut.filters) })}`,
    p: r.p, w: r.w, d: r.d, l: r.l, gf: r.gf, ga: r.ga,
    value: metricValue(r, cut.metric),
    thin: RATE_METRICS.has(cut.metric) && r.p < MIN_RATE_SAMPLE,
    meta: `${fmtNum(r.p)} matches · ${r.w}W ${r.d}D ${r.l}L`,
  }));

  rankGroups(groups, cut.dimension, cut.metric);

  return {
    cut,
    groups: groups.slice(0, cap),
    total: groups.length,
    played: t.p,
    baseline: teamBaseline(cut.metric, t),
    headline: buildHeadline(groups, cut.metric, cut.dimension, cut.subject),
    coverage: gradeCoverage(cut, t.p),
  };
}

/** Slice-wide average for a team lens: the contextual baseline behind the chart. */
function teamBaseline(metric: CutMetric, t: { p: number; w: number; d: number }): number | null {
  if (t.p === 0) return null;
  switch (metric) {
    case "winrate":
      return (100 * t.w) / t.p;
    case "ppg":
      return (3 * t.w + t.d) / t.p;
    case "gd":
      return 0;
    default:
      return null;
  }
}

// ---- the player engine ---------------------------------------------------

/** A player group's tally, merged from the two fact sources. */
interface PlayerAcc { glabel: string; apps: number; starts: number; goals: number }

/** Player output, grouped by a dimension and measured by goals/apps/starts/rate.
 *
 *  Two complete-history sources are merged per group: appearances and starts from
 *  `match_lineups` (a player appeared if he started or came on), goals from
 *  `match_events`. A `player` filter is applied at the *attribution* level (count
 *  this player's output) rather than as a match filter, so "X's goals by season"
 *  counts X's goals — not every goal in the matches X played. Every other filter
 *  narrows the matches the output is drawn from. */
function runPlayerCut(cut: Cut, cap: number): CutResult {
  const dim = cut.dimension;
  const matchFilters: CutFilters = { ...cut.filters };
  const playerId = matchFilters.player;
  delete matchFilters.player;
  const { cond, params } = matchWhere(matchFilters);
  const extra = cond ? cond.replace(/^WHERE /, " AND ") : "";
  const bind = playerId ? { ...params, cutPlayer: playerId } : params;
  const pClause = (col: string) => (playerId ? ` AND ${col} = @cutPlayer` : "");

  const appsCols = playerDimSelect(dim, "l.player_id");
  const appsRows = getDb()
    .prepare(
      `SELECT ${appsCols.group} AS gkey, ${appsCols.label} AS glabel,
              COUNT(*) AS apps, COALESCE(SUM(l.started=1),0) AS starts
       FROM match_lineups l
       JOIN matches m ON m.id = l.match_id
       JOIN competitions c ON c.id = m.competition_id
       ${appsCols.joins}
       WHERE l.player_side='united' AND (l.started=1 OR l.sub_on IS NOT NULL)${pClause("l.player_id")}${extra}
       GROUP BY gkey HAVING gkey IS NOT NULL`,
    )
    .all(bind) as { gkey: string; glabel: string; apps: number; starts: number }[];

  const goalsCols = playerDimSelect(dim, "e.player_id");
  const goalsRows = getDb()
    .prepare(
      `SELECT ${goalsCols.group} AS gkey, ${goalsCols.label} AS glabel, COUNT(*) AS goals
       FROM match_events e
       JOIN matches m ON m.id = e.match_id
       JOIN competitions c ON c.id = m.competition_id
       ${goalsCols.joins}
       WHERE e.player_side='united' AND e.type IN ('goal','pen-goal')${pClause("e.player_id")}${extra}
       GROUP BY gkey HAVING gkey IS NOT NULL`,
    )
    .all(bind) as { gkey: string; glabel: string; goals: number }[];

  const merged = new Map<string, PlayerAcc>();
  for (const r of appsRows) {
    merged.set(String(r.gkey), { glabel: r.glabel, apps: r.apps, starts: r.starts, goals: 0 });
  }
  for (const r of goalsRows) {
    const k = String(r.gkey);
    const cur = merged.get(k);
    if (cur) cur.goals = r.goals;
    else merged.set(k, { glabel: r.glabel, apps: 0, starts: 0, goals: r.goals });
  }

  const base = baseParams(cut.filters);
  const fmtLabel = dim === "player" ? undefined : DIMS[dim as Exclude<CutDimension, "player">].fmtLabel;

  let totalApps = 0;
  let totalGoals = 0;
  const groups: CutGroup[] = [];
  for (const [gkey, a] of merged) {
    totalApps += a.apps;
    totalGoals += a.goals;
    groups.push({
      key: gkey,
      label: fmtLabel ? fmtLabel(gkey) : a.glabel,
      href: playerHref(dim, gkey, base, cut.filters),
      value: playerValue(cut.metric, a),
      thin: RATE_METRICS.has(cut.metric) && a.apps < MIN_RATE_SAMPLE,
      p: a.apps,
      meta: `${fmtNum(a.apps)} apps · ${fmtNum(a.starts)} starts · ${fmtNum(a.goals)} goals`,
      w: 0, d: 0, l: 0, gf: 0, ga: 0,
    });
  }

  rankGroups(groups, dim, cut.metric);
  const baseline = cut.metric === "goalsperapp" && totalApps > 0 ? totalGoals / totalApps : null;

  return {
    cut,
    groups: groups.slice(0, cap),
    total: groups.length,
    played: totalApps,
    baseline,
    headline: buildHeadline(groups, cut.metric, dim, cut.subject),
    coverage: gradeCoverage(cut, totalApps),
  };
}

function playerValue(metric: CutMetric, a: PlayerAcc): number | null {
  switch (metric) {
    case "goals":
      return a.goals;
    case "apps":
      return a.apps;
    case "starts":
      return a.starts;
    case "goalsperapp":
      return a.apps > 0 ? a.goals / a.apps : null;
    default:
      return null;
  }
}

/** Group/label/joins for a player dimension, parameterised by the base table's
 *  player-id column (`l.player_id` for lineups, `e.player_id` for events). Match
 *  dimensions reuse the team SQL (it reads `m`/`c`, joined in both queries). */
function playerDimSelect(
  dim: CutDimension,
  pidCol: string,
): { group: string; label: string; joins: string } {
  if (dim === "player") {
    return { group: pidCol, label: "pl.name", joins: `JOIN players pl ON pl.id = ${pidCol}` };
  }
  const cfg = DIMS[dim as Exclude<CutDimension, "player">];
  return { group: cfg.groupExpr, label: cfg.labelExpr, joins: cfg.join ?? "" };
}

/** Evidence link for a player group: the player's page for a by-player row, else
 *  the matches behind the slice (carrying any player filter) via /matches. */
function playerHref(
  dim: CutDimension,
  gkey: string,
  base: Record<string, string | undefined>,
  filters: CutFilters,
): string {
  if (dim === "player") return `/player/${gkey}`;
  const cfg = DIMS[dim as Exclude<CutDimension, "player">];
  return `/matches${queryString({ ...base, ...cfg.groupParam(gkey, filters) })}`;
}

/** Sort in place: a chronological dimension reads in key order; everything else by
 *  the lens (desc). For a rate metric, thin samples sink below every solid group, so
 *  the ladder leads with figures that mean something and stays coherent with the
 *  headline; ties break by sample size then label so order is deterministic. */
function rankGroups(groups: CutGroup[], dim: CutDimension, metric: CutMetric): void {
  if (isChronological(dim)) {
    groups.sort((a, b) => a.label.localeCompare(b.label));
    return;
  }
  const rate = RATE_METRICS.has(metric);
  groups.sort((a, b) => {
    if (rate && a.thin !== b.thin) return a.thin ? 1 : -1;
    const av = a.value ?? -Infinity;
    const bv = b.value ?? -Infinity;
    if (av !== bv) return bv - av;
    if (a.p !== b.p) return b.p - a.p;
    return a.label.localeCompare(b.label);
  });
}

/** The headline finding: the standout group for the metric. Rate metrics ignore
 *  thin samples so a 100% win rate over two games never leads the cut. */
function buildHeadline(
  groups: CutGroup[],
  metric: CutMetric,
  dim: CutDimension,
  subject: CutSubject,
): CutHeadline | null {
  if (groups.length === 0) return null;
  const eligible = RATE_METRICS.has(metric) ? groups.filter((g) => !g.thin) : groups;
  const ranked = [...(eligible.length ? eligible : groups)].sort((a, b) => {
    const av = a.value ?? -Infinity;
    const bv = b.value ?? -Infinity;
    return bv - av || b.p - a.p;
  });
  const top = ranked[0];
  if (!top || top.value === null) return null;

  const noun = dimensionNoun(dim, groups.length);
  const volNoun =
    subject === "player"
      ? top.p === 1 ? "appearance" : "appearances"
      : top.p === 1 ? "match" : "matches";
  const gloss = COUNT_METRICS.has(metric)
    ? `the most of ${fmtNum(groups.length)} ${noun}`
    : `the strongest of ${fmtNum(groups.length)} ${noun}, from ${fmtNum(top.p)} ${volNoun}`;

  return {
    key: top.key,
    subject: top.label,
    figure: metricFmt(top.value, metric),
    metric: metricLabel(metric).toLowerCase(),
    gloss,
    href: top.href,
  };
}

/** Grade the cut's coverage. The group engine ranks the *result* record, which is
 *  complete for every official match, so the only real holes are an empty slice
 *  (a fork whose filters intersect to nothing) and thin samples on rate metrics —
 *  surfaced rather than papered over, so a cut never shows a clean total over a hole. */
function gradeCoverage(cut: Cut, played: number): CutCoverage {
  if (played === 0) {
    return {
      grade: "empty",
      basis:
        cut.subject === "player"
          ? "No appearances fit this cut — loosen a filter or change the slice."
          : "No matches fit this cut — loosen a filter or change the slice.",
    };
  }
  const rate = RATE_METRICS.has(cut.metric);
  if (cut.subject === "player") {
    let basis =
      "Appearances and goals from the match-by-match record — lineups cover all but a handful of the 6,000+ matches and goalscorers span the full history. Assists are not yet a player lens.";
    if (rate) {
      basis += ` ${metricLabel(cut.metric)} over fewer than ${MIN_RATE_SAMPLE} appearances is flagged thin and sorted below the solid groups, so a tiny sample never tops the ladder.`;
    }
    return { grade: "complete", basis };
  }
  return {
    grade: "complete",
    basis: rate
      ? `Result-level record — complete for every official match in this slice. ${metricLabel(cut.metric)} over fewer than ${MIN_RATE_SAMPLE} matches is flagged thin and sorted below the solid groups, so a tiny sample never tops the ladder.`
      : "Result-level record — complete for every official match in this slice.",
  };
}

// ---- serialization -------------------------------------------------------

const FILTER_KEYS: (keyof CutFilters)[] = [
  "competition", "opponent", "manager", "season", "venue", "result", "type", "from", "to", "q", "player",
];

/** A bare year (1999) expands to that year's edge; a full ISO date passes through,
 *  so an era/decade bound links to exactly the matches it counts — matching /matches. */
function normalizeDateBound(v: string | undefined, edge: "from" | "to"): string | undefined {
  if (!v) return undefined;
  return /^\d{4}$/.test(v) ? `${v}-${edge === "from" ? "01-01" : "12-31"}` : v;
}

/** Read a Cut from URL search params (the /cut route's query string). The subject
 *  gates the valid dimensions and metrics; anything out of range falls back to that
 *  subject's default, so a stale or cross-subject URL never lands on an invalid cut. */
export function cutFromParams(sp: Record<string, string | undefined>): Cut {
  const subject: CutSubject = sp.subject === "player" ? "player" : "team";
  const dims = DIM_ORDER[subject];
  const metrics = METRIC_ORDER[subject];
  const dimension: CutDimension = dims.includes(sp.by as CutDimension)
    ? (sp.by as CutDimension)
    : dims[0];
  const metric: CutMetric = metrics.includes(sp.metric as CutMetric)
    ? (sp.metric as CutMetric)
    : metrics[0];
  const filters: CutFilters = {};
  for (const k of FILTER_KEYS) {
    const v = sp[k];
    if (v) filters[k] = v;
  }
  filters.from = normalizeDateBound(filters.from, "from");
  filters.to = normalizeDateBound(filters.to, "to");
  const cut: Cut = { subject, dimension, metric, filters, curated: false };
  cut.curated = isCurated(cut);
  return cut;
}

/** The /cut URL that encodes this Cut. Team is the default subject, so team URLs
 *  stay clean (no subject param) and curated canonical links are unchanged. */
export function cutHref(cut: {
  subject?: CutSubject;
  dimension: CutDimension;
  metric: CutMetric;
  filters?: CutFilters;
}): string {
  return `/cut${queryString({
    subject: cut.subject === "player" ? "player" : undefined,
    by: cut.dimension,
    metric: cut.metric,
    ...(cut.filters ?? {}),
  })}`;
}

/** A stable identity string for a cut's parameters, used to match the curated set. */
function canonicalKey(cut: {
  subject?: CutSubject;
  dimension: CutDimension;
  metric: CutMetric;
  filters?: CutFilters;
}): string {
  const f = cut.filters ?? {};
  const filterPart = FILTER_KEYS.filter((k) => f[k])
    .map((k) => `${k}=${f[k]}`)
    .join("&");
  return `${cut.subject ?? "team"}|${cut.dimension}|${cut.metric}|${filterPart}`;
}

// ---- the curated registry ------------------------------------------------

export interface CuratedCut {
  /** Stable slug — the canonical identity for SEO, sharing, and citation. */
  slug: string;
  eyebrow: string;
  title: string;
  blurb: string;
  dimension: CutDimension;
  metric: CutMetric;
  filters?: CutFilters;
}

/**
 * The cuts that earn an indexable canonical page — the Exploring strip's curated
 * set and the SEO-safe subset of the infinite fork space. These replace the old
 * "Group the record" launchers with real Cut pages; every other parameter combo a
 * reader forks into is the same engine, just `noindex`.
 */
export const CURATED_CUTS: CuratedCut[] = [
  {
    slug: "opponents-by-win-rate",
    eyebrow: "By opponent",
    title: "All opponents, ranked by win rate",
    blurb: "The opponents United dominated most — and those who proved hardest to beat — over 140 years.",
    dimension: "opponent",
    metric: "winrate",
  },
  {
    slug: "managers-by-points",
    eyebrow: "By manager",
    title: "Managers, ranked by points per game",
    blurb: "Every managerial reign restated under the three-points-for-a-win standard, Mangnall to the present.",
    dimension: "manager",
    metric: "ppg",
  },
  {
    slug: "seasons-by-points",
    eyebrow: "By season",
    title: "Seasons, ranked by points per game",
    blurb: "All 120+ league campaigns compared on a single, modern points-per-game scale.",
    dimension: "season",
    metric: "ppg",
  },
];

const CURATED_BY_KEY = new Map(CURATED_CUTS.map((c) => [canonicalKey(c), c]));

/** Does this cut exactly match a registered curated cut? (Drives indexability.) */
export function isCurated(cut: { subject?: CutSubject; dimension: CutDimension; metric: CutMetric; filters?: CutFilters }): boolean {
  return CURATED_BY_KEY.has(canonicalKey(cut));
}

/** The curated entry a cut matches, if any — its prose, title, and slug. */
export function curatedFor(cut: { subject?: CutSubject; dimension: CutDimension; metric: CutMetric; filters?: CutFilters }): CuratedCut | undefined {
  return CURATED_BY_KEY.get(canonicalKey(cut));
}

/** The Cut a curated entry describes. (All curated cuts are team cuts for now.) */
export function curatedCut(c: CuratedCut): Cut {
  return { subject: "team", dimension: c.dimension, metric: c.metric, filters: c.filters ?? {}, curated: true };
}
