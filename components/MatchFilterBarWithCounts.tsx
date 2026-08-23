"use client";

import { useMemo } from "react";
import { MatchFilterBar } from "@/components/MatchFilterBar";
import { useMatchesCatalog } from "@/components/matches/MatchesCatalogContext";
import type { DecadeBucket } from "@/components/matches/FilterZones";
import type { FacetCounts, FacetOptions } from "@/lib/matchFacets";
import { matchFilterFromSearchParams } from "@/lib/matchFilterFromUrl";
import { catalogChipCounts, catalogFacetCounts } from "@/lib/matches/filterCatalog";

const EMPTY_COUNTS: FacetCounts = {};
const EMPTY_OPTIONS: FacetOptions = {};
const EMPTY_CHIP_COUNTS: Record<string, number> = {};

export function MatchFilterBarWithCounts({
  embedded = false,
  sheetLayout = false,
  params,
  chips,
  total,
  matchHref,
  seasons,
  decadeBuckets,
}: {
  embedded?: boolean;
  sheetLayout?: boolean;
  params: Record<string, string | undefined>;
  chips: { key: string; label: string }[];
  total: number;
  matchHref?: string;
  seasons: string[];
  decadeBuckets?: DecadeBucket[];
}) {
  const catalog = useMatchesCatalog();
  const filter = useMemo(() => matchFilterFromSearchParams(params), [params]);
  const chipKeys = useMemo(() => chips.map((chip) => chip.key), [chips]);
  const options = catalog?.options ?? EMPTY_OPTIONS;
  const counts = catalog ? catalogFacetCounts(catalog.matches, filter) : EMPTY_COUNTS;
  const chipCounts =
    catalog && chipKeys.length > 0 ? catalogChipCounts(catalog.matches, filter, chipKeys) : EMPTY_CHIP_COUNTS;

  return (
    <MatchFilterBar
      embedded={embedded}
      sheetLayout={sheetLayout}
      params={params}
      chips={chips}
      chipCounts={chipKeys.length > 0 ? chipCounts : EMPTY_CHIP_COUNTS}
      options={options}
      optionsLoading={!catalog}
      counts={counts}
      countsLoading={!catalog}
      total={total}
      matchHref={matchHref}
      seasons={seasons}
      decadeBuckets={decadeBuckets}
    />
  );
}
