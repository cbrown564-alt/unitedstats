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
  findMatches,
  getMeta,
  matchesSummary,
  recordByCompetitionType,
  topScorers,
} from "../lib/queries";
import { comebacks } from "../lib/trails";
import { clubStreaks, topRuns } from "../lib/streaks";
import { compareEras, compareManagers, comparePlayers } from "../lib/compare";
import {
  CURATED_CUTS, cutFromParams, cutHref, curatedCut, isCurated, runCut,
} from "../lib/cut";
import { runSearch } from "../lib/search";
import { classifyMiss } from "../lib/search/log";
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
  assert.match(hit.summary, /^P\d+ W\d+ D\d+ L\d+ · \d+% won · GF \d+ GA \d+$/);
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
  assert.deepEqual(runSearch(""), { shaped: [], entities: [], total: 0 });
  assert.deepEqual(runSearch("a"), { shaped: [], entities: [], total: 0 });
});

// ------------------------------------------------ phase 2: query understanding

test("head-to-head resolves from a bare opponent phrase ('Arsenal away record')", () => {
  const { shaped } = runSearch("arsenal away record");
  const hit = shaped.find((s) => s.title === "Record away at Arsenal");
  assert.ok(hit, "expected a venue-aware head-to-head for 'arsenal away record'");
  assert.match(hit.summary, /^P\d+ W\d+ D\d+ L\d+ · \d+% won · GF \d+ GA \d+$/);
  assert.equal(hit.href, "/matches?opponent=arsenal&venue=A");
});

test("superlative: biggest win in a decade resolves to the single extreme match", () => {
  const { shaped } = runSearch("biggest win in the 90s");
  const hit = shaped.find((s) => s.title.startsWith("Biggest win"));
  assert.ok(hit, "expected a superlative answer");
  // a comfortable United win, scoped to the 1990s, with a browse link carrying the sort
  assert.match(hit.summary, /^\d+–\d+.* v .+ · \d{1,2} \w{3} 19\d\d/);
  assert.match(hit.href, /sort=margin/);
  assert.match(hit.href, /from=1990/);
});

test("comparison: two players resolve to a side-by-side, never a head-to-head", () => {
  const { shaped } = runSearch("rooney vs charlton");
  const hit = shaped.find((s) => s.title === "Wayne Rooney vs Bobby Charlton");
  assert.ok(hit, "expected a player-vs-player comparison");
  assert.match(hit.summary, /Wayne Rooney: .*goals/);
  assert.match(hit.summary, /Bobby Charlton: .*goals/);
});

test("era/competition scope: 'United in Europe' gives a computed record", () => {
  const { shaped } = runSearch("united in europe");
  const hit = shaped.find((s) => s.title === "United in Europe");
  assert.ok(hit, "expected an era/competition-scoped record");
  assert.match(hit.summary, /^P\d+ W\d+ D\d+ L\d+/);
  assert.equal(hit.href, "/matches?type=european");
});

test("scoping operators: 'player:' constrains kind, 'vs:' yields a head-to-head", () => {
  const players = runSearch("player:giggs").entities;
  assert.ok(players.length > 0 && players.every((e) => e.kind === "player"), "player: should return only players");

  const { shaped } = runSearch("vs:liverpool");
  assert.ok(shaped.some((s) => /Record against Liverpool/.test(s.title)), "vs: should return a head-to-head");
});

// ------------------------------------------ phase 18.2: search as the front door

test("18.2 natural phrasing: a verb-shaped question computes a head-to-head", () => {
  // "did united ever beat barcelona" used to return nothing at all (no shaped, no
  // entity). The expanded verb lexicon now recognises "beat" and routes it.
  const { shaped } = runSearch("did united ever beat barcelona");
  const hit = shaped.find((s) => /Record against FC Barcelona/.test(s.title));
  assert.ok(hit, "expected a computed head-to-head for natural phrasing");
  assert.match(hit.summary, /^P\d+ W\d+ D\d+ L\d+ · \d+% won/);
  assert.equal(hit.tentative, undefined, "a recognised verb is confident, not a guess");
  assert.equal(hit.coverage?.grade, "complete", "the result record is complete");
});

test("18.2 tentative fallback: question-shape + one strong opponent, no trigger", () => {
  // No verb, no trigger word — just question-shape and an opponent. The parser
  // offers a *tentative* best guess ("Did you mean …?"), never an assertion.
  const { shaped } = runSearch("how many times barcelona");
  const guess = shaped.find((s) => /Record against FC Barcelona/.test(s.title));
  assert.ok(guess, "expected a tentative head-to-head");
  assert.equal(guess.tentative, true, "a verb-less guess must be flagged tentative");
});

test("18.2 no false positive: a bare opponent name stays entity-first", () => {
  // A plain name must NOT auto-fire a head-to-head — the researcher may want the
  // opponent page, and entity rows are the right answer.
  const { shaped, entities } = runSearch("barcelona");
  assert.equal(shaped.length, 0, "a bare name shapes no answer");
  assert.ok(entities.some((e) => e.kind === "opponent" && /Barcelona/.test(e.label)));
});

test("18.2 subject-strip is safe for clubs whose name contains 'United'", () => {
  // Stripping the United subject must never eat a trailing club name.
  const bare = runSearch("leeds united");
  assert.equal(bare.shaped.length, 0, "'leeds united' is an opponent lookup, not a cut");
  const h2h = runSearch("did united lose to leeds").shaped;
  assert.ok(h2h.some((s) => /Record against Leeds United/.test(s.title)), "verb-shaped vs Leeds resolves");
});

test("18.2 coverage grade rides on every shaped verdict, graded honestly", () => {
  const h2h = runSearch("record away at arsenal").shaped.find((s) => /Arsenal/.test(s.title));
  assert.equal(h2h?.coverage?.grade, "complete", "result record is complete");

  const late = runSearch("late goals under ferguson").shaped[0];
  assert.equal(late?.coverage?.grade, "partial", "an event-derived answer is partial");
  assert.match(late.coverage.label, /timed-goal/);
});

// ------------------------ phase 18.2 cont.: the player-vs-opponent answer shape

test("player vs opponent: a player's goals against one club computes", () => {
  // The shape the team head-to-head structurally can't reach. Rooney is retired,
  // so the recorded figure is a closed slice; pinned structurally (player, opponent,
  // grade) rather than to an exact count so future event backfill can only grow it,
  // while a broken join (0 goals → "No recorded goals…") still fails the regex.
  const { shaped } = runSearch("how many times did rooney score against arsenal");
  const hit = shaped.find((s) => s.title === "Wayne Rooney v Arsenal");
  assert.ok(hit, "expected a player-vs-opponent answer");
  assert.match(hit.summary, /^\d+ recorded goals in \d+ matches/);
  assert.equal(hit.coverage?.grade, "partial", "goal events are partial coverage");
  // The evidence link reproduces exactly the matches counted: this player's goals
  // against this club, via the shared scorer+opponent /matches filter.
  assert.match(hit.href, /^\/matches\?/);
  assert.match(hit.href, /scorer=wayne-rooney/);
  assert.match(hit.href, /opponent=arsenal/);
});

test("player-vs-opponent never steals a two-player comparison", () => {
  // "rooney vs charlton" must stay Rooney-vs-Bobby-Charlton, not also surface
  // "Wayne Rooney v Charlton Athletic" (a real opponent club).
  const { shaped } = runSearch("rooney vs charlton");
  assert.ok(shaped.some((s) => s.title === "Wayne Rooney vs Bobby Charlton"));
  assert.ok(!shaped.some((s) => /Charlton Athletic/.test(s.title)), "the opponent read must not leak in");
});

test("ambiguous 'player vs club token' prefers opponent cuts and keeps player comparison as an alternative", () => {
  const { shaped } = runSearch("cantona vs leeds");
  assert.ok(shaped.some((s) => s.title === "Eric Cantona v Leeds United — appearances"));
  assert.ok(shaped.some((s) => s.title === "Eric Cantona v Leeds United — goals"));
  assert.ok(shaped.some((s) => s.title === "Eric Cantona v Leeds United — assists"));
  assert.ok(
    shaped.some((s) => s.summary.includes("appearance")) &&
      shaped.some((s) => s.summary.includes("recorded goal")) &&
      shaped.some((s) => s.summary.includes("recorded assist")),
    "expected appearance, goal, and assist variants for the player-vs-opponent cut",
  );
  assert.ok(shaped.some((s) => s.title === "Eric Cantona vs Lee Sharpe"), "expected comparison as an alternative");
});

test("a team-record phrasing still falls through to the head-to-head", () => {
  // "record against arsenal" names no player on the left, so player-vs-opponent
  // returns null and the team head-to-head answers instead.
  const { shaped } = runSearch("record against arsenal");
  assert.ok(shaped.some((s) => s.title === "Record against Arsenal"));
  assert.ok(!shaped.some((s) => / v Arsenal$/.test(s.title)), "no spurious player answer");
});

test("18.2 miss classification: shaped = hit, entity-only = fell, nothing = zero", () => {
  assert.equal(classifyMiss(9, 1), undefined, "a shaped answer is never a miss");
  assert.equal(classifyMiss(9, 0), "fell", "entity rows but no answer is a fall-through");
  assert.equal(classifyMiss(0, 0), "zero", "nothing at all is a zero-result");
});

// ------------------------- the subject × metric × scope grammar (one engine)

test("grammar: a player's metric varies by keyword (appearances, not just goals)", () => {
  // The whack-a-mole fix: the metric is a slot, so the appearances cell — adjacent
  // to the goals cell — computes instead of returning nothing.
  const apps = runSearch("rooney appearances vs liverpool").shaped.find((s) => s.title === "Wayne Rooney v Liverpool");
  assert.ok(apps, "expected a player-appearances answer");
  assert.match(apps.summary, /^\d+ appearances? \(\d+ starts?\)/);
  assert.equal(apps.coverage?.label, "lineup data", "appearances are lineup-derived");
  assert.match(apps.href, /player=wayne-rooney/);
  assert.match(apps.href, /opponent=liverpool/);
});

test("grammar: a manager is a subject — record scoped to him, link agrees with count", () => {
  const hit = runSearch("ferguson record vs arsenal").shaped.find((s) => s.title === "Sir Alex Ferguson v Arsenal");
  assert.ok(hit, "expected a manager-vs-opponent record");
  assert.match(hit.summary, /^P\d+ W\d+ D\d+ L\d+/);
  assert.equal(hit.coverage?.grade, "complete", "the result record is complete");
  // The evidence link must carry the manager filter, or it would show every United
  // v Arsenal match rather than Ferguson's — the count and the slice must match.
  assert.match(hit.href, /manager=alex-ferguson/);
  assert.match(hit.href, /opponent=arsenal/);
});

test("grammar: United's own goals over a scope is a complete count", () => {
  const hit = runSearch("united goals at home in the 90s").shaped.find((s) => /^United goals/.test(s.title));
  assert.ok(hit, "expected a team-goals aggregate");
  assert.match(hit.summary, /^\d[\d,]* scored, \d[\d,]* conceded in \d+ matches$/);
  assert.equal(hit.coverage?.grade, "complete", "goals-for is in the result table");
  assert.equal(hit.href, "/matches?venue=H&from=1990&to=1999");
});

test("grammar: 'late' is a window on the goals metric, applied for any subject", () => {
  // "late goals by Cantona" used to return nothing (the "by player" + "late"
  // shape); "late goals against Bayern" silently dropped "late" and returned all
  // goals. The window is now a slot: a rate over the same scope, partial coverage.
  const byPlayer = runSearch("late goals by cantona").shaped.find((s) => /Cantona late goals/.test(s.title));
  assert.ok(byPlayer, "expected a player late-goals rate");
  assert.match(byPlayer.summary, /^\d+ of \d+ recorded goals? \(\d+%\) came after the 85th minute$/);
  assert.equal(byPlayer.coverage?.label, "timed-goal data", "minute-derived → partial");

  const vsOpp = runSearch("late goals against bayern").shaped.find((s) => /late goals v /.test(s.title));
  assert.ok(vsOpp, "expected a team late-goals rate vs the opponent");
  assert.match(vsOpp.summary, /came after the 85th minute$/);
  assert.match(vsOpp.href, /goalWindow=late/);
  assert.ok(!/scored, \d+ conceded/.test(vsOpp.summary), "'late' must not collapse to a plain goal total");
});

test("grammar: 'late' uses the canonical after-the-85th-minute definition", () => {
  // One definition across the product (the homepage late-goals question and
  // lib/trails.ts), not the search box's old looser "final 15 minutes".
  const hit = runSearch("late goals under ferguson").shaped.find((s) => /late goals under/i.test(s.title));
  assert.ok(hit, "expected a manager-scoped late-goals rate");
  assert.match(hit.summary, /came after the 85th minute$/);
  assert.equal(hit.coverage?.grade, "partial");
});

test("matches parity: event filters reproduce late-goal and assist evidence slices", () => {
  const late = runSearch("late goals by cantona").shaped.find((s) => /Cantona late goals/.test(s.title));
  assert.ok(late, "expected a player late-goals answer");
  const lateUrl = new URL(`https://example.test${late.href}`);
  assert.equal(lateUrl.searchParams.get("scorer"), "eric-cantona");
  assert.equal(lateUrl.searchParams.get("goalWindow"), "late");
  const lateSummary = matchesSummary({ scorer: "eric-cantona", goalWindow: "late" });
  assert.match(late.summary, new RegExp(`^${lateSummary.p} of \\d+ recorded goals?`));

  const assists = runSearch("rooney assists vs arsenal").shaped.find((s) => s.title === "Wayne Rooney v Arsenal");
  assert.ok(assists, "expected a player-assists answer");
  assert.match(assists.href, /assister=wayne-rooney/);
  assert.match(assists.href, /opponent=arsenal/);
  const assistMatches = findMatches({ assister: "wayne-rooney", opponent: "arsenal", limit: 200 });
  assert.match(assists.summary, new RegExp(`recorded assists? in ${assistMatches.total} matches?`));
});

test("grammar: a bare player or manager name stays entity-first (no metric, no fire)", () => {
  // Symmetry with the bare-opponent rule: only a metric or an opponent earns a
  // shaped verdict, so typing a name still lands on its entity row.
  assert.equal(runSearch("rooney").shaped.length, 0, "a bare player name shapes no answer");
  assert.equal(runSearch("ferguson").shaped.length, 0, "a bare manager name shapes no answer");
});

// ------------------------------------------------ phase 9: runs and comebacks

test("run detection is ordered, bounded, and reaches a deep unbeaten run", () => {
  const runs = topRuns("unbeaten", 5);
  assert.ok(runs.length > 0, "expected at least one unbeaten run");
  // Longest first, then chronological — never increasing in length down the list.
  for (let i = 1; i < runs.length; i++) {
    assert.ok(runs[i].length <= runs[i - 1].length, "runs must be ordered longest-first");
  }
  // Each run is a real, forward span; an ended run names the match that broke it.
  for (const r of runs) {
    assert.ok(r.from <= r.to, `run span ${r.from}..${r.to} must run forwards`);
    assert.equal(r.ongoing, r.ender === null, "a run is ongoing iff it has no ender");
  }
  // The all-time unbeaten record is the 1998-99 treble run; it can only grow, so
  // this is a floor, not an exact pin.
  assert.ok(runs[0].length >= 33, `longest unbeaten run ${runs[0].length} below the known 33`);

  // Every kind produces a record run, and clubStreaks agrees with topRuns.
  const s = clubStreaks(5);
  assert.equal(s.unbeaten[0].length, runs[0].length);
  for (const kind of ["winning", "scoring", "cleansheet"] as const) {
    assert.ok(s[kind][0]?.length >= 3, `expected a ${kind} run of 3+`);
  }
});

test("comeback detection is internally consistent and finds the 2001 Spurs fightback", () => {
  const { summary, deepest } = comebacks(50);
  // The funnel only narrows: wins ⊆ recoveries ⊆ fell-behind ⊆ replayable.
  assert.ok(summary.wonFromBehind <= summary.recovered);
  assert.ok(summary.recovered <= summary.fellBehind);
  assert.ok(summary.fellBehind <= summary.replayable);
  assert.ok(summary.twoPlusRecovered <= summary.recovered);
  assert.equal(summary.replayable, Number(getMeta().matches_events_complete));
  // Floors that only grow as more matches are minute-stamped.
  assert.ok(summary.recovered >= 1000, `recoveries ${summary.recovered} below floor`);
  assert.ok(summary.wonFromBehind >= 490, `comeback wins ${summary.wonFromBehind} below floor`);

  // United trailed 3-0 at White Hart Lane in 2001 and won 5-3 — the canonical
  // comeback, detected from minute-stamped goals with a deficit of 3.
  const spurs = deepest.find((m) => m.id === "2001-09-29-tottenham-hotspur-a");
  assert.ok(spurs, "expected the 5-3 at Spurs among the deepest comebacks");
  assert.equal(spurs.deficit, 3);
  assert.equal(spurs.result, "W");
});

test("compare builders reproduce the official record across the three modes", () => {
  // Players: the comparison reads the official scorer/appearance record.
  const players = comparePlayers("wayne-rooney", "bobby-charlton");
  assert.ok(players, "expected a player comparison");
  const byLabel = (c: NonNullable<typeof players>, label: string) =>
    c.metrics.find((m) => m.label === label)!;
  assert.deepEqual([byLabel(players, "Goals").a, byLabel(players, "Goals").b], [253, 249]);
  assert.deepEqual([byLabel(players, "Appearances").a, byLabel(players, "Appearances").b], [559, 758]);
  // Scoring depth: hat-tricks and best single-season return, both match-attributed
  // and complete across these careers (Rooney 8 hat-tricks to Charlton's 7).
  assert.deepEqual([byLabel(players, "Hat-tricks").a, byLabel(players, "Hat-tricks").b], [8, 7]);
  const best = byLabel(players, "Best season");
  assert.deepEqual([best.a, best.b], [34, 29]);
  assert.match(best.note ?? "", /Charlton: 29 in/, "best-season note names the season");
  assert.equal(byLabel(players, "Hat-tricks").comparable, undefined, "hat-tricks need no coverage gate");

  // Managers: Ferguson's trophy count is the canonical 38; Busby's reign is closed.
  const mgrs = compareManagers("alex-ferguson", "matt-busby");
  assert.ok(mgrs, "expected a manager comparison");
  assert.deepEqual([byLabel(mgrs, "Trophies").a, byLabel(mgrs, "Trophies").b], [38, 11]);
  assert.deepEqual([byLabel(mgrs, "Matches").a, byLabel(mgrs, "Matches").b], [1497, 1141]);
  // Per-game toggle: Points total carries a Points-per-game rate form.
  assert.ok(byLabel(mgrs, "Points").rate, "Points metric should expose a per-game rate");

  // Eras: a closed-vs-closed era comparison resolves with sane win rates.
  const eras = compareEras("busby", "ferguson");
  assert.ok(eras, "expected an era comparison");
  const ferWin = byLabel(eras, "Win rate").b;
  assert.ok(ferWin != null && ferWin > 55 && ferWin < 62, `Ferguson-era win rate ${ferWin} out of range`);

  // Coverage honesty: Rooney's career is inside the assists record, Charlton's
  // predates it — assists must not be judged as a like-for-like figure.
  const rooAssists = byLabel(players, "Assists");
  assert.equal(rooAssists.comparable, false, "Rooney-vs-Charlton assists must be flagged non-comparable");
  assert.ok(byLabel(players, "Goals").rate, "Goals metric should expose a per-90 rate");

  // Same entity on both sides is not a comparison.
  assert.equal(comparePlayers("wayne-rooney", "wayne-rooney"), null);
  assert.equal(compareEras("busby", "busby"), null);
});

// ------------------------------------------------------------------ the Cut

test("Cut params round-trip through the URL without loss", () => {
  const cut = cutFromParams({ by: "manager", metric: "ppg", season: "1998-99", venue: "H" });
  assert.equal(cut.dimension, "manager");
  assert.equal(cut.metric, "ppg");
  assert.equal(cut.filters.season, "1998-99");
  assert.equal(cut.filters.venue, "H");

  // Serialize, re-parse from the resulting query string: the cut is stable.
  const sp = Object.fromEntries(new URL(`https://x${cutHref(cut)}`).searchParams);
  const back = cutFromParams(sp);
  assert.deepEqual(back.filters, cut.filters);
  assert.equal(back.dimension, cut.dimension);
  assert.equal(back.metric, cut.metric);

  // Unknown dimension/metric fall back to the safe defaults rather than throwing.
  const bad = cutFromParams({ by: "nonsense", metric: "vibes" });
  assert.equal(bad.dimension, "decade");
  assert.equal(bad.metric, "winrate");
});

test("only registered cuts are curated (the SEO guardrail)", () => {
  // Every registry entry recognises itself.
  for (const c of CURATED_CUTS) assert.equal(isCurated(curatedCut(c)), true, `curated ${c.slug}`);
  // A registered combination, parsed from a bare URL, is curated.
  assert.equal(cutFromParams({ by: "manager", metric: "ppg" }).curated, true);
  // The same dimension on a different lens is a fork — noindex.
  assert.equal(cutFromParams({ by: "manager", metric: "winrate" }).curated, false);
  // Any added filter turns a curated cut into a fork.
  assert.equal(cutFromParams({ by: "manager", metric: "ppg", venue: "H" }).curated, false);
});

test("runCut aggregates the record and degrades honestly", () => {
  // Decades cover every match (every fixture has a date), so the grouped sum is
  // the all-time total and the engine matches the canonical record.
  const decades = runCut(cutFromParams({ by: "decade", metric: "winrate" }));
  assert.equal(decades.played, allTimeRecord().p);
  assert.ok(decades.groups.length >= 13, `expected 13+ decades, got ${decades.groups.length}`);
  assert.equal(decades.coverage.grade, "complete");
  assert.ok(decades.headline, "expected a standout decade");
  for (const g of decades.groups) assert.equal(g.w + g.d + g.l, g.p, `W+D+L=P for ${g.label}`);

  // Cross-check one group against a direct query: home matches in calendar 1990.
  const venue90 = runCut(cutFromParams({ by: "venue", metric: "winrate", from: "1990", to: "1990" }));
  const home = venue90.groups.find((g) => g.key === "H");
  assert.ok(home, "expected a Home group in 1990");
  const direct = rec("venue='H' AND date>='1990-01-01' AND date<='1990-12-31'");
  assert.deepEqual(
    { p: home.p, w: home.w, d: home.d, l: home.l, gf: home.gf, ga: home.ga },
    { p: direct.p, w: direct.w, d: direct.d, l: direct.l, gf: direct.gf, ga: direct.ga },
  );

  // A fork whose filters intersect to nothing degrades to an empty state rather
  // than a clean total over a hole — no headline, the coverage grade says empty.
  const empty = runCut(cutFromParams({ by: "decade", metric: "winrate", season: "3000-3001" }));
  assert.equal(empty.played, 0);
  assert.equal(empty.groups.length, 0);
  assert.equal(empty.headline, null);
  assert.equal(empty.coverage.grade, "empty");

  // Thin samples never top a rate ladder: the opponent win-rate cut leads with a
  // solid-sample group that matches the headline, and every thin group sorts below
  // every solid one (so a 100%-from-two-games club can't pose as the best record).
  const opp = runCut(cutFromParams({ by: "opponent", metric: "winrate" }));
  assert.equal(opp.groups[0].thin, false, "ladder must not open on a thin sample");
  assert.equal(opp.groups[0].key, opp.headline?.key, "ladder #1 must be the headline");
  const firstThin = opp.groups.findIndex((g) => g.thin);
  if (firstThin !== -1) {
    assert.ok(
      opp.groups.slice(firstThin).every((g) => g.thin),
      "no solid group may sort below a thin one",
    );
  }
});

test("player Cut ranks the squad and slices one player, from complete-history sources", () => {
  // By-player goals reproduce the canonical all-time top scorer and headline him as
  // the most of all players (a count metric — "the most", never "the strongest").
  const scorers = runCut(cutFromParams({ subject: "player", by: "player", metric: "goals" }));
  assert.equal(scorers.cut.subject, "player");
  const top = scorers.groups[0];
  assert.equal(top.key, "wayne-rooney");
  assert.equal(top.value, 253);
  assert.equal(scorers.headline?.key, "wayne-rooney");
  assert.ok(scorers.headline, "expected a top-scorer headline");
  assert.match(scorers.headline.gloss, /the most of [\d,]+ players/);
  // A by-player row's evidence is the player's page; player cuts are forks (noindex).
  assert.equal(top.href, "/player/wayne-rooney");
  assert.equal(scorers.cut.curated, false);

  // Single-player slice: grouping by season under a player filter counts THAT
  // player's goals (attribution), not every goal in matches he played. The grouped
  // total equals his recorded event goals, and his peak season matches a direct query.
  const rooney = runCut(
    cutFromParams({ subject: "player", by: "season", metric: "goals", player: "wayne-rooney" }),
  );
  const grouped = rooney.groups.reduce((s, g) => s + (g.value ?? 0), 0);
  const directTotal = (
    getDb()
      .prepare(
        "SELECT COUNT(*) n FROM match_events WHERE player_side='united' AND type IN ('goal','pen-goal') AND player_id='wayne-rooney'",
      )
      .get() as { n: number }
  ).n;
  assert.equal(grouped, directTotal);
  const peak = getDb()
    .prepare(
      `SELECT m.season s, COUNT(*) n FROM match_events e JOIN matches m ON m.id = e.match_id
       WHERE e.player_side='united' AND e.type IN ('goal','pen-goal') AND e.player_id='wayne-rooney'
       GROUP BY m.season ORDER BY n DESC, s LIMIT 1`,
    )
    .get() as { s: string; n: number };
  const peakGroup = rooney.groups.find((g) => g.key === peak.s);
  assert.ok(peakGroup && peakGroup.value === peak.n, "peak season goals match a direct query");

  // A stale or cross-subject URL (a team dimension/metric under the player subject)
  // falls back to the player defaults rather than producing an invalid cut.
  const coerced = cutFromParams({ subject: "player", by: "manager", metric: "winrate" });
  assert.equal(coerced.dimension, "player");
  assert.equal(coerced.metric, "goals");

  // subject survives the URL round-trip; team stays the clean default (no param).
  const back = cutFromParams(Object.fromEntries(new URL(`https://x${cutHref(scorers.cut)}`).searchParams));
  assert.equal(back.subject, "player");
  assert.ok(!cutHref(cutFromParams({ by: "decade", metric: "winrate" })).includes("subject"));

  // A rate lens (goals per app) never opens on a thin sample.
  const gpa = runCut(cutFromParams({ subject: "player", by: "player", metric: "goalsperapp" }));
  assert.equal(gpa.groups[0].thin, false, "rate ladder must not open on a thin sample");
});
