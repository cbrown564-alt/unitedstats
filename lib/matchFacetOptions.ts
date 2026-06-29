import { COMPETITION_TYPE_LABELS, resultLabel } from "@/lib/format";
import type { FacetOptions } from "@/lib/matchFacets";
import {
  allSeasons,
  competitionsList,
  managersIndex,
  matchCitiesList,
  opponentsIndex,
  playersIndex,
  stadiumsList,
} from "@/lib/queries";

const TYPE_FILTER_KEYS = ["league", "cup", "domestic-cup", "league-cup", "european", "unofficial"];
const RESULT_FILTER_KEYS = ["W", "D", "L"];
const GOAL_WINDOW_FILTERS = [
  { key: "firstHalf", label: "First half" },
  { key: "secondHalf", label: "Second half" },
  { key: "late", label: "Late" },
  { key: "stoppage", label: "Stoppage time" },
  { key: "extraTime", label: "Extra time" },
] as const;

/** Static facet option lists for the matches filter UI — immutable between deploys. */
export function buildMatchFacetOptions(): FacetOptions {
  const players = [...playersIndex()].sort((a, b) => a.name.localeCompare(b.name));
  const opponents = opponentsIndex();
  const comps = competitionsList();
  const managers = managersIndex();
  const stadiums = stadiumsList();
  const cities = matchCitiesList();

  return {
    opponent: opponents.map((o) => ({ value: o.id, label: o.name })),
    competition: comps.map((c) => ({ value: c.id, label: c.name })),
    season: allSeasons().map((s) => ({ value: s, label: s })),
    venue: [
      { value: "H", label: "Home" },
      { value: "A", label: "Away" },
      { value: "N", label: "Neutral" },
    ],
    result: RESULT_FILTER_KEYS.map((r) => ({ value: r, label: resultLabel(r) })),
    type: TYPE_FILTER_KEYS.map((t) => ({ value: t, label: COMPETITION_TYPE_LABELS[t] })),
    manager: managers.map((m) => ({ value: m.id, label: m.name })),
    stadium: stadiums.map((s) => ({ value: s.id, label: `${s.name}${s.city ? `, ${s.city}` : ""}` })),
    city: cities.map((c) => ({ value: c.city, label: c.city })),
    goalWindow: GOAL_WINDOW_FILTERS.map((w) => ({ value: w.key, label: w.label })),
    player: players.map((p) => ({ value: p.player_id, label: p.name })),
  };
}
