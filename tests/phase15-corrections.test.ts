import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import type React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import MatchPage from "../app/match/[id]/page";
import PlayerPage from "../app/player/[id]/page";
import {
  CORRECTION_LABELS,
  CORRECTION_STATUS_URL,
  MAX_GITHUB_ISSUE_URL_LENGTH,
  correctionIssueBody,
  correctionIssueTitle,
  correctionIssueUrl,
  correctionPayloadFromSearchParams,
  correctionPrefillHref,
  fieldPatch,
  validateCorrectionPayload,
  type CorrectionPayload,
} from "../lib/corrections";
import { correctionRef } from "../lib/citations";
import sample from "./fixtures/corrections/sample-attendance.json";
import malformed from "./fixtures/corrections/malformed-missing-source.json";

const samplePayload = sample as CorrectionPayload;
const malformedPayload = malformed as CorrectionPayload;

test("correction prefill links carry match, player, and event citable context", async () => {
  const matchHtml = renderToStaticMarkup(
    (await MatchPage({ params: Promise.resolve({ id: "1999-05-26-bayern-munich-n" }) })) as React.ReactElement,
  );
  assert.match(matchHtml, /href="\/corrections\?[^"]*kind=match[^"]*field=matches%5Bid%3D1999-05-26-bayern-munich-n%5D\.attendance/);
  assert.match(matchHtml, /href="\/corrections\?[^"]*kind=event[^"]*field=matches%5Bid%3D1999-05-26-bayern-munich-n%5D\.events%5B\d+%5D\.minute/);
  assert.match(matchHtml, /cite=us%3Amatch%3A1999-05-26-bayern-munich-n/);

  const playerHtml = renderToStaticMarkup(
    (await PlayerPage({ params: Promise.resolve({ id: "a-longton" }) })) as React.ReactElement,
  );
  assert.match(playerHtml, /href="\/corrections\?[^"]*kind=player[^"]*field=players%5Bid%3Da-longton%5D\.name/);
  assert.match(playerHtml, /cite=us%3Aentity%3Aplayer%253Aa-longton/);
});

test("correction payload schema accepts complete payloads and rejects malformed fixtures before issue generation", () => {
  assert.deepEqual(validateCorrectionPayload(samplePayload), []);
  assert.ok(validateCorrectionPayload(malformedPayload).some((error) => error.includes("sourceUrl or archiveRef")));
  assert.throws(() => correctionIssueUrl(malformedPayload), /sourceUrl or archiveRef/);
});

test("correction issue title, body, diff, labels, and URL are deterministic", () => {
  const first = correctionIssueUrl(samplePayload);
  const second = correctionIssueUrl(samplePayload);
  assert.equal(first, second);
  assert.ok(first.length < MAX_GITHUB_ISSUE_URL_LENGTH);

  const url = new URL(first);
  assert.equal(url.pathname, "/cbrown564-alt/unitedstats/issues/new");
  assert.equal(url.searchParams.get("labels"), "correction,data");
  assert.equal(url.searchParams.get("labels"), CORRECTION_LABELS.join(","));
  assert.equal(
    url.searchParams.get("title"),
    "Correction: match Manchester United 2-1 FC Bayern Munich matches[id=1999-05-26-bayern-munich-n].attendance",
  );
  assert.equal(url.searchParams.get("title"), correctionIssueTitle(samplePayload));

  const requestId = "us:correction:094c3c992703e9c1";
  assert.equal(correctionRef({
    target: samplePayload.target,
    fieldPath: samplePayload.fieldPath,
    currentValue: samplePayload.currentValue,
    proposedValue: samplePayload.proposedValue,
    pagePath: samplePayload.pagePath,
    citableId: samplePayload.citableId,
  }).id, requestId);

  const body = url.searchParams.get("body") ?? "";
  assert.match(body, new RegExp(`Request ID: \`${requestId}\``));
  assert.match(body, /Target: match `1999-05-26-bayern-munich-n` \(Manchester United 2-1 FC Bayern Munich\)/);
  assert.match(body, /Source URL: https:\/\/www\.uefa\.com\/uefachampionsleague\/match\/56379--man-united-vs-bayern\//);
  assert.match(body, /- \[ \] Run `npm run validate`/);

  assert.equal(fieldPatch(samplePayload), [
    "field: matches[id=1999-05-26-bayern-munich-n].attendance",
    "- 90245",
    "+ 90246",
  ].join("\n"));
});

test("correction issue body escapes fences and handles missing optional fields", () => {
  const payload: CorrectionPayload = {
    ...samplePayload,
    proposedValue: "```new value```",
    explanation: "Long enough explanation with a ``` fence.",
    sourceUrl: "",
    archiveRef: "Programme page 4",
    attachmentNote: "",
    reporterContact: "",
  };
  const body = correctionIssueBody(payload);
  assert.match(body, /`\u200b``new value/);
  assert.match(body, /_No attachment note\._/);
  assert.match(body, /_No contact provided\._/);
  assert.deepEqual(validateCorrectionPayload(payload), []);
});

test("correction issue URLs enforce the documented maximum size", () => {
  const valuePayload = {
    ...samplePayload,
    proposedValue: "x".repeat(1001),
  };
  assert.ok(validateCorrectionPayload(valuePayload).some((error) => error.includes("proposedValue is too long")));
  assert.throws(() => correctionIssueUrl(valuePayload), /proposedValue is too long/);

  const urlPayload = {
    ...samplePayload,
    explanation: "x".repeat(MAX_GITHUB_ISSUE_URL_LENGTH * 2),
  };
  assert.deepEqual(validateCorrectionPayload(urlPayload), []);
  assert.throws(() => correctionIssueUrl(urlPayload), /exceeds 6000 characters/);
});

test("correction prefill round-trips from URL search params", () => {
  const href = correctionPrefillHref({
    targetKind: "match",
    targetId: "1999-05-26-bayern-munich-n",
    targetLabel: "Manchester United 2-1 FC Bayern Munich",
    fieldPath: "matches[id=1999-05-26-bayern-munich-n].attendance",
    currentValue: 90245,
    pagePath: "/match/1999-05-26-bayern-munich-n",
    citableId: "us:match:1999-05-26-bayern-munich-n",
  });
  const payload = correctionPayloadFromSearchParams(new URL(`https://example.test${href}`).searchParams);
  assert.equal(payload.target.kind, "match");
  assert.equal(payload.fieldPath, "matches[id=1999-05-26-bayern-munich-n].attendance");
  assert.equal(payload.currentValue, "90245");
  assert.equal(payload.citableId, "us:match:1999-05-26-bayern-munich-n");
});

test("sample correction applies to a temp canonical copy and passes validation", () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "unitedstats-correction-"));
  const canonical = path.join(tmp, "canonical");
  fs.cpSync(path.join(process.cwd(), "data/canonical"), canonical, { recursive: true });
  try {
    execFileSync("npx", ["tsx", "scripts/apply-correction-fixture.ts", "tests/fixtures/corrections/sample-attendance.json", "--canonical", canonical], {
      cwd: process.cwd(),
      stdio: "pipe",
    });
    execFileSync("npm", ["run", "validate"], {
      cwd: process.cwd(),
      env: { ...process.env, UNITEDSTATS_CANONICAL_DIR: canonical },
      stdio: "pipe",
    });
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test("public correction status uses the agreed filtered GitHub issue search", () => {
  assert.match(CORRECTION_STATUS_URL, /^https:\/\/github\.com\/cbrown564-alt\/unitedstats\/issues\?q=/);
  assert.match(decodeURIComponent(CORRECTION_STATUS_URL), /label:correction/);
});
