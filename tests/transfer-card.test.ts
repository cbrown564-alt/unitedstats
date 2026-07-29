import assert from "node:assert/strict";
import { test } from "node:test";
import {
  assertTransferCardCopy,
  buildAnalyticalStubPayload,
  buildDealReceiptPayload,
  buildManagerEraPayload,
  buildTransfersHubPayload,
  buildWindowReceiptPayload,
  TRANSFER_OG_EXEMPLARS,
} from "@/lib/transferCardData";

const HOT_TAKE = /\b(flop|disaster|genius|proved)\b/i;

function assertCardShape(payload: {
  headline: string;
  facts: readonly string[];
  coverageCue: string;
  marker?: string;
}) {
  assert.equal(payload.facts.length, 3);
  assert.ok(payload.headline.length > 0);
  assert.ok(payload.coverageCue.length > 0);
  const copy = [payload.headline, ...payload.facts, payload.coverageCue, payload.marker ?? ""].join(" ");
  assert.equal(HOT_TAKE.test(copy), false, `hot-take language in: ${copy}`);
  assertTransferCardCopy(copy);
}

test("deal receipt payloads cover signing, sale, free, and ongoing cases", () => {
  const signing = buildDealReceiptPayload(TRANSFER_OG_EXEMPLARS.recordSigning);
  const sale = buildDealReceiptPayload(TRANSFER_OG_EXEMPLARS.recordSale);
  const free = buildDealReceiptPayload(TRANSFER_OG_EXEMPLARS.freeTransfer);
  const undisclosed = buildDealReceiptPayload(TRANSFER_OG_EXEMPLARS.undisclosedFee);
  const active = buildDealReceiptPayload(TRANSFER_OG_EXEMPLARS.activeSigning);

  assert.ok(signing);
  assert.ok(sale);
  assert.ok(free);
  assert.ok(undisclosed);
  assert.ok(active);

  for (const payload of [signing, sale, free, undisclosed, active]) {
    assertCardShape(payload!);
  }

  assert.match(signing!.facts[0], /£/);
  assert.match(sale!.facts[0], /£/);
  assert.match(free!.facts[0], /Free/);
  assert.match(undisclosed!.facts[0], /Undisclosed/);
  assert.equal(active!.marker, "ONGOING");
  assert.doesNotMatch(free!.facts[0], /£0/);
  assert.doesNotMatch(undisclosed!.facts[0], /£0/);
});

test("window receipt payload lists arrivals, departures, net, and follow-up", () => {
  const treble = buildWindowReceiptPayload(TRANSFER_OG_EXEMPLARS.trebleWindow);
  assert.ok(treble);
  assertCardShape(treble!);
  assert.match(treble!.facts[0], /arrivals/);
  assert.match(treble!.facts[1], /Known net/);
  assert.ok(treble!.lanes);
});

test("transfers hub payload exposes coverage without zero-fee fiction", () => {
  const hub = buildTransfersHubPayload();
  assertCardShape(hub);
  assert.match(hub.coverageCue, /published fee/);
  assert.doesNotMatch(hub.coverageCue, /£0/);
});

test("manager era payload stays separate from career-card semantics", () => {
  const era = buildManagerEraPayload(TRANSFER_OG_EXEMPLARS.fergusonEra);
  assert.ok(era);
  assertCardShape(era!);
  assert.equal(era!.kind, "manager-era");
  assert.match(era!.eyebrow, /MANAGER TRANSFER ERA/);
  assert.match(era!.facts[0], /signings/);
});

test("analytical stub is lab-only and names closed gates", () => {
  const stub = buildAnalyticalStubPayload();
  assertCardShape(stub);
  assert.equal(stub.kind, "analytical");
  assert.match(stub.eyebrow, /NOT PUBLISHED/);
  assert.match(stub.facts[1], /closed/);
});
