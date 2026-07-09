/**
 * Server-side copy catalog/queue IO. Client UI imports types from `lib/copyTypes`.
 */

import fs from "node:fs";
import path from "node:path";

import type { CopyCatalogFile, CopyQueueEntry, CopyQueueFile, CopyQueueStatus } from "./copyTypes";

export type {
  CopyCatalogFile,
  CopyItem,
  CopyKind,
  CopyQueueEntry,
  CopyQueueFile,
  CopyQueueStatus,
  CopyTier,
} from "./copyTypes";
export {
  COPY_QUEUE_STATUSES,
  COPY_RUBRIC_CHECKS,
  countByStatus,
  isCopyQueueStatus,
} from "./copyTypes";

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
  for (const id of catalogIds) {
    const existing = prev.entries[id];
    entries[id] = existing ? { ...existing, id } : { id, status: "todo" };
  }
  return { updatedAt: now, entries };
}

/** Copy Studio + queue API are local-dev only. */
export function copyStudioEnabled(): boolean {
  return process.env.NODE_ENV === "development";
}

export function saveCopyQueue(queue: CopyQueueFile, filePath = COPY_QUEUE_PATH): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(queue, null, 2)}\n`);
}

export function updateQueueEntry(
  queue: CopyQueueFile,
  id: string,
  patch: { status?: CopyQueueStatus; notes?: string | null },
  now = new Date().toISOString(),
): CopyQueueFile {
  const existing = queue.entries[id];
  if (!existing) {
    throw new Error(`unknown copy queue id: ${id}`);
  }
  const next: CopyQueueEntry = {
    ...existing,
    updatedAt: now,
  };
  if (patch.status !== undefined) next.status = patch.status;
  if (patch.notes !== undefined) {
    if (patch.notes === null || patch.notes.trim() === "") {
      delete next.notes;
    } else {
      next.notes = patch.notes;
    }
  }
  return {
    updatedAt: now,
    entries: { ...queue.entries, [id]: next },
  };
}
