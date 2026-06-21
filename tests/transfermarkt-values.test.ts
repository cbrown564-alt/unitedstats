/**
 * Unit tests for the pure core of the transfermarkt-values ingest.
 *
 * This lane broke CI once: `providerId` is typed `string | number` (football-data
 * stamps numeric ids, mufcinfo string ones), and a version that fed the number
 * straight into a string-only API failed type-check at build time. The fast
 * `npm run typecheck` gate now catches that class of error in seconds, and these
 * tests pin the runtime behaviour the coercion exists to support — a numeric
 * provider id must resolve exactly like its string form.
 *
 * Pure functions only: no DB or network, so these run anywhere (unlike the
 * golden tests, which need data/united.db).
 *
 * Run: npm test
 */
import assert from "node:assert/strict";
import test from "node:test";

import { LineupEntry } from "../scripts/lib";
import { daysBetween, nearestValuation, resolveProviderIds } from "../scripts/ingest/transfermarkt-values";

const entry = (e: Partial<LineupEntry>): LineupEntry => ({ start: true, ...e });

// ----------------------------------------------------------- resolveProviderIds

test("a numeric providerId resolves identically to its string form", () => {
  // The regression guard: football-data stamps a number, mufcinfo a string; both
  // must land on the same TM id rather than throwing or being dropped.
  const fromNumber = resolveProviderIds([entry({ player: "bruno-fernandes", providerId: 240306 })]);
  const fromString = resolveProviderIds([entry({ player: "bruno-fernandes", providerId: "240306" })]);
  assert.equal(fromNumber.get("bruno-fernandes"), "240306");
  assert.deepEqual([...fromNumber], [...fromString]);
});

test("the most-stamped numeric id wins per player", () => {
  const map = resolveProviderIds([
    entry({ player: "marcus-rashford", providerId: 258923 }),
    entry({ player: "marcus-rashford", providerId: 258923 }),
    entry({ player: "marcus-rashford", providerId: "999" }), // stray, less frequent
  ]);
  assert.equal(map.get("marcus-rashford"), "258923");
});

test("opponent rows, unknown players and non-numeric ids are ignored", () => {
  const map = resolveProviderIds([
    entry({ player: "haaland", providerId: 418560, playerSide: "opponent" }), // not United
    entry({ player: null, providerId: 123 }), // unmatched to a canonical player
    entry({ player: "trialist", providerId: "mufcinfo:trialist" }), // non-numeric provider id
    entry({ player: "kobbie-mainoo" }), // no providerId at all
  ]);
  assert.equal(map.size, 0);
});

test("an explicit united side is accepted", () => {
  const map = resolveProviderIds([
    entry({ player: "garnacho", providerId: 717924, playerSide: "united" }),
  ]);
  assert.equal(map.get("garnacho"), "717924");
});

// -------------------------------------------------------------- daysBetween

test("daysBetween is symmetric and counts whole days", () => {
  assert.equal(daysBetween("2021-01-01", "2021-01-31"), 30);
  assert.equal(daysBetween("2021-01-31", "2021-01-01"), 30);
  assert.equal(daysBetween("2021-01-01", "2021-01-01"), 0);
});

// ------------------------------------------------------------ nearestValuation

const series = [
  { date: "2019-06-01", mv: 50_000_000 },
  { date: "2020-06-01", mv: 70_000_000 },
  { date: "2021-06-01", mv: 90_000_000 },
];

test("nearestValuation returns the closest valuation within the window", () => {
  // Transfer dated just after the 2020 stamp picks 2020, not the year-away ones.
  assert.equal(nearestValuation(series, "2020-07-01"), 70_000_000);
  // Equidistant-ish but nearer the 2021 stamp.
  assert.equal(nearestValuation(series, "2021-05-01"), 90_000_000);
});

test("nearestValuation rejects a nearest valuation beyond the 365-day window", () => {
  // Two years before the earliest stamp: closest gap exceeds the window.
  assert.equal(nearestValuation(series, "2017-01-01"), null);
  assert.equal(nearestValuation([], "2020-01-01"), null);
});
