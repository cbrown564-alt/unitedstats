import assert from "node:assert/strict";
import test from "node:test";

import { GET as facetOptionsGet } from "../app/api/v1/matches/facet-options/route";
import { GET as chipCountsGet } from "../app/api/v1/matches/chip-counts/route";
import { buildMatchFacetOptions } from "../lib/matchFacetOptions";

test("GET /api/v1/matches/facet-options returns static facet lists", async () => {
  const res = await facetOptionsGet();
  assert.equal(res.status, 200);
  const body = (await res.json()) as { data: ReturnType<typeof buildMatchFacetOptions> };
  assert.deepEqual(body.data, buildMatchFacetOptions());
  assert.match(res.headers.get("Cache-Control") ?? "", /s-maxage=86400/);
});

test("GET /api/v1/matches/chip-counts is a static empty snapshot", async () => {
  const res = await chipCountsGet();
  assert.equal(res.status, 200);
  const body = (await res.json()) as { data: Record<string, number> };
  assert.deepEqual(body.data, {});
});
