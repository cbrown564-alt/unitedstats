/**
 * Golden-numbers regression tests.
 *
 * The product promise is researcher-grade trust: a silent regression in
 * lib/queries.ts or lib/search.ts corrupts every page at once. These tests
 * pin query results to closed historical slices (finished seasons, finished
 * tenures, retired players) so they stay stable as new matches arrive.
 *
 * Scorer and appearance figures are the official club record as published by
 * Wikipedia's List of Manchester United F.C. players, which the dataset's
 * player_records table reproduces.
 *
 * Run: npm test (requires data/united.db — npm run build:db)
 */
import assert from "node:assert/strict";
import test from "node:test";

import {
  allTimeRecord,
  eloSeries,
  getMeta,
  recordByCompetitionType,
  topScorers,
} from "../lib/queries";
import { runSearch } from "../lib/search";
import { getDb } from "../lib/db";

const rec = (cond: string, ...params: unknown[]) =>
  getDb()
    .prepare(
      `SELECT COUNT(*) p, SUM(result='W') w, SUM(result='D') d, SUM(result='L') l,
              SUM(gf) gf, SUM(ga) ga
       FROM matches WHERE ${cond}`,
    )
    .get(...(params as never[])) as { p: number; w: number; d: number; l: number; gf: number; ga: number };

// ---------------------------------------------------------------- closed eras

test("1998-99 treble season record", () => {
  assert.deepEqual(rec("season = ?", "1998-99"), {
    p: 63, w: 36, d: 22, l: 5, gf: 128, ga: 63,
  });
});

test("Alex Ferguson tenure record (closed)", () => {
  assert.deepEqual(rec("manager_id = ?", "alex-ferguson"), {
    p: 1497, w: 893, d: 337, l: 267, gf: 2763, ga: 1363,
  });
});

test("Matt Busby tenure record (closed)", () => {
  assert.deepEqual(rec("manager_id = ?", "matt-busby"), {
    p: 1141, w: 577, d: 265, l: 299, gf: 2323, ga: 1561,
  });
});

// --------------------------------------------------- official scorer record

test("all-time top scorers reproduce the official club record", () => {
  // "Own Goal" is a synthetic aggregate scorer (see below); the official record
  // is real players, so it is excluded from this calibration.
  const top = topScorers(9)
    .filter((p) => p.player_id !== "own-goal")
    .slice(0, 8)
    .map((p) => [p.player_id, p.goals]);
  assert.deepEqual(top, [
    ["wayne-rooney", 253],
    ["bobby-charlton", 249],
    ["denis-law", 237],
    ["jack-rowley", 211],
    ["george-best", 179],
    ["dennis-viollet", 179],
    ["ryan-giggs", 168],
    ["joe-spence", 168],
  ]);
});

test("Own Goal aggregates opponents' own goals as a synthetic top scorer", () => {
  // Own goals scored FOR United gather under one synthetic 'own-goal' scorer,
  // which ranks among the club's leading scorers. Pinned as calibration: a player
  // in United's own lineup can never own-goal in United's favour, so this number
  // must not absorb mislabelled real goals (the Roger Byrne cluster).
  const top = topScorers(6);
  const og = top.find((p) => p.player_id === "own-goal");
  assert.ok(og, "Own Goal should rank among the top scorers");
  assert.equal(og?.name, "Own Goal");
  assert.equal(og?.goals, 202);
  assert.equal(top.indexOf(og!), 4, "Own Goal should rank fifth all-time");
});

test("Wayne Rooney official appearance record", () => {
  const row = getDb()
    .prepare("SELECT apps, starts, subs, goals FROM player_records WHERE player_id = ?")
    .get("wayne-rooney");
  assert.deepEqual(row, { apps: 559, starts: 497, subs: 62, goals: 253 });
});

// -------------------------------------------------------------- famous facts

test("1999 Champions League final: score and corrected attendance", () => {
  const m = getDb()
    .prepare("SELECT gf, ga, attendance, competition_id, round FROM matches WHERE id = ?")
    .get("1999-05-26-bayern-munich-n") as {
      gf: number; ga: number; attendance: number; competition_id: string; round: string;
    };
  assert.equal(m.gf, 2);
  assert.equal(m.ga, 1);
  assert.equal(m.attendance, 90245);
  assert.equal(m.competition_id, "champions-league");
  assert.equal(m.round, "Final");
});

test("1985-86 Screen Sport Super Cup is not filed as the UEFA Super Cup", () => {
  const n = (getDb()
    .prepare("SELECT COUNT(*) n FROM matches WHERE competition_id = 'screen-sport-super-cup'")
    .get() as { n: number }).n;
  assert.equal(n, 4);
  const wrong = (getDb()
    .prepare("SELECT COUNT(*) n FROM matches WHERE competition_id = 'uefa-super-cup' AND round = 'Group stage'")
    .get() as { n: number }).n;
  assert.equal(wrong, 0);
});

test("furthest_round is the canonical deepest cup round, across naming variants", () => {
  const db = getDb();
  const fr = (season: string, comp: string) =>
    (db
      .prepare("SELECT furthest_round f FROM season_summaries WHERE season = ? AND competition_id = ?")
      .get(season, comp) as { f: string } | undefined)?.f;

  // The sources spell rounds many ways; the deepest must win regardless. Each of
  // these used to record an earlier round than the campaign actually reached:
  //  - two-legged knockout ties tied at the default and lost to the group match;
  //  - "First/Second round" word-ordinals and "Fifth Round" never ranked at all;
  //  - a qualifying round outranked the European knockout round it preceded.
  assert.equal(fr("2013-14", "champions-league"), "Quarter-final"); // not "Group A"
  assert.equal(fr("1998-99", "league-cup"), "Round 5"); // not "Third Round"
  assert.equal(fr("1991-92", "cup-winners-cup"), "Round 2"); // not "First round"
  assert.equal(fr("2004-05", "champions-league"), "Round of 16"); // not the qualifier
  assert.equal(fr("1998-99", "champions-league"), "Final"); // the treble, unchanged

  // The stored value is always a canonical round — never a leg suffix, a lettered
  // group, a replay, a plural ("Quarter-finals"), or a league matchday.
  const dirty = db
    .prepare(
      `SELECT COUNT(*) n FROM season_summaries
       WHERE furthest_round LIKE '% leg' OR furthest_round LIKE 'Group _'
          OR furthest_round LIKE '%Matchday' OR furthest_round LIKE '%Replay%'
          OR furthest_round LIKE '%finals'`,
    )
    .get() as { n: number };
  assert.equal(dirty.n, 0);

  // "Furthest round" only applies to knockout/cup competitions; leagues use position.
  const leagueRounds = db
    .prepare(
      `SELECT COUNT(*) n FROM season_summaries ss JOIN competitions c ON c.id = ss.competition_id
       WHERE c.type = 'league' AND ss.furthest_round IS NOT NULL`,
    )
    .get() as { n: number };
  assert.equal(leagueRounds.n, 0);
});

// ----------------------------------------------------------- self-consistency

test("all-time record is internally consistent and covers every match", () => {
  const r = allTimeRecord();
  assert.equal(r.w + r.d + r.l, r.p);
  const total = (getDb().prepare("SELECT COUNT(*) n FROM matches").get() as { n: number }).n;
  const meta = getMeta();
  assert.equal(Number(meta.matches), total);
});

test("competition-type records sum to the all-time record", () => {
  const r = allTimeRecord();
  const byType = recordByCompetitionType();
  const sum = byType.reduce(
    (acc, t) => ({ p: acc.p + t.p, w: acc.w + t.w, d: acc.d + t.d, l: acc.l + t.l }),
    { p: 0, w: 0, d: 0, l: 0 },
  );
  assert.deepEqual(sum, { p: r.p, w: r.w, d: r.d, l: r.l });
});

test("every match has exactly one Elo history row, ratings in sane range", () => {
  const total = (getDb().prepare("SELECT COUNT(*) n FROM matches").get() as { n: number }).n;
  const elo = (getDb()
    .prepare("SELECT COUNT(*) n, MIN(elo_post) lo, MAX(elo_post) hi FROM elo_history")
    .get()) as { n: number; lo: number; hi: number };
  assert.equal(elo.n, total);
  assert.ok(elo.lo > 1100 && elo.hi < 2400, `elo range [${elo.lo}, ${elo.hi}] out of bounds`);
  assert.ok(eloSeries().length > 0);
});

// ----------------------------------------------------------------- transfers

test("record signing and record sale are the documented club anchors", () => {
  const topIn = getDb()
    .prepare(
      "SELECT player_name, fee_gbp FROM transfers WHERE direction='in' AND fee_kind='fee' ORDER BY fee_gbp DESC LIMIT 1",
    )
    .get() as { player_name: string; fee_gbp: number };
  assert.equal(topIn.player_name, "Paul Pogba");
  assert.ok(topIn.fee_gbp >= 89_000_000, `record signing fee ${topIn.fee_gbp} below £89m`);

  // Cristiano Ronaldo's £80m move to Real Madrid (2009) is the record sale; later
  // departures must not eclipse it as the dataset grows.
  const topOut = getDb()
    .prepare(
      "SELECT player_name, fee_gbp FROM transfers WHERE direction='out' AND fee_kind='fee' ORDER BY fee_gbp DESC LIMIT 1",
    )
    .get() as { player_name: string; fee_gbp: number };
  assert.equal(topOut.player_name, "Cristiano Ronaldo");
  assert.equal(topOut.fee_gbp, 80_000_000);
});

test("transfers span the archive and never carry a zero fee", () => {
  const span = getDb()
    .prepare("SELECT COUNT(*) n, MIN(date) lo, MAX(date) hi FROM transfers WHERE date IS NOT NULL")
    .get() as { n: number; lo: string; hi: number };
  assert.ok(span.n > 1500, `expected a deep transfer archive, got ${span.n}`);
  assert.ok(span.lo < "1900-01-01", `earliest transfer ${span.lo} should reach the Newton Heath era`);

  // A "fee" kind always means a real positive amount; everything else stores no
  // number, so a fee is never silently rendered as £0.
  const badFee = (getDb()
    .prepare(
      "SELECT COUNT(*) n FROM transfers WHERE (fee_kind='fee') != (fee_gbp IS NOT NULL AND fee_gbp > 0)",
    )
    .get() as { n: number }).n;
  assert.equal(badFee, 0);
});

test("modern transfers carry a Transfermarkt market value, fee left intact", () => {
  // The valuation enrichment is additive: it fills market_value_eur on the
  // lineup-covered modern era without disturbing the mufcinfo GBP fee spine.
  const withValue = (getDb()
    .prepare("SELECT COUNT(*) n FROM transfers WHERE market_value_eur IS NOT NULL")
    .get() as { n: number }).n;
  assert.ok(withValue > 100, `expected market values on the modern era, got ${withValue}`);

  const pogbaIn = getDb()
    .prepare("SELECT fee_gbp, fee_kind, market_value_eur FROM transfers WHERE id = '2016-08-09-paul-pogba-in'")
    .get() as { fee_gbp: number; fee_kind: string; market_value_eur: number | null };
  assert.equal(pogbaIn.fee_kind, "fee");
  assert.ok(pogbaIn.fee_gbp >= 89_000_000, "record fee must survive enrichment");
  assert.ok(pogbaIn.market_value_eur != null && pogbaIn.market_value_eur > 0, "record signing should carry a market value");
});

// -------------------------------------------------------------------- search

test("shaped search: record away at Arsenal", () => {
  const { shaped } = runSearch("record away at arsenal");
  const hit = shaped.find((s) => s.title === "Record away at Arsenal");
  assert.ok(hit, "expected a shaped answer for 'record away at arsenal'");
  assert.match(hit.summary, /^P\d+ W\d+ D\d+ L\d+ · \d+\.\d% won · GF \d+ GA \d+$/);
  assert.equal(hit.href, "/matches?opponent=arsenal&venue=A");
});

test("shaped search: record under a manager and a season token", () => {
  const under = runSearch("record under busby").shaped;
  assert.ok(under.some((s) => s.title === "Record under Sir Matt Busby"));

  const season = runSearch("1998-99").shaped;
  const hit = season.find((s) => s.title === "1998-99 season");
  assert.ok(hit, "expected a shaped season answer");
  assert.match(hit.summary, /^P63 W36 D22 L5/);
});

test("entity search: giggs resolves as player and manager", () => {
  const { entities } = runSearch("giggs");
  assert.ok(entities.some((e) => e.kind === "player" && e.label === "Ryan Giggs"));
  assert.ok(entities.some((e) => e.kind === "manager" && e.label === "Ryan Giggs"));
});

test("search ignores short or empty queries", () => {
  assert.deepEqual(runSearch(""), { shaped: [], entities: [] });
  assert.deepEqual(runSearch("a"), { shaped: [], entities: [] });
});
