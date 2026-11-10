import assert from "node:assert/strict";
import test from "node:test";
import { monotonePath, niceTicks, thinIndices } from "../components/charts/plot";

test("niceTicks steps like d3", () => {
  assert.deepEqual(niceTicks([0, 34], 4), [0, 10, 20, 30]);
  assert.deepEqual(niceTicks([0, 1572], 3), [0, 500, 1000, 1500]);
});

test("thinIndices keeps endpoints, extremes and the cap", () => {
  const pts: [number, number][] = Array.from({ length: 6000 }, (_, i) => [i / 60, 50 + 20 * Math.sin(i / 37)]);
  pts[4321] = [pts[4321][0], 1]; // a lone spike must survive
  const keep = thinIndices(pts, 600);
  assert.equal(keep.length, 600);
  assert.equal(keep[0], 0);
  assert.equal(keep.at(-1), 5999);
  assert.ok(keep.includes(4321));
  assert.ok(keep.every((v, i) => i === 0 || v > keep[i - 1]));
});

test("thinIndices passes short series through", () => {
  assert.deepEqual(thinIndices([[0, 0], [1, 1]], 600), [0, 1]);
});

test("monotonePath starts at the first point", () => {
  assert.match(monotonePath([[0, 10], [50, 20], [100, 5]]), /^M0,10C/);
});
