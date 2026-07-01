import type { SourceRecord } from "@/lib/queries";

export type SourceUsageRow = SourceRecord & {
  records: number;
  usageLabel: string;
  facets: string;
  /** Per–use-case counts when one source id serves several roles in a family. */
  useCaseStats?: Record<string, { records: number; usageLabel: string }>;
};

/** Preferred match facet when picking an on-file example — avoids attendance winning by row order. */
export const SOURCE_PRIMARY_FACET: Record<string, string> = {
  "mufcinfo-match-lineups": "starting-lineup",
  "mufcinfo-goal-minutes": "united-scorers",
  engsoccerdata: "result",
  openfootball: "result",
  "transfermarkt-datasets": "starting-lineup",
  wikipedia: "starting-lineup",
  curated: "result",
};

type SourceUseCaseDef = {
  id: string;
  sourceId: string;
  label: string;
  blurb: string;
};

type SourceFamilyDef = {
  id: string;
  label: string;
  summary: string;
  kind: string;
  url: string | null;
  useCases: SourceUseCaseDef[];
};

/** Families in the provenance register — one upstream source, several use cases beneath. */
const SOURCE_FAMILY_DEFS: SourceFamilyDef[] = [
  {
    id: "mufcinfo",
    label: "MUFCInfo",
    summary: "Historical lineups, goal minutes, and the transfer archive from mufcinfo.com.",
    kind: "reference",
    url: "https://www.mufcinfo.com/",
    useCases: [
      {
        sourceId: "mufcinfo-match-lineups",
        id: "mufcinfo-match-lineups",
        label: "Lineups",
        blurb: "Match-page starting XIs, shirt numbers, and players used from the bench.",
      },
      {
        sourceId: "mufcinfo-goal-minutes",
        id: "mufcinfo-goal-minutes",
        label: "Goal minutes",
        blurb: "Minute stamps on existing goal events from historical scoreboard blocks.",
      },
      {
        sourceId: "mufcinfo-transfers",
        id: "mufcinfo-transfers",
        label: "Transfers",
        blurb: "Arrivals and departures with fees where known, 1883–present.",
      },
    ],
  },
  {
    id: "wikipedia",
    label: "Wikipedia & Wikidata",
    summary: "Match and season articles, player lists, portraits, and positions from the Wikimedia stack.",
    kind: "article",
    url: "https://www.wikipedia.org/",
    useCases: [
      {
        sourceId: "wikipedia",
        id: "wikipedia",
        label: "Match articles",
        blurb: "Cup, European, and late-round fixtures — scorers, attendance, and lineups where structured.",
      },
      {
        sourceId: "wikipedia-player-records",
        id: "wikipedia-player-records",
        label: "Player lists",
        blurb: "Verified competitive starts, substitute appearances, totals, and goals.",
      },
      {
        sourceId: "wikidata-commons",
        id: "wikidata-commons",
        label: "Portraits",
        blurb: "Licensed image candidates with Commons attribution metadata.",
      },
      {
        sourceId: "wikidata-positions",
        id: "wikidata-positions",
        label: "Positions",
        blurb: "Primary playing position per player, collapsed to GK/DEF/MID/FWD.",
      },
    ],
  },
  {
    id: "transfermarkt",
    label: "transfermarkt",
    summary:
      "CC0 match sheets and transfer-time market values from the dcaribou/transfermarkt-datasets project.",
    kind: "dataset",
    url: "https://github.com/dcaribou/transfermarkt-datasets",
    useCases: [
      {
        sourceId: "transfermarkt-datasets",
        id: "transfermarkt-match-sheets",
        label: "Match sheets",
        blurb: "Goals, assists, cards, substitutions, lineups, and attendance from 2012 onward.",
      },
      {
        sourceId: "transfermarkt-datasets",
        id: "transfermarkt-transfer-values",
        label: "Transfer values",
        blurb:
          "Market value at the time of transfer, from the valuation time series — fees and the transfer spine still come from MUFCInfo.",
      },
    ],
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
  transfers: "Transfers",
  "player-totals": "Player totals",
  portraits: "Portraits",
  positions: "Positions",
  "season-aggregates": "Season aggregates",
  "shirt-numbers": "Shirt numbers",
  "transfer-values": "Transfer values",
};

export type SourceUseCase = SourceUseCaseDef & {
  records: number;
  usageLabel: string;
};

export type SourceFamily = {
  type: "family";
  id: string;
  label: string;
  summary: string;
  kind: string;
  url: string | null;
  useCases: SourceUseCase[];
  records: number;
};

export type SourceTreeItem = SourceFamily | { type: "source"; source: SourceUsageRow };

export function buildSourceTree(sources: SourceUsageRow[]): SourceTreeItem[] {
  const byId = new Map(sources.map((s) => [s.id, s]));
  const used = new Set<string>();
  const items: SourceTreeItem[] = [];

  for (const def of SOURCE_FAMILY_DEFS) {
    const useCases: SourceUseCase[] = [];
    for (const uc of def.useCases) {
      const source = byId.get(uc.sourceId);
      if (!source) continue;
      used.add(uc.sourceId);
      const stats = source.useCaseStats?.[uc.id] ?? {
        records: source.records,
        usageLabel: source.usageLabel,
      };
      useCases.push({
        ...uc,
        records: stats.records,
        usageLabel: stats.usageLabel,
      });
    }
    if (useCases.length === 0) continue;

    items.push({
      type: "family",
      id: def.id,
      label: def.label,
      summary: def.summary,
      kind: def.kind,
      url: def.url ?? byId.get(useCases[0].sourceId)?.url ?? null,
      useCases,
      records: Math.max(...useCases.map((u) => u.records)),
    });
  }

  for (const s of sources) {
    if (!used.has(s.id)) items.push({ type: "source", source: s });
  }

  return items.sort((a, b) => {
    const ra = a.type === "family" ? a.records : a.source.records;
    const rb = b.type === "family" ? b.records : b.source.records;
    return rb - ra || (a.type === "family" ? a.label : a.source.label).localeCompare(b.type === "family" ? b.label : b.source.label);
  });
}

export function parseSourceFacets(facets: string | null | undefined): string[] {
  if (!facets) return [];
  return facets
    .split(",")
    .map((f) => f.trim())
    .filter(Boolean)
    .sort()
    .map((f) => SOURCE_FACET_LABELS[f] ?? f);
}

export function formatSourceFacets(facets: string | null | undefined): string {
  return parseSourceFacets(facets).join(", ");
}

export function layerLabel(layer: string): string {
  return SOURCE_FACET_LABELS[layer] ?? layer;
}
