import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { getDb } from "../lib/db";
import { fergieTimeEchoes, fortressRun } from "../lib/journey";
import { lateGoalScatter, leadHeldAtHome } from "../lib/trails";

type MatchPoint = {
  id: string;
  date: string;
  result: "W" | "D" | "L";
  venue: string;
  competitionType: string;
};

const db = getDb();
const matches = db
  .prepare(
    `SELECT m.id, m.date, m.result, m.venue, c.type competitionType
     FROM matches m JOIN competitions c ON c.id = m.competition_id
     ORDER BY m.date, m.id`,
  )
  .all() as MatchPoint[];

const lateGoals = lateGoalScatter("1950-01-01").map((goal) => ({
  key: `${goal.matchId}:e${goal.seq}`,
  matchId: goal.matchId,
  date: goal.date,
  opponent: goal.opponent,
  minute: goal.minute,
  added: goal.added,
  clock: goal.clock,
  scorer: goal.scorer,
  stoppage: goal.stoppage,
}));

const fortress = fortressRun();
if (!fortress) throw new Error("Fortress run is unavailable");
const led = leadHeldAtHome();
const fortressGames = led.games
  .filter((game) => game.date > fortress.lastLoss.date)
  .map((game) => ({
    id: game.id,
    date: game.date,
    result: game.result,
    opponent: game.opponent_name,
    riskMinute: game.riskMinute,
    worst: game.worst,
  }));

const counts = db
  .prepare(
    `SELECT
       (SELECT COUNT(*) FROM matches) matches,
       (SELECT COUNT(*) FROM match_events) events,
       (SELECT COUNT(*) FROM match_lineups) lineups`,
  )
  .get() as { matches: number; events: number; lineups: number };

const fixture = {
  counts,
  firstMatch: {
    id: "1886-10-30-fleetwood-rangers-a",
    date: "1886-10-30",
    opponent: "Fleetwood Rangers",
    score: "2–2",
    clubName: "Newton Heath",
  },
  matches,
  lateGoals,
  fergieEchoes: fergieTimeEchoes(),
  fortress: {
    ...fortress,
    games: fortressGames,
  },
};

const output = resolve("video/generated-master-data.json");
writeFileSync(output, `${JSON.stringify(fixture, null, 2)}\n`, "utf8");
process.stdout.write(
  `Generated ${output}: ${matches.length} matches, ${lateGoals.length} late goals, ${fortressGames.length} fortress games\n`,
);

