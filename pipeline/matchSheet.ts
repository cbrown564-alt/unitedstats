import type { LineupEntry, Match, MatchEvent, SeasonFile } from "../scripts/lib";

const UNITED_GOAL_TYPES = new Set<MatchEvent["type"]>(["goal", "pen-goal", "own-goal-for"]);
const OPP_GOAL_TYPES = new Set<MatchEvent["type"]>(["opp-goal", "own-goal-against"]);
const CARD_TYPES = new Set<MatchEvent["type"]>(["card-yellow", "card-red"]);

export interface MatchSheet {
  id: string;
  date: string;
  opponent: string;
  score: [number, number];
  unitedStarters: number;
  unitedBench: number;
  starterShirts: number;
  substitutions: number;
  unitedGoalEvents: number;
  oppGoalEvents: number;
  assists: number;
  cards: number;
  sources: string[];
  complete: boolean;
  missing: string[];
}

function unitedRows(lineup: LineupEntry[] | undefined): LineupEntry[] {
  return (lineup ?? []).filter((row) => row.playerSide !== "opponent");
}

export function assessMatchSheet(match: Match): MatchSheet {
  const [gf, ga] = match.score.ft;
  const united = unitedRows(match.lineup);
  const starters = united.filter((row) => row.start);
  const bench = united.filter((row) => row.bench || (!row.start && row.on != null));
  const events = match.events ?? [];
  const unitedGoalEvents = events.filter((e) => UNITED_GOAL_TYPES.has(e.type)).length;
  const oppGoalEvents = events.filter((e) => OPP_GOAL_TYPES.has(e.type)).length;
  const missing: string[] = [];
  if (starters.length < 11) missing.push("united-starters");
  if (starters.filter((row) => row.shirt != null).length < 11) missing.push("starter-shirts");
  if (bench.length < 1) missing.push("bench");
  if (unitedGoalEvents < gf) missing.push("united-goals");
  if (oppGoalEvents < ga) missing.push("opp-goals");

  return {
    id: match.id,
    date: match.date,
    opponent: match.opponent,
    score: [gf, ga],
    unitedStarters: starters.length,
    unitedBench: bench.length,
    starterShirts: starters.filter((row) => row.shirt != null).length,
    substitutions: united.filter((row) => row.on != null || row.off != null).length,
    unitedGoalEvents,
    oppGoalEvents,
    assists: events.filter((e) => e.assist || e.assistName).length,
    cards: events.filter((e) => CARD_TYPES.has(e.type)).length,
    sources: [...match.sources],
    complete: missing.length === 0,
    missing,
  };
}

export function latestMatches(season: SeasonFile, limit: number): Match[] {
  return [...season.matches]
    .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id))
    .slice(0, limit);
}

export function formatSheetReport(sheets: MatchSheet[]): string {
  if (sheets.length === 0) return "No current-season matches to assess.";
  return sheets.map((sheet) => {
    const status = sheet.complete ? "COMPLETE" : `INCOMPLETE (${sheet.missing.join(", ")})`;
    return [
      `${sheet.date} ${sheet.id} ${sheet.score[0]}-${sheet.score[1]} v ${sheet.opponent}: ${status}`,
      `  XI ${sheet.unitedStarters} shirts ${sheet.starterShirts} bench ${sheet.unitedBench} subs ${sheet.substitutions}`,
      `  goals ${sheet.unitedGoalEvents}/${sheet.score[0]} opp ${sheet.oppGoalEvents}/${sheet.score[1]} assists ${sheet.assists} cards ${sheet.cards}`,
      `  sources ${sheet.sources.join(", ") || "(none)"}`,
    ].join("\n");
  }).join("\n");
}
