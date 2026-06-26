"use client";

import { useEffect, useMemo, useState } from "react";
import { MatchFilterBar } from "@/components/MatchFilterBar";
import type { DecadeBucket } from "@/components/matches/FilterZones";
import type { FacetCounts, FacetOptions } from "@/lib/matchFacets";
import { queryString } from "@/lib/url";

const EMPTY_COUNTS: FacetCounts = {};
const EMPTY_OPTIONS: FacetOptions = {};
const EMPTY_CHIP_COUNTS: Record<string, number> = {};

/**
 * Renders the match filter bar immediately, then loads facet options, contextual
 * counts, and per-chip isolation counts after mount so heavy lists and aggregate
 * queries stay off the SSR critical path.
 */
export function MatchFilterBarWithCounts({
  embedded = false,
  params,
  chips,
  total,
  matchHref,
  seasons,
  decadeBuckets,
}: {
  /** Render as the chip row inside MatchControlDeck — no outer panel. */
  embedded?: boolean;
  params: Record<string, string | undefined>;
  chips: { key: string; label: string }[];
  total: number;
  matchHref?: string;
  seasons: string[];
  decadeBuckets?: DecadeBucket[];
}) {
  const [options, setOptions] = useState<FacetOptions>(EMPTY_OPTIONS);
  const [optionsLoaded, setOptionsLoaded] = useState(false);
  const [counts, setCounts] = useState<FacetCounts>(EMPTY_COUNTS);
  const [chipCounts, setChipCounts] = useState<Record<string, number>>(EMPTY_CHIP_COUNTS);
  const [loadedQs, setLoadedQs] = useState<string | null>(null);

  const fetchQs = useMemo(() => {
    const filterParams = { ...params };
    delete filterParams.page;
    delete filterParams.sort;
    return queryString(filterParams);
  }, [params]);
  const countsLoading = loadedQs !== fetchQs;

  const chipKeys = useMemo(() => chips.map((c) => c.key).join(","), [chips]);

  useEffect(() => {
    const ac = new AbortController();
    fetch("/api/v1/matches/facet-options", { signal: ac.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`facet options ${res.status}`);
        return res.json() as Promise<{ data: FacetOptions }>;
      })
      .then((json) => {
        if (!ac.signal.aborted) {
          setOptions(json.data ?? EMPTY_OPTIONS);
          setOptionsLoaded(true);
        }
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        if (!ac.signal.aborted) setOptionsLoaded(true);
      });
    return () => ac.abort();
  }, []);

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

  useEffect(() => {
    if (!chipKeys) {
      setChipCounts(EMPTY_CHIP_COUNTS);
      return;
    }
    const ac = new AbortController();
    const qs = fetchQs
      ? `${fetchQs}&keys=${encodeURIComponent(chipKeys)}`
      : `?keys=${encodeURIComponent(chipKeys)}`;
    fetch(`/api/v1/matches/chip-counts${qs}`, { signal: ac.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`chip counts ${res.status}`);
        return res.json() as Promise<{ data: Record<string, number> }>;
      })
      .then((json) => {
        if (!ac.signal.aborted) setChipCounts(json.data ?? EMPTY_CHIP_COUNTS);
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        if (!ac.signal.aborted) setChipCounts(EMPTY_CHIP_COUNTS);
      });
    return () => ac.abort();
  }, [fetchQs, chipKeys]);

  return (
    <MatchFilterBar
      embedded={embedded}
      params={params}
      chips={chips}
      chipCounts={chipCounts}
      options={options}
      optionsLoading={!optionsLoaded}
      counts={counts}
      countsLoading={countsLoading}
      total={total}
      matchHref={matchHref}
      seasons={seasons}
      decadeBuckets={decadeBuckets}
    />
  );
}
