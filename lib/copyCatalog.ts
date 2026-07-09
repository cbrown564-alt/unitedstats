/**
 * Server-side copy catalog/queue IO. Client UI imports types from `lib/copyTypes`.
 *
 * The committed queue lives under content/. Live Studio writes go to a temp file
 * outside the repo so saving status does not trip Next/Turbopack file watching
 * and Fast Refresh (which previously death-spiraled on /dev/copy).
 */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import type { CopyCatalogFile, CopyQueueEntry, CopyQueueFile, CopyQueueStatus } from "./copyTypes";

export type {
  CopyCatalogFile,
  CopyItem,
  CopyKind,
  CopyQueueFile,
  CopyQueueStatus,
  CopyTier,
} from "./copyTypes";
export {
  countByStatus,
  isCopyQueueStatus,
} from "./copyTypes";

export const COPY_CONTENT_DIR = path.join(process.cwd(), "content");
export const COPY_CATALOG_PATH = path.join(COPY_CONTENT_DIR, "copy-catalog.json");
/** Committed queue — updated by `copy:extract` / `copy:persist`, not by live Studio saves. */
export const COPY_QUEUE_PATH = path.join(COPY_CONTENT_DIR, "copy-queue.json");
/** Live Studio queue — outside the project tree so writes do not trigger HMR. */
export const COPY_QUEUE_RUNTIME_PATH = path.join(os.tmpdir(), "unitedstats-copy-queue.json");

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

function readQueueFile(filePath: string): CopyQueueFile | null {
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as CopyQueueFile;
}

/**
 * Prefer the live runtime queue (Studio saves), else the committed content/ file.
 * Pass an explicit path to force one or the other (tests / extract).
 */
export function loadCopyQueue(filePath?: string): CopyQueueFile {
  if (filePath) {
    const forced = readQueueFile(filePath);
    if (!forced) throw new Error(`missing copy queue: ${filePath}`);
    return forced;
  }
  return (
    readQueueFile(COPY_QUEUE_RUNTIME_PATH) ??
    readQueueFile(COPY_QUEUE_PATH) ??
    emptyQueue()
  );
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

/** Live Studio saves — temp path only (avoids Turbopack HMR). */
export function saveCopyQueue(queue: CopyQueueFile, filePath = COPY_QUEUE_RUNTIME_PATH): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(queue, null, 2)}\n`);
}

/** Write the committed content/copy-queue.json (extract / persist). */
export function persistCopyQueue(queue: CopyQueueFile): void {
  fs.mkdirSync(COPY_CONTENT_DIR, { recursive: true });
  fs.writeFileSync(COPY_QUEUE_PATH, `${JSON.stringify(queue, null, 2)}\n`);
}

/**
 * Seed runtime queue from committed file when missing, and return the active queue.
 * Used by extract so statuses survive across machines via content/, while Studio
 * keeps writing to the temp runtime path.
 */
export function syncRuntimeQueueFromCommitted(): CopyQueueFile {
  const committed = readQueueFile(COPY_QUEUE_PATH) ?? emptyQueue();
  const runtime = readQueueFile(COPY_QUEUE_RUNTIME_PATH);
  if (!runtime) {
    saveCopyQueue(committed);
    return committed;
  }
  // Prefer runtime statuses when both exist (local work in progress).
  return runtime;
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
