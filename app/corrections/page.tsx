import { Suspense } from "react";
import { PageHeader } from "@/components/PageHeader";
import { CorrectionBuilder } from "./CorrectionBuilder";
import { CORRECTION_STATUS_URL } from "@/lib/corrections";

export const metadata = { title: "Suggest a correction" };

export default function CorrectionsPage() {
  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Corrections" title="Suggest a correction">
        Found a wrong score, date, attendance, or name? Make the claim here and it becomes a structured GitHub issue with
        the field-level diff and your source attached. Every change is reviewed against the source before it ships.
      </PageHeader>

      <Suspense fallback={<div className="border border-line bg-panel p-4 text-sm text-ink-dim">Loading correction builder...</div>}>
        <CorrectionBuilder />
      </Suspense>

      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-line/70 pt-4 text-sm text-ink-dim">
        <span>Every suggested correction is tracked in the open issue queue.</span>
        <a href={CORRECTION_STATUS_URL} className="font-semibold text-devil-bright hover:underline focus-ring">
          View open correction issues →
        </a>
      </footer>
    </div>
  );
}
