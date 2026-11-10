import assert from "node:assert/strict";
import test from "node:test";
import { brotliCompressSync, constants } from "node:zlib";
import { buildMatchesCatalog } from "../lib/matches/catalog";
import { decodeMatchesCatalog } from "../lib/matches/catalogWire";
import { encodeMatchesCatalog } from "../lib/matches/encodeCatalog";

test("the compact catalog preserves the complete fixture record and cuts compressed transfer", async () => {
  const catalog = buildMatchesCatalog();
  const wire = encodeMatchesCatalog(catalog);
  let yielded = false;
  const timer = setTimeout(() => { yielded = true; }, 0);
  assert.deepEqual(await decodeMatchesCatalog(JSON.parse(JSON.stringify(wire))), catalog);
  clearTimeout(timer);
  assert.equal(yielded, true, "full-record decoding yields to pending browser work");
  const size = (value: unknown) => brotliCompressSync(Buffer.from(JSON.stringify(value)), {
    params: { [constants.BROTLI_PARAM_QUALITY]: 4 },
  }).length;
  assert.ok(size(wire) < size(catalog) * 0.60);
});

test("the transport preserves exceptional IDs, unknown players, and an empty archive", async () => {
  const catalog = buildMatchesCatalog();
  const match = structuredClone(catalog.matches[0]);
  match.id = `${match.id}-replay`;
  match.starters = ["future-player"];
  match.goalEvents = [{ type: "goal", player_id: null, player_side: null, assist_id: "future-assister", assist_side: "united", minute: null, added: null }];
  const small = { ...catalog, matches: [match] };
  assert.deepEqual(await decodeMatchesCatalog(encodeMatchesCatalog(small)), small);
  const empty = { ...catalog, matches: [] };
  assert.deepEqual(await decodeMatchesCatalog(encodeMatchesCatalog(empty)), empty);
});

test("catalog decoding rejects unsupported versions and incomplete rows", async () => {
  const catalog = buildMatchesCatalog();
  const wire = encodeMatchesCatalog(catalog);
  await assert.rejects(decodeMatchesCatalog({ ...wire, version: 1 } as never), /version/);
  await assert.rejects(decodeMatchesCatalog({ ...wire, matches: { ...wire.matches, count: 1 } }), /rows/);
});
