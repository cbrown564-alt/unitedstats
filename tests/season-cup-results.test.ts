import assert from "node:assert/strict";
import { test } from "node:test";
import { getDb } from "../lib/db";
import { seasonCupLastResults } from "../lib/queries";

test("cup verdicts keep every latest-dated result for each season and competition", () => {
  const rows = getDb().prepare(`
    SELECT m.season, m.competition_id, m.date, m.outcome AS last_outcome
    FROM matches m JOIN competitions c ON c.id = m.competition_id
    WHERE c.type <> 'league'
  `).all() as { season: string; competition_id: string; date: string; last_outcome: string }[];
  const latest = new Map<string, typeof rows>();
  for (const row of rows) {
    const key = `${row.season}:${row.competition_id}`;
    const previous = latest.get(key);
    if (!previous || row.date > previous[0].date) latest.set(key, [row]);
    else if (row.date === previous[0].date) previous.push(row);
  }
  const expected = [...latest.values()].flat().map(({ season, competition_id, last_outcome }) => ({ season, competition_id, last_outcome }));
  const sort = (a: typeof expected[number], b: typeof expected[number]) => JSON.stringify(a).localeCompare(JSON.stringify(b));
  assert.ok(expected.length > 200, "exercise the complete historical cup record");
  assert.deepEqual(seasonCupLastResults().sort(sort), expected.sort(sort));
});
