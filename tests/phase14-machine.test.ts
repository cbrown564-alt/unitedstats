import assert from "node:assert/strict";
import test from "node:test";
import type React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { GET as AnswersIndexRoute } from "../app/api/v1/answers.json/route";
import { GET as CutAnswerRoute } from "../app/api/v1/answers/cuts/[slug]/route";
import MatchPage from "../app/match/[id]/page";
import PlayerPage from "../app/player/[id]/page";
import robots from "../app/robots";
import sitemap from "../app/sitemap";
import { API_ATTRIBUTION } from "../lib/api";
import { answerRef, cutKey, entityRef, matchRef, questionRef } from "../lib/citations";
import { CURATED_CUTS, curatedCut } from "../lib/cut";
import { cutAnswer } from "../lib/machineAnswers";
import { questionBySlug } from "../lib/questions";
import { SITE_URL } from "../lib/site";
import {
  jsonLdHtml,
  matchJsonLd,
  playerJsonLd,
  questionJsonLd,
  websiteJsonLd,
} from "../lib/structuredData";
import { matchById, playerById, sourcesForMatch } from "../lib/queries";

const MATCH_ID = "1999-05-26-bayern-munich-n";
const PLAYER_ID = "wayne-rooney";
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
  assert.equal(jsonLd.endDate, "1999-05-26");
  assert.equal(jsonLd.eventAttendanceMode, "https://schema.org/OfflineEventAttendanceMode");

  const location = jsonLd.location as { "@type": string; name: string; address: { "@type": string } };
  assert.equal(location["@type"], "Place");
  assert.ok(location.name);
  assert.equal(location.address["@type"], "PostalAddress");

  const organizer = jsonLd.organizer as { "@type": string; name: string; url: string };
  assert.equal(organizer["@type"], "SportsOrganization");
  assert.equal(organizer.name, match.competition_name);
  assert.ok(organizer.url);

  const performers = jsonLd.performer as { "@type": string; name: string }[];
  assert.equal(performers.length, 2);
  assert.ok(performers.every((p) => p["@type"] === "SportsTeam" && p.name));

  const images = jsonLd.image as string[];
  assert.deepEqual(images, [`${SITE_URL}/opengraph-image`]);

  const basedOn = jsonLd.isBasedOn as { identifier: string; name: string; about: string }[];
  assert.ok(basedOn.some((s) => s.identifier === "wikipedia" && s.about === "attendance"));
  assert.ok(basedOn.some((s) => s.identifier === "wikipedia" && s.about === "result"));
});

test("match JSON-LD always includes location, with stadium address when known", () => {
  const away = matchById("1892-09-03-blackburn-rovers-a");
  assert.ok(away);
  assert.equal(away.stadium_name, "Ewood Park");
  const jsonLd = matchJsonLd(away, []);
  const location = jsonLd.location as { name: string; address: { "@type": string } };
  assert.equal(location.name, "Ewood Park");
  assert.equal(location.address["@type"], "PostalAddress");

  const home = matchById("1892-09-10-burnley-h");
  assert.ok(home);
  assert.ok(home.stadium_name);
  const homeLd = matchJsonLd(home, []);
  const homeLoc = homeLd.location as {
    name: string;
    address: { addressLocality?: string; addressCountry?: string };
  };
  assert.equal(homeLoc.name, home.stadium_name);
  assert.equal(homeLoc.address.addressLocality, home.stadium_city);
  assert.equal(homeLoc.address.addressCountry, home.stadium_country);
});

test("match JSON-LD falls back when no stadium is recorded", () => {
  // Synthetic row: same shape as MatchRow, no ground.
  const bare = {
    ...matchById("1892-09-03-blackburn-rovers-a")!,
    stadium_id: null,
    stadium_name: null,
    stadium_city: null,
    stadium_country: null,
    venue: "A" as const,
    opponent_name: "Blackburn Rovers",
  };
  const location = matchJsonLd(bare, []).location as {
    name: string;
    address: { "@type": string; name?: string };
  };
  assert.equal(location.name, "Blackburn Rovers (away)");
  assert.equal(location.address["@type"], "PostalAddress");
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

test("player JSON-LD uses Person, entity ref, and Manchester United membership", () => {
  const player = playerById(PLAYER_ID);
  assert.ok(player);
  const jsonLd = playerJsonLd(player);

  assert.equal(jsonLd["@type"], "Person");
  assert.equal(jsonLd.identifier, entityRef("player", PLAYER_ID).id);
  assert.equal(jsonLd.url, entityRef("player", PLAYER_ID).url);
  assert.equal(jsonLd.name, player.name);
  assert.match(String(jsonLd.description), /Manchester United/);
  assert.match(String(jsonLd.description), /appearances/);

  const memberOf = jsonLd.memberOf as { "@type": string; name: string };
  assert.equal(memberOf["@type"], "SportsTeam");
  assert.equal(memberOf.name, "Manchester United");
});

test("question JSON-LD uses FAQPage with Question and Answer mainEntity", () => {
  const q = questionBySlug("treble");
  assert.ok(q);
  const jsonLd = questionJsonLd(q);

  assert.equal(jsonLd["@type"], "FAQPage");
  assert.equal(jsonLd.identifier, questionRef("treble").id);
  assert.equal(jsonLd.url, questionRef("treble").url);

  const mainEntity = jsonLd.mainEntity as { "@type": string; name: string; acceptedAnswer: { "@type": string; text: string } }[];
  assert.equal(mainEntity.length, 1);
  assert.equal(mainEntity[0]["@type"], "Question");
  assert.equal(mainEntity[0].name, q.question);
  assert.equal(mainEntity[0].acceptedAnswer["@type"], "Answer");
  assert.equal(mainEntity[0].acceptedAnswer.text, q.summary);
});

test("website JSON-LD exposes SearchAction for site search", () => {
  const jsonLd = websiteJsonLd();

  assert.equal(jsonLd["@type"], "WebSite");
  assert.equal(jsonLd.name, "Red Thread");
  assert.equal(jsonLd.url, SITE_URL);

  const action = jsonLd.potentialAction as { "@type": string; target: { urlTemplate: string } };
  assert.equal(action["@type"], "SearchAction");
  assert.match(action.target.urlTemplate, /\/search\?q=\{search_term_string\}$/);
});

test("the player page renders parseable JSON-LD with a citable entity ID", async () => {
  const playerHtml = renderToStaticMarkup(
    (await PlayerPage({ params: Promise.resolve({ id: PLAYER_ID }) })) as React.ReactElement,
  );
  const playerLd = firstJsonLd(playerHtml);
  assert.equal(playerLd.identifier, entityRef("player", PLAYER_ID).id);
  assert.equal(playerLd["@type"], "Person");
  assert.equal(playerLd.name, playerById(PLAYER_ID)?.name);
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

  const humanUrls = new Set(
    sitemap().map((entry) => new URL(entry.url.replaceAll("&amp;", "&")).pathname),
  );
  assert.ok(humanUrls.has("/"));
  assert.ok(humanUrls.has("/data"));
});

test("robots keeps the public site crawlable and shuts APIs and utility routes", () => {
  const policy = robots();
  const rules = Array.isArray(policy.rules) ? policy.rules[0] : policy.rules;
  assert.ok(rules);
  assert.equal(rules.userAgent, "*");
  const allow = [rules.allow].flat().filter(Boolean);
  const disallow = [rules.disallow].flat().filter(Boolean);
  assert.ok(allow.includes("/"));
  assert.ok(!allow.includes("/api/v1/"));
  assert.ok(!allow.includes("/dataset/"));
  for (const path of ["/api/", "/dataset/", "/search", "/matches", "/surprise", "/compare", "/cut", "/on-this-day", "/dev/"]) {
    assert.ok(disallow.includes(path), path);
  }
  assert.equal(policy.sitemap, `${SITE_URL}/sitemap.xml`);
});
