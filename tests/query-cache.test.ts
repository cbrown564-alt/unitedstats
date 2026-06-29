import assert from "node:assert/strict";
import test from "node:test";

import { cachedQuery, clearQueryCache } from "../lib/queryCache";

test.afterEach(() => clearQueryCache());

test("cachedQuery returns the same value within TTL", () => {
  let calls = 0;
  const first = cachedQuery("playersIndex", 60_000, () => {
    calls++;
    return { n: 1 };
  });
  const second = cachedQuery("playersIndex", 60_000, () => {
    calls++;
    return { n: 2 };
  });
  assert.equal(calls, 1);
  assert.equal(second, first);
});

test("cachedQuery isolates keys", () => {
  const a = cachedQuery("a", 60_000, () => 1);
  const b = cachedQuery("b", 60_000, () => 2);
  assert.equal(a, 1);
  assert.equal(b, 2);
});

test("cachedQuery refetches after TTL", () => {
  test.mock.timers.enable({ apis: ["Date"], now: 1_000 });
  let calls = 0;
  cachedQuery("k", 100, () => {
    calls++;
    return "v1";
  });
  test.mock.timers.tick(101);
  const next = cachedQuery("k", 100, () => {
    calls++;
    return "v2";
  });
  assert.equal(calls, 2);
  assert.equal(next, "v2");
  test.mock.timers.reset();
});
