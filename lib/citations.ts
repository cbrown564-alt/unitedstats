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
  | "correction"
  | "on-this-day";

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
  { kind: "correction", unit: "Correction request", key: "target hash or issue id", path: "GitHub issue / correction builder" },
  { kind: "on-this-day", unit: "On-this-day entry", key: "MM-DD", path: "/on-this-day/[monthDay]" },
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

export function correctionRef(target: unknown, path = "/corrections"): CitableRef {
  return citableRef("correction", stableHash(target), path);
}

export function onThisDayRef(monthDay: string): CitableRef {
  return citableRef("on-this-day", monthDay, `/on-this-day/${monthDay}`);
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
