import assert from "node:assert/strict";
import test from "node:test";
import { lateGoalPointKey } from "../lib/trails.ts";

test("lateGoalPointKey scopes seq to match id", () => {
  const a = lateGoalPointKey({ matchId: "2002-10-07-everton-h", seq: 0 });
  const b = lateGoalPointKey({ matchId: "1999-05-26-bayern-munich-n", seq: 0 });
  assert.notEqual(a, b);
  assert.equal(a, "2002-10-07-everton-h:e0");
});
