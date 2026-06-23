import { getDb } from "./db";
import { matchWhere, type MatchFilter, type Record_ } from "./queries";
import { COMPETITION_TYPE_LABELS, fmtNum, resultLabel, venueLabel } from "./format";
import { queryString } from "./url";

/**
 * The Cut — the keystone of the discovery layer (ROADMAP Phase 12).
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

export type CutDimension =
  | "decade" | "season" | "type" | "competition" | "venue" | "result" | "opponent" | "manager";

/** The lens — the measure that ranks the ladder and supplies the headline figure. */
export type CutMetric = "winrate" | "ppg" | "gd" | "matches";

/** The cut's slice — the subset of {@link MatchFilter} that round-trips through the URL. */
export type CutFilters = Pick<
  MatchFilter,
  "competition" | "opponent" | "manager" | "season" | "venue" | "result" | "type" | "from" | "to" | "q"
>;

export interface Cut {
  dimension: CutDimension;
  filters: CutFilters;
  metric: CutMetric;
  /** True only when the cut matches a registered {@link CURATED_CUTS} entry. */
  curated: boolean;
}

// ---- dimensions ----------------------------------------------------------

export const DIMENSIONS: { key: CutDimension; label: string; short: string; noun: string }[] = [
  { key: "decade", label: "By decade", short: "Decade", noun: "decades" },
  { key: "season", label: "By season", short: "Season", noun: "seasons" },
  { key: "type", label: "By competition type", short: "Type", noun: "competition types" },
  { key: "competition", label: "By competition", short: "Competition", noun: "competitions" },
  { key: "venue", label: "By venue", short: "Venue", noun: "venues" },
  { key: "result", label: "By result", short: "Result", noun: "results" },
  { key: "opponent", label: "By opponent", short: "Opponent", noun: "opponents" },
  { key: "manager", label: "By manager", short: "Manager", noun: "managers" },
];

const DIM_KEYS = new Set(DIMENSIONS.map((d) => d.key));
export function dimensionLabel(dim: CutDimension): string {
  return DIMENSIONS.find((d) => d.key === dim)?.short ?? dim;
}

/** Plural noun for a dimension's groups ("opponents"), singularised for a count of one. */
function dimensionNoun(dim: CutDimension, n: number): string {
  const plural = DIMENSIONS.find((d) => d.key === dim)?.noun ?? "groups";
  return n === 1 ? plural.replace(/s$/, "") : plural;
}

/** Chronological dimensions (decade, season) read in time order, not metric rank. */
export function isChronological(dim: CutDimension): boolean {
  return DIMS[dim].naturalOrder === "label";
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

const DIMS: Record<CutDimension, DimConfig> = {
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

export const METRICS: { key: CutMetric; label: string; short: string }[] = [
  { key: "winrate", label: "Win rate", short: "Win %" },
  { key: "ppg", label: "Points per game", short: "PPG" },
  { key: "gd", label: "Goal difference", short: "GD" },
  { key: "matches", label: "Matches played", short: "Played" },
];

const METRIC_KEYS = new Set(METRICS.map((m) => m.key));
export function metricLabel(metric: CutMetric): string {
  return METRICS.find((m) => m.key === metric)?.label ?? metric;
}

/** The metric's value for one group's record, or null when undefined (rate over 0). */
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
  }
}

/** Format a metric value for display, matching the lens. */
export function metricFmt(value: number | null, metric: CutMetric): string {
  if (value === null) return "—";
  switch (metric) {
    case "winrate":
      return `${value.toFixed(1)}%`;
    case "ppg":
      return value.toFixed(2);
    case "gd":
      return value > 0 ? `+${fmtNum(value)}` : fmtNum(value);
    case "matches":
      return fmtNum(value);
  }
}

/** Rate metrics mislead on tiny groups (a 100% win rate over two games tops nothing
 *  meaningful). Below this many matches a rate figure is "thin": it is flagged, sunk
 *  to the bottom of the ladder, and never eligible to headline — matching the
 *  "met at least twenty times" convention the bogey-sides question already uses. */
const MIN_RATE_SAMPLE = 20;
const RATE_METRICS = new Set<CutMetric>(["winrate", "ppg"]);

// ---- the engine ----------------------------------------------------------

export interface CutGroup extends Record_ {
  key: string;
  label: string;
  /** /matches link reproducing exactly this group's matches within the base filter. */
  href: string;
  /** The active-metric value, already computed. */
  value: number | null;
  /** A rate figure standing on a small sample — flagged, not hidden. */
  thin: boolean;
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
  /** Matches across the whole slice (every group summed). */
  played: number;
  /** The standout group for the active metric, or null over an empty slice. */
  headline: CutHeadline | null;
  coverage: CutCoverage;
}

/** The base-filter params carried into every row's /matches evidence link. */
function baseParams(f: CutFilters): Record<string, string | undefined> {
  return {
    competition: f.competition, opponent: f.opponent, manager: f.manager, season: f.season,
    venue: f.venue, result: f.result, type: f.type, from: f.from, to: f.to, q: f.q,
  };
}

/**
 * Run a Cut: aggregate the filtered record by its dimension, rank by its metric,
 * grade coverage, and pick the standout group for the headline. Null-keyed groups
 * (e.g. matches with no recorded manager) are dropped; the result is capped so a
 * high-cardinality cut (every opponent) stays readable, with the true count kept.
 */
export function runCut(cut: Cut, cap = 60): CutResult {
  const cfg = DIMS[cut.dimension];
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
  const played = rows.reduce((s, r) => s + r.p, 0);

  const groups: CutGroup[] = rows.map((r) => ({
    key: r.gkey,
    label: cfg.fmtLabel ? cfg.fmtLabel(r.gkey) : r.glabel,
    href: `/matches${queryString({ ...base, ...cfg.groupParam(r.gkey, cut.filters) })}`,
    p: r.p, w: r.w, d: r.d, l: r.l, gf: r.gf, ga: r.ga,
    value: metricValue(r, cut.metric),
    thin: RATE_METRICS.has(cut.metric) && r.p < MIN_RATE_SAMPLE,
  }));

  rankGroups(groups, cut.dimension, cut.metric);

  return {
    cut,
    groups: groups.slice(0, cap),
    total: groups.length,
    played,
    headline: buildHeadline(groups, cut.metric, cut.dimension),
    coverage: gradeCoverage(cut, played),
  };
}

/** Sort in place: a chronological dimension reads in key order; everything else by
 *  the lens (desc). For a rate metric, thin samples sink below every solid group, so
 *  the ladder leads with figures that mean something and stays coherent with the
 *  headline; ties break by sample size then label so order is deterministic. */
function rankGroups(groups: CutGroup[], dim: CutDimension, metric: CutMetric): void {
  if (DIMS[dim].naturalOrder === "label") {
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
function buildHeadline(groups: CutGroup[], metric: CutMetric, dim: CutDimension): CutHeadline | null {
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
  const gloss =
    metric === "matches"
      ? `the most of ${fmtNum(groups.length)} ${noun}`
      : `the strongest of ${fmtNum(groups.length)} ${noun}, from ${fmtNum(top.p)} ${top.p === 1 ? "match" : "matches"}`;

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
      basis: "No matches fit this cut — loosen a filter or change the slice.",
    };
  }
  const rate = RATE_METRICS.has(cut.metric);
  return {
    grade: "complete",
    basis: rate
      ? `Result-level record — complete for every official match in this slice. ${metricLabel(cut.metric)} over fewer than ${MIN_RATE_SAMPLE} matches is flagged thin and sorted below the solid groups, so a tiny sample never tops the ladder.`
      : "Result-level record — complete for every official match in this slice.",
  };
}

// ---- serialization -------------------------------------------------------

const FILTER_KEYS: (keyof CutFilters)[] = [
  "competition", "opponent", "manager", "season", "venue", "result", "type", "from", "to", "q",
];

/** A bare year (1999) expands to that year's edge; a full ISO date passes through,
 *  so an era/decade bound links to exactly the matches it counts — matching /matches. */
function normalizeDateBound(v: string | undefined, edge: "from" | "to"): string | undefined {
  if (!v) return undefined;
  return /^\d{4}$/.test(v) ? `${v}-${edge === "from" ? "01-01" : "12-31"}` : v;
}

/** Read a Cut from URL search params (the /cut route's query string). */
export function cutFromParams(sp: Record<string, string | undefined>): Cut {
  const dimension: CutDimension = DIM_KEYS.has(sp.by as CutDimension)
    ? (sp.by as CutDimension)
    : "decade";
  const metric: CutMetric = METRIC_KEYS.has(sp.metric as CutMetric)
    ? (sp.metric as CutMetric)
    : "winrate";
  const filters: CutFilters = {};
  for (const k of FILTER_KEYS) {
    const v = sp[k];
    if (v) filters[k] = v;
  }
  filters.from = normalizeDateBound(filters.from, "from");
  filters.to = normalizeDateBound(filters.to, "to");
  const cut: Cut = { dimension, metric, filters, curated: false };
  cut.curated = isCurated(cut);
  return cut;
}

/** The /cut URL that encodes this Cut. */
export function cutHref(cut: { dimension: CutDimension; metric: CutMetric; filters?: CutFilters }): string {
  return `/cut${queryString({ by: cut.dimension, metric: cut.metric, ...(cut.filters ?? {}) })}`;
}

/** A stable identity string for a cut's parameters, used to match the curated set. */
function canonicalKey(cut: { dimension: CutDimension; metric: CutMetric; filters?: CutFilters }): string {
  const f = cut.filters ?? {};
  const filterPart = FILTER_KEYS.filter((k) => f[k])
    .map((k) => `${k}=${f[k]}`)
    .join("&");
  return `${cut.dimension}|${cut.metric}|${filterPart}`;
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
    slug: "decades-by-win-rate",
    eyebrow: "By decade",
    title: "Every decade by win rate",
    blurb: "United's win rate across each ten-year span, 1880s to today.",
    dimension: "decade",
    metric: "winrate",
  },
  {
    slug: "opponents-by-win-rate",
    eyebrow: "By opponent",
    title: "Every opponent, by how often United beat them",
    blurb: "The clubs United beat most — and least — across the whole record.",
    dimension: "opponent",
    metric: "winrate",
  },
  {
    slug: "managers-by-points",
    eyebrow: "By manager",
    title: "Every manager by points per game",
    blurb: "Each reign restated in three-points-for-a-win terms, Mangnall to now.",
    dimension: "manager",
    metric: "ppg",
  },
  {
    slug: "competition-types-by-goal-difference",
    eyebrow: "By competition type",
    title: "League, cup, and Europe by goal difference",
    blurb: "Where United's goal difference runs deepest, by type of football.",
    dimension: "type",
    metric: "gd",
  },
  {
    slug: "venues-by-win-rate",
    eyebrow: "By venue",
    title: "Home, away, and neutral by win rate",
    blurb: "How much of United's record is built at Old Trafford and on the road.",
    dimension: "venue",
    metric: "winrate",
  },
  {
    slug: "seasons-by-points",
    eyebrow: "By season",
    title: "Every season by points per game",
    blurb: "The whole record, season by season, on a single modern scale.",
    dimension: "season",
    metric: "ppg",
  },
];

const CURATED_BY_KEY = new Map(CURATED_CUTS.map((c) => [canonicalKey(c), c]));

/** Does this cut exactly match a registered curated cut? (Drives indexability.) */
export function isCurated(cut: { dimension: CutDimension; metric: CutMetric; filters?: CutFilters }): boolean {
  return CURATED_BY_KEY.has(canonicalKey(cut));
}

/** The curated entry a cut matches, if any — its prose, title, and slug. */
export function curatedFor(cut: { dimension: CutDimension; metric: CutMetric; filters?: CutFilters }): CuratedCut | undefined {
  return CURATED_BY_KEY.get(canonicalKey(cut));
}

/** The Cut a curated entry describes. */
export function curatedCut(c: CuratedCut): Cut {
  return { dimension: c.dimension, metric: c.metric, filters: c.filters ?? {}, curated: true };
}
