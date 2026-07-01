/**
 * Normalize the curated exports from the public Tableau workbook "Manchester
 * United Games" (profile: conor.brown) into canonical aggregate sources:
 *
 *   data/canonical/tableau-goals-assists.json  (goals + assists)
 *   data/canonical/tableau-goal-types.json     (goals by body part)
 *
 * Both exports are one row per goal/assist, attributed to a player against an
 * opponent in a given season and competition. They are hand-curated and not
 * exhaustive, but they are the only structured assist and goal-type data this
 * project has for the Sir Alex Ferguson era (the modern transfermarkt lane only
 * reaches back to 2012-13; see docs/SOURCE-AUDIT.md). They carry no dates or
 * minutes, so they are NOT match-attributed and never enter match_events — they
 * are season-level aggregates, surfaced as their own lane.
 *
 * Source CSVs are committed under data/sources/tableau/ because the host
 * (public.tableau.com) is not refetchable from CI; the exports were produced by
 * hand and preserved for provenance.
 *
 * Usage:
 *   npm run ingest:tableau-goals-assists           # dry-run summary
 *   npm run ingest:tableau-goals-assists -- --write # persist canonical JSON
 */
import fs from "node:fs";
import path from "node:path";
import {
  CANONICAL,
  ROOT,
  parseCsv,
  readJson,
  slugify,
  writeJson,
  seasonKey,
  type AliasFile,
} from "../lib";
import { familyNameSlug, normalizedSlug } from "../player-resolver";

const SOURCE_ID = "tableau-goals-assists";
const SOURCE_NAME = "Mrs Smokers' records";
const SOURCE_URL =
  "https://public.tableau.com/app/profile/conor.brown/viz/ManchesterUnitedGames/SeasonSummary";

const TABLEAU_DIR = path.join(ROOT, "data", "sources", "tableau");
const SUMMARY_CSV = path.join(TABLEAU_DIR, "goals-assists-summary.csv");
const GOAL_TYPES_CSV = path.join(TABLEAU_DIR, "goal-breakdown.csv");
const SUMMARY_OUT = path.join(CANONICAL, "tableau-goals-assists.json");
const GOAL_TYPES_OUT = path.join(CANONICAL, "tableau-goal-types.json");

/** Competition labels as they appear in the exports -> canonical competition id. */
const COMPETITION_MAP: Record<string, string> = {
  "First Division": "first-division",
  "Premier League": "premier-league",
  "FA Cup": "fa-cup",
  "League Cup": "league-cup",
  "Champions League": "champions-league",
  "European Cup": "european-cup",
  "Charity Shield": "charity-shield",
  "Community Shield": "charity-shield",
  "Club World Championship": "fifa-club-world-cup",
  "Club World Cup": "fifa-club-world-cup",
  "Intercontinental Cup": "intercontinental-cup",
  "European Super Cup": "uefa-super-cup",
  "UEFA Super Cup": "uefa-super-cup",
};

/** Non-player scorer/assist labels -> how to attribute the event. */
const PLACEHOLDERS: Record<string, "own-goal" | "unknown"> = {
  "(own goal)": "own-goal",
  "(someone)": "unknown",
  "?": "unknown",
};

/**
 * Explicit player-label -> player id, for labels the surname index cannot
 * resolve on its own: same-surname collisions (disambiguated by comparing the
 * seasons the label appears in against career spans in player-records.json),
 * the two-token labels the curator already disambiguated, the surname-first
 * "Park", and the "R. Jones" youth-team initial.
 */
const EXPLICIT_ID: Record<string, string> = {
  // same-surname collisions
  Blackmore: "clayton-blackmore",
  Brown: "wes-brown",
  Cole: "andy-cole",
  Davies: "simon-davies",
  Evans: "jonny-evans",
  Ferguson: "darren-ferguson",
  Fletcher: "darren-fletcher",
  Gibson: "darron-gibson",
  Gillespie: "keith-gillespie",
  Graham: "deiniol-graham",
  Hughes: "mark-hughes",
  Jones: "phil-jones",
  Keane: "roy-keane",
  Lee: "kieran-lee",
  McGrath: "paul-mcgrath",
  Miller: "liam-miller",
  Moses: "remi-moses",
  "O'Brien": "liam-o-brien",
  Owen: "michael-owen",
  Parker: "paul-parker",
  Powell: "nick-powell",
  Richardson: "kieran-richardson",
  Schmeichel: "peter-schmeichel",
  Smith: "alan-smith",
  Whiteside: "norman-whiteside",
  Wilson: "james-wilson",
  Young: "ashley-young",
  // curator-disambiguated two-token labels
  "Colin Gibson": "colin-gibson",
  "Gary Neville": "gary-neville",
  "Phil Neville": "phil-neville",
  "Viv Anderson": "viv-anderson",
  "David Wilson": "david-wilson",
  // the da Silva twins: Rafael has no "silva" token in players.json, so the
  // surname index would otherwise collapse both onto Fabio
  "Rafael da Silva": "rafael",
  "Fábio da Silva": "fabio-pereira-da-silva",
  // surname-first / initialled / spelling-variant labels
  Park: "park-ji-sung",
  "R. Jones": "ritchie-jones",
  "Djemba-Djemba": "eric-djemba-djemba",
  DjembaDjemba: "eric-djemba-djemba",
};

/**
 * "Martin" merges both Lee Martins across the era, so it resolves by season:
 * the 1988-91 winger vs the 2005-09 youth full-back.
 */
function resolveMartin(seasonStartYear: number): string {
  return seasonStartYear >= 2000 ? "lee-martin-2005" : "lee-martin";
}

type Attribution = "player" | "own-goal" | "unknown";

interface Resolver {
  playerIds: Set<string>;
  resolvePlayer(label: string, startYear: number): { playerId: string | null; attribution: Attribution };
  resolveOpponent(name: string): string | null;
}

function buildResolver(): Resolver {
  const players = readJson<{ players: { id: string; name: string }[] }>(
    path.join(CANONICAL, "players.json"),
  ).players;
  const playerIds = new Set(players.map((p) => p.id));

  const norm = (s: string) => normalizedSlug(s);
  const bySurname = new Map<string, string[]>();
  const byFull = new Map<string, string>();
  for (const p of players) {
    byFull.set(norm(p.name), p.id);
    const surname = familyNameSlug(p.name);
    (bySurname.get(surname) ?? bySurname.set(surname, []).get(surname)!).push(p.id);
  }

  const opponentIds = new Set(
    readJson<{ opponents: { id: string }[] }>(path.join(CANONICAL, "opponents.json")).opponents.map(
      (o) => o.id,
    ),
  );
  const aliases = readJson<AliasFile>(path.join(CANONICAL, "opponent-aliases.json")).aliases;

  return {
    playerIds,
    resolvePlayer(label, startYear) {
      if (label in PLACEHOLDERS) return { playerId: null, attribution: PLACEHOLDERS[label] };
      if (label === "Martin") return { playerId: resolveMartin(startYear), attribution: "player" };
      if (label in EXPLICIT_ID) return { playerId: EXPLICIT_ID[label], attribution: "player" };
      const full = byFull.get(norm(label));
      if (full) return { playerId: full, attribution: "player" };
      const cands = bySurname.get(familyNameSlug(label)) ?? [];
      if (cands.length === 1) return { playerId: cands[0], attribution: "player" };
      return { playerId: null, attribution: "unknown" };
    },
    resolveOpponent(name) {
      const candidate = aliases[name] ?? slugify(name);
      return opponentIds.has(candidate) ? candidate : null;
    },
  };
}

interface BaseRow {
  playerId: string | null;
  playerLabel: string;
  attribution: Attribution;
  season: string;
  competition: string;
  opponent: string;
  opponentId: string | null;
}

/** Resolve the fields shared by every export row; null when the row is skipped. */
function resolveRow(r: Resolver, row: Record<string, string>): { base: BaseRow; startYear: number } {
  const label = row["Player"].trim();
  const startYear = parseInt(row["Season"].slice(0, 4), 10);
  const season = seasonKey(startYear);

  const competitionLabel = row["Competition"].replace(/\s+/g, " ").trim();
  const competition = COMPETITION_MAP[competitionLabel];
  if (!competition) throw new Error(`Unmapped competition: ${JSON.stringify(competitionLabel)}`);

  const opponent = row["Opponent"].trim();
  const opponentId = r.resolveOpponent(opponent);

  const { playerId, attribution } = r.resolvePlayer(label, startYear);
  if (playerId && !r.playerIds.has(playerId)) {
    throw new Error(`Resolved player id not in players.json: ${label} -> ${playerId}`);
  }

  return { base: { playerId, playerLabel: label, attribution, season, competition, opponent, opponentId }, startYear };
}

function commonMeta() {
  return {
    generatedAt: new Date().toISOString(),
    sourceId: SOURCE_ID,
    sourceName: SOURCE_NAME,
    sourceUrl: SOURCE_URL,
  };
}

// ---- goals + assists summary -----------------------------------------------

function buildSummary(r: Resolver) {
  type Kind = "goal" | "assist";
  interface Row extends BaseRow { kind: Kind; count: number }

  const csv = parseCsv(fs.readFileSync(SUMMARY_CSV, "utf8"));
  const agg = new Map<string, Row>();
  const unmatchedPlayers = new Set<string>();
  const unmatchedOpponents = new Set<string>();
  let dropped = 0;

  for (const row of csv) {
    // Tableau densification emits empty-player rows (Player Count 0); skip them.
    if (row["Player Count"] !== "1") {
      dropped++;
      continue;
    }
    const { base } = resolveRow(r, row);
    if (base.attribution === "unknown" && !(base.playerLabel in PLACEHOLDERS)) {
      unmatchedPlayers.add(base.playerLabel);
    }
    if (!base.opponentId) unmatchedOpponents.add(base.opponent);

    const kind: Kind = row["Scorer / Assister"].trim() === "Goals" ? "goal" : "assist";
    const key = [base.playerId ?? base.playerLabel, base.attribution, kind, base.season, base.competition, base.opponent].join("|");
    const existing = agg.get(key);
    if (existing) existing.count++;
    else agg.set(key, { ...base, kind, count: 1 });
  }

  const rows = [...agg.values()].sort(
    (a, b) =>
      a.season.localeCompare(b.season) ||
      a.competition.localeCompare(b.competition) ||
      a.opponent.localeCompare(b.opponent) ||
      a.kind.localeCompare(b.kind) ||
      a.playerLabel.localeCompare(b.playerLabel),
  );

  const goals = rows.filter((x) => x.kind === "goal").reduce((n, x) => n + x.count, 0);
  const assists = rows.filter((x) => x.kind === "assist").reduce((n, x) => n + x.count, 0);
  const seasons = [...new Set(rows.map((x) => x.season))].sort();

  const out = {
    ...commonMeta(),
    grain: "one row per (player, attribution, kind, season, competition, opponent) with an event count",
    coverage: { fromSeason: seasons[0], toSeason: seasons.at(-1), seasonCount: seasons.length, goals, assists },
    notes: [
      "Hand-curated and not exhaustive; some European campaigns and matches are absent.",
      "No dates or minutes: not match-attributed and never written to match_events.",
      "kind=goal counts include penalties; goal-type detail lives in tableau-goal-types.json.",
      "attribution=own-goal: opposition own goals credited to United; attribution=unknown: scorer/assister not recorded in the source.",
      "Opponent ids resolve against opponents.json where present; foreign clubs not yet in that table keep opponentId=null with the display name preserved.",
    ],
    unresolved: { players: [...unmatchedPlayers].sort(), opponents: [...unmatchedOpponents].sort() },
    rows,
  };

  console.log(`summary: ${csv.length} source rows, ${dropped} densification rows dropped`);
  console.log(`  -> ${rows.length} rows: ${goals} goals, ${assists} assists, seasons ${seasons[0]}..${seasons.at(-1)}`);
  console.log(`  unresolved players: ${out.unresolved.players.length}, opponents without canonical id: ${out.unresolved.opponents.length}`);
  if (out.unresolved.players.length) console.log("  unresolved player labels:", out.unresolved.players);
  return out;
}

// ---- goals by body part ----------------------------------------------------

function buildGoalTypes(r: Resolver) {
  interface Row extends BaseRow { goalType: string; count: number }

  const csv = parseCsv(fs.readFileSync(GOAL_TYPES_CSV, "utf8"));
  const agg = new Map<string, Row>();
  const unmatchedPlayers = new Set<string>();
  const unmatchedOpponents = new Set<string>();
  const byType: Record<string, number> = {};

  for (const row of csv) {
    if (row["Player Count"] !== "1") continue;
    const { base } = resolveRow(r, row);
    if (base.attribution === "unknown" && !(base.playerLabel in PLACEHOLDERS)) {
      unmatchedPlayers.add(base.playerLabel);
    }
    if (!base.opponentId) unmatchedOpponents.add(base.opponent);

    const goalType = row["Goal Description"].trim();
    byType[goalType] = (byType[goalType] ?? 0) + 1;
    const key = [base.playerId ?? base.playerLabel, base.attribution, goalType, base.season, base.competition, base.opponent].join("|");
    const existing = agg.get(key);
    if (existing) existing.count++;
    else agg.set(key, { ...base, goalType, count: 1 });
  }

  const rows = [...agg.values()].sort(
    (a, b) =>
      a.season.localeCompare(b.season) ||
      a.competition.localeCompare(b.competition) ||
      a.opponent.localeCompare(b.opponent) ||
      a.goalType.localeCompare(b.goalType) ||
      a.playerLabel.localeCompare(b.playerLabel),
  );

  const goals = rows.reduce((n, x) => n + x.count, 0);
  const seasons = [...new Set(rows.map((x) => x.season))].sort();

  const out = {
    ...commonMeta(),
    grain: "one row per (player, goalType, season, competition, opponent) with a goal count",
    coverage: { fromSeason: seasons[0], toSeason: seasons.at(-1), seasonCount: seasons.length, goals, byType },
    notes: [
      "goalType is the body part / technique the goal was scored with (Right Foot, Left Foot, Head, Knee, Backheel, Torso, Shoulder).",
      "Hand-curated and not exhaustive; goal count is a subset of the summary goal total and does not include own goals.",
      "No dates or minutes: not match-attributed and never written to match_events.",
      "Opponent ids resolve against opponents.json where present; foreign clubs not yet in that table keep opponentId=null with the display name preserved.",
    ],
    unresolved: { players: [...unmatchedPlayers].sort(), opponents: [...unmatchedOpponents].sort() },
    rows,
  };

  console.log(`goal-types: ${csv.length} source rows`);
  console.log(`  -> ${rows.length} rows: ${goals} goals, seasons ${seasons[0]}..${seasons.at(-1)}`);
  console.log(`  by type: ${Object.entries(byType).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(", ")}`);
  console.log(`  unresolved players: ${out.unresolved.players.length}, opponents without canonical id: ${out.unresolved.opponents.length}`);
  if (out.unresolved.players.length) console.log("  unresolved player labels:", out.unresolved.players);
  return out;
}

function main() {
  const write = process.argv.includes("--write");
  const r = buildResolver();

  const summary = buildSummary(r);
  const goalTypes = buildGoalTypes(r);

  if (write) {
    writeJson(SUMMARY_OUT, summary);
    writeJson(GOAL_TYPES_OUT, goalTypes);
    console.log(`wrote ${path.relative(ROOT, SUMMARY_OUT)} and ${path.relative(ROOT, GOAL_TYPES_OUT)}`);
  } else {
    console.log("dry-run; pass --write to persist");
  }
}

try {
  main();
} catch (error) {
  console.error("tableau-goals-assists failed:", error);
  process.exit(1);
}
