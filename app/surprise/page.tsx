import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { SurpriseReveal } from "@/components/SurpriseReveal";
import { surpriseFacts, pickIndex } from "@/lib/surprise";

// The wanderer's door (Phase 18.3): not a redirect but a *reveal* — one curated,
// genuinely-surprising fact, with a re-roll that deals another in place. Dynamic
// so the server's opening fact varies per visit and reflects the latest data; the
// curated pool and rolling logic live in `lib/surprise.ts` / `SurpriseReveal`.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Surprise me",
  description:
    "One curated, genuinely-surprising fact from United's record — then another, and another. Every find links to the matches behind it.",
  alternates: { canonical: "/surprise" },
};

export default function SurprisePage() {
  const facts = surpriseFacts();
  if (facts.length === 0) notFound();
  const seed = pickIndex(facts.length);

  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Surprise" title="Something you didn't know" deferOnMobile>
        One tested myth, a data slice, or a club peak — follow it to the matches, or roll again.
      </PageHeader>
      <SurpriseReveal facts={facts} seed={seed} />
    </div>
  );
}
