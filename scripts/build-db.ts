/**
 * Compile data/canonical/*.json -> data/united.db (SQLite).
 * Pure function of the canonical data: safe to delete the .db and rebuild.
 *
 * Also precomputes the analytics layer:
 *  - elo_history: closed-universe Elo (opponents rated only on their games
 *    vs United) + pre-match win expectancy. Documented in docs/DATA-MODEL.md.
 *  - player_totals, season_summaries, opponent_records.
 */
import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import {
  CANONICAL, DB_PATH, Match, SeasonFile,
  listSeasonFiles, readJson, MATCHES_DIR,
} from "./lib";

interface Managers {
  managers: {
    id: string; name: string; nationality: string; role: string;
    tenures: { from: string; to: string | null; note: string | null }[];
  }[];
}
interface Stadiums {
  stadiums: {
    id: string; name: string; city: string; country: string;
    lat: number | null; lng: number | null;
    home: { from: string; to: string | null }[]; note?: string | null;
  }[];
}
interface Competitions {
  competitions: { id: string; name: string; type: string; tier: number | null }[];
}
interface Players {
  players: {
    id: string; name: string; positions?: string[] | null;
    nationality?: string | null; born?: string | null;
  }[];
}
interface PlayerRecords {
  records: {
    playerId: string;
    name: string;
    wikiTitle?: string | null;
    career: string;
    firstYear?: number | null;
    lastYear?: number | null;
    starts: number;
    subs: number;
    apps: number;
    goals: number;
    sourceId: string;
    sourceUrl: string;
    sourcePage?: string | null;
    sourceBucket?: string | null;
    statsAsOf?: string | null;
  }[];
}
interface PlayerMedia {
  records: {
    playerId: string;
    wikidataId?: string | null;
    commonsFile: string;
    imageUrl: string;
    thumbUrl?: string | null;
    pageUrl?: string | null;
    license?: string | null;
    artist?: string | null;
    credit?: string | null;
    sourceId: string;
    retrievedAt?: string | null;
  }[];
}
interface ManagerMedia {
  records: {
    managerId: string;
    wikidataId?: string | null;
    commonsFile: string;
    imageUrl: string;
    thumbUrl?: string | null;
    pageUrl?: string | null;
    license?: string | null;
    artist?: string | null;
    credit?: string | null;
    sourceId: string;
    retrievedAt?: string | null;
  }[];
}
interface OgScorerMedia {
  records: {
    name: string;
    wikidataId?: string | null;
    commonsFile: string;
    imageUrl: string;
    thumbUrl?: string | null;
    pageUrl?: string | null;
    license?: string | null;
    artist?: string | null;
    credit?: string | null;
    sourceId: string;
    retrievedAt?: string | null;
  }[];
}
interface PlayerShirts {
  records: {
    playerId: string;
    name?: string;
    shirt: number;
    decade: string;
    apps: number;
    firstDate: string;
    lastDate: string;
    sourceId: string;
  }[];
}
interface TableauGoalAssistRow {
  playerId: string | null;
  playerLabel: string;
  attribution: string;
  kind: "goal" | "assist";
  season: string;
  competition: string;
  opponent: string;
  opponentId: string | null;
  count: number;
}
interface TableauGoalTypeRow {
  playerId: string | null;
  playerLabel: string;
  attribution: string;
  goalType: string;
  season: string;
  competition: string;
  opponent: string;
  opponentId: string | null;
  count: number;
}
interface TableauFile<R> {
  sourceId: string;
  rows: R[];
}
interface Opponents {
  opponents?: { id: string; name: string; country?: string | null; lat?: number | null; lng?: number | null }[];
}
interface Sources {
  sources: {
    id: string; label: string; kind: string; url?: string | null;
    coverage?: string | null; notes?: string | null;
  }[];
}

const managers = readJson<Managers>(path.join(CANONICAL, "managers.json")).managers;
const stadiums = readJson<Stadiums>(path.join(CANONICAL, "stadiums.json")).stadiums;
const competitions = readJson<Competitions>(path.join(CANONICAL, "competitions.json")).competitions;
const playerRecordsFile = path.join(CANONICAL, "player-records.json");
const playerRecords = fs.existsSync(playerRecordsFile)
  ? readJson<PlayerRecords>(playerRecordsFile).records
  : [];
const playerMediaFile = path.join(CANONICAL, "player-media.json");
const playerMedia = fs.existsSync(playerMediaFile)
  ? readJson<PlayerMedia>(playerMediaFile).records
  : [];
const managerMediaFile = path.join(CANONICAL, "manager-media.json");
const managerMedia = fs.existsSync(managerMediaFile)
  ? readJson<ManagerMedia>(managerMediaFile).records
  : [];
const ogScorerMediaFile = path.join(CANONICAL, "og-scorer-media.json");
const ogScorerMedia = fs.existsSync(ogScorerMediaFile)
  ? readJson<OgScorerMedia>(ogScorerMediaFile).records
  : [];
const playerShirtsFile = path.join(CANONICAL, "player-shirts.json");
const playerShirts = fs.existsSync(playerShirtsFile)
  ? readJson<PlayerShirts>(playerShirtsFile).records
  : [];
const tableauGoalsAssistsFile = path.join(CANONICAL, "tableau-goals-assists.json");
const tableauGoalsAssists = fs.existsSync(tableauGoalsAssistsFile)
  ? readJson<TableauFile<TableauGoalAssistRow>>(tableauGoalsAssistsFile)
  : null;
const tableauGoalTypesFile = path.join(CANONICAL, "tableau-goal-types.json");
const tableauGoalTypes = fs.existsSync(tableauGoalTypesFile)
  ? readJson<TableauFile<TableauGoalTypeRow>>(tableauGoalTypesFile)
  : null;
const playerBase = readJson<Players>(path.join(CANONICAL, "players.json")).players;
const playerById = new Map(playerBase.map((p) => [p.id, p]));
for (const r of playerRecords) {
  if (!playerById.has(r.playerId)) {
    playerById.set(r.playerId, { id: r.playerId, name: r.name });
  }
}
const players = [...playerById.values()].sort((a, b) => a.id.localeCompare(b.id));
const sourcesFile = path.join(CANONICAL, "sources.json");
const sources = fs.existsSync(sourcesFile) ? readJson<Sources>(sourcesFile).sources : [];
const opponentsFile = path.join(CANONICAL, "opponents.json");
const curatedOpponents = fs.existsSync(opponentsFile)
  ? readJson<Opponents>(opponentsFile).opponents ?? []
  : [];

function managerFor(date: string): string | null {
  for (const m of managers) {
    for (const t of m.tenures) {
      if (date >= t.from && (t.to === null || date <= t.to)) return m.id;
    }
  }
  return null;
}

function homeStadiumFor(date: string): string | null {
  for (const s of stadiums) {
    for (const h of s.home) {
      if (date >= h.from && (h.to === null || date <= h.to)) return s.id;
    }
  }
  return null;
}

// ---------- load all matches ----------
const seasons = listSeasonFiles().map((f) =>
  readJson<SeasonFile>(path.join(MATCHES_DIR, f)),
);
const allMatches: { season: string; m: Match }[] = [];
for (const sf of seasons) for (const m of sf.matches) allMatches.push({ season: sf.season, m });
allMatches.sort((a, b) => a.m.date.localeCompare(b.m.date) || a.m.id.localeCompare(b.m.id));

// ---------- create db ----------
function sqlIdent(name: string): string {
  return `"${name.replaceAll("\"", "\"\"")}"`;
}

function createFreshDb(): Database.Database {
  try {
    fs.rmSync(DB_PATH, { force: true });
    return new Database(DB_PATH);
  } catch (error) {
    if (!(error instanceof Error) || !("code" in error) || error.code !== "EPERM") throw error;
    const existing = new Database(DB_PATH);
    existing.pragma("foreign_keys = OFF");
    const objects = existing
      .prepare(
        "SELECT type, name FROM sqlite_master WHERE type IN ('table','view') AND name NOT LIKE 'sqlite_%'",
      )
      .all() as { type: "table" | "view"; name: string }[];
    existing.exec("BEGIN");
    for (const object of objects.filter((o) => o.type === "view")) {
      existing.exec(`DROP VIEW IF EXISTS ${sqlIdent(object.name)}`);
    }
    for (const object of objects.filter((o) => o.type === "table")) {
      existing.exec(`DROP TABLE IF EXISTS ${sqlIdent(object.name)}`);
    }
    existing.exec("COMMIT");
    existing.exec("VACUUM");
    return existing;
  }
}

const db = createFreshDb();
db.pragma("journal_mode = OFF");
db.pragma("synchronous = OFF");

db.exec(`
CREATE TABLE competitions (id TEXT PRIMARY KEY, name TEXT NOT NULL, type TEXT NOT NULL, tier INTEGER);
CREATE TABLE stadiums (id TEXT PRIMARY KEY, name TEXT NOT NULL, city TEXT, country TEXT, lat REAL, lng REAL, note TEXT);
CREATE TABLE managers (id TEXT PRIMARY KEY, name TEXT NOT NULL, nationality TEXT, role TEXT);
CREATE TABLE manager_tenures (manager_id TEXT NOT NULL REFERENCES managers(id), date_from TEXT NOT NULL, date_to TEXT, note TEXT);
CREATE TABLE players (id TEXT PRIMARY KEY, name TEXT NOT NULL, positions TEXT, nationality TEXT, born TEXT);
CREATE TABLE opponents (id TEXT PRIMARY KEY, name TEXT NOT NULL, country TEXT, lat REAL, lng REAL);
CREATE TABLE sources (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  kind TEXT NOT NULL,
  url TEXT,
  coverage TEXT,
  notes TEXT
);

CREATE TABLE matches (
  id TEXT PRIMARY KEY,
  season TEXT NOT NULL,
  date TEXT NOT NULL,
  competition_id TEXT NOT NULL REFERENCES competitions(id),
  round TEXT,
  opponent_id TEXT NOT NULL REFERENCES opponents(id),
  opponent_name TEXT NOT NULL,
  venue TEXT NOT NULL CHECK (venue IN ('H','A','N')),
  stadium_id TEXT REFERENCES stadiums(id),
  attendance INTEGER,
  gf INTEGER NOT NULL, ga INTEGER NOT NULL,
  ht_gf INTEGER, ht_ga INTEGER,
  aet INTEGER NOT NULL DEFAULT 0,
  pen_gf INTEGER, pen_ga INTEGER,
  result TEXT NOT NULL CHECK (result IN ('W','D','L')),
  outcome TEXT NOT NULL CHECK (outcome IN ('W','D','L')),
  manager_id TEXT REFERENCES managers(id),
  events_complete INTEGER NOT NULL DEFAULT 0,
  has_lineup INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  sources TEXT
);
CREATE INDEX idx_matches_date ON matches(date);
CREATE INDEX idx_matches_season ON matches(season);
CREATE INDEX idx_matches_opponent ON matches(opponent_id);
CREATE INDEX idx_matches_competition ON matches(competition_id);

CREATE TABLE match_sources (
  match_id TEXT NOT NULL REFERENCES matches(id),
  source_id TEXT NOT NULL,
  facet TEXT NOT NULL CHECK (facet IN (
    'result','united-scorers','opposition-goals','assists','starting-lineup',
    'used-substitutes','bench','cards','attendance','notes'
  )),
  confidence TEXT NOT NULL CHECK (confidence IN ('complete','partial','supporting')),
  note TEXT,
  PRIMARY KEY (match_id, source_id, facet)
);
CREATE INDEX idx_match_sources_source ON match_sources(source_id);
CREATE INDEX idx_match_sources_facet ON match_sources(facet);

CREATE TABLE match_events (
  match_id TEXT NOT NULL REFERENCES matches(id),
  seq INTEGER NOT NULL,
  type TEXT NOT NULL,
  player_id TEXT REFERENCES players(id),
  player_name TEXT,
  player_side TEXT NOT NULL DEFAULT 'united' CHECK (player_side IN ('united','opponent')),
  player_provider_id TEXT,
  minute INTEGER,
  assist_player_id TEXT REFERENCES players(id),
  assist_name TEXT,
  assist_side TEXT CHECK (assist_side IN ('united','opponent')),
  assist_provider_id TEXT,
  provider_event_id TEXT,
  source_confidence TEXT CHECK (source_confidence IN ('complete','partial','supporting')),
  detail TEXT,
  PRIMARY KEY (match_id, seq)
);
CREATE INDEX idx_events_player ON match_events(player_id);
CREATE INDEX idx_events_assist_player ON match_events(assist_player_id);

CREATE TABLE match_lineups (
  match_id TEXT NOT NULL REFERENCES matches(id),
  seq INTEGER NOT NULL,
  player_id TEXT REFERENCES players(id),
  player_name TEXT,
  player_side TEXT NOT NULL DEFAULT 'united' CHECK (player_side IN ('united','opponent')),
  provider_id TEXT,
  shirt INTEGER, role TEXT,
  started INTEGER NOT NULL,
  bench INTEGER NOT NULL DEFAULT 0,
  sub_on INTEGER, sub_off INTEGER,
  PRIMARY KEY (match_id, seq)
);
CREATE INDEX idx_lineups_player ON match_lineups(player_id);
CREATE INDEX idx_lineups_match_side ON match_lineups(match_id, player_side);

CREATE TABLE elo_history (
  match_id TEXT PRIMARY KEY REFERENCES matches(id),
  date TEXT NOT NULL,
  elo_pre REAL NOT NULL, elo_post REAL NOT NULL,
  opp_elo_pre REAL NOT NULL,
  expected REAL NOT NULL
);

CREATE TABLE player_totals (
  player_id TEXT NOT NULL REFERENCES players(id),
  scope TEXT NOT NULL,            -- 'all' or competition type
  apps INTEGER NOT NULL, starts INTEGER NOT NULL,
  goals INTEGER NOT NULL, assists INTEGER NOT NULL,
  first_date TEXT, last_date TEXT,
  PRIMARY KEY (player_id, scope)
);

CREATE TABLE player_records (
  player_id TEXT PRIMARY KEY REFERENCES players(id),
  name TEXT NOT NULL,
  wiki_title TEXT,
  career TEXT NOT NULL,
  first_year INTEGER,
  last_year INTEGER,
  starts INTEGER NOT NULL,
  subs INTEGER NOT NULL,
  apps INTEGER NOT NULL,
  goals INTEGER NOT NULL,
  source_id TEXT NOT NULL REFERENCES sources(id),
  source_url TEXT NOT NULL,
  source_page TEXT,
  source_bucket TEXT,
  stats_as_of TEXT
);
CREATE INDEX idx_player_records_apps ON player_records(apps);
CREATE INDEX idx_player_records_goals ON player_records(goals);

CREATE TABLE player_media (
  player_id TEXT PRIMARY KEY REFERENCES players(id),
  wikidata_id TEXT,
  commons_file TEXT NOT NULL,
  image_url TEXT NOT NULL,
  thumb_url TEXT,
  page_url TEXT,
  license TEXT,
  artist TEXT,
  credit TEXT,
  source_id TEXT NOT NULL REFERENCES sources(id),
  retrieved_at TEXT
);
CREATE INDEX idx_player_media_source ON player_media(source_id);

CREATE TABLE manager_media (
  manager_id TEXT PRIMARY KEY REFERENCES managers(id),
  wikidata_id TEXT,
  commons_file TEXT NOT NULL,
  image_url TEXT NOT NULL,
  thumb_url TEXT,
  page_url TEXT,
  license TEXT,
  artist TEXT,
  credit TEXT,
  source_id TEXT NOT NULL REFERENCES sources(id),
  retrieved_at TEXT
);

CREATE TABLE og_scorer_media (
  name TEXT PRIMARY KEY,
  wikidata_id TEXT,
  commons_file TEXT NOT NULL,
  image_url TEXT NOT NULL,
  thumb_url TEXT,
  page_url TEXT,
  license TEXT,
  artist TEXT,
  credit TEXT,
  source_id TEXT NOT NULL REFERENCES sources(id),
  retrieved_at TEXT
);

CREATE TABLE player_shirts (
  player_id TEXT NOT NULL REFERENCES players(id),
  shirt INTEGER NOT NULL,
  decade TEXT NOT NULL,
  apps INTEGER NOT NULL,
  first_date TEXT NOT NULL,
  last_date TEXT NOT NULL,
  source_id TEXT NOT NULL REFERENCES sources(id),
  PRIMARY KEY (player_id, shirt, decade, source_id)
);
CREATE INDEX idx_player_shirts_player ON player_shirts(player_id);
CREATE INDEX idx_player_shirts_source ON player_shirts(source_id);

-- curated season-level scorer/assist + goal-type aggregates (Tableau lane).
-- Not match-attributed (no dates/minutes); kept separate from match_events.
CREATE TABLE tableau_goals_assists (
  player_id TEXT REFERENCES players(id),
  player_label TEXT NOT NULL,
  attribution TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('goal','assist')),
  season TEXT NOT NULL,
  competition_id TEXT REFERENCES competitions(id),
  opponent_id TEXT,
  opponent_name TEXT NOT NULL,
  count INTEGER NOT NULL,
  source_id TEXT NOT NULL REFERENCES sources(id)
);
CREATE INDEX idx_tga_player ON tableau_goals_assists(player_id);

CREATE TABLE tableau_goal_types (
  player_id TEXT REFERENCES players(id),
  player_label TEXT NOT NULL,
  attribution TEXT NOT NULL,
  goal_type TEXT NOT NULL,
  season TEXT NOT NULL,
  competition_id TEXT REFERENCES competitions(id),
  opponent_id TEXT,
  opponent_name TEXT NOT NULL,
  count INTEGER NOT NULL,
  source_id TEXT NOT NULL REFERENCES sources(id)
);
CREATE INDEX idx_tgt_player ON tableau_goal_types(player_id);

CREATE TABLE season_summaries (
  season TEXT NOT NULL,
  competition_id TEXT NOT NULL,
  p INTEGER NOT NULL, w INTEGER NOT NULL, d INTEGER NOT NULL, l INTEGER NOT NULL,
  gf INTEGER NOT NULL, ga INTEGER NOT NULL,
  furthest_round TEXT,
  position INTEGER,
  league_size INTEGER,
  PRIMARY KEY (season, competition_id)
);

CREATE TABLE meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);
`);

// ---------- reference inserts ----------
const insComp = db.prepare("INSERT INTO competitions VALUES (?,?,?,?)");
for (const c of competitions) insComp.run(c.id, c.name, c.type, c.tier);

const insStad = db.prepare("INSERT INTO stadiums VALUES (?,?,?,?,?,?,?)");
for (const s of stadiums) insStad.run(s.id, s.name, s.city, s.country, s.lat, s.lng, s.note ?? null);

const insMan = db.prepare("INSERT INTO managers VALUES (?,?,?,?)");
const insTen = db.prepare("INSERT INTO manager_tenures VALUES (?,?,?,?)");
for (const m of managers) {
  insMan.run(m.id, m.name, m.nationality, m.role);
  for (const t of m.tenures) insTen.run(m.id, t.from, t.to, t.note);
}

const insPlayer = db.prepare("INSERT INTO players VALUES (?,?,?,?,?)");
for (const p of players) {
  insPlayer.run(p.id, p.name, p.positions ? JSON.stringify(p.positions) : null, p.nationality ?? null, p.born ?? null);
}

const knownSourceIds = new Set(sources.map((s) => s.id));
const insSource = db.prepare("INSERT INTO sources VALUES (?,?,?,?,?,?)");
for (const s of sources) insSource.run(s.id, s.label, s.kind, s.url ?? null, s.coverage ?? null, s.notes ?? null);
const sourceIdsFromCanonical = new Set([
  ...allMatches.flatMap(({ m }) => m.sources),
  ...playerRecords.map((r) => r.sourceId),
  ...playerMedia.map((r) => r.sourceId),
  ...managerMedia.map((r) => r.sourceId),
  ...ogScorerMedia.map((r) => r.sourceId),
  ...playerShirts.map((r) => r.sourceId),
  ...(tableauGoalsAssists ? [tableauGoalsAssists.sourceId] : []),
  ...(tableauGoalTypes ? [tableauGoalTypes.sourceId] : []),
]);
for (const id of sourceIdsFromCanonical) {
  if (!knownSourceIds.has(id)) {
    insSource.run(id, id, "unknown", null, "Referenced by canonical JSON.", "Add this source to data/canonical/sources.json with provenance details.");
    knownSourceIds.add(id);
  }
}

const insPlayerRecord = db.prepare("INSERT INTO player_records VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)");
for (const r of playerRecords) {
  insPlayerRecord.run(
    r.playerId,
    r.name,
    r.wikiTitle ?? null,
    r.career,
    r.firstYear ?? null,
    r.lastYear ?? null,
    r.starts,
    r.subs,
    r.apps,
    r.goals,
    r.sourceId,
    r.sourceUrl,
    r.sourcePage ?? null,
    r.sourceBucket ?? null,
    r.statsAsOf ?? null,
  );
}

const insPlayerMedia = db.prepare("INSERT OR REPLACE INTO player_media VALUES (?,?,?,?,?,?,?,?,?,?,?)");
for (const m of playerMedia) {
  insPlayerMedia.run(
    m.playerId,
    m.wikidataId ?? null,
    m.commonsFile,
    m.imageUrl,
    m.thumbUrl ?? null,
    m.pageUrl ?? null,
    m.license ?? null,
    m.artist ?? null,
    m.credit ?? null,
    m.sourceId,
    m.retrievedAt ?? null,
  );
}

const managerIds = new Set(managers.map((m) => m.id));
const insManagerMedia = db.prepare("INSERT OR REPLACE INTO manager_media VALUES (?,?,?,?,?,?,?,?,?,?,?)");
for (const m of managerMedia) {
  if (!managerIds.has(m.managerId)) continue;
  insManagerMedia.run(
    m.managerId, m.wikidataId ?? null, m.commonsFile, m.imageUrl, m.thumbUrl ?? null,
    m.pageUrl ?? null, m.license ?? null, m.artist ?? null, m.credit ?? null, m.sourceId, m.retrievedAt ?? null,
  );
}

const insOgMedia = db.prepare("INSERT OR REPLACE INTO og_scorer_media VALUES (?,?,?,?,?,?,?,?,?,?,?)");
for (const m of ogScorerMedia) {
  insOgMedia.run(
    m.name, m.wikidataId ?? null, m.commonsFile, m.imageUrl, m.thumbUrl ?? null,
    m.pageUrl ?? null, m.license ?? null, m.artist ?? null, m.credit ?? null, m.sourceId, m.retrievedAt ?? null,
  );
}

const insPlayerShirt = db.prepare("INSERT OR REPLACE INTO player_shirts VALUES (?,?,?,?,?,?,?)");
for (const s of playerShirts) {
  insPlayerShirt.run(
    s.playerId,
    s.shirt,
    s.decade,
    s.apps,
    s.firstDate,
    s.lastDate,
    s.sourceId,
  );
}

if (tableauGoalsAssists) {
  const ins = db.prepare("INSERT INTO tableau_goals_assists VALUES (?,?,?,?,?,?,?,?,?,?)");
  const tx = db.transaction(() => {
    for (const r of tableauGoalsAssists.rows) {
      ins.run(r.playerId, r.playerLabel, r.attribution, r.kind, r.season,
        r.competition, r.opponentId, r.opponent, r.count, tableauGoalsAssists.sourceId);
    }
  });
  tx();
}
if (tableauGoalTypes) {
  const ins = db.prepare("INSERT INTO tableau_goal_types VALUES (?,?,?,?,?,?,?,?,?,?)");
  const tx = db.transaction(() => {
    for (const r of tableauGoalTypes.rows) {
      ins.run(r.playerId, r.playerLabel, r.attribution, r.goalType, r.season,
        r.competition, r.opponentId, r.opponent, r.count, tableauGoalTypes.sourceId);
    }
  });
  tx();
}

// opponents: curated entries first, then derive the rest from matches
const oppNames = new Map<string, string>(); // id -> latest display name
const oppMeta = new Map<string, { country: string | null; lat: number | null; lng: number | null }>();
for (const o of curatedOpponents) {
  oppNames.set(o.id, o.name);
  oppMeta.set(o.id, { country: o.country ?? null, lat: o.lat ?? null, lng: o.lng ?? null });
}
for (const { m } of allMatches) {
  if (!oppMeta.has(m.opponentId)) {
    oppNames.set(m.opponentId, m.opponent); // matches are date-sorted: ends at latest name
    if (!oppMeta.has(m.opponentId)) oppMeta.set(m.opponentId, { country: null, lat: null, lng: null });
  } else if (!curatedOpponents.some((o) => o.id === m.opponentId)) {
    oppNames.set(m.opponentId, m.opponent);
  }
}
const insOpp = db.prepare("INSERT INTO opponents VALUES (?,?,?,?,?)");
for (const [id, name] of oppNames) {
  const meta = oppMeta.get(id)!;
  insOpp.run(id, name, meta.country, meta.lat, meta.lng);
}

// ---------- matches ----------
const insMatch = db.prepare(`INSERT INTO matches VALUES
  (@id,@season,@date,@competition_id,@round,@opponent_id,@opponent_name,@venue,@stadium_id,
   @attendance,@gf,@ga,@ht_gf,@ht_ga,@aet,@pen_gf,@pen_ga,@result,@outcome,@manager_id,
   @events_complete,@has_lineup,@notes,@sources)`);
const insEvent = db.prepare("INSERT INTO match_events VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)");
const insLineup = db.prepare("INSERT INTO match_lineups VALUES (?,?,?,?,?,?,?,?,?,?,?,?)");
const insMatchSource = db.prepare("INSERT OR IGNORE INTO match_sources VALUES (?,?,?,?,?)");

function sourceFacets(m: Match): { facet: string; confidence: string; note: string | null }[] {
  const facets = [{ facet: "result", confidence: "complete", note: null as string | null }];
  const events = m.events ?? [];
  const unitedGoals = events.filter((e) => ["goal", "pen-goal", "own-goal-for"].includes(e.type));
  const oppositionGoals = events.filter((e) => ["opp-goal", "own-goal-against"].includes(e.type));
  const starters = (m.lineup ?? []).filter((l) => (l.playerSide ?? "united") === "united" && l.start).length;
  const usedSubs = (m.lineup ?? []).filter((l) => (l.playerSide ?? "united") === "united" && !l.start && !l.bench).length;
  const bench = (m.lineup ?? []).filter((l) => l.bench).length;
  if (m.events && m.events.length > 0) {
    if (unitedGoals.length > 0) {
      facets.push({
        facet: "united-scorers",
        confidence: m.eventsComplete ? "complete" : "partial",
        note: m.eventsComplete ? null : "United scoring events are present but do not fully account for United goals.",
      });
    }
    if (oppositionGoals.length > 0) {
      const complete = oppositionGoals.length === m.score.ft[1];
      facets.push({
        facet: "opposition-goals",
        confidence: complete ? "complete" : "partial",
        note: complete ? null : "Opposition goal events are present but do not fully account for goals against.",
      });
    }
    if (m.events.some((e) => e.assist || e.assistName)) {
      facets.push({ facet: "assists", confidence: "partial", note: "Only assists explicitly present in the source are recorded." });
    }
    if (m.events.some((e) => e.type === "card-yellow" || e.type === "card-red")) {
      facets.push({ facet: "cards", confidence: "partial", note: "Only cards explicitly present in the source are recorded." });
    }
  }
  if (m.lineup && m.lineup.length > 0) {
    if (starters >= 11) {
      facets.push({ facet: "starting-lineup", confidence: "complete", note: null });
    }
    if (usedSubs > 0) {
      facets.push({ facet: "used-substitutes", confidence: "complete", note: "Substitute appearances are recorded for players who entered the match." });
    }
    if (bench > 0) {
      facets.push({ facet: "bench", confidence: "supporting", note: "Bench players are listed separately and excluded from appearance totals unless they entered." });
    }
  }
  if (m.attendance != null) {
    facets.push({ facet: "attendance", confidence: "supporting", note: null });
  }
  if (m.notes) {
    facets.push({ facet: "notes", confidence: "supporting", note: "Match note carries context from the canonical record." });
  }
  return facets;
}

const insertAll = db.transaction(() => {
  for (const { season, m } of allMatches) {
    const [gf, ga] = m.score.ft;
    const result = gf > ga ? "W" : gf < ga ? "L" : "D";
    let outcome = result;
    if (m.score.pens) outcome = m.score.pens[0] > m.score.pens[1] ? "W" : "L";
    insMatch.run({
      id: m.id,
      season,
      date: m.date,
      competition_id: m.competition,
      round: m.round ?? null,
      opponent_id: m.opponentId,
      opponent_name: m.opponent,
      venue: m.venue,
      stadium_id: m.stadium ?? (m.venue === "H" ? homeStadiumFor(m.date) : null),
      attendance: m.attendance ?? null,
      gf, ga,
      ht_gf: m.score.ht?.[0] ?? null,
      ht_ga: m.score.ht?.[1] ?? null,
      aet: m.score.aet ? 1 : 0,
      pen_gf: m.score.pens?.[0] ?? null,
      pen_ga: m.score.pens?.[1] ?? null,
      result, outcome,
      manager_id: managerFor(m.date),
      events_complete: m.eventsComplete ? 1 : 0,
      has_lineup: (m.lineup ?? []).filter((l) => (l.playerSide ?? "united") === "united" && l.start).length >= 11 ? 1 : 0,
      notes: m.notes ?? null,
      sources: JSON.stringify(m.sources),
    });
    if (m.events) {
      m.events.forEach((e, i) =>
        insEvent.run(
          m.id,
          i,
          e.type,
          e.player ?? null,
          e.playerName ?? e.detail ?? null,
          e.playerSide ?? (e.type === "opp-goal" ? "opponent" : "united"),
          e.playerProviderId != null ? String(e.playerProviderId) : null,
          e.minute ?? null,
          e.assist ?? null,
          e.assistName ?? null,
          e.assistSide ?? (e.assist ? "united" : null),
          e.assistProviderId != null ? String(e.assistProviderId) : null,
          e.providerEventId != null ? String(e.providerEventId) : null,
          e.sourceConfidence ?? null,
          e.detail ?? null,
        ),
      );
    }
    if (m.lineup) {
      for (const [i, l] of m.lineup.entries()) {
        insLineup.run(
          m.id,
          i,
          l.player ?? null,
          l.playerName ?? null,
          l.playerSide ?? "united",
          l.providerId != null ? String(l.providerId) : null,
          l.shirt ?? null,
          l.role ?? null,
          l.start ? 1 : 0,
          l.bench ? 1 : 0,
          l.on ?? null,
          l.off ?? null,
        );
      }
    }
    for (const sourceId of m.sources) {
      for (const f of sourceFacets(m)) {
        insMatchSource.run(m.id, sourceId, f.facet, f.confidence, f.note);
      }
    }
  }
});
insertAll();

// ---------- Elo (closed universe) ----------
// United and each opponent start at 1500; opponents are rated only on their
// matches against United. K varies by competition type; goal margin scales K.
const eloOpp = new Map<string, number>();
const K_BY_TYPE: Record<string, number> = {
  league: 24, "domestic-cup": 28, "league-cup": 24, european: 32,
  "super-cup": 20, world: 24, playoff: 24, unofficial: 0,
};
const compType = new Map(competitions.map((c) => [c.id, c.type]));
let eloU = 1500;
const insElo = db.prepare("INSERT INTO elo_history VALUES (?,?,?,?,?,?)");
const eloTx = db.transaction(() => {
  for (const { m } of allMatches) {
    const k0 = K_BY_TYPE[compType.get(m.competition) ?? "league"] ?? 24;
    if (k0 === 0) continue;
    const oppElo = eloOpp.get(m.opponentId) ?? 1500;
    const home = m.venue === "H" ? 60 : m.venue === "A" ? -60 : 0;
    const expected = 1 / (1 + 10 ** (-(eloU + home - oppElo) / 400));
    const [gf, ga] = m.score.ft;
    const score = gf > ga ? 1 : gf < ga ? 0 : 0.5;
    const margin = Math.abs(gf - ga);
    const k = k0 * (margin <= 1 ? 1 : margin === 2 ? 1.25 : 1.25 + (margin - 2) * 0.25);
    const delta = k * (score - expected);
    const pre = eloU;
    eloU += delta;
    eloOpp.set(m.opponentId, oppElo - delta);
    insElo.run(m.id, m.date, pre, eloU, oppElo, expected);
  }
});
eloTx();

// ---------- aggregates ----------
db.exec(`
INSERT INTO season_summaries
SELECT season, competition_id,
  COUNT(*), SUM(result='W'), SUM(result='D'), SUM(result='L'),
  SUM(gf), SUM(ga), NULL, NULL, NULL
FROM matches GROUP BY season, competition_id;
`);

// final league positions (precomputed from full-league results)
const positionsFile = path.join(CANONICAL, "league-positions.json");
if (fs.existsSync(positionsFile)) {
  const { positions } = readJson<{
    positions: { season: string; competition: string; position: number; teams: number }[];
  }>(positionsFile);
  const updPos = db.prepare(
    "UPDATE season_summaries SET position=?, league_size=? WHERE season=? AND competition_id=?",
  );
  for (const p of positions) updPos.run(p.position, p.teams, p.season, p.competition);
}

// Furthest cup round reached per season. The sources spell the same round a dozen
// ways — two-legged ties carry the leg ("Quarter-final First leg"), the group stage
// is lettered ("Group A"), replays repeat a round ("Round 3 Replay"), and the same
// stage shows up as "Round 5" / "Fifth Round", "Semi-final" / "Semi Final", or the
// European-era "First knockout round". {@link roundRank} canonicalises all of them
// onto one ladder, so the genuinely deepest round of a campaign wins the comparison
// (it used to tie at a default and leave, say, the group stage as a quarter-final
// run's "furthest round"). Decimals slot the European-only rounds between integers.
const WORD_NUM: Record<string, number> = { first: 1, second: 2, third: 3, fourth: 4, fifth: 5, sixth: 6 };
function roundRank(raw: string): { name: string; ord: number } {
  const r = raw
    .replace(/\s+(?:first|second) leg$/i, "")
    .replace(/\s+(?:(?:second|2nd) )?replay$/i, "")
    .trim();
  const lc = r.toLowerCase();

  if (lc === "final") return { name: "Final", ord: 40 };
  if (lc.includes("third place")) return { name: "Third place", ord: 35 };
  if (/semi[-\s]?final/.test(lc)) return { name: "Semi-final", ord: 30 };
  if (/quarter[-\s]?final/.test(lc)) return { name: "Quarter-final", ord: 20 };
  if (/round of 16|first knockout round/.test(lc)) return { name: "Round of 16", ord: 16 };
  if (/round of 32/.test(lc)) return { name: "Round of 32", ord: 15.5 };
  if (/play-?off/.test(lc)) return { name: "Play-off round", ord: 15.2 };
  if (/group|league phase/.test(lc)) return { name: "Group stage", ord: 15 };

  const num = lc.match(/round (\d+)/) ?? lc.match(/(\d+)(?:st|nd|rd|th) round/);
  const word = lc.match(/(first|second|third|fourth|fifth|sixth) round/);
  const n = num ? Number(num[1]) : word ? WORD_NUM[word[1]] : null;
  if (n != null) return { name: `Round ${n}`, ord: 9 + n };

  if (/qualifying|preliminary/.test(lc)) {
    const q = lc.match(/(first|second|third|fourth)/);
    return { name: r, ord: 1 + (q ? WORD_NUM[q[1]] : 0) / 10 };
  }
  return { name: r, ord: 5 };
}
// Only knockout/cup competitions have a meaningful "furthest round"; a league's
// rounds are matchdays, and ranking those leaves a noise value the UI never reads.
const cupRows = db.prepare(`
  SELECT m.season, m.competition_id, m.round FROM matches m
  JOIN competitions c ON c.id = m.competition_id
  WHERE m.round IS NOT NULL AND c.type != 'league'
`).all() as { season: string; competition_id: string; round: string }[];
const furthest = new Map<string, { round: string; ord: number }>();
for (const r of cupRows) {
  const { name: round, ord } = roundRank(r.round);
  const key = `${r.season}|${r.competition_id}`;
  const cur = furthest.get(key);
  if (!cur || ord > cur.ord) furthest.set(key, { round, ord });
}
const updFurthest = db.prepare(
  "UPDATE season_summaries SET furthest_round=? WHERE season=? AND competition_id=?",
);
for (const [key, v] of furthest) {
  const [season, comp] = key.split("|");
  updFurthest.run(v.round, season, comp);
}

// player totals from events + lineups
db.exec(`
INSERT INTO player_totals
SELECT p.id, 'all',
  COALESCE((SELECT COUNT(*) FROM match_lineups l WHERE l.player_id = p.id AND l.player_side = 'united' AND l.bench = 0), 0),
  COALESCE((SELECT COUNT(*) FROM match_lineups l WHERE l.player_id = p.id AND l.player_side = 'united' AND l.started = 1 AND l.bench = 0), 0),
  COALESCE((SELECT COUNT(*) FROM match_events e WHERE e.player_id = p.id AND ((e.player_side = 'united' AND e.type IN ('goal','pen-goal')) OR e.type = 'own-goal-for')), 0),
  COALESCE((SELECT COUNT(*) FROM match_events e WHERE e.assist_player_id = p.id AND e.assist_side = 'united' AND e.type IN ('goal','pen-goal')), 0),
  (SELECT MIN(m.date) FROM match_lineups l JOIN matches m ON m.id=l.match_id WHERE l.player_id = p.id AND l.player_side = 'united' AND l.bench = 0),
  (SELECT MAX(m.date) FROM match_lineups l JOIN matches m ON m.id=l.match_id WHERE l.player_id = p.id AND l.player_side = 'united' AND l.bench = 0)
FROM players p;

INSERT INTO player_totals
SELECT p.id, c.type,
  COUNT(l.match_id),
  SUM(l.started = 1),
  COALESCE((
    SELECT COUNT(*) FROM match_events e
    JOIN matches gm ON gm.id = e.match_id
    JOIN competitions gc ON gc.id = gm.competition_id
    WHERE e.player_id = p.id AND ((e.player_side = 'united' AND e.type IN ('goal','pen-goal')) OR e.type = 'own-goal-for') AND gc.type = c.type
  ), 0),
  COALESCE((
    SELECT COUNT(*) FROM match_events e
    JOIN matches am ON am.id = e.match_id
    JOIN competitions ac ON ac.id = am.competition_id
    WHERE e.assist_player_id = p.id AND e.assist_side = 'united' AND e.type IN ('goal','pen-goal') AND ac.type = c.type
  ), 0),
  MIN(m.date),
  MAX(m.date)
FROM players p
JOIN match_lineups l ON l.player_id = p.id
JOIN matches m ON m.id = l.match_id
JOIN competitions c ON c.id = m.competition_id
WHERE l.player_side = 'united' AND l.bench = 0
GROUP BY p.id, c.type;
`);

// ---------- meta ----------
const counts = db.prepare(
  `SELECT COUNT(*) n, MIN(date) min_d, MAX(date) max_d FROM matches`,
).get() as { n: number; min_d: string; max_d: string };
const eventsN = (db.prepare("SELECT COUNT(*) n FROM match_events").get() as { n: number }).n;
const scorerMatchesN = (
  db.prepare("SELECT COUNT(DISTINCT match_id) n FROM match_events WHERE type IN ('goal','pen-goal','own-goal-for')").get() as { n: number }
).n;
const eventsCompleteN = (db.prepare("SELECT COUNT(*) n FROM matches WHERE events_complete = 1").get() as { n: number }).n;
const lineupsN = (
  db.prepare("SELECT COUNT(DISTINCT match_id) n FROM match_lineups WHERE player_side = 'united' AND started = 1").get() as { n: number }
).n;
const lineupEntriesN = (
  db.prepare("SELECT COUNT(*) n FROM match_lineups WHERE player_side = 'united' AND bench = 0").get() as { n: number }
).n;
const assistsN = (
  db.prepare("SELECT COUNT(*) n FROM match_events WHERE assist_player_id IS NOT NULL OR assist_name IS NOT NULL").get() as { n: number }
).n;
const oppositionGoalsN = (
  db.prepare("SELECT COUNT(*) n FROM match_events WHERE type IN ('opp-goal','own-goal-against')").get() as { n: number }
).n;
const benchN = (
  db.prepare("SELECT COUNT(*) n FROM match_lineups WHERE bench = 1").get() as { n: number }
).n;
const playerShirtsN = (db.prepare("SELECT COUNT(*) n FROM player_shirts").get() as { n: number }).n;
const insMeta = db.prepare("INSERT INTO meta VALUES (?,?)");
insMeta.run("built_at", new Date().toISOString());
insMeta.run("matches", String(counts.n));
insMeta.run("first_match", counts.min_d);
insMeta.run("last_match", counts.max_d);
insMeta.run("events", String(eventsN));
insMeta.run("matches_with_scorers", String(scorerMatchesN));
insMeta.run("matches_events_complete", String(eventsCompleteN));
insMeta.run("matches_with_lineups", String(lineupsN));
insMeta.run("lineup_entries", String(lineupEntriesN));
insMeta.run("assists", String(assistsN));
insMeta.run("opposition_goals", String(oppositionGoalsN));
insMeta.run("bench_entries", String(benchN));
insMeta.run("player_shirt_rows", String(playerShirtsN));
insMeta.run("sources", String(knownSourceIds.size));

db.close();
console.log(
  `built ${DB_PATH}: ${counts.n} matches (${counts.min_d} → ${counts.max_d}), ${eventsN} events, ${lineupsN} matches with lineups`,
);
