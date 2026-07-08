import type { Metadata } from "next";
import { PageHeader } from "@/components/PageHeader";
import { MatchesPageBody } from "@/components/matches/MatchesPageBody";
import { buildMatchesPageView } from "@/lib/buildMatchesPageView";
import { validateMatchFilterDates } from "@/lib/matchFilterFromUrl";
import { listSeo, seoMetadata } from "@/lib/seo";

export const revalidate = 86400;

export const metadata: Metadata = seoMetadata(listSeo.matches.title, listSeo.matches.description);

export default async function MatchesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const dateError = validateMatchFilterDates(sp);
  const view = buildMatchesPageView(dateError ? {} : sp);

  return (
    <div className="space-y-7">
      <PageHeader eyebrow="Fixture record" title="Matches" deferOnMobile>
        Every official match since 1886. Filter by era, competition, opponent, or result.
      </PageHeader>

      {dateError ? (
        <p className="rounded-lg border border-line bg-panel px-4 py-3 text-sm text-ink-dim">{dateError}</p>
      ) : null}

      <MatchesPageBody view={view} />
    </div>
  );
}
