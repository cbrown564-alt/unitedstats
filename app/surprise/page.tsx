import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PageHeader } from "@/components/PageHeader";
import { SurpriseReveal } from "@/components/SurpriseReveal";
import { EraPrompt } from "@/components/EraPrompt";
import { surpriseFacts, pickIndex } from "@/lib/surprise";
import { parseSinceYear } from "@/lib/rediscovery";
import { listSeo, seoMetadata } from "@/lib/seo";

// The wanderer's door (Phase 18.3): not a redirect but a *reveal* — one curated,
// genuinely-surprising fact, with a re-roll that deals another in place. Dynamic
// so the server's opening fact varies per visit and reflects the latest data; the
// curated pool and rolling logic live in `lib/surprise.ts` / `SurpriseReveal`.
export const dynamic = "force-dynamic";

export const metadata: Metadata = seoMetadata(listSeo.surprise.title, listSeo.surprise.description, {
  alternates: { canonical: "/surprise" },
});

export default async function SurprisePage({
  searchParams,
}: {
  searchParams: Promise<{ since?: string }>;
}) {
  const params = await searchParams;
  const sinceYear = parseSinceYear(params.since);
  const facts = surpriseFacts({ sinceYear });
  if (facts.length === 0) notFound();
  const seed = pickIndex(facts.length);

  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Surprise" title="Something you didn't know" deferOnMobile>
        One charged match-night from the record — follow it to the evidence, or roll again.
      </PageHeader>
      <div className="flex justify-end">
        <Suspense fallback={null}>
          <EraPrompt initialSince={sinceYear} />
        </Suspense>
      </div>
      <SurpriseReveal facts={facts} seed={seed} />
    </div>
  );
}
