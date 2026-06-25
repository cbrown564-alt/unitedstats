"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import {
  CORRECTION_STATUS_URL,
  correctionIssueBody,
  correctionIssueTitle,
  correctionIssueUrl,
  correctionPayloadFromPrefill,
  validateCorrectionPayload,
  type CorrectionPayload,
} from "@/lib/corrections";
import type { CorrectionInventory } from "@/lib/correctionInventory";

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

/** No prefill and no inventory: a correction is always about a specific claim. */
function EmptyState() {
  return (
    <div className="space-y-4 border border-line bg-panel p-5">
      <p className="text-sm leading-6 text-ink-dim">
        A correction is always about one specific claim — a score, a date, an attendance, a name, a goal minute. Start
        from the page that shows the value you want to fix and use its{" "}
        <span className="font-semibold text-ink">Suggest a correction</span> link; it brings you here with that match
        or player’s facts laid out to choose from.
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

/** Step 1 — pick the exact fact that is wrong from the match's inventory. */
function Picker({ inventory, onPick }: { inventory: CorrectionInventory; onPick: (payload: CorrectionPayload) => void }) {
  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-faint">What needs correcting?</p>
        <p className="mt-1 text-sm text-ink-dim">
          Pick the exact fact on{" "}
          <Link href={inventory.pagePath} className="font-semibold text-ink hover:text-devil-bright focus-ring">
            {inventory.label}
          </Link>{" "}
          that is wrong — you will make the case on the next step.
        </p>
      </div>

      {inventory.groups.map((group, groupIndex) => (
        <details key={group.name} open={groupIndex === 0} className="group border border-line bg-panel">
          <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-semibold text-ink hover:bg-panel-2 focus-ring">
            <span>
              {group.name} <span className="text-ink-faint">· {group.fields.length}</span>
            </span>
            <span aria-hidden className="text-ink-faint transition-transform group-open:rotate-180">▾</span>
          </summary>
          <ul className="divide-y divide-line/60 border-t border-line">
            {group.fields.map((field, fieldIndex) => (
              <li key={`${field.prefill.fieldPath}-${fieldIndex}`}>
                <button
                  type="button"
                  onClick={() => onPick(correctionPayloadFromPrefill(field.prefill))}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-panel-2 focus-ring"
                >
                  <span className="flex min-w-0 flex-1 items-center gap-2">
                    <span className="truncate text-sm text-ink">{field.label}</span>
                    {field.field && (
                      <span className="shrink-0 rounded bg-black/30 px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-ink-dim">
                        {field.field}
                      </span>
                    )}
                  </span>
                  <span className="shrink-0 stat-num text-xs text-ink-faint">{field.current}</span>
                  <span aria-hidden className="shrink-0 text-devil-bright">→</span>
                </button>
              </li>
            ))}
          </ul>
        </details>
      ))}
    </div>
  );
}

/** Step 2 — make the claim for the chosen field. */
function ClaimFlow({
  payload,
  setPayload,
  onBack,
}: {
  payload: CorrectionPayload;
  setPayload: (next: CorrectionPayload) => void;
  onBack?: () => void;
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

  return (
    <div className="space-y-6">
      {onBack && (
        <button type="button" onClick={onBack} className="text-sm font-semibold text-ink-dim hover:text-ink focus-ring">
          ← Change what you are correcting
        </button>
      )}

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

export function CorrectionBuilder({
  initialPayload,
  inventory,
}: {
  initialPayload: CorrectionPayload | null;
  inventory: CorrectionInventory | null;
}) {
  const [payload, setPayload] = useState<CorrectionPayload | null>(initialPayload);

  if (payload) {
    return (
      <ClaimFlow
        payload={payload}
        setPayload={setPayload}
        onBack={inventory ? () => setPayload(null) : undefined}
      />
    );
  }
  if (inventory) return <Picker inventory={inventory} onPick={setPayload} />;
  return <EmptyState />;
}
