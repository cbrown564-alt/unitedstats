import { roundMatchesFilter } from "../matchRounds";
import type { MatchEventBadge, MatchFilter, MatchRow, MatchesSummary } from "../queries";
import type { MatchCatalogRow, MatchGoalEvent } from "./catalogTypes";

function minuteLabel(minute: number | null, added: number | null): string {
  if (minute == null) return "?";
  return added && added > 0 ? `${minute}+${added}` : String(minute);
}

function hasGoalEventFilter(filter: MatchFilter): boolean {
  return Boolean(
    filter.scorer || filter.assister || filter.goalWindow || filter.goalFrom != null || filter.goalTo != null,
  );
}

function goalEventHits(event: MatchGoalEvent, match: MatchCatalogRow, filter: MatchFilter): boolean {
  if (filter.scorer) {
    if (event.player_id !== filter.scorer) return false;
    if (event.player_side !== "united") return false;
    if (event.type !== "goal" && event.type !== "pen-goal") return false;
  } else {
    if (event.type !== "goal" && event.type !== "pen-goal" && event.type !== "own-goal-for") return false;
  }
  if (filter.assister) {
    if (event.assist_id !== filter.assister) return false;
    if (event.assist_side !== "united") return false;
    if (event.type !== "goal" && event.type !== "pen-goal") return false;
  }
  if (filter.goalWindow || filter.goalFrom != null || filter.goalTo != null) {
    if (event.minute == null) return false;
  }
  switch (filter.goalWindow) {
    case "firstHalf":
      if (event.minute! < 1 || event.minute! > 45) return false;
      break;
    case "secondHalf":
      if (event.minute! < 46) return false;
      break;
    case "late":
      if (event.minute! < 86) return false;
      break;
    case "stoppage":
      if (!((event.added ?? 0) > 0 || (match.aet === 0 && event.minute! > 90))) return false;
      break;
    case "extraTime":
      if (!(match.aet === 1 && event.minute! > 90)) return false;
      break;
    case undefined:
      break;
    default: {
      const _exhaustive: never = filter.goalWindow;
      return _exhaustive;
    }
  }
  if (filter.goalFrom != null && event.minute! < filter.goalFrom) return false;
  if (filter.goalTo != null && event.minute! > filter.goalTo) return false;
  return true;
}

function matchesFilter(match: MatchCatalogRow, filter: MatchFilter): boolean {
  if (filter.competition && match.competition_id !== filter.competition) return false;
  if (filter.opponent && match.opponent_id !== filter.opponent) return false;
  if (filter.manager && match.manager_id !== filter.manager) return false;
  if (filter.season && match.season !== filter.season) return false;
  if (filter.venue && match.venue !== filter.venue) return false;
  if (filter.result && match.result !== filter.result) return false;
  if (filter.aet && match.aet !== 1) return false;
  if (filter.type === "cup") {
    if (match.competition_type === "league" || match.competition_type === "unofficial") return false;
  } else if (filter.type && match.competition_type !== filter.type) {
    return false;
  }
  if (filter.round && !roundMatchesFilter(match.round, filter.round)) return false;
  if (filter.stadium && match.stadium_id !== filter.stadium) return false;
  if (filter.city && match.stadium_city !== filter.city) return false;
  if (hasGoalEventFilter(filter) && !match.goalEvents.some((event) => goalEventHits(event, match, filter))) {
    return false;
  }
  if (filter.player && !match.starters.includes(filter.player)) return false;
  if (filter.from && match.date < filter.from) return false;
  if (filter.to && match.date > filter.to) return false;
  if (filter.q && !match.opponent_name.toLowerCase().includes(filter.q.toLowerCase())) return false;
  return true;
}

function sortMatches(rows: MatchCatalogRow[], sort: MatchFilter["sort"]): MatchCatalogRow[] {
  const key = sort ?? "date-desc";
  const copy = [...rows];
  switch (key) {
    case "date-desc":
      return copy;
    case "date-asc":
      return copy.reverse();
    case "gd-desc":
      return copy.sort((a, b) => b.gf - b.ga - (a.gf - a.ga) || b.gf - a.gf || b.date.localeCompare(a.date));
    case "gd-asc":
      return copy.sort((a, b) => a.gf - a.ga - (b.gf - b.ga) || b.ga - a.ga || b.date.localeCompare(a.date));
    default: {
      const _exhaustive: never = key;
      return _exhaustive;
    }
  }
}

export function filterCatalogMatches(matches: MatchCatalogRow[], filter: MatchFilter): MatchCatalogRow[] {
  return sortMatches(matches.filter((match) => matchesFilter(match, filter)), filter.sort);
}

export function catalogSummary(matches: MatchCatalogRow[]): MatchesSummary {
  let p = 0;
  let w = 0;
  let d = 0;
  let l = 0;
  let gf = 0;
  let ga = 0;
  let first: string | null = null;
  let last: string | null = null;
  let homeAtt = 0;
  let homeAttN = 0;
  for (const match of matches) {
    p += 1;
    if (match.result === "W") w += 1;
    else if (match.result === "D") d += 1;
    else l += 1;
    gf += match.gf;
    ga += match.ga;
    if (!first || match.date < first) first = match.date;
    if (!last || match.date > last) last = match.date;
    if (match.venue === "H" && match.attendance != null) {
      homeAtt += match.attendance;
      homeAttN += 1;
    }
  }
  return {
    p,
    w,
    d,
    l,
    gf,
    ga,
    first,
    last,
    avg_home_att: homeAttN > 0 ? Math.round(homeAtt / homeAttN) : null,
  };
}

export function catalogDecades(matches: MatchCatalogRow[]): { decade: string; from: number; to: number; n: number }[] {
  const counts = new Map<number, number>();
  for (const match of matches) {
    const from = Number(`${match.date.slice(0, 3)}0`);
    counts.set(from, (counts.get(from) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([from, n]) => ({ decade: `${from}s`, from, to: from + 9, n }));
}

export function catalogEventBadges(
  rows: MatchCatalogRow[],
  filter: Pick<MatchFilter, "scorer" | "assister" | "goalWindow" | "goalFrom" | "goalTo">,
): Record<string, MatchEventBadge> {
  if (!hasGoalEventFilter(filter)) return {};
  const out: Record<string, MatchEventBadge> = {};
  const noun = filter.assister && !filter.scorer ? "assist" : "goal";
  for (const row of rows) {
    const minutes = row.goalEvents
      .filter((event) => goalEventHits(event, row, filter))
      .map((event) => minuteLabel(event.minute, event.added));
    if (minutes.length > 0) out[row.id] = { count: minutes.length, noun, minutes };
  }
  return out;
}

export function catalogFacetCounts(
  matches: MatchCatalogRow[],
  filter: MatchFilter,
): Record<string, Record<string, number>> {
  const countBy = (key: keyof MatchFilter, value: (match: MatchCatalogRow) => string | null) => {
    const slice = filterCatalogMatches(matches, {
      ...filter,
      [key]: undefined,
      sort: undefined,
      limit: undefined,
      offset: undefined,
    });
    const counts: Record<string, number> = {};
    for (const match of slice) {
      const v = value(match);
      if (v) counts[v] = (counts[v] ?? 0) + 1;
    }
    return counts;
  };
  const typeRaw = countBy("type", (match) => match.competition_type);
  const cupTotal = Object.entries(typeRaw)
    .filter(([type]) => type !== "league" && type !== "unofficial")
    .reduce((sum, [, n]) => sum + n, 0);
  return {
    opponent: countBy("opponent", (match) => match.opponent_id),
    competition: countBy("competition", (match) => match.competition_id),
    season: countBy("season", (match) => match.season),
    venue: countBy("venue", (match) => match.venue),
    result: countBy("result", (match) => match.result),
    manager: countBy("manager", (match) => match.manager_id),
    stadium: countBy("stadium", (match) => match.stadium_id),
    city: countBy("city", (match) => match.stadium_city),
    type: cupTotal > 0 ? { ...typeRaw, cup: cupTotal } : typeRaw,
  };
}

export function catalogChipCounts(
  matches: MatchCatalogRow[],
  filter: MatchFilter,
  keys: string[],
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const key of keys) {
    const value = (filter as Record<string, unknown>)[key];
    if (value === undefined || value === false) continue;
    counts[key] = filterCatalogMatches(matches, { [key]: value } as MatchFilter).length;
  }
  return counts;
}

export function toMatchRow(row: MatchCatalogRow): MatchRow {
  const match: MatchRow & Partial<Pick<MatchCatalogRow, "starters" | "goalEvents">> = { ...row };
  delete match.starters;
  delete match.goalEvents;
  return match;
}
