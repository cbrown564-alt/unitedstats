// Shared description of every Matches filter facet. This is the single place the
// set of filters is enumerated — the server page assembles option lists/chips from
// it, and the client MatchFilterBar reads it to build the chip row, the add-filter
// menu, and the per-facet editors. Keep this pure data: no DB or server-only
// imports, so it stays safe to pull into the client bundle.

type FacetKind = "datalist" | "select" | "year" | "minute" | "toggle";
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
}

export const FACET_GROUPS: { key: FacetGroup; label: string }[] = [
  { key: "who", label: "Who" },
  { key: "what", label: "What" },
  { key: "where", label: "Where" },
  { key: "when", label: "When" },
];

// Order within each group is the order shown in the add-filter menu.
export const MATCH_FACETS: FacetDef[] = [
  { key: "opponent", label: "Opponent", kind: "select", group: "who", optionsKey: "opponent" },
  { key: "manager", label: "Manager", kind: "select", group: "who", optionsKey: "manager" },
  { key: "player", label: "Player appeared", kind: "datalist", group: "who", optionsKey: "player", placeholder: "wayne-rooney" },
  { key: "scorer", label: "Scorer", kind: "datalist", group: "who", optionsKey: "player", placeholder: "eric-cantona" },
  { key: "assister", label: "Assister", kind: "datalist", group: "who", optionsKey: "player", placeholder: "wayne-rooney" },

  { key: "competition", label: "Competition", kind: "select", group: "what", optionsKey: "competition" },
  { key: "type", label: "Match type", kind: "select", group: "what", optionsKey: "type" },
  { key: "result", label: "Result", kind: "select", group: "what", optionsKey: "result" },
  { key: "aet", label: "Went to extra time", kind: "toggle", group: "what", onValue: "1" },

  { key: "venue", label: "Venue", kind: "select", group: "where", optionsKey: "venue" },
  { key: "stadium", label: "Stadium", kind: "select", group: "where", optionsKey: "stadium" },
  { key: "city", label: "City", kind: "select", group: "where", optionsKey: "city" },

  { key: "season", label: "Season", kind: "select", group: "when", optionsKey: "season" },
  { key: "from", label: "From year", kind: "year", group: "when", placeholder: "1886" },
  { key: "to", label: "To year", kind: "year", group: "when", placeholder: "2026" },
  { key: "goalWindow", label: "Goal timing", kind: "select", group: "when", optionsKey: "goalWindow" },
  { key: "goalFrom", label: "Goal from minute", kind: "minute", group: "when", placeholder: "86" },
  { key: "goalTo", label: "Goal to minute", kind: "minute", group: "when", placeholder: "90" },
];

export const FACET_BY_KEY: Record<string, FacetDef> = Object.fromEntries(
  MATCH_FACETS.map((f) => [f.key, f]),
);

export type FacetOption = { value: string; label: string };
export type FacetOptions = Record<string, FacetOption[]>;
/** Per-facet contextual option counts: facet key → option value → match count. */
export type FacetCounts = Record<string, Record<string, number>>;
