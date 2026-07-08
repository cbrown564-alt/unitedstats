import assert from "node:assert/strict";
import { test } from "node:test";
import { resolveSitemap } from "next/dist/build/webpack/loaders/metadata/resolve-route-data";
import sitemap from "../app/sitemap";
import { GET as llmsTxtRoute } from "../app/llms.txt/route";

function sitemapPaths() {
  return sitemap().map((entry) => new URL(entry.url.replaceAll("&amp;", "&")).pathname);
}

test("sitemap XML escapes ampersands in query-string URLs", () => {
  const xml = resolveSitemap(sitemap());
  assert.match(xml, /<loc>https:\/\/[^<]*&amp;[^<]*<\/loc>/);
  assert.doesNotMatch(xml, /<loc>[^<]*&(?!amp;)[^<]*<\/loc>/);
});

test("sitemap includes /surprise", () => {
  const paths = sitemapPaths();
  assert.ok(paths.includes("/surprise"));
  const entry = sitemap().find((e) => e.url.endsWith("/surprise"));
  assert.equal(entry?.changeFrequency, "weekly");
  assert.equal(entry?.priority, 0.7);
});

test("llms.txt returns plain text with key links and license", async () => {
  const res = await llmsTxtRoute();
  assert.equal(res.status, 200);
  assert.match(res.headers.get("Content-Type") ?? "", /text\/plain/);
  const body = await res.text();
  assert.match(body, /Red Thread/);
  assert.match(body, /\/data/);
  assert.match(body, /\/api\/v1\/meta/);
  assert.match(body, /\/dataset\/manifest\.json/);
  assert.match(body, /\/sitemap\.xml/);
  assert.match(body, /CC BY-SA 4\.0/);
});
