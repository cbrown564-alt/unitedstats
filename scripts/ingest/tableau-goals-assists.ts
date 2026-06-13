/**
 * Normalize the curated "Goals & Assists Summary" export from the public
 * Tableau workbook "Manchester United Games" (profile: conor.brown) into a
 * canonical aggregate source.
 *
 * The export is one row per goal or per assist, attributed to a player against
 * an opponent in a given season and competition. It is hand-curated and not
 * exhaustive, but it is the only structured assist data this project has for
 * the Sir Alex Ferguson era (the modern transfermarkt lane only reaches back to
 * 2012-13; see docs/ASSISTS-PLAN.md). It carries no dates or minutes, so it is
 * NOT match-attributed and never enters match_events — it is a season-level
 * scorer/assist aggregate, surfaced as its own lane.
 *
 * Source CSV is committed at data/sources/tableau/goals-assists-summary.csv
 * because the host (public.tableau.com) is not refetchable from CI; the export
 * was produced by hand and preserved for provenance.
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

const SOURCE_ID = "tableau-goals-assists";
const SOURCE_NAME = "Manchester United Games (Tableau Public, conor.brown)";
const SOURCE_URL =
  "https://public.tableau.com/app/profile/conor.brown/viz/ManchesterUnitedGames/SeasonSummary";
const CSV_PATH = path.join(ROOT, "data", "sources", "tableau", "goals-assists-summary.csv");
const OUT_PATH = path.join(CANONICAL, "tableau-goals-assists.json");

/** Competition labels as they appear in the export -> canonical competition id. */
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
  // slugify renders "æ" as a separator, so the surname index cannot reach him
  Solskjær: "ole-gunnar-solskj-r",
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

type Kind = "goal" | "assist";
type Attribution = "player" | "own-goal" | "unknown";

interface AggRow {
  playerId: string | null;
  playerLabel: string;
  attribution: Attribution;
  kind: Kind;
  season: string;
  competition: string;
  opponent: string;
  opponentId: string | null;
  count: number;
}

function buildSurnameIndex(players: { id: string; name: string }[]) {
  const norm = (s: string) => slugify(s);
  const bySurname = new Map<string, string[]>();
  const byFull = new Map<string, string>();
  for (const p of players) {
    byFull.set(norm(p.name), p.id);
    const tokens = norm(p.name).split("-");
    const surname = tokens[tokens.length - 1];
    const list = bySurname.get(surname) ?? [];
    list.push(p.id);
    bySurname.set(surname, list);
  }
  return { bySurname, byFull, norm };
}

function main() {
  const write = process.argv.includes("--write");

  const players = readJson<{ players: { id: string; name: string }[] }>(
    path.join(CANONICAL, "players.json"),
  ).players;
  const playerIds = new Set(players.map((p) => p.id));
  const { bySurname, byFull, norm } = buildSurnameIndex(players);

  const opponentIds = new Set(
    readJson<{ opponents: { id: string }[] }>(path.join(CANONICAL, "opponents.json")).opponents.map(
      (o) => o.id,
    ),
  );
  const aliases = readJson<AliasFile>(path.join(CANONICAL, "opponent-aliases.json")).aliases;

  const csv = parseCsv(fs.readFileSync(CSV_PATH, "utf8"));

  const agg = new Map<string, AggRow>();
  const unmatchedPlayers = new Set<string>();
  const unmatchedOpponents = new Set<string>();
  let dropped = 0;

  for (const row of csv) {
    // Tableau densification emits empty-player rows (Player Count 0); skip them.
    if (row["Player Count"] !== "1") {
      dropped++;
      continue;
    }

    const label = row["Player"].trim();
    const kindRaw = row["Scorer / Assister"].trim();
    const kind: Kind = kindRaw === "Goals" ? "goal" : "assist";

    const startYear = parseInt(row["Season"].slice(0, 4), 10);
    const season = seasonKey(startYear);

    const competitionLabel = row["Competition"].replace(/\s+/g, " ").trim();
    const competition = COMPETITION_MAP[competitionLabel];
    if (!competition) throw new Error(`Unmapped competition: ${JSON.stringify(competitionLabel)}`);

    const opponent = row["Opponent"].trim();
    const candidateOpp = aliases[opponent] ?? slugify(opponent);
    const opponentId = opponentIds.has(candidateOpp) ? candidateOpp : null;
    if (!opponentId) unmatchedOpponents.add(opponent);

    // resolve player
    let attribution: Attribution = "player";
    let playerId: string | null = null;
    if (label in PLACEHOLDERS) {
      attribution = PLACEHOLDERS[label];
    } else if (label === "Martin") {
      playerId = resolveMartin(startYear);
    } else if (label in EXPLICIT_ID) {
      playerId = EXPLICIT_ID[label];
    } else {
      const full = byFull.get(norm(label));
      if (full) {
        playerId = full;
      } else {
        const tokens = norm(label).split("-");
        const cands = bySurname.get(tokens[tokens.length - 1]) ?? [];
        if (cands.length === 1) {
          playerId = cands[0];
        } else {
          unmatchedPlayers.add(label);
          attribution = "unknown";
        }
      }
    }
    if (playerId && !playerIds.has(playerId)) {
      throw new Error(`Resolved player id not in players.json: ${label} -> ${playerId}`);
    }

    const key = [playerId ?? label, attribution, kind, season, competition, opponent].join("|");
    const existing = agg.get(key);
    if (existing) {
      existing.count++;
    } else {
      agg.set(key, {
        playerId,
        playerLabel: label,
        attribution,
        kind,
        season,
        competition,
        opponent,
        opponentId,
        count: 1,
      });
    }
  }

  const rows = [...agg.values()].sort(
    (a, b) =>
      a.season.localeCompare(b.season) ||
      a.competition.localeCompare(b.competition) ||
      a.opponent.localeCompare(b.opponent) ||
      a.kind.localeCompare(b.kind) ||
      (a.playerLabel || "").localeCompare(b.playerLabel || ""),
  );

  const goals = rows.filter((r) => r.kind === "goal").reduce((n, r) => n + r.count, 0);
  const assists = rows.filter((r) => r.kind === "assist").reduce((n, r) => n + r.count, 0);
  const seasons = [...new Set(rows.map((r) => r.season))].sort();

  const out = {
    generatedAt: new Date().toISOString(),
    sourceId: SOURCE_ID,
    sourceName: SOURCE_NAME,
    sourceUrl: SOURCE_URL,
    grain: "one row per (player, attribution, kind, season, competition, opponent) with an event count",
    coverage: {
      fromSeason: seasons[0],
      toSeason: seasons[seasons.length - 1],
      seasonCount: seasons.length,
      goals,
      assists,
    },
    notes: [
      "Hand-curated and not exhaustive; some European campaigns and matches are absent.",
      "No dates or minutes: not match-attributed and never written to match_events.",
      "kind=goal counts include penalties; this export carries no goal-type detail.",
      "attribution=own-goal: opposition own goals credited to United; attribution=unknown: scorer/assister not recorded in the source.",
      "Opponent ids resolve against opponents.json where present; foreign clubs not yet in that table keep opponentId=null with the display name preserved.",
    ],
    unresolved: {
      players: [...unmatchedPlayers].sort(),
      opponents: [...unmatchedOpponents].sort(),
    },
    rows,
  };

  console.log(`tableau-goals-assists: ${csv.length} source rows, ${dropped} densification rows dropped`);
  console.log(`  aggregated to ${rows.length} rows: ${goals} goals, ${assists} assists`);
  console.log(`  seasons ${seasons[0]}..${seasons[seasons.length - 1]} (${seasons.length})`);
  console.log(
    `  unresolved players: ${out.unresolved.players.length}, opponents without canonical id: ${out.unresolved.opponents.length}`,
  );
  if (out.unresolved.players.length) console.log("  player labels left unresolved:", out.unresolved.players);

  if (write) {
    writeJson(OUT_PATH, out);
    console.log(`wrote ${path.relative(ROOT, OUT_PATH)}`);
  } else {
    console.log("dry-run; pass --write to persist");
  }
}

main();
