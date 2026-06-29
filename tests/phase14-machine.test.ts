import assert from "node:assert/strict";
import test from "node:test";
import type React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { GET as AnswersIndexRoute } from "../app/api/v1/answers/route";
import { GET as CutAnswerRoute } from "../app/api/v1/answers/cuts/[slug]/route";
import MatchPage from "../app/match/[id]/page";
import robots from "../app/robots";
import sitemap from "../app/sitemap";
import { API_ATTRIBUTION } from "../lib/api";
import { answerRef, cutKey, matchRef } from "../lib/citations";
import { CURATED_CUTS, curatedCut } from "../lib/cut";
import { cutAnswer } from "../lib/machineAnswers";
import { SITE_URL } from "../lib/site";
import { jsonLdHtml, matchJsonLd } from "../lib/structuredData";
import { matchById, sourcesForMatch } from "../lib/queries";

const MATCH_ID = "1999-05-26-bayern-munich-n";
const CUT_SLUG = "opponents-by-win-rate";

function firstJsonLd(html: string): Record<string, unknown> {
  const match = /<script type="application\/ld\+json">(.+?)<\/script>/.exec(html);
  assert.ok(match, "JSON-LD script should render");
  return JSON.parse(match[1]) as Record<string, unknown>;
}

test("match JSON-LD uses SportsEvent, Phase 0 IDs, and canonical match-source provenance", () => {
  const match = matchById(MATCH_ID);
  assert.ok(match);
  const jsonLd = matchJsonLd(match, sourcesForMatch(MATCH_ID));

  assert.equal(jsonLd["@type"], "SportsEvent");
  assert.equal(jsonLd.identifier, matchRef(MATCH_ID).id);
  assert.equal(jsonLd.url, matchRef(MATCH_ID).url);
  assert.equal(jsonLd.startDate, "1999-05-26");

  const basedOn = jsonLd.isBasedOn as { identifier: string; name: string; about: string }[];
  assert.ok(basedOn.some((s) => s.identifier === "wikipedia" && s.about === "attendance"));
  assert.ok(basedOn.some((s) => s.identifier === "wikipedia" && s.about === "result"));
});

test("the match page renders parseable JSON-LD with a citable ID", async () => {
  const matchHtml = renderToStaticMarkup(
    (await MatchPage({ params: Promise.resolve({ id: MATCH_ID }) })) as React.ReactElement,
  );
  const matchLd = firstJsonLd(matchHtml);
  assert.equal(matchLd.identifier, matchRef(MATCH_ID).id);
  assert.match(String(matchLd.name), /Manchester United 2-1 FC Bayern Munich/);
});

test("JSON-LD serialization is deterministic and escapes script-breaking text", () => {
  const payload = { "@context": "https://schema.org", name: "A < B", z: 1, a: 2 };
  const once = jsonLdHtml(payload);
  const twice = jsonLdHtml(payload);
  assert.equal(once, twice);
  assert.match(once, /\\u003c/);
  assert.ok(once.indexOf("\"a\"") < once.indexOf("\"z\""));
});

test("curated Cut machine answer has stable cut and answer IDs, provenance, and cache headers", async () => {
  const answer = cutAnswer(CUT_SLUG);
  assert.ok(answer);

  const cut = curatedCut(CURATED_CUTS[0]);
  assert.equal(answer.cut?.id, `us:cut:${CUT_SLUG}`);
  assert.equal(answer.ref.id, answerRef("cut-headline", cutKey(cut), `/api/v1/answers/cuts/${CUT_SLUG}`).id);
  assert.match(answer.version, /^cv1-/);
  assert.ok(answer.provenance.some((p) => p.sourceId === "engsoccerdata" && p.facet === "result"));
  assert.ok(answer.evidence.some((e) => e.path.startsWith("/matches")));

  const res = await CutAnswerRoute(new Request(`${SITE_URL}/api/v1/answers/cuts/${CUT_SLUG}`), {
    params: Promise.resolve({ slug: CUT_SLUG }),
  });
  assert.equal(res.headers.get("Access-Control-Allow-Origin"), "*");
  assert.match(res.headers.get("Cache-Control") ?? "", /s-maxage=86400/);
  const body = await res.json();
  assert.equal(body.attribution.source, API_ATTRIBUTION.source);
  assert.equal(body.data.ref.id, answer.ref.id);
});

test("answer IDs are unique and deterministic across selected Phase 14 surfaces", () => {
  const refs = [
    ...CURATED_CUTS.map((c) => cutAnswer(c.slug)?.ref.id),
  ].filter(Boolean) as string[];
  assert.equal(new Set(refs).size, refs.length);
  assert.deepEqual(refs, [
    "us:answer:cut-headline%3Aopponents-by-win-rate",
    "us:answer:cut-headline%3Amanagers-by-points",
    "us:answer:cut-headline%3Aseasons-by-points",
  ]);
});

test("the answer index and sitemap agree on the machine and human surfaces", async () => {
  const answerIndex = await AnswersIndexRoute();
  assert.equal((await answerIndex.json()).data.source, API_ATTRIBUTION.source);

  const humanUrls = new Set(sitemap().map((entry) => new URL(entry.url).pathname));
  assert.ok(humanUrls.has("/"));
  assert.ok(humanUrls.has("/data"));
});

test("robots allows read-only API routes while disallowing side-effect click logging", () => {
  const policy = robots();
  assert.deepEqual(policy.rules, {
    userAgent: "*",
    allow: ["/", "/api/v1/"],
    disallow: ["/api/search/click"],
  });
  assert.equal(policy.sitemap, `${SITE_URL}/sitemap.xml`);
});
