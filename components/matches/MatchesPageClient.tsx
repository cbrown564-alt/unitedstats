"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { MatchesPageBody } from "@/components/matches/MatchesPageBody";
import { useMatchesCatalog } from "@/components/matches/MatchesCatalogContext";
import { buildMatchesPageViewFromCatalog } from "@/lib/matches/buildCatalogView";
import type { MatchPageView } from "@/lib/matchPageView";

export function MatchesPageClient({ defaultView }: { defaultView: MatchPageView }) {
  const searchParams = useSearchParams();
  const catalog = useMatchesCatalog();
  const params = useMemo(() => Object.fromEntries(searchParams.entries()), [searchParams]);
  const view = catalog ? buildMatchesPageViewFromCatalog(params, catalog) : defaultView;

  return <MatchesPageBody view={view} />;
}
