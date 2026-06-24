import assert from "node:assert/strict";
import test from "node:test";
import type React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import HistoryChangedPage, { generateMetadata, generateStaticParams } from "../app/history-changed/[id]/page";
import HistoryChangedImage from "../app/history-changed/[id]/opengraph-image";

const DIGEST_ID = "2026-05-24-brighton-and-hove-albion-a";

test("history-changed page renders digest claims and evidence links", async () => {
  const params = Promise.resolve({ id: DIGEST_ID });
  const html = renderToStaticMarkup((await HistoryChangedPage({ params })) as React.ReactElement);

  assert.match(html, /History changed/);
  assert.match(html, /beat Brighton &amp; Hove Albion 3–0 away/);
  assert.match(html, /Elo rating by \+16\.1/);
  assert.match(html, new RegExp(`href="/match/${DIGEST_ID}"`));
  assert.match(html, new RegExp(`href="/api/v1/matches/${DIGEST_ID}"`));
  assert.match(html, /claim version cv1-/);
});

test("history-changed metadata and static params expose generated digests", async () => {
  const params = generateStaticParams();
  assert.ok(params.some((p) => p.id === DIGEST_ID));

  const meta = await generateMetadata({ params: Promise.resolve({ id: DIGEST_ID }) });
  assert.equal(meta.alternates?.canonical, `/history-changed/${DIGEST_ID}`);
  assert.match(String(meta.description), /beat Brighton & Hove Albion 3–0 away/);
});

test("history-changed OG image route returns a PNG response", async () => {
  const res = await HistoryChangedImage({ params: Promise.resolve({ id: DIGEST_ID }) });
  assert.equal(res.headers.get("content-type"), "image/png");
});
