import assert from "node:assert/strict";
import { test } from "node:test";
import { resolveSitemap } from "next/dist/build/webpack/loaders/metadata/resolve-route-data";
import sitemap from "../app/sitemap";
import { GET as llmsTxtRoute } from "../app/llms.txt/route";

function sitemapPaths() {
  return sitemap().map((entry) => new URL(entry.url.replaceAll("&amp;", "&")).pathname);
}

test("sitemap lists canonical pages without saved-query receipts", () => {
  assert.ok(sitemap().every((entry) => !new URL(entry.url.replaceAll("&amp;", "&")).search));
  assert.ok(sitemapPaths().every((path) => path !== "/cut"));

  const xml = resolveSitemap(sitemap());
  assert.doesNotMatch(xml, /<loc>[^<]*&(?!amp;)[^<]*<\/loc>/);
});

test("sitemap excludes surprise, search, and the calendar corpus", () => {
  const paths = sitemapPaths();
  assert.ok(!paths.includes("/surprise"));
  assert.ok(!paths.includes("/search"));
  assert.ok(!paths.includes("/matches"));
  assert.ok(!paths.some((path) => path.startsWith("/on-this-day")));
});

test("llms.txt returns plain text with key links and license", async () => {
  const res = await llmsTxtRoute();
  assert.equal(res.status, 200);
  assert.match(res.headers.get("Content-Type") ?? "", /text\/plain/);
  const body = await res.text();
  assert.match(body, /Red Thread/);
  assert.match(body, /\/data/);
  assert.match(body, /\/sitemap\.xml/);
  assert.match(body, /CC BY-SA 4\.0/);
});
