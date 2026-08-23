/**
 * Client-safe copy-review types and constants (no Node fs).
 * Server loaders live in `lib/copyCatalog.ts`.
 */

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

export const COPY_QUEUE_STATUSES: CopyQueueStatus[] = ["todo", "rewritten", "keep", "skip"];

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

/** Rubric checklist shown beside every string in Copy Studio. */
export const COPY_RUBRIC_CHECKS: { id: string; label: string }[] = [
  { id: "fan-sayable", label: "Fan-sayable — a United fan would say this out loud" },
  { id: "precise", label: "Precise — concrete claim, date, or measure" },
  { id: "evidence-honest", label: "Evidence-honest — no fake certainty" },
  { id: "curious-guide", label: "Curious guide — not pundit, not heritage brochure" },
  { id: "one-job", label: "One job — no throat-clearing or decorative triplets" },
  { id: "templates", label: "Templates — every instance still sounds human" },
];
