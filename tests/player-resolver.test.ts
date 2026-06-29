import assert from "node:assert/strict";
import { test } from "node:test";
import { familyNameSlug, nameParts } from "../scripts/player-resolver";

test("familyNameSlug handles surname particles", () => {
  assert.equal(familyNameSlug("David de Gea"), "de-gea");
  assert.equal(familyNameSlug("Edwin van der Sar"), "van-der-sar");
  assert.equal(familyNameSlug("de Gea"), "de-gea");
  assert.equal(familyNameSlug("van der Sar"), "van-der-sar");
});

test("nameParts uses particle-aware family slug", () => {
  assert.deepEqual(nameParts("David de Gea"), { first: "david", last: "de-gea" });
  assert.deepEqual(nameParts("Edwin van der Sar"), { first: "edwin", last: "van-der-sar" });
  assert.deepEqual(nameParts("Wayne Rooney"), { first: "wayne", last: "rooney" });
});
