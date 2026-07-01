import assert from "node:assert/strict";
import test from "node:test";
import { pitchPlacement } from "../lib/placement.ts";

test("pitchPlacement prefers recorded role over career band", () => {
  const at = pitchPlacement(
    { role: "Left-Back", shirt: 10, career_band: "FWD" },
    2010,
  );
  assert.equal(at?.band, "DEF");
  assert.equal(at?.via, "role");
});
