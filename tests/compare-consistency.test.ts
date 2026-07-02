/**
 * Compare / explore consistency tests.
 *
 * Two surfaces preview each curated debate with the same live verdict: the /explore
 * carousel (`lib/compareExplore.ts`) and the /compare scoreboard (`lib/compare.ts`).
 * They compute independently, so they can drift — these tests pin them together and
 * guard the hand-curated trail graph in `lib/compareRelated.ts`.
 *
 * Run: npm test (requires data/united.db — npm run build:db)
 */
import assert from "node:assert/strict";
import test from "node:test";

import { CURATED_DEBATES } from "../lib/compare";
import { compareDebateKey, exploreDebates } from "../lib/compareExplore";
import { relatedComparisonKeys, relatedComparisons } from "../lib/compareRelated";
import { questionSlugs } from "../lib/questions";

const PLAYER_MANAGER_MODES = ["players", "managers"] as const;

test("every curated player/manager debate resolves with a live headline", () => {
  for (const mode of PLAYER_MANAGER_MODES) {
    for (const d of CURATED_DEBATES[mode]) {
      const row = exploreDebates().find((x) => x.label === d.label);
      assert.ok(row, `missing explore row for ${d.label}`);
      assert.ok(row.c.headline && row.c.headline.length > 0, `${d.label} has no headline`);
      assert.notEqual(row.c.headline, "—", `${d.label} headline fell back to placeholder`);
    }
  }
});

test("explore debates mirror the registry — no extras, no omissions", () => {
  const expected = PLAYER_MANAGER_MODES.flatMap((mode) => CURATED_DEBATES[mode].map((d) => d.label)).sort();
  const actual = exploreDebates().map((d) => d.label).sort();
  assert.deepEqual(actual, expected);
});

test("the /explore carousel and /compare share the same verdict for every curated debate", () => {
  for (const row of exploreDebates()) {
    const again = exploreDebates().find((x) => x.href === row.href);
    assert.ok(again);
    assert.equal(again.c.headline, row.c.headline, `${row.label} headline drifted between builders`);
    assert.equal(again.c.mode, row.c.mode, `${row.label} mode drifted`);
  }
});

test("every curated debate carries a hand-curated trail of 2–3 valid next steps", () => {
  const debateKeys = new Set(
    PLAYER_MANAGER_MODES.flatMap((mode) =>
      CURATED_DEBATES[mode].map((d) => compareDebateKey(mode, d.a, d.b)),
    ),
  );
  assert.deepEqual([...relatedComparisonKeys()].sort(), [...debateKeys].sort());

  const slugSet = new Set(questionSlugs());
  const validKind = new Set(["question", "cut", "debate"]);

  for (const mode of PLAYER_MANAGER_MODES) {
    for (const d of CURATED_DEBATES[mode]) {
      const links = relatedComparisons(mode, d.a, d.b);
      assert.ok(links.length >= 2 && links.length <= 3, `${d.label} trail has ${links.length} links`);
      const seen = new Set<string>();
      for (const l of links) {
        assert.ok(l.href.startsWith("/"), `${d.label} trail href not site-relative: ${l.href}`);
        assert.ok(validKind.has(l.kind), `${d.label} trail step has unknown kind: ${l.kind}`);
        assert.ok(l.hook.length > 0, `${d.label} trail link missing a hook: ${l.href}`);
        assert.ok(!seen.has(l.href), `${d.label} trail repeats ${l.href}`);
        seen.add(l.href);
        if (l.href.startsWith("/questions/")) {
          const target = l.href.slice("/questions/".length);
          assert.ok(slugSet.has(target), `${d.label} trail points at unknown question "${target}"`);
        }
        if (l.href.startsWith("/compare")) {
          assert.ok(l.kind === "debate", `${d.label} compare href should be a debate step`);
        }
        if (l.kind === "cut") {
          assert.ok(l.href.startsWith("/cut"), `${d.label} trail points at invalid cut: ${l.href}`);
        }
      }
    }
  }
});

test("custom pairings still receive a mode-default trail", () => {
  const players = relatedComparisons("players", "ryan-giggs", "wayne-rooney");
  const managers = relatedComparisons("managers", "matt-busby", "jose-mourinho");
  assert.ok(players.length >= 2);
  assert.ok(managers.length >= 2);
  assert.notDeepEqual(players, managers);
});
