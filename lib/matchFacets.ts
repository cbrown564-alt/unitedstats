// Shared description of every Matches filter facet. This is the single place the
// set of filters is enumerated — the server page assembles option lists/chips from
// it, and the client MatchFilterBar reads it to build the chip row, the add-filter
// menu, and the per-facet editors. Keep this pure data: no DB or server-only
// imports, so it stays safe to pull into the client bundle.

type FacetKind = "datalist" | "select" | "date" | "minute" | "toggle";
export type FacetGroup = "who" | "what" | "where" | "when";

export interface FacetDef {
  /** searchParam key — also the matching MatchFilter field. */
  key: string;
  /** Label shown in the add-filter menu and the editor. */
  label: string;
  kind: FacetKind;
  /** Section the facet sits under in the add-filter menu. */
  group: FacetGroup;
  /** Key into the server-supplied option map (select + datalist facets). */
  optionsKey?: string;
  placeholder?: string;
  /** Value a toggle writes when switched on. */
  onValue?: string;
  /** Glyph name resolved by <FacetIcon>. */
  icon?: string;
}

export const FACET_GROUPS: { key: FacetGroup; label: string }[] = [
  { key: "who", label: "Who" },
  { key: "what", label: "What" },
  { key: "where", label: "Where" },
  { key: "when", label: "When" },
];

// Order within each group is the order shown in the add-filter menu.
export const MATCH_FACETS: FacetDef[] = [
  { key: "opponent", label: "Opponent", kind: "select", group: "who", optionsKey: "opponent", icon: "shield" },
  { key: "manager", label: "Manager", kind: "select", group: "who", optionsKey: "manager", icon: "suit" },
  { key: "player", label: "Player appeared", kind: "datalist", group: "who", optionsKey: "player", placeholder: "wayne-rooney", icon: "person" },
  { key: "scorer", label: "Goalscorer", kind: "datalist", group: "who", optionsKey: "player", placeholder: "eric-cantona", icon: "target" },
  { key: "assister", label: "Assister", kind: "datalist", group: "who", optionsKey: "player", placeholder: "wayne-rooney", icon: "arrow" },

  { key: "competition", label: "Competition", kind: "select", group: "what", optionsKey: "competition", icon: "trophy" },
  { key: "type", label: "Match type", kind: "select", group: "what", optionsKey: "type", icon: "tag" },
  { key: "result", label: "Result", kind: "select", group: "what", optionsKey: "result", icon: "flag" },
  { key: "aet", label: "Went to extra time", kind: "toggle", group: "what", onValue: "1", icon: "hourglass" },

  { key: "venue", label: "Venue", kind: "select", group: "where", optionsKey: "venue", icon: "home" },
  { key: "stadium", label: "Stadium", kind: "select", group: "where", optionsKey: "stadium", icon: "stadium" },
  { key: "city", label: "City", kind: "select", group: "where", optionsKey: "city", icon: "pin" },

  { key: "season", label: "Season", kind: "select", group: "when", optionsKey: "season", icon: "calendar" },
  { key: "from", label: "From", kind: "date", group: "when", icon: "calendar" },
  { key: "to", label: "To", kind: "date", group: "when", icon: "calendar" },
  { key: "goalWindow", label: "Goal timing", kind: "select", group: "when", optionsKey: "goalWindow", icon: "stopwatch" },
  { key: "goalFrom", label: "Goal from minute", kind: "minute", group: "when", placeholder: "86", icon: "stopwatch" },
  { key: "goalTo", label: "Goal to minute", kind: "minute", group: "when", placeholder: "90", icon: "stopwatch" },
];

export const FACET_BY_KEY: Record<string, FacetDef> = Object.fromEntries(
  MATCH_FACETS.map((f) => [f.key, f]),
);

/** Filters offered as tactile controls in the add-filter palette. */
export const PRIMARY_FACET_KEYS = [
  "opponent",
  "manager",
  "player",
  "scorer",
  "assister",
  "competition",
  "season",
] as const;

/** Narrowing dimensions the search bar understands — shown as hints, not palette picks. */
export const SEARCH_ONLY_FACET_KEYS = [
  "type",
  "result",
  "aet",
  "venue",
  "stadium",
  "city",
  "goalWindow",
  "goalFrom",
  "goalTo",
] as const;

export const PRIMARY_FACETS = PRIMARY_FACET_KEYS.map((k) => FACET_BY_KEY[k]);
export const SEARCH_ONLY_FACETS = SEARCH_ONLY_FACET_KEYS.map((k) => FACET_BY_KEY[k]);

/** Normalise a `from`/`to` param (bare year or ISO date) for `<input type="date">`. */
export function paramToInputDate(v: string | undefined, edge: "from" | "to"): string {
  if (!v) return "";
  if (/^\d{4}$/.test(v)) return edge === "from" ? `${v}-01-01` : `${v}-12-31`;
  return v.slice(0, 10);
}

export type FacetOption = { value: string; label: string };
export type FacetOptions = Record<string, FacetOption[]>;
/** Per-facet contextual option counts: facet key → option value → match count. */
export type FacetCounts = Record<string, Record<string, number>>;
