import assert from "node:assert/strict";
import test from "node:test";
import type React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import OnThisDayPage, { generateStaticParams as onThisDayParams } from "../app/on-this-day/[monthDay]/page";
import CollectionPage, { generateMetadata as collectionMetadata } from "../app/collection/page";
import CutEmbedPage, { generateMetadata as embedMetadata, generateStaticParams as embedParams } from "../app/embed/cut/[slug]/page";
import nextConfig from "../next.config";
import { CURATED_CUTS, curatedCut, cutHref } from "../lib/cut";
import { decodeCollection, encodeCollection, MAX_COLLECTION_CHARS, MAX_COLLECTION_CUTS } from "../lib/collections";
import { collectionShareHref, encodeCollectionHrefs } from "../lib/collectionShare";
import { cutEmbed, EMBED_FRAME_HEADERS } from "../lib/embeds";
import { monthDayKeys, onThisDay } from "../lib/onThisDay";

test("on-this-day exposes all 366 UTC month/day keys", () => {
  const keys = monthDayKeys();
  assert.equal(keys.length, 366);
  assert.equal(keys[0], "01-01");
  assert.ok(keys.includes("02-29"));
  assert.equal(keys.at(-1), "12-31");
  assert.equal(onThisDayParams().length, 366);
});

test("on-this-day fixtures pin deterministic facts including February 29", async () => {
  const leap = onThisDay("02-29");
  assert.equal(leap.facts[0].id, "1896-02-29-burton-wanderers-h");
  assert.equal(leap.facts[1].text, "Saturday 29 February 1908: United 1-0 Birmingham City.");
  assert.equal(leap.facts[1].evidencePath, "/match/1908-02-29-birmingham-city-h");

  const finalDay = onThisDay("05-26");
  assert.ok(finalDay.facts.some((fact) => fact.id === "1999-05-26-bayern-munich-n" && fact.text.includes("2-1 FC Bayern Munich")));

  const html = renderToStaticMarkup(
    (await OnThisDayPage({ params: Promise.resolve({ monthDay: "05-26" }) })) as React.ReactElement,
  );
  assert.match(html, /United 2-1 FC Bayern Munich/);
  assert.match(html, /href="\/match\/1999-05-26-bayern-munich-n"/);
});

test("on-this-day all keys resolve without crashing and fallback is deterministic", () => {
  for (const key of monthDayKeys()) {
    const entry = onThisDay(key);
    assert.equal(entry.monthDay, key);
    assert.equal(entry.ref.id, `us:on-this-day:${key}`);
    if (entry.facts.length === 0) assert.equal(entry.fallback, `No official United match is recorded on ${key}.`);
  }
});

test("saved collections round-trip one, many, and max-size Cut sets", async () => {
  const one = encodeCollection([curatedCut(CURATED_CUTS[0])]);
  const decodedOne = decodeCollection(one);
  assert.equal(decodedOne.ok, true);
  if (decodedOne.ok) {
    assert.equal(decodedOne.collection.cuts.length, 1);
    assert.equal(decodedOne.collection.cuts[0].href, "/cut?by=opponent&metric=winrate");
    assert.ok(decodedOne.collection.cuts[0].result.coverage.basis.includes("Result-level record"));
    assert.ok(decodedOne.collection.cuts[0].result.groups[0].href.startsWith("/matches"));
  }

  const many = encodeCollection(CURATED_CUTS.map(curatedCut));
  const decodedMany = decodeCollection(many);
  assert.equal(decodedMany.ok, true);
  if (decodedMany.ok) assert.equal(decodedMany.collection.cuts.length, CURATED_CUTS.length);

  const max = encodeCollection(Array.from({ length: MAX_COLLECTION_CUTS }, () => curatedCut(CURATED_CUTS[0])));
  assert.ok(max.length <= MAX_COLLECTION_CHARS);
  const decodedMax = decodeCollection(max);
  assert.equal(decodedMax.ok, true);
  if (decodedMax.ok) assert.equal(decodedMax.collection.cuts.length, MAX_COLLECTION_CUTS);

  const html = renderToStaticMarkup(
    (await CollectionPage({ searchParams: Promise.resolve({ c: one }) })) as React.ReactElement,
  );
  assert.match(html, /Saved Cuts/);
  assert.match(html, /Evidence/);
});

test("the client save widget encodes a working set the server decodes identically", () => {
  const hrefs = CURATED_CUTS.slice(0, 3).map((c) => cutHref(curatedCut(c)));

  // The browser-side encoder (collectionShare) matches the server encoder byte-for-byte.
  assert.equal(encodeCollectionHrefs(hrefs), encodeCollection(CURATED_CUTS.slice(0, 3).map(curatedCut)));

  const share = collectionShareHref(hrefs);
  assert.ok(share.startsWith("/collection?c="));
  const param = new URL(share, "https://unitedstats.test").searchParams.get("c") ?? "";
  const decoded = decodeCollection(param);
  assert.equal(decoded.ok, true);
  if (decoded.ok) {
    assert.equal(decoded.collection.cuts.length, 3);
    assert.equal(decoded.collection.cuts[0].href, hrefs[0]);
  }

  // Removing an item re-encodes to a smaller, still-valid collection URL.
  const removed = collectionShareHref(hrefs.filter((_, i) => i !== 1));
  const removedDecoded = decodeCollection(new URL(removed, "https://unitedstats.test").searchParams.get("c") ?? "");
  assert.equal(removedDecoded.ok, true);
  if (removedDecoded.ok) assert.equal(removedDecoded.collection.cuts.length, 2);
});

test("saved collections reject over-cap inputs without truncating state and are noindex", async () => {
  assert.throws(
    () => encodeCollection(Array.from({ length: MAX_COLLECTION_CUTS + 1 }, () => curatedCut(CURATED_CUTS[0]))),
    /exceeds 12 Cuts/,
  );
  const tooLong = decodeCollection("x".repeat(MAX_COLLECTION_CHARS + 1));
  assert.deepEqual(tooLong, { ok: false, error: "Collection exceeds 1800 URL characters." });
  const malformed = decodeCollection("not-valid-base64");
  assert.equal(malformed.ok, false);

  const meta = await collectionMetadata();
  assert.deepEqual(meta.robots, { index: false, follow: true });
});

test("cut embeds are bounded to curated slugs, render content, and are noindex", async () => {
  assert.deepEqual(embedParams(), CURATED_CUTS.map((cut) => ({ slug: cut.slug })));
  const embed = cutEmbed("opponents-by-win-rate");
  assert.ok(embed);
  assert.equal(embed.ref.id, "us:embed:cut-card%3Aopponents-by-win-rate");
  assert.equal(cutEmbed("arbitrary-fork"), null);

  const html = renderToStaticMarkup(
    (await CutEmbedPage({ params: Promise.resolve({ slug: "opponents-by-win-rate" }) })) as React.ReactElement,
  );
  assert.match(html, /UnitedStats embed/);
  assert.match(html, /Every opponent, by how often United beat them/);

  const meta = await embedMetadata();
  assert.deepEqual(meta.robots, { index: false, follow: false });
});

test("embed headers declare cache and framing behavior", async () => {
  assert.deepEqual(EMBED_FRAME_HEADERS, [
    { key: "Cache-Control", value: "public, max-age=300, s-maxage=86400, stale-while-revalidate=604800" },
    { key: "Content-Security-Policy", value: "frame-ancestors *" },
  ]);
  const headers = nextConfig.headers ? await nextConfig.headers() : [];
  const embedHeader = headers.find((entry) => entry.source === "/embed/:path*");
  assert.ok(embedHeader);
  assert.deepEqual(embedHeader.headers, EMBED_FRAME_HEADERS);
});
