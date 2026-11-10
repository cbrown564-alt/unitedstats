"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { MatchesPageBody } from "@/components/matches/MatchesPageBody";
import { useMatchesCatalog } from "@/components/matches/MatchesCatalogContext";
import { buildMatchesPageViewFromCatalog } from "@/lib/matches/buildCatalogView";
import type { MatchPageView } from "@/lib/matchPageView";

function MatchesQueryReader({ onQuery }: { onQuery: (query: string) => void }) {
  const query = useSearchParams().toString();
  useEffect(() => { onQuery(query); }, [query, onQuery]);
  return null;
}

export function MatchesPageClient({ defaultView }: { defaultView: MatchPageView }) {
  const [query, setQuery] = useState("");
  const catalog = useMatchesCatalog();
  const params = useMemo(() => Object.fromEntries(new URLSearchParams(query)), [query]);
  const view = useMemo(() => catalog ? buildMatchesPageViewFromCatalog(params, catalog) : defaultView, [catalog, params, defaultView]);

  return (
    <>
      {/* Only URL reading requires a client-rendered fallback. Keep the archive
          HTML in place through hydration instead of replacing the whole page. */}
      <Suspense fallback={null}><MatchesQueryReader onQuery={setQuery} /></Suspense>
      <MatchesPageBody view={view} />
    </>
  );
}
