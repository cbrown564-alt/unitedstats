"use client";

import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import {
  CORRECTION_STATUS_URL,
  correctionIssueBody,
  correctionIssueTitle,
  correctionIssueUrl,
  correctionPayloadFromSearchParams,
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

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
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

/** No prefill: a correction is always about a specific claim, so guide the user back to one. */
function EmptyState() {
  return (
    <div className="space-y-4 border border-line bg-panel p-5">
      <p className="text-sm leading-6 text-ink-dim">
        A correction is always about one specific claim — a score, a date, an attendance, a name, a goal minute. Start
        from the page that shows the value you want to fix and use its{" "}
        <span className="font-semibold text-ink">Suggest a correction</span> link; it returns here with the field and
        its current value already filled in, so all you add is the new value and your source.
      </p>
      <div className="flex flex-wrap gap-2 text-sm font-semibold">
        <Link href="/matches" className="control inline-flex items-center hover:text-devil-bright focus-ring">
          Find a match →
        </Link>
        <Link href="/players" className="control inline-flex items-center hover:text-devil-bright focus-ring">
          Find a player →
        </Link>
        <Link href="/data" className="control inline-flex items-center hover:text-devil-bright focus-ring">
          Browse the data ledger →
        </Link>
      </div>
      <p className="text-xs text-ink-faint">
        Canonical data changes land through a reviewed pull request and <code className="font-mono">npm run validate</code>;
        this builder only opens the issue that starts that review.
      </p>
    </div>
  );
}

export function CorrectionBuilder() {
  const searchParams = useSearchParams();
  const initial = useMemo(() => correctionPayloadFromSearchParams(searchParams), [searchParams]);
  const [payload, setPayload] = useState<CorrectionPayload>(initial);

  const hasTarget = payload.target.id.trim() !== "" && payload.fieldPath.trim() !== "";
  if (!hasTarget) return <EmptyState />;

  const needsProposed = !payload.proposedValue.trim();
  const needsSource = !payload.sourceUrl?.trim() && !payload.archiveRef?.trim();
  const needsExplanation = payload.explanation.trim().length < 10;
  const errors = validateCorrectionPayload(payload);
  // Covered by the friendly checklist below; anything left is a real format error worth surfacing raw.
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

  return (
    <div className="space-y-6">
      {/* What you're correcting — static context + a live diff. Never an input box. */}
      <section className="border border-line bg-panel p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-faint">You are correcting</p>
        <p className="mt-2 text-sm text-ink-dim">
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
        <p className="mt-1 break-all font-mono text-xs text-ink-faint">{payload.fieldPath}</p>

        <div className="mt-4 overflow-hidden rounded border border-line bg-black/25 font-mono text-sm">
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

      {/* The claim — the two things only a human can supply. */}
      <section className="space-y-5 border border-line bg-panel p-5">
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
            rows={3}
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

      {/* Submit — a transparent destination, not the mental model. */}
      <section className="space-y-3 border border-line bg-panel p-5">
        {issueUrl ? (
          <>
            <a
              href={issueUrl}
              className="inline-flex rounded bg-devil px-4 py-2 text-sm font-semibold text-white hover:bg-devil-bright focus-ring"
            >
              Open the prefilled GitHub issue →
            </a>
            <p className="text-xs leading-5 text-ink-faint">
              This opens GitHub with the issue already written. A maintainer verifies the source, applies the change in
              canonical JSON, and runs the validation gate before it ships.
            </p>
            <details className="text-xs text-ink-dim">
              <summary className="cursor-pointer font-semibold text-ink-dim hover:text-ink focus-ring">
                Preview the issue
              </summary>
              <p className="mt-2 font-semibold text-ink">{correctionIssueTitle(payload)}</p>
              <pre className="mt-2 max-h-72 overflow-auto whitespace-pre-wrap rounded border border-line bg-black/25 p-3">
                {correctionIssueBody(payload)}
              </pre>
            </details>
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
