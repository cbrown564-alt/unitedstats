import assert from "node:assert/strict";
import test from "node:test";

import { GET } from "../app/api/v1/matches/view/route";
import { buildMatchesPageView } from "../lib/buildMatchesPageView";
import {
  hasActiveMatchFilters,
  matchesPageNeedsClientFetch,
} from "../lib/matchPageView";

const SITE = "https://unitedstats.vercel.app";

test("matchesPageNeedsClientFetch is false for the default archive view", () => {
  assert.equal(matchesPageNeedsClientFetch({}), false);
  assert.equal(matchesPageNeedsClientFetch({ sort: "date-desc" }), false);
});

test("matchesPageNeedsClientFetch is true when filters or pagination apply", () => {
  assert.equal(matchesPageNeedsClientFetch({ opponent: "liverpool" }), true);
  assert.equal(matchesPageNeedsClientFetch({ page: "2" }), true);
  assert.equal(matchesPageNeedsClientFetch({ sort: "date-asc" }), true);
  assert.equal(hasActiveMatchFilters({ venue: "H" }), true);
});

test("GET /api/v1/matches/view returns the same shape as buildMatchesPageView", async () => {
  const res = await GET(new Request(`${SITE}/api/v1/matches/view?venue=H`));
  assert.equal(res.status, 200);
  const body = (await res.json()) as { data: ReturnType<typeof buildMatchesPageView> };
  const expected = buildMatchesPageView({ venue: "H" });
  assert.equal(body.data.total, expected.total);
  assert.equal(body.data.rows.length, expected.rows.length);
  assert.equal(body.data.hasFilters, true);
});

test("default matches page view is the unfiltered first page", () => {
  const view = buildMatchesPageView({});
  assert.equal(view.page, 1);
  assert.equal(view.hasFilters, false);
  assert.equal(view.sort, "date-desc");
  assert.ok(view.total > 0);
  assert.equal(view.rows.length, 50);
});
