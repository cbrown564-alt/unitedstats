import { Suspense } from "react";
import { ComparePageClient, ComparePageView } from "@/components/compare/ComparePageClient";
import { compareManagers, comparePlayers, CURATED_DEBATES, type Comparison } from "@/lib/compare";
import { curatedComparisonKey } from "@/lib/curatedDebates";
import { listSeo, seoMetadata } from "@/lib/seo";

export const metadata = seoMetadata(listSeo.compare.title, listSeo.compare.description, {
  alternates: { canonical: "/compare" },
});

export default function ComparePage() {
  const curated: Record<string, Comparison> = {};
  for (const debate of CURATED_DEBATES.players) {
    const comparison = comparePlayers(debate.a, debate.b);
    if (comparison) curated[curatedComparisonKey("players", debate.a, debate.b)] = comparison;
  }
  for (const debate of CURATED_DEBATES.managers) {
    const comparison = compareManagers(debate.a, debate.b);
    if (comparison) curated[curatedComparisonKey("managers", debate.a, debate.b)] = comparison;
  }

  return (
    <Suspense fallback={<ComparePageView curated={curated} />}>
      <ComparePageClient curated={curated} />
    </Suspense>
  );
}
