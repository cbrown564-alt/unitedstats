/**
 * Shared types and paths for the copy-review catalog (Phase 0–1).
 * Source of truth for prose remains the TS/TSX registries; these JSON files
 * are the review layer (inventory + queue status).
 */

import fs from "node:fs";
import path from "node:path";

export type CopyTier = "A" | "B" | "C";

export type CopyKind =
  | "tagline"
  | "question"
  | "label"
  | "summary"
  | "finding"
  | "slice"
  | "coverage"
  | "gloss"
  | "stakes"
  | "hook"
  | "title"
  | "blurb"
  | "eyebrow"
  | "dek"
  | "hint"
  | "placeholder"
  | "editorial"
  | "description"
  | "template";

export type CopyQueueStatus = "todo" | "rewritten" | "keep" | "skip";

export interface CopyItem {
  id: string;
  group: string;
  tier: CopyTier;
  route?: string;
  file: string;
  kind: CopyKind;
  text: string;
  siblings?: string[];
}

export interface CopyCatalogFile {
  generatedAt: string;
  itemCount: number;
  byTier: Record<CopyTier, number>;
  items: CopyItem[];
}

export interface CopyQueueEntry {
  id: string;
  status: CopyQueueStatus;
  notes?: string;
  updatedAt?: string;
}

export interface CopyQueueFile {
  updatedAt: string;
  entries: Record<string, CopyQueueEntry>;
}

export const COPY_CONTENT_DIR = path.join(process.cwd(), "content");
export const COPY_CATALOG_PATH = path.join(COPY_CONTENT_DIR, "copy-catalog.json");
export const COPY_QUEUE_PATH = path.join(COPY_CONTENT_DIR, "copy-queue.json");

/** Registries the extractor must cover (Tier A pins). */
export const TIER_A_SOURCE_FILES = [
  "lib/site.ts",
  "lib/questions.ts",
  "lib/questionHeadlines.ts",
  "lib/curatedNights.ts",
  "lib/compare.ts",
  "lib/cut.ts",
  "components/QuestionModules.tsx",
  "app/page.tsx",
  "app/explore/page.tsx",
  "app/compare/page.tsx",
  "app/data/page.tsx",
] as const;

export function loadCopyCatalog(filePath = COPY_CATALOG_PATH): CopyCatalogFile {
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as CopyCatalogFile;
}

export function loadCopyQueue(filePath = COPY_QUEUE_PATH): CopyQueueFile {
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as CopyQueueFile;
}

export function emptyQueue(): CopyQueueFile {
  return { updatedAt: new Date().toISOString(), entries: {} };
}

/** Merge catalog ids into the queue: keep status/notes for existing ids; add todo for new. */
export function mergeQueue(
  prev: CopyQueueFile,
  catalogIds: string[],
  now = new Date().toISOString(),
): CopyQueueFile {
  const entries: Record<string, CopyQueueEntry> = {};
  const idSet = new Set(catalogIds);
  for (const id of catalogIds) {
    const existing = prev.entries[id];
    entries[id] = existing
      ? { ...existing, id }
      : { id, status: "todo" };
  }
  // Drop queue rows whose catalog id disappeared (source removed).
  void idSet;
  return { updatedAt: now, entries };
}

export function countByStatus(queue: CopyQueueFile): Record<CopyQueueStatus, number> {
  const counts: Record<CopyQueueStatus, number> = {
    todo: 0,
    rewritten: 0,
    keep: 0,
    skip: 0,
  };
  for (const e of Object.values(queue.entries)) {
    counts[e.status] += 1;
  }
  return counts;
}
