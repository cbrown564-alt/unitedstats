/**
 * Rediscovery engine tests (Phase 3a — lib/charge.ts + lib/rediscovery.ts).
 *
 * These pin the *properties* the engine must hold, not exact scores (the weights
 * are tunable): a forgotten-but-charged night surfaces, a famous night is
 * suppressed, charged defeats are eligible, the era bias reorders toward the
 * reader, and selection is deterministic (the static guardrail — no behavioural
 * or random input).
 *
 * Run: npm test (requires data/united.db — npm run build:db).
 */
import assert from "node:assert/strict";
import test from "node:test";

import { getDb } from "../lib/db";
import { topRediscoveries, eraBias } from "../lib/rediscovery";
import { ageBand, fadedness } from "../lib/charge";

// Closed history — stable ids.
const TREBLE_FINAL = "1999-05-26-bayern-munich-n"; // famous: a curated night
const FORGOTTEN_EXIT = "2010-03-30-bayern-munich-a"; // 2010 QF, charged, not famous

function chargeRow(id: string) {
  return getDb()
    .prepare("SELECT charge, fadedness, score, reason FROM match_charge WHERE match_id = ?")
    .get(id) as { charge: number; fadedness: number; score: number; reason: string } | undefined;
}

test("fadedness inverts the curated hero: famous nights are suppressed", () => {
  const famous = chargeRow(TREBLE_FINAL);
  const forgotten = chargeRow(FORGOTTEN_EXIT);
  assert.ok(famous, "treble final should be scored");
  assert.ok(forgotten, "2010 exit should be scored");
  // The treble final is genuinely charged (a stoppage-time comeback) but famous,
  // so its fadedness carries the strong fame penalty…
  assert.ok(famous!.fadedness <= 0.2, `famous fadedness ${famous!.fadedness} should be <= 0.2`);
  // …while a forgotten night of the same era keeps full living-memory fadedness.
  assert.ok(forgotten!.fadedness >= 0.8, `forgotten fadedness ${forgotten!.fadedness} should be >= 0.8`);
});

test("the famous treble final never reaches the overall top picks", () => {
  const top = topRediscoveries({ limit: 80 }).map((p) => p.match.id);
  assert.ok(!top.includes(TREBLE_FINAL), "treble final should be suppressed out of the top");
});

test("the 2015-16 Europa exit to Liverpool tops its entity slices", () => {
  // The canonical rediscovery example: a forgotten, charged knockout exit.
  const liverpool = topRediscoveries({
    entityKind: "opponent",
    entityId: "liverpool",
    since: 2010,
    limit: 5,
  });
  const top3 = liverpool.slice(0, 3);
  const exit = top3.find((p) => p.match.id.startsWith("2016-03") && p.match.opponent_id === "liverpool");
  assert.ok(exit, "the 2016 Liverpool Europa exit should be in the top 3 of the Liverpool slice");
  assert.equal(exit!.reason, "knockoutExit");

  const season = topRediscoveries({ entityKind: "season", entityId: "2015-16", limit: 3 }).map(
    (p) => p.match.id,
  );
  assert.ok(
    season.includes("2016-03-17-liverpool-h") || season.includes("2016-03-10-liverpool-a"),
    `2015-16 slice should lead with the Liverpool exit, got ${season.join(", ")}`,
  );
});

test("charged defeats are eligible — the top picks are not wins-only", () => {
  const top = topRediscoveries({ limit: 10 });
  assert.ok(
    top.some((p) => p.match.result === "L"),
    "rediscovery must surface forgotten defeats, not just wins",
  );
});

test("selection is deterministic (static guardrail — no behaviour, no randomness)", () => {
  const a = topRediscoveries({ since: 2010, limit: 25 }).map((p) => p.match.id);
  const b = topRediscoveries({ since: 2010, limit: 25 }).map((p) => p.match.id);
  assert.deepEqual(a, b);
});

test("the era bias reorders toward the reader's living memory", () => {
  assert.equal(eraBias(2016, undefined), 1, "no era → neutral");
  assert.ok(eraBias(2016, 2010) > eraBias(2016, undefined), "in-era night is boosted");
  assert.ok(eraBias(1990, 2010) < 1, "pre-era night is faded");

  const neutral = topRediscoveries({ limit: 40 }).map((p) => p.match.id);
  const era = topRediscoveries({ since: 2018, limit: 40 }).map((p) => p.match.id);
  assert.notDeepEqual(neutral, era, "supplying an era should change the ranking");
});

test("ageBand is a living-memory window", () => {
  assert.ok(ageBand(0.5) < 0.3, "last season is not yet forgotten");
  assert.equal(ageBand(12), 1.0, "the ~5–28y zone is the sweet spot");
  assert.ok(ageBand(80) <= 0.2, "the deep archive is faded (the hero's 'never saw it' mode)");

  const now = new Date(Date.UTC(2026, 0, 1));
  assert.ok(
    fadedness(2016, false, now) > fadedness(2016, true, now),
    "the same night is more faded when it is famous",
  );
});
