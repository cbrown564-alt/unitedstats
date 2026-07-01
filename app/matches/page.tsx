import type { Metadata } from "next";
import { PageHeader } from "@/components/PageHeader";
import { MatchesPageBody } from "@/components/matches/MatchesPageBody";
import { MatchesPageQueryGate } from "@/components/matches/MatchesPageQueryGate";
import { buildMatchesPageView } from "@/lib/buildMatchesPageView";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Matches",
  description:
    "Browse and filter the complete Manchester United match record since 1886 — filter by opponent, manager, season, venue, and result.",
};

export default function MatchesPage() {
  const view = buildMatchesPageView({});

  return (
    <div className="space-y-7">
      <PageHeader eyebrow="Fixture record" title="Matches" deferOnMobile>
        Every official match since 1886. Filter by era, competition, opponent, or result.
      </PageHeader>

      <MatchesPageQueryGate>
        <MatchesPageBody view={view} />
      </MatchesPageQueryGate>
    </div>
  );
}
