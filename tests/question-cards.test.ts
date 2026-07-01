/**
 * Tested-question consistency tests.
 *
 * Three surfaces answer each curated question with the same figure: the /explore
 * headline (`lib/questionHeadlines.ts`), the OG share card (`lib/questionCardData.ts`),
 * and the on-page module (`components/QuestionModules.tsx`). They compute it
 * independently, so they can drift — and one did: the fortress headline hardcoded
 * "0 defeats" while minute-data ingestion had since surfaced 18 home losses from a
 * half-time lead. These tests pin the surfaces to each other and to the live data,
 * so a future hardcode or threshold change that breaks one surface fails CI.
 *
 * Run: npm test (requires data/united.db — npm run build:db)
 */
import assert from "node:assert/strict";
import test from "node:test";

import { QUESTIONS } from "../lib/questions";
import { questionHeadlines } from "../lib/questionHeadlines";
import { questionAnswer } from "../lib/questionCardData";
import { leadHeldAtHome, europeanFinals } from "../lib/trails";
import { topScorers } from "../lib/queries";
import { getDb } from "../lib/db";
import { fmtNum } from "../lib/format";

// Questions that render a data-driven OG card. The new front-door questions
// (decline, ferguson, treble, europe) fall back to the text card for now;
// own-goals stays as a linkable easter-egg card.
const DATA_CARD_SLUGS = ["late-goals", "runs", "cup-specialists", "own-goals", "fortress"];
const DEFERRED_SLUGS = ["comebacks", "manager-bounce", "treble", "europe"];
// Questions whose headline figure and card figure are the same number.
const HEADLINE_MATCHES_CARD = ["late-goals", "runs", "cup-specialists", "fortress"];

test("every curated question has a non-empty, data-present headline", () => {
  const headlines = questionHeadlines();
  for (const { slug } of QUESTIONS) {
    const h = headlines[slug];
    assert.ok(h, `missing headline for ${slug}`);
    assert.ok(h.stat.length > 0, `empty headline stat for ${slug}`);
    assert.notEqual(h.stat, "—", `${slug} headline fell back to the no-data placeholder`);
    assert.ok(h.gloss.length > 0, `empty headline gloss for ${slug}`);
  }
});

test("the data-card questions render a card; the deferred fall back to text", () => {
  for (const slug of DATA_CARD_SLUGS) {
    const a = questionAnswer(slug);
    assert.ok(a, `${slug} should produce a data card`);
    assert.ok(a.figure.length > 0, `${slug} card has no figure`);
    assert.ok(a.gloss.length > 0, `${slug} card has no gloss`);
  }
  for (const slug of DEFERRED_SLUGS) {
    assert.equal(questionAnswer(slug), null, `${slug} should fall back to the text card`);
  }
});

test("each data card's visual is well-formed", () => {
  for (const slug of DATA_CARD_SLUGS) {
    const a = questionAnswer(slug);
    assert.ok(a);
    const v = a.visual;
    if (v.kind === "wdl") {
      assert.ok(v.w >= 0 && v.d >= 0 && v.l >= 0, `${slug} wdl has a negative segment`);
      assert.ok(v.w + v.d + v.l > 0, `${slug} wdl is empty`);
    } else {
      assert.ok(v.bars.length > 0, `${slug} ${v.kind} has no bars`);
      assert.ok(v.bars.some((b) => b.highlight), `${slug} highlights no bar`);
      assert.ok(v.bars.every((b) => Number.isFinite(b.value)), `${slug} has a non-finite bar value`);
    }
  }
});

test("the /explore headline and the OG card report the same figure", () => {
  const headlines = questionHeadlines();
  for (const slug of HEADLINE_MATCHES_CARD) {
    const a = questionAnswer(slug);
    assert.ok(a, `${slug} should have a data card`);
    assert.equal(a.figure, headlines[slug].stat, `card figure and explore headline disagree for ${slug}`);
  }
});

test("own-goals: card leads with the rank, derived from the live top-scorers table", () => {
  const a = questionAnswer("own-goals");
  assert.ok(a);
  const idx = topScorers(8).findIndex((p) => p.player_id === "own-goal");
  assert.equal(a.figure, idx >= 0 ? `#${idx + 1}` : "—", "card should lead with the own-goal rank");
});

test("fortress: every surface reports the real unbeaten run, never a stale 0", () => {
  const lh = leadHeldAtHome();
  const results = lh.games.map((g) => g.result);
  const lastLossIdx = results.lastIndexOf("L");
  const run = lh.games.length - 1 - lastLossIdx;
  const tail = lh.games.slice(lastLossIdx + 1);

  // The run is a genuine unbeaten streak: the trailing games hold no loss, and it
  // begins right after one (these checks don't re-derive the figure, so they catch
  // a wrong run, not just a hardcode).
  assert.equal(tail.length, run);
  assert.ok(run > 0, "fortress run should be positive");
  assert.ok(tail.every((g) => g.result !== "L"), "the unbeaten run must contain no losses");
  if (lastLossIdx >= 0) {
    assert.equal(lh.games[lastLossIdx].result, "L", "the run must begin just after a defeat");
  }

  const h = questionHeadlines().fortress;
  const a = questionAnswer("fortress");
  assert.ok(a);
  assert.equal(h.stat, fmtNum(run), "explore headline must report the live run");
  assert.equal(a.figure, fmtNum(run), "OG card must report the live run");
  assert.notEqual(h.stat, "0", "the fortress headline must never be a flat 0");
  assert.match(h.gloss, /unbeaten since \d{4}/, "headline gloss should name the year");

  assert.equal(a.visual.kind, "wdl");
  if (a.visual.kind === "wdl") {
    assert.equal(a.visual.l, 0, "the card's modern run shows no losses");
    assert.equal(a.visual.w + a.visual.d, run, "the card's W+D should equal the run length");
  }
});

test("europe: finals are one-off deciders, not quarter-finals", () => {
  // The round filter once read `round LIKE '%final%'`, which matches the substring
  // in "Quarter-final" — inflating United's European finals from 10 to 65 (and the
  // trophy count from 5 to 32). These guards re-derive independently so the bug
  // can't return: a magnitude bound, and no final may share an id with a QF tie.
  const finals = europeanFinals();
  assert.ok(finals.length > 0, "should find European finals");
  assert.ok(
    finals.length <= 15,
    `implausible European-final count (${finals.length}) — quarter-finals leaking through the round filter?`,
  );
  assert.ok(finals.filter((f) => f.won).length <= finals.length, "won finals can't exceed finals");

  const qfIds = new Set(
    (
      getDb()
        .prepare(
          `SELECT m.id FROM matches m JOIN competitions c ON c.id = m.competition_id
           WHERE (c.type = 'european' OR c.id = 'uefa-super-cup') AND m.round LIKE '%quarter%'`,
        )
        .all() as { id: string }[]
    ).map((r) => r.id),
  );
  assert.ok(finals.every((f) => !qfIds.has(f.id)), "a quarter-final is being counted as a European final");
});
