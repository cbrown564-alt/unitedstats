import assert from "node:assert/strict";
import { test } from "node:test";
import { resolveSitemap } from "next/dist/build/webpack/loaders/metadata/resolve-route-data";
import sitemap from "../app/sitemap";

test("sitemap XML escapes ampersands in query-string URLs", () => {
  const xml = resolveSitemap(sitemap());
  assert.match(xml, /<loc>https:\/\/[^<]*&amp;[^<]*<\/loc>/);
  assert.doesNotMatch(xml, /<loc>[^<]*&(?!amp;)[^<]*<\/loc>/);
});
