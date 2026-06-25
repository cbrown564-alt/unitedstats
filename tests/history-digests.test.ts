import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  buildHistoryDigest,
  latestHistoryDigestMatchIds,
  orderHistoryDigestMatchIds,
  readHistoryDigest,
  writeHistoryDigests,
  type HistoryDigestClaimKind,
} from "../lib/historyDigests";
import { claimVersion, groupProvenanceBySource, type ClaimProvenance } from "../lib/citations";

function withTempDir(fn: (dir: string) => void) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "unitedstats-digests-"));
  try {
    fn(dir);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

function assertHas(matchId: string, kind: HistoryDigestClaimKind, text: RegExp) {
  const digest = buildHistoryDigest(matchId);
  const claim = digest.claims.find((c) => c.kind === kind);
  assert.ok(claim, `${matchId} should include ${kind}`);
  assert.match(claim.text, text);
}

function assertLacks(matchId: string, kind: HistoryDigestClaimKind) {
  const digest = buildHistoryDigest(matchId);
  assert.ok(!digest.claims.some((c) => c.kind === kind), `${matchId} should not include ${kind}`);
}

test("history digest latest selector is date-ordered and supports a no-change run", () => {
  assert.deepEqual(latestHistoryDigestMatchIds(0), []);
  assert.deepEqual(latestHistoryDigestMatchIds(1), ["2026-05-24-brighton-and-hove-albion-a"]);
  assert.deepEqual(latestHistoryDigestMatchIds(3), [
    "2026-05-09-sunderland-a",
    "2026-05-17-nottingham-forest-h",
    "2026-05-24-brighton-and-hove-albion-a",
  ]);

  withTempDir((dir) => {
    assert.deepEqual(writeHistoryDigests([], dir), []);
    assert.deepEqual(fs.readdirSync(dir), []);
  });
});

test("history digest writer emits exactly one artifact for one requested match", () => {
  withTempDir((dir) => {
    const ids = latestHistoryDigestMatchIds(1);
    assert.deepEqual(ids, ["2026-05-24-brighton-and-hove-albion-a"]);
    assert.deepEqual(writeHistoryDigests(ids, dir), ids);
    assert.deepEqual(fs.readdirSync(dir), ["2026-05-24-brighton-and-hove-albion-a.json"]);
  });
});

test("history digest ordering is byte-stable for same-date ties", () => {
  const dates = new Map([
    ["z-same-day", { date: "2026-01-01" }],
    ["a-same-day", { date: "2026-01-01" }],
    ["middle-later", { date: "2026-01-02" }],
    ["first-earlier", { date: "2025-12-31" }],
  ]);
  assert.deepEqual(
    orderHistoryDigestMatchIds(
      ["middle-later", "z-same-day", "first-earlier", "a-same-day"],
      (id) => dates.get(id),
    ),
    ["first-earlier", "a-same-day", "z-same-day", "middle-later"],
  );
});

test("history digest writer emits exactly one deterministic artifact per requested match", () => {
  withTempDir((dir) => {
    const ids = latestHistoryDigestMatchIds(3);
    assert.deepEqual(writeHistoryDigests(ids, dir), ids);
    assert.deepEqual(fs.readdirSync(dir).sort(), ids.map((id) => `${id}.json`).sort());

    const before = fs.readFileSync(path.join(dir, `${ids[2]}.json`), "utf8");
    assert.deepEqual(writeHistoryDigests(ids, dir), ids);
    const after = fs.readFileSync(path.join(dir, `${ids[2]}.json`), "utf8");
    assert.equal(after, before, "rewriting the same digest is byte-identical");

    const digest = readHistoryDigest(ids[2], dir);
    assert.equal(digest?.matchId, ids[2]);
    assert.equal(digest?.ref.id, `us:history-digest:${ids[2]}`);
    assert.equal(digest?.canonicalUrl, `https://unitedstats.vercel.app/history-changed/${ids[2]}`);
    assert.ok(digest?.claimVersion.startsWith("cv1-"));
    assert.ok(digest?.evidenceLinks.some((l) => l.path === `/match/${ids[2]}`));
    assert.ok(digest?.provenance.some((p) => p.evidencePath === `/match/${ids[2]}`));
  });
});

test("every digest carries an always-on result claim that names the outcome", () => {
  // The human floor: an ordinary match leads with what happened, not with Elo.
  assertHas("2026-05-17-nottingham-forest-h", "result", /beat Nottingham Forest 3–2 at home/);
  assertHas("2026-05-09-sunderland-a", "result", /drew 0–0 with Sunderland away/);
  assertHas("1902-03-01-lincoln-city-h", "result", /Newton Heath/);
});

test("history digest detectors have positive and negative golden cases", () => {
  assertHas("1892-10-15-wolverhampton-wanderers-h", "record", /10 goals/);
  assertLacks("1902-03-01-lincoln-city-h", "record");

  assertHas("1893-04-08-accrington-f-c-h", "streak-started", /4-match unbeaten/);
  assertLacks("1902-03-01-lincoln-city-h", "streak-started");

  assertHas("1893-09-09-west-bromwich-albion-a", "streak-ended", /4-match unbeaten/);
  assertLacks("1902-03-01-lincoln-city-h", "streak-ended");

  // rank-change now fires only inside the all-time top 100 (or a new peak), so an
  // ordinary modern mid-table match no longer emits a meaningless absolute rank.
  assertHas("1999-05-26-bayern-munich-n", "rank-change", /20th-best rating/);
  assertLacks("1902-03-01-lincoln-city-h", "rank-change");
  assertLacks("2026-05-24-brighton-and-hove-albion-a", "rank-change");

  assertHas("1895-09-07-crewe-alexandra-h", "manager-milestone", /100th match/);
  assertLacks("1902-03-01-lincoln-city-h", "manager-milestone");

  assertHas("1886-10-30-fleetwood-rangers-a", "opponent-milestone", /1st time/);
  assertLacks("1902-03-01-lincoln-city-h", "opponent-milestone");

  assertHas("1892-10-15-wolverhampton-wanderers-h", "unusual-scoreline", /9-goal gap/);
  assertLacks("1902-03-01-lincoln-city-h", "unusual-scoreline");

  assertHas("1893-04-22-birmingham-city-n", "venue-fact", /1st neutral match/);
  assertLacks("1902-03-01-lincoln-city-h", "venue-fact");

  assertHas("1999-05-26-bayern-munich-n", "elo-movement", /\+5\.6/);
  assertLacks("1902-03-01-lincoln-city-h", "elo-movement");

  assertHas("1999-05-26-bayern-munich-n", "historical-percentile", /99\.6th percentile/);
  assertLacks("1902-03-01-lincoln-city-h", "historical-percentile");
});

test("provenance groups by source, ordered by coverage, facets strongest first", () => {
  const p = (sourceId: string, sourceName: string, facet: string, confidence: string): ClaimProvenance => ({
    sourceId, sourceName, facet, confidence, evidencePath: "/match/x", evidenceUrl: "https://x/match/x",
  });
  const groups = groupProvenanceBySource([
    p("openfootball", "openfootball", "attendance", "supporting"),
    p("wikipedia", "Wikipedia", "result", "complete"),
    p("openfootball", "openfootball", "result", "complete"),
    p("wikipedia", "Wikipedia", "starting-lineup", "complete"),
    p("wikipedia", "Wikipedia", "assists", "partial"),
    p("wikipedia", "Wikipedia", "result", "complete"), // duplicate facet, collapsed
  ]);

  // Two sources, not six rows. Wikipedia leads on more complete facets.
  assert.equal(groups.length, 2);
  assert.deepEqual(groups.map((g) => g.sourceId), ["wikipedia", "openfootball"]);

  const wiki = groups[0];
  assert.equal(wiki.completeCount, 2);
  // Strongest confidence first; the duplicate result facet appears once.
  assert.deepEqual(wiki.facets.map((f) => f.facet), ["result", "starting-lineup", "assists"]);
  assert.equal(wiki.facets.filter((f) => f.facet === "result").length, 1);
});

test("history digest claim versions stay stable for the same facts and change when content changes", () => {
  const digest = buildHistoryDigest("1999-05-26-bayern-munich-n");
  const same = buildHistoryDigest("1999-05-26-bayern-munich-n");
  assert.equal(same.ref.id, digest.ref.id);
  assert.equal(same.claimVersion, digest.claimVersion);

  const changed = {
    ...digest,
    claims: [{ ...digest.claims[0], text: `${digest.claims[0].text} Corrected.` }, ...digest.claims.slice(1)],
  };
  const body = { ...changed };
  delete (body as any).claimVersion;
  assert.notEqual(claimVersion(body), digest.claimVersion);
});


