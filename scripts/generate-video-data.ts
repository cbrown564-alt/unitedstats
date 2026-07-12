import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { getDb } from "../lib/db";
import { comparePlayers } from "../lib/compare";
import { fergieTimeEchoes, fortressRun } from "../lib/journey";
import { eventsForMatch, lineupForMatch, matchById, playerById } from "../lib/queries";
import { lateGoalScatter, leadHeldAtHome } from "../lib/trails";
import { FEATURED_MATCH_MANIFEST } from "../video/featured-match-manifest";

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

const careerComparison = comparePlayers("cristiano-ronaldo", "george-best");
if (!careerComparison || careerComparison.signature?.kind !== "career") {
  throw new Error("Ronaldo / Best career comparison is unavailable");
}

const featuredMatches = FEATURED_MATCH_MANIFEST.map((entry) => {
  const match = matchById(entry.matchId);
  if (!match) throw new Error(`Featured film match is unavailable: ${entry.matchId}`);

  const featuredPlayers = entry.featuredPlayers.map((playerId) => {
    const player = playerById(playerId);
    if (!player) throw new Error(`Featured film player is unavailable: ${playerId}`);
    return {
      id: player.player_id,
      name: player.name,
      image: player.player_image_url,
      imagePage: player.player_image_page_url,
      imageLicense: player.player_image_license,
      apps: player.apps,
      goals: player.goals,
      firstYear: player.first_year,
      lastYear: player.last_year,
    };
  });

  return {
    ...entry,
    match: {
      id: match.id,
      date: match.date,
      opponent: match.opponent_name,
      venue: match.venue,
      stadium: match.stadium_name,
      competition: match.competition_name,
      round: match.round,
      gf: match.gf,
      ga: match.ga,
      aet: Boolean(match.aet),
      penGf: match.pen_gf,
      penGa: match.pen_ga,
      eventsComplete: Boolean(match.events_complete),
      hasLineup: Boolean(match.has_lineup),
    },
    events: eventsForMatch(entry.matchId).map((event) => ({
      seq: event.seq,
      type: event.type,
      playerId: event.player_id,
      player: event.player_display_name,
      side: event.player_side,
      minute: event.minute,
      added: event.added_time,
    })),
    lineup: lineupForMatch(entry.matchId).map((player) => ({
      playerId: player.player_id,
      name: player.player_display_name,
      side: player.player_side,
      shirt: player.shirt,
      role: player.role,
      careerBand: player.career_band,
      started: Boolean(player.started),
      bench: Boolean(player.bench),
      subOn: player.sub_on,
      subOff: player.sub_off,
    })),
    featuredPlayers,
  };
});

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
  featuredMatches,
  careerDuel: {
    ronaldo: careerComparison.signature.a,
    best: careerComparison.signature.b,
  },
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
