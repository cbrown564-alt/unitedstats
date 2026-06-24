import { cutHref, curatedFor, type Cut } from "./cut";
import type { MatchSourceRecord } from "./queries";
import { SITE_URL } from "./site";

export type CitableKind =
  | "match"
  | "entity"
  | "season"
  | "question"
  | "cut"
  | "answer"
  | "history-digest"
  | "correction"
  | "on-this-day"
  | "collection"
  | "embed";

export interface CitableUnitDefinition {
  kind: CitableKind;
  unit: string;
  key: string;
  path: string;
}

export const CITABLE_UNITS: CitableUnitDefinition[] = [
  { kind: "match", unit: "Match", key: "match id", path: "/match/[id]" },
  { kind: "entity", unit: "Entity page", key: "kind:id", path: "/player/[id], /manager/[id], /opponent/[id]" },
  { kind: "season", unit: "Season", key: "season id", path: "/seasons/[season]" },
  { kind: "question", unit: "Curated question", key: "question slug", path: "/questions/[slug]" },
  { kind: "cut", unit: "Cut", key: "curated slug or normalized /cut URL", path: "/cut?..." },
  { kind: "answer", unit: "Answer", key: "surface:key", path: "answer-shaped API/JSON-LD surfaces" },
  { kind: "history-digest", unit: "History-changed digest", key: "match id", path: "/history-changed/[matchId]" },
  { kind: "correction", unit: "Correction request", key: "target hash or issue id", path: "GitHub issue / correction builder" },
  { kind: "on-this-day", unit: "On-this-day entry", key: "MM-DD", path: "/on-this-day/[monthDay]" },
  { kind: "collection", unit: "Saved collection", key: "encoded collection payload", path: "/collection?..." },
  { kind: "embed", unit: "Embed", key: "surface:key", path: "/embed/..." },
];

export interface CitableRef {
  kind: CitableKind;
  key: string;
  id: string;
  path: string;
  url: string;
}

export function canonicalUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_URL}${normalized}`;
}

export function normalizePath(path: string): string {
  const [base, query = ""] = path.split("?");
  if (!query) return base || "/";
  const params = new URLSearchParams(query);
  const sorted = [...params.entries()].sort(([ak, av], [bk, bv]) => ak.localeCompare(bk) || av.localeCompare(bv));
  const out = new URLSearchParams();
  for (const [key, value] of sorted) out.set(key, value);
  return `${base}?${out.toString()}`;
}

export function citableId(kind: CitableKind, key: string): string {
  if (!key.trim()) throw new Error(`missing citable key for ${kind}`);
  return `us:${kind}:${encodeURIComponent(key)}`;
}

export function parseCitableId(id: string): { kind: CitableKind; key: string } | null {
  const match = /^us:([a-z-]+):(.+)$/.exec(id);
  if (!match) return null;
  const kind = match[1] as CitableKind;
  if (!CITABLE_UNITS.some((u) => u.kind === kind)) return null;
  return { kind, key: decodeURIComponent(match[2]) };
}

export function citableRef(kind: CitableKind, key: string, path: string): CitableRef {
  const normalizedPath = normalizePath(path);
  return {
    kind,
    key,
    id: citableId(kind, key),
    path: normalizedPath,
    url: canonicalUrl(normalizedPath),
  };
}

export function matchRef(matchId: string): CitableRef {
  return citableRef("match", matchId, `/match/${matchId}`);
}

export type EntityKind = "player" | "manager" | "opponent";

export function entityRef(kind: EntityKind, id: string): CitableRef {
  return citableRef("entity", `${kind}:${id}`, `/${kind}/${id}`);
}

export function seasonRef(season: string): CitableRef {
  return citableRef("season", season, `/seasons/${season}`);
}

export function questionRef(slug: string): CitableRef {
  return citableRef("question", slug, `/questions/${slug}`);
}

export function cutKey(cut: Cut): string {
  const curated = curatedFor(cut);
  if (curated) return curated.slug;
  return normalizePath(cutHref(cut));
}

export function cutRef(cut: Cut): CitableRef {
  return citableRef("cut", cutKey(cut), cutHref(cut));
}

export function answerRef(surface: string, key: string, path: string): CitableRef {
  return citableRef("answer", `${surface}:${key}`, path);
}

export function historyDigestRef(matchId: string): CitableRef {
  return citableRef("history-digest", matchId, `/history-changed/${matchId}`);
}

export function correctionRef(target: unknown, path = "/corrections"): CitableRef {
  return citableRef("correction", stableHash(target), path);
}

export function onThisDayRef(monthDay: string): CitableRef {
  return citableRef("on-this-day", monthDay, `/on-this-day/${monthDay}`);
}

export function collectionRef(encoded: string): CitableRef {
  return citableRef("collection", encoded, `/collection?c=${encodeURIComponent(encoded)}`);
}

export function embedRef(surface: string, key: string, path: string): CitableRef {
  return citableRef("embed", `${surface}:${key}`, path);
}

export function claimVersion(claim: unknown): string {
  return `cv1-${stableHash(claim)}`;
}

export function stableHash(value: unknown): string {
  const s = canonicalStringify(value);
  let h1 = 0xdeadbeef ^ s.length;
  let h2 = 0x41c6ce57 ^ s.length;
  for (let i = 0; i < s.length; i++) {
    const ch = s.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return `${(h2 >>> 0).toString(16).padStart(8, "0")}${(h1 >>> 0).toString(16).padStart(8, "0")}`;
}

export function canonicalStringify(value: unknown): string {
  return JSON.stringify(canonicalize(value));
}

function canonicalize(value: unknown): unknown {
  if (value === undefined) return undefined;
  if (value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map((v) => (v === undefined ? null : canonicalize(v)));
  const out: Record<string, unknown> = {};
  for (const key of Object.keys(value as Record<string, unknown>).sort()) {
    const v = canonicalize((value as Record<string, unknown>)[key]);
    if (v !== undefined) out[key] = v;
  }
  return out;
}

export interface ClaimProvenance {
  sourceId: string;
  sourceName: string;
  sourceUrl?: string;
  facet?: string;
  confidence?: string;
  scope?: string;
  evidencePath: string;
  evidenceUrl: string;
  retrievedAt?: string;
  statsAsOf?: string;
  note?: string;
}

export interface ProvenanceInput {
  sourceId: string;
  sourceName: string;
  sourceUrl?: string | null;
  facet?: string | null;
  confidence?: string | null;
  scope?: string | null;
  evidencePath: string;
  retrievedAt?: string | null;
  statsAsOf?: string | null;
  note?: string | null;
}

export function claimProvenance(input: ProvenanceInput): ClaimProvenance {
  const p: ClaimProvenance = {
    sourceId: input.sourceId,
    sourceName: input.sourceName,
    evidencePath: normalizePath(input.evidencePath),
    evidenceUrl: canonicalUrl(input.evidencePath),
  };
  if (input.sourceUrl) p.sourceUrl = input.sourceUrl;
  if (input.facet) p.facet = input.facet;
  if (input.confidence) p.confidence = input.confidence;
  if (input.scope) p.scope = input.scope;
  if (input.retrievedAt) p.retrievedAt = input.retrievedAt;
  if (input.statsAsOf) p.statsAsOf = input.statsAsOf;
  if (input.note) p.note = input.note;
  return p;
}

export function matchSourceProvenance(source: MatchSourceRecord, matchId: string): ClaimProvenance {
  return claimProvenance({
    sourceId: source.id,
    sourceName: source.label,
    sourceUrl: source.url,
    facet: source.facet,
    confidence: source.confidence,
    evidencePath: `/match/${matchId}`,
    note: source.source_note,
  });
}

interface SourceFacet {
  facet: string;
  confidence?: string;
}

export interface SourceProvenanceGroup {
  sourceId: string;
  sourceName: string;
  sourceUrl?: string;
  /** Facets this source recorded for the match, strongest confidence first. */
  facets: SourceFacet[];
  /** How many facets this source captured at `complete` confidence. */
  completeCount: number;
}

/** Confidence ordered strongest → weakest, so a source's best coverage leads. */
const CONFIDENCE_RANK: Record<string, number> = { complete: 0, supporting: 1, partial: 2 };

function confidenceRank(c?: string): number {
  return c != null && c in CONFIDENCE_RANK ? CONFIDENCE_RANK[c] : 3;
}

/**
 * Collapse a flat, facet-first provenance list into one entry per source, each
 * carrying exactly the facets that source recorded for this match. Turns the
 * repetitive "source · facet" dump into a contextually relevant "what did each
 * source capture here" view. Sources are ordered by how much they cover
 * (complete facets, then total facets), then by name; facets within a source by
 * confidence then facet name — both deterministic for stable artifacts.
 */
export function groupProvenanceBySource(provenance: ClaimProvenance[]): SourceProvenanceGroup[] {
  const groups = new Map<string, SourceProvenanceGroup>();
  for (const p of provenance) {
    let g = groups.get(p.sourceId);
    if (!g) {
      g = { sourceId: p.sourceId, sourceName: p.sourceName, completeCount: 0, facets: [] };
      if (p.sourceUrl) g.sourceUrl = p.sourceUrl;
      groups.set(p.sourceId, g);
    }
    if (p.facet && !g.facets.some((f) => f.facet === p.facet)) {
      g.facets.push({ facet: p.facet, ...(p.confidence ? { confidence: p.confidence } : {}) });
      if (p.confidence === "complete") g.completeCount += 1;
    }
  }
  const ordered = [...groups.values()];
  for (const g of ordered) {
    g.facets.sort((a, b) => confidenceRank(a.confidence) - confidenceRank(b.confidence) || (a.facet < b.facet ? -1 : a.facet > b.facet ? 1 : 0));
  }
  ordered.sort(
    (a, b) =>
      b.completeCount - a.completeCount ||
      b.facets.length - a.facets.length ||
      (a.sourceName < b.sourceName ? -1 : a.sourceName > b.sourceName ? 1 : 0),
  );
  return ordered;
}
