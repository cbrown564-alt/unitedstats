import { getDb } from "./db";
import { matchWhere, type MatchFilter, type Record_ } from "./queries";
import { COMPETITION_TYPE_LABELS, resultLabel, venueLabel } from "./format";
import { queryString } from "./url";

/**
 * The "build your own cut" explorer: take the same filter the match browser uses,
 * pick a dimension to break it down by, and get an aggregate record per group —
 * each row linking back to exactly the matches it counts. It is the aggregate
 * companion to /matches: that page answers one slice, this one answers "how does
 * that slice split by decade / opponent / venue / …".
 */

export type GroupDim =
  | "decade" | "season" | "competition" | "type" | "venue" | "opponent" | "manager" | "result";

interface ExploreRow extends Record_ {
  key: string;
  label: string;
  /** /matches link reproducing this group within the base filter. */
  href: string;
}

export const GROUP_DIMS: { key: GroupDim; label: string }[] = [
  { key: "decade", label: "Decade" },
  { key: "season", label: "Season" },
  { key: "type", label: "Competition type" },
  { key: "competition", label: "Competition" },
  { key: "venue", label: "Venue" },
  { key: "result", label: "Result" },
  { key: "opponent", label: "Opponent" },
  { key: "manager", label: "Manager" },
];

interface DimConfig {
  /** SQL expression yielding the group key. */
  groupExpr: string;
  /** SQL expression yielding the display label (may equal the key). */
  labelExpr: string;
  join?: string;
  /** Override the SQL label in JS (for coded keys like venue/result/type). */
  fmtLabel?: (key: string) => string;
  /** /matches params that select this group, merged over the base filter. */
  groupParam: (key: string, base: MatchFilter) => Record<string, string | undefined>;
  /** Chronological dims read better in key order; the rest default to most matches. */
  defaultSort: "label" | "matches";
}

const DIMS: Record<GroupDim, DimConfig> = {
  decade: {
    groupExpr: "substr(m.date,1,3) || '0s'",
    labelExpr: "substr(m.date,1,3) || '0s'",
    groupParam: (key, base) => {
      // The decade window, intersected with any base date bounds so the link
      // reproduces exactly the matches this row counted.
      const start = `${key.slice(0, 4)}-01-01`;
      const end = `${Number(key.slice(0, 4)) + 9}-12-31`;
      return {
        from: base.from && base.from > start ? base.from : start,
        to: base.to && base.to < end ? base.to : end,
      };
    },
    defaultSort: "label",
  },
  season: {
    groupExpr: "m.season",
    labelExpr: "m.season",
    groupParam: (key) => ({ season: key }),
    defaultSort: "label",
  },
  type: {
    groupExpr: "c.type",
    labelExpr: "c.type",
    fmtLabel: (key) => COMPETITION_TYPE_LABELS[key] ?? key,
    groupParam: (key) => ({ type: key }),
    defaultSort: "matches",
  },
  competition: {
    groupExpr: "m.competition_id",
    labelExpr: "c.name",
    groupParam: (key) => ({ competition: key }),
    defaultSort: "matches",
  },
  venue: {
    groupExpr: "m.venue",
    labelExpr: "m.venue",
    fmtLabel: (key) => venueLabel(key),
    groupParam: (key) => ({ venue: key }),
    defaultSort: "matches",
  },
  result: {
    groupExpr: "m.result",
    labelExpr: "m.result",
    fmtLabel: (key) => resultLabel(key),
    groupParam: (key) => ({ result: key }),
    defaultSort: "matches",
  },
  opponent: {
    groupExpr: "m.opponent_id",
    labelExpr: "m.opponent_name",
    groupParam: (key) => ({ opponent: key }),
    defaultSort: "matches",
  },
  manager: {
    groupExpr: "m.manager_id",
    labelExpr: "mg.name",
    join: "LEFT JOIN managers mg ON mg.id = m.manager_id",
    groupParam: (key) => ({ manager: key }),
    defaultSort: "matches",
  },
};

export type ExploreSort = "matches" | "winrate" | "label";

/** The base-filter query params carried into every row's evidence link. */
function baseParams(f: MatchFilter): Record<string, string | undefined> {
  return {
    competition: f.competition, opponent: f.opponent, manager: f.manager, season: f.season,
    venue: f.venue, result: f.result, type: f.type, stadium: f.stadium, city: f.city,
    from: f.from, to: f.to, q: f.q,
  };
}

export interface ExploreResult {
  rows: ExploreRow[];
  total: number;
  defaultSort: ExploreSort;
}

/**
 * Aggregate the filtered record by `dim`. Groups with a null key (e.g. matches
 * with no recorded manager) are dropped; results are sorted per the requested
 * order — or the dimension's natural default — and capped so a high-cardinality
 * cut (every opponent) stays readable, with the true group count returned.
 */
export function exploreGroups(
  dim: GroupDim,
  base: MatchFilter,
  sort: ExploreSort | undefined,
  cap = 100,
): ExploreResult {
  const cfg = DIMS[dim];
  const { cond, params } = matchWhere(base);
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

  const base_ = baseParams(base);
  const built: ExploreRow[] = rows.map((r) => ({
    key: r.gkey,
    label: cfg.fmtLabel ? cfg.fmtLabel(r.gkey) : r.glabel,
    href: `/matches${queryString({ ...base_, ...cfg.groupParam(r.gkey, base) })}`,
    p: r.p, w: r.w, d: r.d, l: r.l, gf: r.gf, ga: r.ga,
  }));

  const effective: ExploreSort = sort ?? cfg.defaultSort;
  built.sort((a, b) => {
    if (effective === "label") return a.label.localeCompare(b.label);
    if (effective === "winrate") return b.w / (b.p || 1) - a.w / (a.p || 1) || b.p - a.p;
    return b.p - a.p || a.label.localeCompare(b.label);
  });

  return { rows: built.slice(0, cap), total: built.length, defaultSort: cfg.defaultSort };
}
