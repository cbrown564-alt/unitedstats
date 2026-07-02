"use client";

import Link from "next/link";
import {
  CORRECTION_STATUS_URL,
  correctionIssueBody,
  correctionIssueTitle,
  correctionIssueUrl,
  validateCorrectionPayload,
  type CorrectionPayload,
} from "@/lib/corrections";

const TARGET_NOUN: Record<CorrectionPayload["target"]["kind"], string> = {
  match: "match",
  player: "player",
  event: "match event",
};

function update(payload: CorrectionPayload, key: keyof CorrectionPayload, value: string): CorrectionPayload {
  return { ...payload, [key]: value };
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="flex flex-wrap items-baseline justify-between gap-x-3">
        <span className="text-sm font-semibold text-ink">{label}</span>
        {hint && <span className="text-xs text-ink-faint">{hint}</span>}
      </span>
      {children}
    </label>
  );
}

/** Step 2 — make the claim for the chosen field. */
export function CorrectionClaimForm({
  payload,
  setPayload,
  onBack,
  compact = false,
}: {
  payload: CorrectionPayload;
  setPayload: (next: CorrectionPayload) => void;
  onBack?: () => void;
  /** Tighter layout for the match-page drawer. */
  compact?: boolean;
}) {
  const needsProposed = !payload.proposedValue.trim();
  const needsSource = !payload.sourceUrl?.trim() && !payload.archiveRef?.trim();
  const needsExplanation = payload.explanation.trim().length < 10;
  const errors = validateCorrectionPayload(payload);
  const otherErrors = errors.filter(
    (error) =>
      !error.includes("proposedValue is required") &&
      !error.includes("sourceUrl or archiveRef") &&
      !error.includes("explanation must be at least"),
  );

  let issueUrl: string | null = null;
  let issueError: string | null = null;
  if (errors.length === 0) {
    try {
      issueUrl = correctionIssueUrl(payload);
    } catch (error) {
      issueError = error instanceof Error ? error.message : "Could not build the issue link.";
    }
  }

  const proposedPreview = payload.proposedValue.trim();
  const sectionClass = compact ? "space-y-4 border border-line bg-panel p-4" : "space-y-5 border border-line bg-panel p-5";
  const rootGap = compact ? "space-y-4" : "space-y-6";

  return (
    <div className={rootGap}>
      {onBack && (
        <button type="button" onClick={onBack} className="text-sm font-semibold text-ink-dim hover:text-ink focus-ring">
          ← Change what you are correcting
        </button>
      )}

      <section className={sectionClass}>
        {!compact && (
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-faint">You are correcting</p>
        )}
        <p className={`text-sm text-ink-dim ${compact ? "" : "mt-2"}`}>
          The <span className="font-semibold text-ink">{payload.fieldPath.split(".").pop()}</span> of the{" "}
          {TARGET_NOUN[payload.target.kind]}{" "}
          {payload.pagePath ? (
            <Link href={payload.pagePath} className="font-semibold text-ink hover:text-devil-bright focus-ring">
              {payload.target.label}
            </Link>
          ) : (
            <span className="font-semibold text-ink">{payload.target.label}</span>
          )}
          .
        </p>
        {!compact && <p className="mt-1 break-all font-mono text-xs text-ink-faint">{payload.fieldPath}</p>}

        <div className={`overflow-hidden rounded border border-line bg-black/25 font-mono text-sm ${compact ? "mt-3" : "mt-4"}`}>
          <div className="flex gap-3 border-b border-line/70 px-3 py-2 text-loss">
            <span aria-hidden className="select-none text-ink-faint">−</span>
            <span className="break-all line-through decoration-loss/40">{payload.currentValue || "—"}</span>
          </div>
          <div className="flex gap-3 px-3 py-2 text-gold">
            <span aria-hidden className="select-none text-ink-faint">+</span>
            {proposedPreview ? (
              <span className="break-all">{proposedPreview}</span>
            ) : (
              <span className="text-ink-faint">your proposed value</span>
            )}
          </div>
        </div>
      </section>

      <section className={sectionClass}>
        <Field label="Proposed value" hint="What should it say instead?">
          <textarea
            value={payload.proposedValue}
            onChange={(e) => setPayload(update(payload, "proposedValue", e.target.value))}
            rows={2}
            autoFocus
            className="control w-full"
            placeholder="The corrected value"
          />
        </Field>

        <fieldset className="space-y-3">
          <legend className="flex flex-wrap items-baseline justify-between gap-x-3">
            <span className="text-sm font-semibold text-ink">Source</span>
            <span className="text-xs text-ink-faint">Evidence anyone can check — a link or an archive reference</span>
          </legend>
          <input
            value={payload.sourceUrl ?? ""}
            onChange={(e) => setPayload(update(payload, "sourceUrl", e.target.value))}
            className="control w-full"
            placeholder="Source URL (https://…)"
            inputMode="url"
          />
          <input
            value={payload.archiveRef ?? ""}
            onChange={(e) => setPayload(update(payload, "archiveRef", e.target.value))}
            className="control w-full"
            placeholder="…or an archive / programme / book reference"
          />
        </fieldset>

        <Field label="Explanation" hint="Why the change is right (a sentence is plenty)">
          <textarea
            value={payload.explanation}
            onChange={(e) => setPayload(update(payload, "explanation", e.target.value))}
            rows={compact ? 2 : 3}
            className="control w-full"
            placeholder="What does the source show, and how does it support the new value?"
          />
        </Field>

        <details className="group border-t border-line/70 pt-3">
          <summary className="cursor-pointer list-none text-sm font-semibold text-ink-dim hover:text-ink focus-ring">
            <span className="text-ink-faint group-open:hidden">+ </span>
            <span className="hidden text-ink-faint group-open:inline">− </span>
            Optional details
          </summary>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <Field label="Attachment note">
              <input
                value={payload.attachmentNote ?? ""}
                onChange={(e) => setPayload(update(payload, "attachmentNote", e.target.value))}
                className="control w-full"
                placeholder="Where to find a scan, screenshot, etc."
              />
            </Field>
            <Field label="Your contact">
              <input
                value={payload.reporterContact ?? ""}
                onChange={(e) => setPayload(update(payload, "reporterContact", e.target.value))}
                className="control w-full"
                placeholder="Optional — for follow-up questions"
              />
            </Field>
          </div>
        </details>
      </section>

      <section className={compact ? "space-y-3" : "space-y-3 border border-line bg-panel p-5"}>
        {issueUrl ? (
          <>
            <a
              href={issueUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex rounded bg-devil px-4 py-2 text-sm font-semibold text-white hover:bg-devil-bright focus-ring"
            >
              Submit correction for review →
            </a>
            <p className="text-xs leading-5 text-ink-faint">
              Opens GitHub with the issue pre-filled — click Submit once there. A free GitHub account is required.
            </p>
            {!compact && (
              <details className="text-xs text-ink-dim">
                <summary className="cursor-pointer font-semibold text-ink-dim hover:text-ink focus-ring">
                  Preview the issue
                </summary>
                <p className="mt-2 font-semibold text-ink">{correctionIssueTitle(payload)}</p>
                <pre className="mt-2 max-h-72 overflow-auto whitespace-pre-wrap rounded border border-line bg-black/25 p-3">
                  {correctionIssueBody(payload)}
                </pre>
              </details>
            )}
          </>
        ) : (
          <div className="space-y-2">
            <p className="text-sm font-semibold text-ink">Before you can submit</p>
            <ul className="space-y-1.5 text-sm text-ink-dim">
              {needsProposed && <li>Add the proposed value above.</li>}
              {needsSource && <li>Add a source URL or an archive reference.</li>}
              {needsExplanation && <li>Explain the change in at least a sentence.</li>}
              {otherErrors.map((error) => (
                <li key={error} className="text-loss">{error}</li>
              ))}
              {issueError && <li className="text-loss">{issueError}</li>}
            </ul>
          </div>
        )}
        <Link
          href={CORRECTION_STATUS_URL}
          className="inline-block text-sm font-semibold text-devil-bright hover:underline focus-ring"
        >
          Track correction status →
        </Link>
      </section>
    </div>
  );
}
