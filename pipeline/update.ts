/**
 * The recurring update job: fetch latest Manchester United results and append
 * any new ones to the canonical season file. Also rewrites the upcoming
 * schedule overlay from the same openfootball files. Result ingest is
 * idempotent; the overlay is overwrite-only.
 *
 * Primary source: openfootball/england (community-maintained plain text,
 * no API key). Prints NEW_MATCHES=<n> and SCHEDULE_WRITTEN=1 for the workflow.
 */
import {
  AliasFile, CANONICAL, Match, Venue,
  loadSeasonFile, matchId, opponentIdFor, readJson, saveSeasonFile, writeJson,
} from "../scripts/lib";
import path from "node:path";
import { buildUpcomingOverlay, parseOpenfootball, type UpcomingSource } from "./upcoming";

export { parseOpenfootball };

const MU_NAMES = ["Manchester United FC", "Manchester United"];

/** Season to update: --season 2022-23 to backfill, else derived from today. */
function targetSeason(now = new Date()): string {
  const argIdx = process.argv.indexOf("--season");
  if (argIdx !== -1 && process.argv[argIdx + 1]) return process.argv[argIdx + 1];
  const y = now.getUTCFullYear();
  const startYear = now.getUTCMonth() + 1 >= 7 ? y : y - 1;
  return `${startYear}-${String((startYear + 1) % 100).padStart(2, "0")}`;
}

interface SourceSpec {
  file: string; // path within openfootball/england/<season>/
  competition: string;
}
// League is always present; cup files appear in the repo when the season's
// data exists. Missing files are skipped silently.
const SOURCES: SourceSpec[] = [
  { file: "1-premierleague.txt", competition: "premier-league" },
  { file: "facup.txt", competition: "fa-cup" },
  { file: "eflcup.txt", competition: "league-cup" },
  { file: "leaguecup.txt", competition: "league-cup" },
];

async function fetchText(url: string): Promise<string | null> {
  const res = await fetch(url, { headers: { "user-agent": "unitedstats-pipeline" } });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`${res.status} fetching ${url}`);
  return res.text();
}

async function run() {
  const season = targetSeason();
  const startYear = parseInt(season.slice(0, 4), 10);
  const { aliases } = readJson<AliasFile>(path.join(CANONICAL, "opponent-aliases.json"));
  const sf = loadSeasonFile(season);
  const known = new Set(sf.matches.map((m) => m.id));
  // League sides meet once per venue per season, so opponent+venue dedupes
  // even when sources disagree on the exact date of the same fixture.
  const knownLeague = new Set(
    sf.matches
      .filter((m) => m.competition === "premier-league")
      .map((m) => `${m.opponentId}|${m.venue}`),
  );
  let added = 0;
  const addedIds: string[] = [];
  const upcomingSources: UpcomingSource[] = [];

  for (const src of SOURCES) {
    const url = `https://raw.githubusercontent.com/openfootball/england/master/${season}/${src.file}`;
    let text: string | null;
    try {
      text = await fetchText(url);
    } catch (err) {
      console.error(`WARN: ${src.file}: ${err}`);
      continue;
    }
    if (text === null) continue; // file doesn't exist (yet) for this season
    upcomingSources.push({ competition: src.competition, text });

    const isCup = src.competition !== "premier-league";
    for (const f of parseOpenfootball(text, startYear)) {
      const isHome = MU_NAMES.includes(f.home);
      const isAway = MU_NAMES.includes(f.away);
      if (!isHome && !isAway) continue;
      if (f.date > new Date().toISOString().slice(0, 10)) continue; // fixture, not result
      const rawOpp = isHome ? f.away : f.home;
      // strip trailing FC/AFC before alias lookup so "Reading FC" -> reading
      const oppName = rawOpp.replace(/\s+(FC|AFC)$/, "");
      const oppId = opponentIdFor(aliases[rawOpp] ? rawOpp : oppName, aliases);
      // finals (and modern FA Cup semi-finals) are at neutral venues
      const neutral =
        isCup && (f.round === "Final" || (src.competition === "fa-cup" && f.round === "Semi-final"));
      const venue: Venue = neutral ? "N" : isHome ? "H" : "A";
      const id = matchId(f.date, oppId, venue);
      if (known.has(id)) continue;
      if (!isCup && knownLeague.has(`${oppId}|${venue}`)) continue;
      const flip = <T,>(pair: [T, T]): [T, T] => (isHome ? pair : [pair[1], pair[0]]);
      const match: Match = {
        id,
        date: f.date,
        competition: src.competition,
        round: isCup ? f.round : null,
        opponent: oppName,
        opponentId: oppId,
        venue,
        stadium: neutral ? "wembley" : null,
        attendance: null,
        score: {
          ft: flip(f.ft),
          ht: f.ht ? flip(f.ht) : null,
          aet: f.aet || undefined,
          pens: f.pens ? flip(f.pens) : null,
        },
        sources: ["openfootball"],
      };
      sf.matches.push(match);
      known.add(id);
      if (!isCup) knownLeague.add(`${oppId}|${venue}`);
      added++;
      addedIds.push(id);
      const [gf, ga] = match.score.ft;
      console.log(`+ ${f.date} ${isHome ? "v" : "@"} ${oppName} ${gf}-${ga}${f.pens ? ` (${match.score.pens!.join("-")} pens)` : ""} (${src.competition}${f.round ? ", " + f.round : ""})`);
    }
  }

  if (added > 0) saveSeasonFile(sf);
  const overlay = buildUpcomingOverlay({
    season,
    updatedAt: new Date().toISOString().slice(0, 10),
    sources: upcomingSources,
    aliases,
    known: sf.matches.map((m) => ({
      competition: m.competition,
      opponentId: m.opponentId,
      venue: m.venue,
    })),
  });
  writeJson(path.join(CANONICAL, "upcoming.json"), overlay);
  console.log(
    overlay.fixtures.length > 0
      ? `schedule: ${overlay.fixtures.length} upcoming (${overlay.competitions.join(", ")})`
      : "schedule: no upcoming fixtures",
  );
  console.log(added > 0 ? `${added} new match(es) added to ${season}` : "no new matches");
  console.log(`NEW_MATCHES=${added}`);
  console.log("SCHEDULE_WRITTEN=1");
  if (addedIds.length > 0) console.log(`NEW_MATCH_IDS=${addedIds.join(",")}`);
}

// only run when executed directly (the parser is imported elsewhere)
if (process.argv[1] && /update\.(ts|js)$/.test(process.argv[1].replace(/\\/g, "/"))) {
  run().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
