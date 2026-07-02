import assert from "node:assert/strict";
import test from "node:test";
import { pitchPlacement } from "../lib/placement.ts";

test("pitchPlacement prefers recorded role over career band", () => {
  const at = pitchPlacement(
    { role: "Left-Back", shirt: 10, career_band: "FWD", career_label: "forward" },
    2010,
  );
  assert.equal(at?.band, "DEF");
  assert.equal(at?.lat, 0);
  assert.equal(at?.via, "role");
});

test("pitchPlacement refines generic role lateral from career label", () => {
  const at = pitchPlacement(
    { role: "Defender", shirt: 3, career_band: "DEF", career_label: "full-back" },
    2010,
  );
  assert.equal(at?.band, "DEF");
  assert.equal(at?.lat, 0);
  assert.equal(at?.via, "role");
});

test("pitchPlacement places full-backs wide from career label and shirt", () => {
  const irwin = pitchPlacement(
    { role: null, shirt: 3, career_band: "DEF", career_label: "full-back" },
    1999,
  );
  const neville = pitchPlacement(
    { role: null, shirt: 2, career_band: "DEF", career_label: "full-back" },
    1999,
  );
  assert.equal(irwin?.lat, 0);
  assert.equal(neville?.lat, 2);
});

test("pitchPlacement keeps centre-backs central", () => {
  const at = pitchPlacement(
    { role: null, shirt: 4, career_band: "DEF", career_label: "centre-back" },
    1999,
  );
  assert.equal(at?.band, "DEF");
  assert.equal(at?.lat, 1);
});

test("pitchPlacement spreads treble-era midfield from shirt hints", () => {
  const beckham = pitchPlacement(
    { role: null, shirt: 7, career_band: "MID", career_label: "midfielder" },
    1999,
  );
  const giggs = pitchPlacement(
    { role: null, shirt: 11, career_band: "MID", career_label: "midfielder" },
    1999,
  );
  const keane = pitchPlacement(
    { role: null, shirt: 16, career_band: "MID", career_label: "midfielder" },
    1999,
  );
  const scholes = pitchPlacement(
    { role: null, shirt: 18, career_band: "MID", career_label: "midfielder" },
    1999,
  );
  assert.equal(beckham?.lat, 2);
  assert.equal(giggs?.lat, 0);
  assert.equal(keane?.lat, 1);
  assert.equal(scholes?.lat, 1);
});

test("pitchPlacement orders 1999 title-decider defence left to right", () => {
  const starters = [
    { role: null, shirt: 2, career_band: "DEF", career_label: "full-back" },
    { role: null, shirt: 3, career_band: "DEF", career_label: "full-back" },
    { role: null, shirt: 4, career_band: "DEF", career_label: "centre-back" },
    { role: null, shirt: 5, career_band: "DEF", career_label: "defender" },
  ];
  const lats = starters
    .map((p) => pitchPlacement(p, 1999))
    .sort((a, b) => (a!.lat - b!.lat) || 0)
    .map((p) => p!.lat);
  assert.deepEqual(lats, [0, 1, 1, 2]);
});
