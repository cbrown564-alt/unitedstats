import type { Metadata } from "next";
import { PageHeader } from "@/components/PageHeader";
import { CorrectionBuilder } from "./CorrectionBuilder";
import { CORRECTION_STATUS_URL } from "@/lib/corrections";

const CORRECTIONS_DESCRIPTION =
  "Found a wrong score, date, or goalscorer? Pick the fact, attach your source, and it becomes a structured issue for review.";

export const metadata: Metadata = {
  title: "Suggest a correction",
  description: CORRECTIONS_DESCRIPTION,
  alternates: { canonical: "/corrections" },
  openGraph: {
    type: "website",
    title: "Suggest a correction · Red Thread",
    description: CORRECTIONS_DESCRIPTION,
    url: "/corrections",
  },
  twitter: { card: "summary_large_image", title: "Suggest a correction", description: CORRECTIONS_DESCRIPTION },
};

export default function CorrectionsPage() {
  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Corrections" title="Suggest a correction">
        Found a wrong score, date, or goalscorer? Pick the fact, attach your source, and it becomes a structured issue
        for review.
      </PageHeader>

      <CorrectionBuilder initialPayload={null} inventory={null} />

      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-line/70 pt-4 text-sm text-ink-dim">
        <span>Every suggested correction is tracked in the open issue queue.</span>
        <a href={CORRECTION_STATUS_URL} className="font-semibold text-devil-bright hover:underline focus-ring">
          View open correction issues →
        </a>
      </footer>
    </div>
  );
}
