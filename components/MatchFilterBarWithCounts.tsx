"use client";

import { useEffect, useMemo, useState } from "react";
import { MatchFilterBar } from "@/components/MatchFilterBar";
import type { FacetCounts, FacetOptions } from "@/lib/matchFacets";
import { queryString } from "@/lib/url";

const EMPTY_COUNTS: FacetCounts = {};

/**
 * Renders the match filter bar immediately, then loads contextual facet counts
 * after mount so the expensive aggregate queries stay off the SSR critical path.
 */
export function MatchFilterBarWithCounts({
  params,
  chips,
  chipCounts,
  options,
  total,
  matchHref,
}: {
  params: Record<string, string | undefined>;
  chips: { key: string; label: string }[];
  chipCounts: Record<string, number>;
  options: FacetOptions;
  total: number;
  matchHref?: string;
}) {
  const [counts, setCounts] = useState<FacetCounts>(EMPTY_COUNTS);
  const [loadedQs, setLoadedQs] = useState<string | null>(null);

  const fetchQs = useMemo(() => {
    const filterParams = { ...params };
    delete filterParams.page;
    delete filterParams.sort;
    return queryString(filterParams);
  }, [params]);
  const countsLoading = loadedQs !== fetchQs;

  useEffect(() => {
    const ac = new AbortController();
    fetch(`/api/v1/matches/facets${fetchQs}`, { signal: ac.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`facet counts ${res.status}`);
        return res.json() as Promise<{ data: FacetCounts }>;
      })
      .then((json) => {
        if (!ac.signal.aborted) {
          setCounts(json.data ?? EMPTY_COUNTS);
          setLoadedQs(fetchQs);
        }
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        if (!ac.signal.aborted) {
          setCounts(EMPTY_COUNTS);
          setLoadedQs(fetchQs);
        }
      });
    return () => ac.abort();
  }, [fetchQs]);

  return (
    <MatchFilterBar
      params={params}
      chips={chips}
      chipCounts={chipCounts}
      options={options}
      counts={counts}
      countsLoading={countsLoading}
      total={total}
      matchHref={matchHref}
    />
  );
}
