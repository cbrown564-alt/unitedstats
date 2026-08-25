import assert from "node:assert/strict";
import test from "node:test";

import { matchesOffName, parseRows } from "../scripts/ingest/mufcinfo-lineups";

const HULL_XI = `
<table>
  <tr align="center">
    <td bgcolor="white" align="center">
      <img alt="Manchester United squad number 1" src="1.jpg" />
    </td>
    <td class="articles_main_text" bgcolor="white">
      <a href="../../../manupag/a-z_player_archive/a-z_player_archive_pages/lammens_senne.html">Lammens, Senne</a>
    </td>
  </tr>
  <tr align="center">
    <td bgcolor="white" align="center">
      <img alt="Manchester United squad number 3" src="3.jpg" />
    </td>
    <td class="articles_main_text" bgcolor="white">
      <a href="../../../manupag/a-z_player_archive/a-z_player_archive_pages/mazraoui_noussair.html">Mazraoui, Noussair</a>
    </td>
  </tr>
  <tr align="center">
    <td bgcolor="white" align="center">
      <img alt="Manchester United squad number 5" src="5.jpg" />
    </td>
    <td class="articles_main_text" bgcolor="white">
      <a href="../../../manupag/a-z_player_archive/a-z_player_archive_pages/maguire_harry.html">Maguire, Harry</a>
    </td>
  </tr>
  <tr align="center">
    <td bgcolor="white" align="center">
      <img alt="Manchester United squad number 26" src="26.jpg" />
    </td>
    <td class="articles_main_text" bgcolor="white">
      <a href="../../../manupag/a-z_player_archive/a-z_player_archive_pages/heaven_ayden.html">Heaven, Ayden</a>
    </td>
  </tr>
  <tr align="center">
    <td bgcolor="white" align="center">
      <img alt="Manchester United squad number 23" src="23.jpg" />
    </td>
    <td class="articles_main_text" bgcolor="white">
      <a href="../../../manupag/a-z_player_archive/a-z_player_archive_pages/shaw_luke.html">Shaw, Luke</a>
    </td>
  </tr>
  <tr align="center">
    <td bgcolor="white" align="center">
      <img alt="Manchester United squad number 17" src="17.jpg" />
    </td>
    <td class="articles_main_text" bgcolor="white">
      <a href="../../../manupag/a-z_player_archive/a-z_player_archive_pages/santos_andrey.html">Santos, Andrey</a>
    </td>
  </tr>
  <tr align="center">
    <td bgcolor="white" align="center">
      <img alt="Manchester United squad number 18" src="18.jpg" />
    </td>
    <td class="articles_main_text" bgcolor="white">
      <a href="../../../manupag/a-z_player_archive/a-z_player_archive_pages/tielemans_youri.html">Tielemans, Youri</a>
    </td>
  </tr>
  <tr align="center">
    <td bgcolor="white" align="center">
      <img alt="Manchester United squad number 19" src="19.jpg" />
    </td>
    <td class="articles_main_text" bgcolor="white">
      <a href="../../../manupag/a-z_player_archive/a-z_player_archive_pages/mbeumo_bryan.html">Mbeumo, Bryan</a>
    </td>
  </tr>
  <tr align="center">
    <td bgcolor="white" align="center">
      <img alt="Manchester United squad number 8" src="8.jpg" />
    </td>
    <td class="articles_main_text" bgcolor="white">
      <a href="../../../manupag/a-z_player_archive/a-z_player_archive_pages/fernandes_bruno.html">Fernandes, Bruno</a>
    </td>
  </tr>
  <tr align="center">
    <td bgcolor="white" align="center">
      <img alt="Manchester United squad number 13" src="13.jpg" />
    </td>
    <td class="articles_main_text" bgcolor="white">
      <a href="../../../manupag/a-z_player_archive/a-z_player_archive_pages/dorgu_patrick.html">Dorgu, Patrick</a>
    </td>
  </tr>
  <tr align="center">
    <td bgcolor="white" align="center">
      <img alt="Manchester United squad number 10" src="10.jpg" />
    </td>
    <td class="articles_main_text" bgcolor="white">
      <a href="../../../manupag/a-z_player_archive/a-z_player_archive_pages/cunha_matheus.html">Cunha, Matheus</a>
    </td>
  </tr>
  <tr align="center">
    <td bgcolor="white" align="center">
      <img alt="Manchester United squad number 9" src="9.jpg" />
    </td>
    <td class="articles_main_text" bgcolor="white">
      <a href="../../../manupag/a-z_player_archive/a-z_player_archive_pages/rashford_marcus.html">Rashford, Marcus</a>
      ON for Dorgu 46&#039;
    </td>
  </tr>
  <tr align="center">
    <td bgcolor="white" align="center">
      <img alt="Manchester United squad number 2" src="2.jpg" />
    </td>
    <td class="articles_main_text" bgcolor="white">
      <a href="../../../manupag/a-z_player_archive/a-z_player_archive_pages/dalot_diogo.html">Dalot, Diogo</a>
      ON for Noussair 80&#039;
    </td>
  </tr>
</table>
`;

test("parses MUFCInfo XI rows that use tr attributes", () => {
  const rows = parseRows("2026-08-22", HULL_XI);
  assert.equal(rows.length, 13);
  assert.equal(rows.filter((row) => row.start).length, 11);
  assert.deepEqual(rows.slice(0, 2).map((row) => [row.shirt, row.displayName, row.hrefKey]), [
    [1, "Senne Lammens", "lammens_senne"],
    [3, "Noussair Mazraoui", "mazraoui_noussair"],
  ]);
  assert.equal(rows[11]?.on, 46);
  assert.equal(rows[11]?.offName, "Dorgu");
  assert.equal(rows[12]?.on, 80);
  assert.equal(rows[12]?.offName, "Noussair");
});

test("does not treat a wrapper row as a single bloated XI", () => {
  const html = `
    <tr>
      <td>
        <table>${HULL_XI}</table>
      </td>
    </tr>
  `;
  const rows = parseRows("2026-08-22", html);
  assert.equal(rows.filter((row) => row.start).length, 11);
});

test("matches a substitute announced by first name", () => {
  const mazraoui = parseRows("2026-08-22", HULL_XI)[1];
  assert.ok(mazraoui);
  assert.equal(matchesOffName(mazraoui, "Noussair"), true);
  assert.equal(matchesOffName(mazraoui, "Mazraoui"), true);
});
