import assert from "node:assert/strict";
import test from "node:test";

import { GET } from "../app/api/v1/matches/facets/route";
import { matchFacetCounts } from "../lib/queries";

const SITE = "https://unitedstats.vercel.app";

test("GET /api/v1/matches/facets returns contextual facet counts", async () => {
  const res = await GET(new Request(`${SITE}/api/v1/matches/facets?venue=H`));
  assert.equal(res.status, 200);
  const body = (await res.json()) as { data: Record<string, Record<string, number>> };
  const expected = matchFacetCounts({ venue: "H" });
  assert.deepEqual(body.data.opponent, expected.opponent);
  assert.ok(Object.keys(body.data.competition).length > 0);
  assert.ok(body.attribution);
});

test("GET /api/v1/matches/facets rejects invalid date params", async () => {
  const res = await GET(new Request(`${SITE}/api/v1/matches/facets?from=not-a-date`));
  assert.equal(res.status, 400);
});
