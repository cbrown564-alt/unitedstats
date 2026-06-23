import assert from "node:assert/strict";
import test from "node:test";

import {
  CITABLE_UNITS,
  answerRef,
  canonicalStringify,
  canonicalUrl,
  claimProvenance,
  claimVersion,
  collectionRef,
  correctionRef,
  citableId,
  citableRef,
  cutKey,
  cutRef,
  embedRef,
  entityRef,
  historyDigestRef,
  matchRef,
  matchSourceProvenance,
  normalizePath,
  onThisDayRef,
  parseCitableId,
  questionRef,
  seasonRef,
  stableHash,
  type CitableKind,
  type CitableRef,
} from "../lib/citations";
import { CURATED_CUTS, cutFromParams, curatedCut } from "../lib/cut";
import {
  allMatchIds,
  allSeasons,
  managerById,
  managersIndex,
  opponentsIndex,
  playerById,
  playersIndex,
  sourcesForMatch,
} from "../lib/queries";
import { QUESTIONS } from "../lib/questions";

const REQUIRED_UNITS: CitableKind[] = [
  "match",
  "entity",
  "season",
  "question",
  "cut",
  "answer",
  "history-digest",
  "correction",
  "on-this-day",
  "collection",
  "embed",
];

test("Phase 0 defines every required citable unit", () => {
  const units = new Set(CITABLE_UNITS.map((u) => u.kind));
  for (const kind of REQUIRED_UNITS) assert.ok(units.has(kind), `missing ${kind}`);
  assert.equal(units.size, REQUIRED_UNITS.length, "no extra undocumented citable unit kinds");
  for (const unit of CITABLE_UNITS) {
    assert.ok(unit.unit);
    assert.ok(unit.key);
    assert.ok(unit.path);
  }
});

test("citable IDs round-trip and do not collide across the known public set", () => {
  const refs: CitableRef[] = [
    ...allMatchIds().map(matchRef),
    ...playersIndex().map((p) => entityRef("player", p.player_id)),
    ...managersIndex().map((m) => entityRef("manager", m.id)),
    ...opponentsIndex().map((o) => entityRef("opponent", o.id)),
    ...allSeasons().map(seasonRef),
    ...QUESTIONS.map((q) => questionRef(q.slug)),
    ...CURATED_CUTS.map((c) => cutRef(curatedCut(c))),
    cutRef(cutFromParams({ by: "manager", metric: "ppg", season: "1998-99", venue: "H" })),
    answerRef("cut-headline", cutKey(curatedCut(CURATED_CUTS[0])), "/api/v1/answers/cuts/opponents-by-win-rate"),
    historyDigestRef("1999-05-26-bayern-munich-n"),
    correctionRef({ target: "match", id: "1999-05-26-bayern-munich-n", field: "attendance" }),
    onThisDayRef("02-29"),
    collectionRef("c1.by=manager.metric=ppg"),
    embedRef("cut-card", cutKey(curatedCut(CURATED_CUTS[1])), "/embed/cut/managers-by-points"),
  ];

  const ids = new Set<string>();
  for (const ref of refs) {
    const parsed = parseCitableId(ref.id);
    assert.deepEqual(parsed, { kind: ref.kind, key: ref.key }, `round-trip ${ref.id}`);
    assert.ok(ref.path.startsWith("/"), `relative path for ${ref.id}`);
    assert.ok(ref.url.startsWith("https://"), `absolute URL for ${ref.id}`);
    ids.add(ref.id);
  }
  assert.equal(ids.size, refs.length, "every known citable ref has a unique ID");
});

test("low-level citation helpers normalize paths and canonical objects", () => {
  assert.equal(canonicalUrl("match/1999-05-26-bayern-munich-n"), "https://unitedstats.vercel.app/match/1999-05-26-bayern-munich-n");
  assert.equal(normalizePath("/cut?venue=H&metric=ppg&by=manager"), "/cut?by=manager&metric=ppg&venue=H");
  assert.equal(citableId("match", "1999-05-26-bayern-munich-n"), "us:match:1999-05-26-bayern-munich-n");
  assert.deepEqual(citableRef("answer", "meta:dataset", "/api/v1/meta?b=2&a=1"), {
    kind: "answer",
    key: "meta:dataset",
    id: "us:answer:meta%3Adataset",
    path: "/api/v1/meta?a=1&b=2",
    url: "https://unitedstats.vercel.app/api/v1/meta?a=1&b=2",
  });
  assert.equal(canonicalStringify({ z: 1, a: { c: 3, b: 2 } }), '{"a":{"b":2,"c":3},"z":1}');
});

test("Cut citable keys are stable for curated cuts and normalized forks", () => {
  const curated = curatedCut(CURATED_CUTS[0]);
  assert.equal(cutKey(curated), "opponents-by-win-rate");

  const forkA = cutFromParams({ by: "manager", metric: "ppg", season: "1998-99", venue: "H" });
  const forkB = cutFromParams({ venue: "H", season: "1998-99", metric: "ppg", by: "manager" });
  assert.equal(cutKey(forkA), cutKey(forkB));
  assert.equal(cutRef(forkA).id, cutRef(forkB).id);
  assert.match(cutKey(forkA), /^\/cut\?by=manager&metric=ppg&season=1998-99&venue=H$/);
});

test("claim versions are canonical-data hashes, not object-order hashes", () => {
  const a = {
    id: "us:answer:cut-headline%3Aopponents-by-win-rate",
    claim: { text: "United's best opponent record", value: 71.4 },
    provenance: [{ sourceId: "engsoccerdata", facet: "result" }],
  };
  const b = {
    provenance: [{ facet: "result", sourceId: "engsoccerdata" }],
    claim: { value: 71.4, text: "United's best opponent record" },
    id: "us:answer:cut-headline%3Aopponents-by-win-rate",
  };
  assert.equal(claimVersion(a), claimVersion(b));
  assert.notEqual(claimVersion(a), claimVersion({ ...a, claim: { ...a.claim, value: 72.1 } }));
  assert.equal(stableHash({ a: undefined, b: [1, undefined, 3] }), stableHash({ b: [1, null, 3] }));
});

test("provenance includes canonical dates when present and omits wall-clock fallbacks", () => {
  const rooney = playerById("wayne-rooney");
  assert.ok(rooney?.record_source_id);
  assert.equal(rooney.record_stats_as_of, "2026-05-24");
  const playerRecordProvenance = claimProvenance({
    sourceId: rooney.record_source_id,
    sourceName: "Wikipedia Manchester United player lists",
    sourceUrl: rooney.record_source_url,
    scope: "official player record",
    evidencePath: `/player/${rooney.player_id}`,
    statsAsOf: rooney.record_stats_as_of,
  });
  assert.deepEqual(playerRecordProvenance, {
    sourceId: "wikipedia-player-records",
    sourceName: "Wikipedia Manchester United player lists",
    sourceUrl: "https://en.wikipedia.org/wiki/List_of_Manchester_United_F.C._players",
    scope: "official player record",
    evidencePath: "/player/wayne-rooney",
    evidenceUrl: "https://unitedstats.vercel.app/player/wayne-rooney",
    statsAsOf: "2026-05-24",
  });

  const matchSource = sourcesForMatch("1999-05-26-bayern-munich-n").find((s) => s.facet === "result");
  assert.ok(matchSource);
  const matchProvenance = matchSourceProvenance(matchSource, "1999-05-26-bayern-munich-n");
  assert.equal(matchProvenance.evidencePath, "/match/1999-05-26-bayern-munich-n");
  assert.equal(matchProvenance.facet, "result");
  assert.ok(!("statsAsOf" in matchProvenance), "no canonical stats date means no date field");
  assert.ok(!("retrievedAt" in matchProvenance), "no canonical retrieval date means no wall-clock fallback");
});

test("entity references are pure route-param functions", () => {
  const manager = managerById("alex-ferguson");
  assert.ok(manager);
  assert.equal(entityRef("manager", manager.id).id, "us:entity:manager%3Aalex-ferguson");
  assert.equal(entityRef("manager", manager.id).path, "/manager/alex-ferguson");
});
