import { SITE_URL } from "./site";
import { queryString } from "./url";

const GITHUB_REPO_URL = "https://github.com/cbrown564-alt/unitedstats";
export const CORRECTION_LABELS = ["correction", "data"];
export const MAX_GITHUB_ISSUE_URL_LENGTH = 6000;
export const CORRECTION_STATUS_URL =
  `${GITHUB_REPO_URL}/issues?q=is%3Aissue%20label%3Acorrection%20sort%3Aupdated-desc`;

type CorrectionTargetKind = "match" | "player" | "event";

interface CorrectionTarget {
  kind: CorrectionTargetKind;
  id: string;
  label: string;
}

export interface CorrectionPayload {
  target: CorrectionTarget;
  fieldPath: string;
  currentValue: string;
  proposedValue: string;
  pagePath: string;
  citableId: string;
  sourceUrl?: string;
  archiveRef?: string;
  explanation: string;
  attachmentNote?: string;
  reporterContact?: string;
}

export interface CorrectionPrefill {
  targetKind: CorrectionTargetKind;
  targetId: string;
  targetLabel: string;
  fieldPath: string;
  currentValue: string | number | null | undefined;
  pagePath: string;
  citableId: string;
}

interface CitableRef {
  kind: "correction";
  key: string;
  id: string;
  path: string;
  url: string;
}

function canonicalUrl(path: string): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

function stableHash(value: unknown): string {
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

function canonicalStringify(value: unknown): string {
  return JSON.stringify(canonicalize(value));
}

function canonicalize(value: unknown): unknown {
  if (value === undefined) return undefined;
  if (value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map((item) => (item === undefined ? null : canonicalize(item)));
  const out: Record<string, unknown> = {};
  for (const key of Object.keys(value as Record<string, unknown>).sort()) {
    const next = canonicalize((value as Record<string, unknown>)[key]);
    if (next !== undefined) out[key] = next;
  }
  return out;
}

export function correctionPrefillHref(prefill: CorrectionPrefill): string {
  return `/corrections${queryString({
    kind: prefill.targetKind,
    id: prefill.targetId,
    label: prefill.targetLabel,
    field: prefill.fieldPath,
    current: stringifyFieldValue(prefill.currentValue),
    page: prefill.pagePath,
    cite: prefill.citableId,
  })}`;
}

/** Build an empty-but-targeted payload from a prefill (the picker's chosen field). */
export function correctionPayloadFromPrefill(prefill: CorrectionPrefill): CorrectionPayload {
  return {
    target: { kind: prefill.targetKind, id: prefill.targetId, label: prefill.targetLabel },
    fieldPath: prefill.fieldPath,
    currentValue: stringifyFieldValue(prefill.currentValue),
    proposedValue: "",
    pagePath: prefill.pagePath,
    citableId: prefill.citableId,
    sourceUrl: "",
    archiveRef: "",
    explanation: "",
    attachmentNote: "",
    reporterContact: "",
  };
}

export function correctionPayloadFromSearchParams(params: URLSearchParams): CorrectionPayload {
  return {
    target: {
      kind: normalizeTargetKind(params.get("kind")),
      id: params.get("id") ?? "",
      label: params.get("label") ?? "",
    },
    fieldPath: params.get("field") ?? "",
    currentValue: params.get("current") ?? "",
    proposedValue: "",
    pagePath: params.get("page") ?? "",
    citableId: params.get("cite") ?? "",
    sourceUrl: "",
    archiveRef: "",
    explanation: "",
    attachmentNote: "",
    reporterContact: "",
  };
}

function normalizeTargetKind(value: string | null): CorrectionTargetKind {
  return value === "player" || value === "event" ? value : "match";
}

function stringifyFieldValue(value: string | number | null | undefined): string {
  if (value === null) return "null";
  if (value === undefined) return "";
  return String(value);
}

export function validateCorrectionPayload(payload: CorrectionPayload): string[] {
  const errors: string[] = [];
  if (!["match", "player", "event"].includes(payload.target.kind)) errors.push("target.kind must be match, player, or event");
  if (!payload.target.id.trim()) errors.push("target.id is required");
  if (!payload.target.label.trim()) errors.push("target.label is required");
  if (!payload.fieldPath.trim()) errors.push("fieldPath is required");
  if (!payload.pagePath.startsWith("/")) errors.push("pagePath must be a site-relative path");
  if (!payload.citableId.startsWith("us:")) errors.push("citableId must be a Red Thread citable ID");
  if (!payload.proposedValue.trim()) errors.push("proposedValue is required");
  if (!payload.sourceUrl?.trim() && !payload.archiveRef?.trim()) {
    errors.push("sourceUrl or archiveRef is required");
  }
  if (payload.sourceUrl?.trim()) {
    try {
      const url = new URL(payload.sourceUrl);
      if (url.protocol !== "http:" && url.protocol !== "https:") errors.push("sourceUrl must use http or https");
    } catch {
      errors.push("sourceUrl must be a valid URL");
    }
  }
  if (payload.explanation.trim().length < 10) errors.push("explanation must be at least 10 characters");
  if (payload.fieldPath.length > 180) errors.push("fieldPath is too long");
  if (payload.proposedValue.length > 1000) errors.push("proposedValue is too long");
  if ((payload.attachmentNote ?? "").length > 1000) errors.push("attachmentNote is too long");
  if ((payload.reporterContact ?? "").length > 200) errors.push("reporterContact is too long");
  return errors;
}

export function assertValidCorrectionPayload(payload: CorrectionPayload): void {
  const errors = validateCorrectionPayload(payload);
  if (errors.length > 0) throw new Error(`Invalid correction payload: ${errors.join("; ")}`);
}

function correctionRequestRef(payload: CorrectionPayload): CitableRef {
  const key = stableHash({
    target: payload.target,
    fieldPath: payload.fieldPath,
    currentValue: payload.currentValue,
    proposedValue: payload.proposedValue,
    pagePath: payload.pagePath,
    citableId: payload.citableId,
  });
  return {
    kind: "correction",
    key,
    id: `us:correction:${key}`,
    path: "/corrections",
    url: canonicalUrl("/corrections"),
  };
}

export function correctionIssueTitle(payload: CorrectionPayload): string {
  return `Correction: ${payload.target.kind} ${payload.target.label} ${payload.fieldPath}`;
}

export function fieldPatch(payload: Pick<CorrectionPayload, "fieldPath" | "currentValue" | "proposedValue">): string {
  return [
    `field: ${payload.fieldPath}`,
    `- ${payload.currentValue}`,
    `+ ${payload.proposedValue}`,
  ].join("\n");
}

function scrubFence(value: string | undefined): string {
  return (value ?? "").replace(/```/g, "`\u200b``");
}

export function correctionIssueBody(payload: CorrectionPayload): string {
  const ref = correctionRequestRef(payload);
  return [
    "## Correction request",
    "",
    `- Request ID: \`${ref.id}\``,
    `- Target: ${payload.target.kind} \`${scrubFence(payload.target.id)}\` (${scrubFence(payload.target.label)})`,
    `- Field: \`${scrubFence(payload.fieldPath)}\``,
    `- Page: ${canonicalUrl(payload.pagePath)}`,
    `- Citable ID: \`${scrubFence(payload.citableId)}\``,
    "",
    "## Proposed field patch",
    "",
    "```diff",
    scrubFence(fieldPatch(payload)),
    "```",
    "",
    "## Source",
    "",
    payload.sourceUrl?.trim() ? `- Source URL: ${scrubFence(payload.sourceUrl.trim())}` : "- Source URL: _not provided_",
    payload.archiveRef?.trim() ? `- Archive/reference: ${scrubFence(payload.archiveRef.trim())}` : "- Archive/reference: _not provided_",
    "",
    "## Explanation",
    "",
    scrubFence(payload.explanation.trim()),
    "",
    "## Optional notes",
    "",
    payload.attachmentNote?.trim() ? scrubFence(payload.attachmentNote.trim()) : "_No attachment note._",
    "",
    "## Reporter contact",
    "",
    payload.reporterContact?.trim() ? scrubFence(payload.reporterContact.trim()) : "_No contact provided._",
    "",
    "## Maintainer checklist",
    "",
    "- [ ] Verify the cited source/archive.",
    "- [ ] Apply the field-level change in canonical JSON.",
    "- [ ] Run `npm run validate`.",
    "- [ ] Run `npm run build:db`.",
  ].join("\n");
}

export function correctionIssueUrl(payload: CorrectionPayload): string {
  assertValidCorrectionPayload(payload);
  const url = new URL(`${GITHUB_REPO_URL}/issues/new`);
  url.searchParams.set("title", correctionIssueTitle(payload));
  url.searchParams.set("labels", CORRECTION_LABELS.join(","));
  url.searchParams.set("body", correctionIssueBody(payload));
  const href = url.toString();
  if (href.length > MAX_GITHUB_ISSUE_URL_LENGTH) {
    throw new Error(`Correction issue URL exceeds ${MAX_GITHUB_ISSUE_URL_LENGTH} characters`);
  }
  return href;
}
