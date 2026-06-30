import assert from "node:assert/strict";
import test from "node:test";
import { revalidationPathsForMatches } from "../lib/revalidation";

test("revalidationPathsForMatches covers shared surfaces and per-match paths", () => {
  const paths = revalidationPathsForMatches([
    { id: "2026-04-12-liverpool-h", date: "2026-04-12", opponentId: "liverpool" },
  ]);

  assert.ok(paths.includes("/match/2026-04-12-liverpool-h"));
  assert.ok(paths.includes("/seasons/2025-26"));
  assert.ok(paths.includes("/opponent/liverpool"));
  assert.ok(paths.includes("/on-this-day/04-12"));
  assert.ok(paths.includes("/analytics"));
  assert.ok(paths.includes("/api/v1/meta"));
  assert.ok(paths.includes("/matches"));
});

test("revalidationPathsForMatches adds enriched player and manager pages", () => {
  const paths = revalidationPathsForMatches(
    [{ id: "2026-04-12-liverpool-h", date: "2026-04-12", opponentId: "liverpool" }],
    { playerIds: ["wayne-rooney"], managerId: "ruben-amorim" },
  );

  assert.ok(paths.includes("/player/wayne-rooney"));
  assert.ok(paths.includes("/manager/ruben-amorim"));
});

test("revalidationPathsForMatches dedupes paths across multiple matches", () => {
  const paths = revalidationPathsForMatches([
    { id: "2026-04-12-liverpool-h", date: "2026-04-12", opponentId: "liverpool" },
    { id: "2026-04-19-arsenal-a", date: "2026-04-19", opponentId: "arsenal" },
  ]);

  assert.equal(new Set(paths).size, paths.length);
  assert.ok(paths.includes("/seasons/2025-26"));
  assert.ok(paths.includes("/opponent/arsenal"));
});
