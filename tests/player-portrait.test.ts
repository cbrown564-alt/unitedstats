import assert from "node:assert/strict";
import test from "node:test";

import { normalizePortraitSrc } from "../components/PlayerPortrait";

test("Wikimedia portrait URLs drop legacy cache-buster queries", () => {
  assert.equal(
    normalizePortraitSrc(
      "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/HaroldHalse.jpg/120px-HaroldHalse.jpg?_=20150906073133",
    ),
    "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/HaroldHalse.jpg/120px-HaroldHalse.jpg",
  );
});

test("local and unrelated portrait URLs are unchanged", () => {
  assert.equal(normalizePortraitSrc("/media/players/harold-halse.webp"), "/media/players/harold-halse.webp");
  assert.equal(normalizePortraitSrc("https://example.com/player.jpg?v=1"), "https://example.com/player.jpg?v=1");
  assert.equal(normalizePortraitSrc(null), null);
});
