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
        The match browser is the archive spine: every aggregate should be able to come back here as evidence.
        Filter by era, competition, venue, result, or opponent trail.
      </PageHeader>

      <MatchesPageQueryGate>
        <MatchesPageBody view={view} />
      </MatchesPageQueryGate>
    </div>
  );
}
