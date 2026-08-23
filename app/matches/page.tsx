import { Suspense } from "react";
import type { Metadata } from "next";
import { PageHeader } from "@/components/PageHeader";
import { MatchesCatalogProvider } from "@/components/matches/MatchesCatalogContext";
import { MatchesPageClient } from "@/components/matches/MatchesPageClient";
import { MatchesPageBody } from "@/components/matches/MatchesPageBody";
import { buildMatchesPageView } from "@/lib/buildMatchesPageView";
import { listSeo, seoMetadata } from "@/lib/seo";

export const metadata: Metadata = seoMetadata(listSeo.matches.title, listSeo.matches.description);

export default function MatchesPage() {
  const defaultView = buildMatchesPageView({});

  return (
    <div className="space-y-7">
      <PageHeader eyebrow="Fixture record" title="Matches" deferOnMobile>
        Every official match since 1886. Filter by era, competition, opponent, or result.
      </PageHeader>
      <MatchesCatalogProvider>
        <Suspense fallback={<MatchesPageBody view={defaultView} />}>
          <MatchesPageClient defaultView={defaultView} />
        </Suspense>
      </MatchesCatalogProvider>
    </div>
  );
}
