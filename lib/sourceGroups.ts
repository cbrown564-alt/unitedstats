import type { SourceRecord } from "@/lib/queries";

export type SourceUsageRow = SourceRecord & { matches: number; facets: string };

type SourceGroupDef = {
  id: string;
  label: string;
  summary: string;
  sourceIds: string[];
};

/** Logical nests for the provenance register — e.g. four Wikimedia sources under one family. */
const SOURCE_GROUP_DEFS: SourceGroupDef[] = [
  {
    id: "wikipedia",
    label: "Wikipedia & Wikidata",
    summary: "Match and season articles, player lists, portraits, and positions from the Wikimedia stack.",
    sourceIds: ["wikipedia", "wikipedia-player-records", "wikidata-commons", "wikidata-positions"],
  },
  {
    id: "mufcinfo",
    label: "MUFCInfo",
    summary: "Historical lineups, goal minutes, and the transfer archive from mufcinfo.com.",
    sourceIds: ["mufcinfo-match-lineups", "mufcinfo-goal-minutes", "mufcinfo-transfers"],
  },
  {
    id: "result-backbone",
    label: "Result backbone",
    summary: "The official fixture spine — league, cup, and current-season results.",
    sourceIds: ["engsoccerdata", "openfootball"],
  },
  {
    id: "modern-detail",
    label: "Modern match detail",
    summary: "Events, lineups, cards, and attendance from structured modern feeds.",
    sourceIds: ["transfermarkt-datasets", "football-data-org"],
  },
];

export const SOURCE_FACET_LABELS: Record<string, string> = {
  result: "Results",
  "united-scorers": "United goalscorers",
  "opposition-goals": "Opposition goals",
  assists: "Assists",
  "starting-lineup": "Starting XI",
  "used-substitutes": "Substitutes used",
  bench: "Bench",
  cards: "Cards",
  attendance: "Attendance",
  notes: "Notes",
};

export type SourceTreeItem =
  | {
      type: "group";
      id: string;
      label: string;
      summary: string;
      sources: SourceUsageRow[];
      matches: number;
    }
  | { type: "source"; source: SourceUsageRow };

export function buildSourceTree(sources: SourceUsageRow[]): SourceTreeItem[] {
  const byId = new Map(sources.map((s) => [s.id, s]));
  const used = new Set<string>();
  const items: SourceTreeItem[] = [];

  for (const def of SOURCE_GROUP_DEFS) {
    const members = def.sourceIds.map((id) => byId.get(id)).filter(Boolean) as SourceUsageRow[];
    if (members.length === 0) continue;
    for (const m of members) used.add(m.id);
    items.push({
      type: "group",
      id: def.id,
      label: def.label,
      summary: def.summary,
      sources: members,
      matches: members.reduce((a, s) => a + s.matches, 0),
    });
  }

  for (const s of sources) {
    if (!used.has(s.id)) items.push({ type: "source", source: s });
  }

  return items.sort((a, b) => {
    const ma = a.type === "group" ? a.matches : a.source.matches;
    const mb = b.type === "group" ? b.matches : b.source.matches;
    return mb - ma || (a.type === "group" ? a.label : a.source.label).localeCompare(b.type === "group" ? b.label : b.source.label);
  });
}

export function formatSourceFacets(facets: string | null | undefined): string {
  if (!facets) return "Planned only";
  return facets
    .split(",")
    .filter(Boolean)
    .sort()
    .map((f) => SOURCE_FACET_LABELS[f.trim()] ?? f.trim())
    .join(", ");
}
