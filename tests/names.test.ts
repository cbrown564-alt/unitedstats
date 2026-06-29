import assert from "node:assert/strict";
import { test } from "node:test";
import { familyName, initialsFor } from "@/lib/names";

test("familyName handles surname particles", () => {
  assert.equal(familyName("David de Gea"), "de Gea");
  assert.equal(familyName("Edwin van der Sar"), "van der Sar");
  assert.equal(familyName("Ruud van Nistelrooy"), "van Nistelrooy");
  assert.equal(familyName("Donny van de Beek"), "van de Beek");
  assert.equal(familyName("Matthijs de Ligt"), "de Ligt");
  assert.equal(familyName("Louis van Gaal"), "van Gaal");
});

test("familyName leaves simple surnames unchanged", () => {
  assert.equal(familyName("Wayne Rooney"), "Rooney");
  assert.equal(familyName("Ole Gunnar Solskjaer"), "Solskjaer");
  assert.equal(familyName("Sir Alex Ferguson"), "Ferguson");
});

test("initialsFor uses given name and family name", () => {
  assert.equal(initialsFor("David de Gea"), "DG");
  assert.equal(initialsFor("Edwin van der Sar"), "ES");
  assert.equal(initialsFor("Wayne Rooney"), "WR");
});
