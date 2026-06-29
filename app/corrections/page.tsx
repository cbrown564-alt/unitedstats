import { PageHeader } from "@/components/PageHeader";
import { CorrectionBuilder } from "./CorrectionBuilder";
import { CORRECTION_STATUS_URL, correctionPayloadFromSearchParams } from "@/lib/corrections";
import { matchCorrectionInventory } from "@/lib/correctionInventory";

export const metadata = { title: "Suggest a correction" };

type SP = Record<string, string | string[] | undefined>;

export default async function CorrectionsPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(sp)) if (typeof value === "string") params.set(key, value);

  // A direct ?field= deep-link skips straight to the claim flow; otherwise a
  // ?match= id opens the "what's wrong?" picker over that match's facts.
  const initialPayload = params.get("field") && params.get("id") ? correctionPayloadFromSearchParams(params) : null;
  const matchId = params.get("match");
  const inventory = !initialPayload && matchId ? matchCorrectionInventory(matchId) : null;

  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Corrections" title="Suggest a correction">
        Found a wrong score, date, attendance, goalscorer, or shirt number? Pick the exact fact, make the claim, and it
        becomes a structured GitHub issue with the field-level diff and your source attached. Every change is reviewed
        against the source before it ships.
      </PageHeader>

      <CorrectionBuilder initialPayload={initialPayload} inventory={inventory} />

      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-line/70 pt-4 text-sm text-ink-dim">
        <span>Every suggested correction is tracked in the open issue queue.</span>
        <a href={CORRECTION_STATUS_URL} className="font-semibold text-devil-bright hover:underline focus-ring">
          View open correction issues →
        </a>
      </footer>
    </div>
  );
}
