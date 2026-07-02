import assert from "node:assert/strict";
import test from "node:test";

import { groupUntimedGoals } from "../lib/untimedGoals";
import type { EventRow } from "../lib/queries";

function goal(overrides: Partial<EventRow> & Pick<EventRow, "seq">): EventRow {
  return {
    type: "goal",
    player_id: "bob-donaldson",
    player_name: "Bob Donaldson",
    player_display_name: "Bob Donaldson",
    player_side: "united",
    player_provider_id: null,
    minute: null,
    added_time: null,
    assist_player_id: null,
    assist_name: null,
    assist_display_name: null,
    assist_side: null,
    assist_provider_id: null,
    detail: null,
    ...overrides,
  };
}

test("groupUntimedGoals collapses duplicate scorers", () => {
  const grouped = groupUntimedGoals([
    goal({ seq: 0 }),
    goal({ seq: 1 }),
    goal({ seq: 2 }),
    goal({ seq: 3, player_id: "willie-stewart", player_display_name: "Willie Stewart" }),
    goal({ seq: 4, player_id: "willie-stewart", player_display_name: "Willie Stewart" }),
  ]);

  assert.equal(grouped.length, 2);
  assert.equal(grouped[0]?.player_display_name, "Bob Donaldson");
  assert.equal(grouped[0]?.count, 3);
  assert.equal(grouped[1]?.player_display_name, "Willie Stewart");
  assert.equal(grouped[1]?.count, 2);
});

test("groupUntimedGoals keeps distinct types and assists separate", () => {
  const grouped = groupUntimedGoals([
    goal({ seq: 0, type: "goal" }),
    goal({ seq: 1, type: "pen-goal" }),
    goal({ seq: 2, assist_display_name: "Ryan Giggs", assist_side: "united" }),
  ]);

  assert.equal(grouped.length, 3);
  assert.equal(grouped.every((g) => g.count === 1), true);
});
