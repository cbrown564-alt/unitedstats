import assert from "node:assert/strict";
import test from "node:test";
import { analyticsDestination, redactAnalyticsUrl } from "../lib/analytics";
import { recordStories } from "../lib/recordStories";
import { JOURNEY_CHAPTERS } from "../lib/journey";

test("analytics never exposes raw search text or URL fragments", () => {
  assert.equal(redactAnalyticsUrl("https://utdred.com/search?q=private%20text#note"), "https://utdred.com/search");
  assert.deepEqual(analyticsDestination("/matches?player=wayne-rooney&q=private"), { path: "/matches" });
  assert.deepEqual(analyticsDestination("/record?kind=player&id=wayne-rooney&q=private"), { path: "/record", kind: "player", id: "wayne-rooney" });
});
test("authored record continuations resolve to published stories", () => {
  for (const [kind, id] of [["match", "2001-09-29-tottenham-hotspur-a"], ["player", "george-best"], ["player", "teddy-sheringham"]] as const) {
    const links = recordStories(kind, id);
    assert.ok(links.length > 0);
    for (const link of links) assert.ok(JOURNEY_CHAPTERS.some(chapter => chapter.href === link.href));
  }
});
