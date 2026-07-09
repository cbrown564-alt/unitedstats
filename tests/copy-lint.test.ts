/**
 * Unit tests for copy smell detection (Phase 3).
 */
import assert from "node:assert/strict";
import test from "node:test";

import {
  COPY_SMELL_RULES,
  findSmellsInText,
  lintCopyItems,
  smellHitKey,
} from "../lib/copySmells";

test("smell rules cover the rubric phrase list", () => {
  const ids = new Set(COPY_SMELL_RULES.map((r) => r.id));
  for (const id of [
    "carried-the",
    "journey",
    "legacy",
    "proves",
    "every-fan-knows",
    "grew-up-hearing",
    "you-still-hear",
  ] as const) {
    assert.ok(ids.has(id), `missing rule ${id}`);
  }
});

test("findSmellsInText flags carried-the and throat-clear openers", () => {
  const hits = findSmellsInText({
    id: "narrative:template:3",
    tier: "C",
    file: "lib/narrative.ts",
    text: "Home form carried the season — 70% of home matches won against 30% away.",
  });
  assert.equal(hits.length, 1);
  assert.equal(hits[0].smellId, "carried-the");
  assert.equal(hits[0].key, smellHitKey("narrative:template:3", "carried-the"));
});

test("official match is not flagged; official club is", () => {
  const ok = findSmellsInText({
    id: "matches:dek",
    tier: "B",
    file: "app/matches/page.tsx",
    text: "Every official match since 1886.",
  });
  assert.equal(ok.length, 0);

  const bad = findSmellsInText({
    id: "home:dek",
    tier: "A",
    file: "app/page.tsx",
    text: "The official club partner for United history.",
  });
  assert.equal(bad.length, 1);
  assert.equal(bad[0].smellId, "official-affiliation");
});

test("lintCopyItems separates new Tier A from baselined debt", () => {
  const items = [
    {
      id: "question:late-goals:finding",
      tier: "A",
      file: "components/QuestionModules.tsx",
      text: 'You still hear "Fergie time" on the terraces.',
    },
    {
      id: "question:comebacks:finding",
      tier: "A",
      file: "components/QuestionModules.tsx",
      text: "You grew up hearing United never know when they're beaten.",
    },
    {
      id: "narrative:template:3",
      tier: "C",
      file: "lib/narrative.ts",
      text: "Home form carried the season — filler.",
    },
  ];
  const known = [smellHitKey("question:late-goals:finding", "you-still-hear")];
  const { hits, tierA, newTierA, baselinedTierA } = lintCopyItems(items, known);
  assert.equal(hits.length, 3);
  assert.equal(tierA.length, 2);
  assert.equal(baselinedTierA.length, 1);
  assert.equal(newTierA.length, 1);
  assert.equal(newTierA[0].itemId, "question:comebacks:finding");
});
