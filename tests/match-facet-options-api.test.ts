import assert from "node:assert/strict";
import test from "node:test";

import { GET as facetOptionsGet } from "../app/api/v1/matches/facet-options/route";
import { GET as chipCountsGet } from "../app/api/v1/matches/chip-counts/route";
import { buildMatchFacetOptions } from "../lib/matchFacetOptions";
import { matchChipCounts } from "../lib/matchChipCounts";
import { matchFilterFromSearchParams } from "../lib/matchFilterFromUrl";

const SITE = "https://unitedstats.vercel.app";

test("GET /api/v1/matches/facet-options returns static facet lists", async () => {
  const res = await facetOptionsGet();
  assert.equal(res.status, 200);
  const body = (await res.json()) as { data: ReturnType<typeof buildMatchFacetOptions> };
  assert.deepEqual(body.data, buildMatchFacetOptions());
  assert.match(res.headers.get("Cache-Control") ?? "", /s-maxage=86400/);
});

test("GET /api/v1/matches/chip-counts returns isolation totals for active keys", async () => {
  const res = await chipCountsGet(
    new Request(`${SITE}/api/v1/matches/chip-counts?venue=H&keys=venue`),
  );
  assert.equal(res.status, 200);
  const body = (await res.json()) as { data: Record<string, number> };
  const filter = matchFilterFromSearchParams({ venue: "H" });
  assert.deepEqual(body.data, matchChipCounts(filter, ["venue"]));
});

test("GET /api/v1/matches/chip-counts rejects invalid date params", async () => {
  const res = await chipCountsGet(
    new Request(`${SITE}/api/v1/matches/chip-counts?from=not-a-date&keys=from`),
  );
  assert.equal(res.status, 400);
});
