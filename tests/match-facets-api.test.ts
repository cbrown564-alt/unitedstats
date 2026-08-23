import assert from "node:assert/strict";
import test from "node:test";

import { GET } from "../app/api/v1/matches/facets/route";
import { matchFacetCounts } from "../lib/queries";

test("GET /api/v1/matches/facets returns the unfiltered static snapshot", async () => {
  const res = await GET();
  assert.equal(res.status, 200);
  const body = (await res.json()) as { data: Record<string, Record<string, number>>; attribution?: unknown };
  const expected = matchFacetCounts({});
  assert.deepEqual(body.data.opponent, expected.opponent);
  assert.ok(Object.keys(body.data.competition).length > 0);
  assert.ok(body.attribution);
  assert.match(res.headers.get("Cache-Control") ?? "", /s-maxage=86400/);
});
