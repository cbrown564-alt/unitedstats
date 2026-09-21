import assert from "node:assert/strict";
import { test } from "node:test";
import { discoverPlayer } from "../scripts/mufcinfo-player-discovery";

const key = "example_alex";
const url = `https://www.mufcinfo.com/manupag/a-z_player_archive/a-z_player_archive_pages/${key}.html`;
const date = "2026-09-16";
const html = `<h1>Alex Example</h1><script type="application/ld+json">${JSON.stringify({ "@graph": [{ "@type": "Person", name: "Alex Example", url, memberOf: { "@id": "https://www.mufcinfo.com/#mufc" } }] })}</script><a href="../../match_data/match_sql.php?my_match_date=${date}">Appearance</a>`;

test("verified first appearance creates a minimal source-backed player and reruns reuse it", () => {
  const player = discoverPlayer("Alex Example", key, date, html, { players: [] }, []);
  assert.deepEqual(player, { id: "alex-example", name: "Alex Example", mufcinfo: { key, profileUrl: url, matchDate: date } });
  assert.equal(discoverPlayer("Alex Example", key, date, html, { players: [player] }, []), player);
});

test("unverified profiles and absent appearance dates do not create players", () => {
  for (const invalid of ["<h1>Alex Example</h1>", html.replace(date, "2026-09-15"), html.replace('"#mufc"', '"#other"').replace('com/#mufc', 'com/#other'), html.replace("<h1>Alex Example", "<h1>Someone Else")]) {
    assert.throws(() => discoverPlayer("Alex Example", key, date, invalid, { players: [] }, []), /does not verify/);
  }
});

test("namesakes and conflicting source identities require review", () => {
  assert.throws(() => discoverPlayer("Alex Example", key, date, html, { players: [{ id: "alex-example-older", name: "Alex Example" }] }, []), /Ambiguous/);
  assert.throws(() => discoverPlayer("Alex Example", key, date, html, { players: [] }, [{ playerId: "alex-example", name: "Alex Example" }]), /Ambiguous/);
});

import { lineupFromRows, addMissingPlayers, parseRows, buildResolver } from "../scripts/ingest/mufcinfo-lineups";

function knownRows() {
  return Array.from({ length: 11 }, (_, i) => ({ date, shirt: i + 1, displayName: `Player ${i}`, displaySlug: `player-${i}`, hrefKey: `player_${i}`, start: true, bench: false, on: null, offName: null, resolved: { playerId: `player-${i}`, name: `Player ${i}`, inPlayers: true } }));
}

test("first starts and substitute debuts yield valid lineups without duplicate records", () => {
  for (const start of [true, false]) {
    const player = discoverPlayer("Alex Example", key, date, html, { players: [] }, []);
    const debut = { date, shirt: 12, displayName: player.name, displaySlug: player.id, hrefKey: key, start, bench: false, on: start ? null : 70, offName: start ? null : "Player 0", discovered: player, resolved: { playerId: player.id, name: player.name, inPlayers: false } };
    const rows = start ? [...knownRows().slice(1), debut] : [...knownRows(), debut];
    const result = lineupFromRows(rows);
    assert.equal(result.reason, null);
    assert.equal(result.lineup.filter((p) => p.start).length, 11);
    assert.equal(result.lineup.find((p) => p.player === player.id)?.on, start ? null : 70);
    const players = { players: knownRows().map((r) => ({ id: r.resolved.playerId, name: r.resolved.name })) };
    assert.equal(addMissingPlayers(players, rows), 1);
    assert.equal(addMissingPlayers(players, rows), 0);
  }
});

test("unresolved starters or substitutes and duplicate players reject the lineup", () => {
  const rows = knownRows();
  assert.equal(lineupFromRows([{ ...rows[0], resolved: null }, ...rows.slice(1)]).reason, "unresolvedStarters");
  assert.equal(lineupFromRows([...rows, { ...rows[0], start: false, on: 70, resolved: null }]).reason, "unresolvedSubs");
  assert.equal(lineupFromRows([...rows, { ...rows[0], start: false, on: 70 }]).reason, "duplicates");
});


test("lineup parsing respects row boundaries and accepts row attributes", () => {
  const page = `<tr><td>Header</td></tr>` + Array.from({ length: 12 }, (_, i) =>
    `<tr align="center"><td><img alt="Manchester United squad number ${i + 1}" /></td><td class="articles_main_text"><a href="../../../manupag/a-z_player_archive/a-z_player_archive_pages/example_${i}.html">Example, Player${i}</a></td><td>${i === 11 ? "ON for Player0 Example 70&#039;" : ""}</td></tr>`).join("");
  const rows = parseRows(date, page);
  assert.equal(rows.length, 12);
  assert.equal(rows.filter((r) => r.start).length, 11);
  assert.equal(rows[11].on, 70);
  assert.equal(rows[0].hrefKey, "example_0");
});


test("saved source identity wins over names and conflicting identities fail", () => {
  const player = discoverPlayer("Alex Example", key, date, html, { players: [] }, []);
  const row = { ...knownRows()[0], displayName: player.name, displaySlug: player.id, hrefKey: key };
  const resolve = buildResolver({ players: [player] }, []);
  assert.equal(resolve({ ...row, displayName: "A. Example" })?.playerId, player.id);
  assert.throws(() => resolve({ ...row, hrefKey: "example_alex_02" }), /Conflicting/);
  const ambiguous = buildResolver({ players: [{ id: "one", name: player.name }, { id: "two", name: player.name }] }, []);
  assert.throws(() => ambiguous(row), /Ambiguous/);
});
