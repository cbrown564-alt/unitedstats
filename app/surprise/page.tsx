import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PageHeader } from "@/components/PageHeader";
import { SurpriseReveal } from "@/components/SurpriseReveal";
import { EraPrompt } from "@/components/EraPrompt";
import { surpriseFacts, pickIndex } from "@/lib/surprise";
import { listSeo, seoMetadata } from "@/lib/seo";

export const metadata: Metadata = seoMetadata(listSeo.surprise.title, listSeo.surprise.description, {
  alternates: { canonical: "/surprise" },
});

export default function SurprisePage() {
  const facts = surpriseFacts();
  if (facts.length === 0) notFound();
  const seed = pickIndex(facts.length);

  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Surprise" title="Something you didn't know" deferOnMobile>
        One charged match-night from the record — follow it to the evidence, or roll again.
      </PageHeader>
      <div className="flex justify-end">
        <Suspense fallback={null}>
          <EraPrompt initialSince={null} />
        </Suspense>
      </div>
      <SurpriseReveal facts={facts} seed={seed} />
    </div>
  );
}
