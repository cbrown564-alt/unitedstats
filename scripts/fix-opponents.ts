/**
 * One-off migration: re-derive opponentId (and therefore match id) for every
 * canonical match from its display name + the current alias table. Run after
 * extending opponent-aliases.json to merge duplicate opponent identities.
 */
import path from "node:path";
import {
  AliasFile, CANONICAL, MATCHES_DIR, SeasonFile,
  listSeasonFiles, matchId, opponentIdFor, readJson, saveSeasonFile,
} from "./lib";

const { aliases } = readJson<AliasFile>(path.join(CANONICAL, "opponent-aliases.json"));

let changed = 0;
for (const file of listSeasonFiles()) {
  const sf = readJson<SeasonFile>(path.join(MATCHES_DIR, file));
  let touched = false;
  for (const m of sf.matches) {
    const newId = opponentIdFor(m.opponent, aliases);
    if (newId !== m.opponentId) {
      m.opponentId = newId;
      m.id = matchId(m.date, newId, m.venue);
      touched = true;
      changed++;
    }
  }
  if (touched) saveSeasonFile(sf);
}
console.log(`fix-opponents: ${changed} matches remapped`);
