"use client";

import Link from "next/link";
import { useState } from "react";
import { correctionPayloadFromPrefill, type CorrectionPayload } from "@/lib/corrections";
import type { CorrectionInventory } from "@/lib/correctionInventory";
import { CorrectionClaimForm } from "@/components/corrections/CorrectionClaimForm";

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
        Your suggestion opens a structured issue in the public correction queue for the maintainers to review.
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
      <CorrectionClaimForm
        payload={payload}
        setPayload={setPayload}
        onBack={inventory ? () => setPayload(null) : undefined}
      />
    );
  }
  if (inventory) return <Picker inventory={inventory} onPick={setPayload} />;
  return <EmptyState />;
}
