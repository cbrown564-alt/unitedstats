/**
 * Normalise own goals scored FOR United onto a single synthetic "Own Goal"
 * scorer, so they aggregate as a pseudo-player in the goalscorer ranking while
 * the actual opposition scorer stays recorded as a per-event detail.
 *
 * For every `own-goal-for` event this:
 *   - sets `player` to the synthetic id `own-goal` (added to players.json), so
 *     build-db can total them under one "Own Goal" entry, and
 *   - rewrites `playerName` to the clean name of the opponent who scored it,
 *     pulled from wherever it was recorded — `playerName` for modern events, or
 *     `detail` ("Gary Gillespie (og)") for older ones — with the "(og)" /
 *     ", Own-goal" markers stripped.
 *
 * `own-goal-against` events (a United player scoring into his own net) are left
 * untouched: those count for the opposition and stay attributed to the United
 * player who conceded them.
 *
 * Idempotent and additive. Dry run by default; pass --write to save.
 *
 * Usage:
 *   tsx scripts/normalize-own-goals.ts            # dry run
 *   tsx scripts/normalize-own-goals.ts --write
 */
import path from "node:path";
import {
  CANONICAL, loadSeasonFile, listSeasonFiles, readJson, saveSeasonFile, writeJson,
} from "./lib";

const OWN_GOAL_ID = "own-goal";
const OWN_GOAL_NAME = "Own Goal";
const WRITE = process.argv.includes("--write");

interface PlayersFile {
  players: { id: string; name: string }[];
}

/** The opponent scorer's clean name, from playerName or the older `detail` slot. */
function scorerName(playerName: string | null | undefined, detail: string | null | undefined): string | null {
  const raw = playerName ?? detail ?? "";
  const name = raw
    .replace(/,?\s*own[\s-]*goal/gi, " ")
    .replace(/\([^)]*\)/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return name || null;
}

function main() {
  // 1) Ensure the synthetic player exists.
  const playersPath = path.join(CANONICAL, "players.json");
  const playersFile = readJson<PlayersFile>(playersPath);
  const hadPlayer = playersFile.players.some((p) => p.id === OWN_GOAL_ID);
  if (!hadPlayer) {
    playersFile.players.push({ id: OWN_GOAL_ID, name: OWN_GOAL_NAME });
    playersFile.players.sort((a, b) => a.id.localeCompare(b.id));
  }

  // 2) Normalise every own-goal-for event across all seasons.
  let touchedEvents = 0;
  let renamed = 0;
  const touchedSeasons: string[] = [];
  const samples: string[] = [];

  for (const file of listSeasonFiles()) {
    const season = file.replace(/\.json$/, "");
    const sf = loadSeasonFile(season);
    let seasonTouched = false;
    for (const match of sf.matches) {
      for (const event of match.events ?? []) {
        if (event.type !== "own-goal-for") continue;
        const name = scorerName(event.playerName, event.detail);
        const needsPlayer = event.player !== OWN_GOAL_ID;
        const needsName = (event.playerName ?? null) !== name;
        if (!needsPlayer && !needsName) continue;
        touchedEvents++;
        seasonTouched = true;
        if (needsName && name) renamed++;
        if (samples.length < 12) samples.push(`${match.id}: ${name ?? "(unknown)"}`);
        if (WRITE) {
          event.player = OWN_GOAL_ID;
          if (name) event.playerName = name;
          event.playerSide = "opponent";
        }
      }
    }
    if (seasonTouched) touchedSeasons.push(season);
    if (WRITE && seasonTouched) saveSeasonFile(sf);
  }

  if (WRITE && !hadPlayer) {
    playersFile.players.sort((a, b) => a.id.localeCompare(b.id));
    writeJson(playersPath, playersFile);
  }

  for (const s of samples) console.log(`  ${s}`);
  console.log(
    `normalize-own-goals ${WRITE ? "write" : "dry-run"}: ` +
      `${hadPlayer ? "own-goal player already present" : `${WRITE ? "added" : "would add"} 'own-goal' player`}; ` +
      `${touchedEvents} own-goal-for events ${WRITE ? "normalised" : "to normalise"} ` +
      `(${renamed} scorer names cleaned) across ${touchedSeasons.length} seasons`,
  );
}

main();
