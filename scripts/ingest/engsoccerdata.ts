/**
 * One-off bootstrap: build canonical season JSON from engsoccerdata raw CSVs.
 *
 * - data/raw/england.csv  -> every league match 1892-93 onward
 * - data/raw/facup.csv    -> every FA Cup match 1886-87 onward
 *
 * Merge-aware: never removes or overwrites a match that already exists in a
 * canonical season file (so curated enrichments and pipeline-appended matches
 * survive re-runs). Only adds matches that are missing.
 */
import fs from "node:fs";
import path from "node:path";
import {
  AliasFile, CANONICAL, Match, RAW, Venue,
  loadSeasonFile, matchId, opponentIdFor, parseCsv, readJson, saveSeasonFile, seasonKey,
} from "../lib";

const MU = "Manchester United";
const { aliases } = readJson<AliasFile>(path.join(CANONICAL, "opponent-aliases.json"));

function leagueCompetition(seasonStart: number, tier: number): string {
  if (tier === 2) return "second-division";
  return seasonStart >= 1992 ? "premier-league" : "first-division";
}

/** "Hillsborough, Sheffield" -> known stadium id or null (kept in notes). */
function knownStadiumId(venueText: string | null): string | null {
  if (!venueText) return null;
  const v = venueText.toLowerCase();
  if (v.includes("wembley")) return "wembley";
  if (v.includes("millennium")) return "millennium-stadium";
  if (v.includes("maine road")) return "maine-road";
  if (v.includes("old trafford")) return "old-trafford";
  return null;
}

function na(s: string | undefined): string | null {
  if (s === undefined) return null;
  const t = s.trim();
  return t === "" || t === "NA" ? null : t;
}

interface Stats { added: number; skipped: number; existing: number }

function upsert(
  bySeason: Map<string, ReturnType<typeof loadSeasonFile>>,
  season: string,
  match: Match,
  stats: Stats,
) {
  let sf = bySeason.get(season);
  if (!sf) { sf = loadSeasonFile(season); bySeason.set(season, sf); }
  if (sf.matches.some((m) => m.id === match.id)) { stats.existing++; return; }
  sf.matches.push(match);
  stats.added++;
}

function run() {
  const bySeason = new Map<string, ReturnType<typeof loadSeasonFile>>();
  const stats: Stats = { added: 0, skipped: 0, existing: 0 };

  // ---- League ----
  const england = parseCsv(fs.readFileSync(path.join(RAW, "england.csv"), "utf8"));
  for (const r of england) {
    const isHome = r.home === MU;
    const isAway = r.visitor === MU;
    if (!isHome && !isAway) continue;
    const seasonStart = parseInt(r.Season, 10);
    const season = seasonKey(seasonStart);
    const tier = parseInt(r.tier, 10);
    const oppName = isHome ? r.visitor : r.home;
    const oppId = opponentIdFor(oppName, aliases);
    const venue: Venue = isHome ? "H" : "A";
    const gf = parseInt(isHome ? r.hgoal : r.vgoal, 10);
    const ga = parseInt(isHome ? r.vgoal : r.hgoal, 10);
    if (Number.isNaN(gf) || Number.isNaN(ga)) { stats.skipped++; continue; }
    const match: Match = {
      id: matchId(r.Date, oppId, venue),
      date: r.Date,
      competition: leagueCompetition(seasonStart, tier),
      round: null,
      opponent: oppName,
      opponentId: oppId,
      venue,
      stadium: null, // resolved from home-ground date ranges at DB build time
      attendance: null,
      score: { ft: [gf, ga] },
      sources: ["engsoccerdata"],
    };
    upsert(bySeason, season, match, stats);
  }

  // ---- FA Cup ----
  const facup = parseCsv(fs.readFileSync(path.join(RAW, "facup.csv"), "utf8"));
  const roundNames: Record<string, string> = {
    "1": "Round 1", "2": "Round 2", "3": "Round 3", "4": "Round 4",
    "5": "Round 5", "6": "Quarter-final", s: "Semi-final", f: "Final",
    "Quarter-final": "Quarter-final", "Semi-final": "Semi-final", Final: "Final",
  };
  for (const r of facup) {
    const isHome = r.home === MU;
    const isAway = r.visitor === MU;
    if (!isHome && !isAway) continue;
    const date = na(r.Date);
    if (!date) { stats.skipped++; continue; }
    const seasonStart = parseInt(r.Season, 10);
    const season = seasonKey(seasonStart);
    const oppName = isHome ? r.visitor : r.home;
    const oppId = opponentIdFor(oppName, aliases);
    const neutral = na(r.neutral) === "yes";
    const venue: Venue = neutral ? "N" : isHome ? "H" : "A";
    const gf = parseInt(isHome ? r.hgoal : r.vgoal, 10);
    const ga = parseInt(isHome ? r.vgoal : r.hgoal, 10);
    if (Number.isNaN(gf) || Number.isNaN(ga)) { stats.skipped++; continue; }
    const aet = na(r.aet) === "yes";
    let pens: [number, number] | null = null;
    if (na(r.pen) === "yes") {
      const hp = parseInt(r.hp, 10);
      const vp = parseInt(r.vp, 10);
      if (!Number.isNaN(hp) && !Number.isNaN(vp)) {
        pens = isHome ? [hp, vp] : [vp, hp];
      }
    }
    const venueText = na(r.Venue);
    const attendance = na(r.attendance)
      ? parseInt(r.attendance.replace(/[, ]/g, ""), 10) || null
      : null;
    const notesParts: string[] = [];
    const tie = na(r.tie);
    if (tie && tie !== "initial") notesParts.push(`FA Cup ${tie}`);
    if (venueText && !knownStadiumId(venueText)) notesParts.push(`Venue: ${venueText}`);
    const nonmatch = na(r.nonmatch);
    if (nonmatch) notesParts.push(nonmatch);
    const noteText = na(r.notes);
    if (noteText) notesParts.push(noteText);

    const match: Match = {
      id: matchId(date, oppId, venue),
      date,
      competition: "fa-cup",
      round: roundNames[r.round] ?? (na(r.round) ? `Round ${r.round}` : null),
      opponent: oppName,
      opponentId: oppId,
      venue,
      stadium: knownStadiumId(venueText),
      attendance,
      score: { ft: [gf, ga], aet: aet || undefined, pens },
      sources: ["engsoccerdata"],
      notes: notesParts.length ? notesParts.join(". ") : null,
    };
    upsert(bySeason, season, match, stats);
  }

  for (const sf of bySeason.values()) saveSeasonFile(sf);
  console.log(
    `engsoccerdata ingest: +${stats.added} added, ${stats.existing} already present, ${stats.skipped} skipped, ${bySeason.size} season files`,
  );
}

run();
