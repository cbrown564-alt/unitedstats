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
interface Opponents {
  opponents?: { id: string; name: string; country?: string | null; lat?: number | null; lng?: number | null }[];
}

const managers = readJson<Managers>(path.join(CANONICAL, "managers.json")).managers;
const stadiums = readJson<Stadiums>(path.join(CANONICAL, "stadiums.json")).stadiums;
const competitions = readJson<Competitions>(path.join(CANONICAL, "competitions.json")).competitions;
const players = readJson<Players>(path.join(CANONICAL, "players.json")).players;
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
fs.rmSync(DB_PATH, { force: true });
const db = new Database(DB_PATH);
db.pragma("journal_mode = OFF");
db.pragma("synchronous = OFF");

db.exec(`
CREATE TABLE competitions (id TEXT PRIMARY KEY, name TEXT NOT NULL, type TEXT NOT NULL, tier INTEGER);
CREATE TABLE stadiums (id TEXT PRIMARY KEY, name TEXT NOT NULL, city TEXT, country TEXT, lat REAL, lng REAL, note TEXT);
CREATE TABLE managers (id TEXT PRIMARY KEY, name TEXT NOT NULL, nationality TEXT, role TEXT);
CREATE TABLE manager_tenures (manager_id TEXT NOT NULL REFERENCES managers(id), date_from TEXT NOT NULL, date_to TEXT, note TEXT);
CREATE TABLE players (id TEXT PRIMARY KEY, name TEXT NOT NULL, positions TEXT, nationality TEXT, born TEXT);
CREATE TABLE opponents (id TEXT PRIMARY KEY, name TEXT NOT NULL, country TEXT, lat REAL, lng REAL);

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

CREATE TABLE match_events (
  match_id TEXT NOT NULL REFERENCES matches(id),
  seq INTEGER NOT NULL,
  type TEXT NOT NULL,
  player_id TEXT REFERENCES players(id),
  minute INTEGER,
  assist_player_id TEXT REFERENCES players(id),
  detail TEXT,
  PRIMARY KEY (match_id, seq)
);
CREATE INDEX idx_events_player ON match_events(player_id);

CREATE TABLE match_lineups (
  match_id TEXT NOT NULL REFERENCES matches(id),
  player_id TEXT NOT NULL REFERENCES players(id),
  shirt INTEGER, role TEXT,
  started INTEGER NOT NULL,
  sub_on INTEGER, sub_off INTEGER,
  PRIMARY KEY (match_id, player_id)
);
CREATE INDEX idx_lineups_player ON match_lineups(player_id);

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
const insEvent = db.prepare("INSERT INTO match_events VALUES (?,?,?,?,?,?,?)");
const insLineup = db.prepare("INSERT INTO match_lineups VALUES (?,?,?,?,?,?,?)");

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
      has_lineup: m.lineup && m.lineup.length > 0 ? 1 : 0,
      notes: m.notes ?? null,
      sources: JSON.stringify(m.sources),
    });
    if (m.events) {
      m.events.forEach((e, i) =>
        insEvent.run(m.id, i, e.type, e.player ?? null, e.minute ?? null, e.assist ?? null, e.detail ?? null),
      );
    }
    if (m.lineup) {
      for (const l of m.lineup) {
        insLineup.run(m.id, l.player, l.shirt ?? null, l.role ?? null, l.start ? 1 : 0, l.on ?? null, l.off ?? null);
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

// furthest cup round reached per season (ordinal mapping)
const roundOrder: Record<string, number> = {
  "Preliminary": 0, "Qualifying": 1, "Round 1": 10, "Round 2": 11, "Round 3": 12,
  "Round 4": 13, "Round 5": 14, "Group": 15, "League Phase": 15, "Round of 16": 16,
  "Quarter-final": 20, "Semi-final": 30, "Third place": 35, "Final": 40,
};
const cupRows = db.prepare(`
  SELECT season, competition_id, round FROM matches
  WHERE round IS NOT NULL
`).all() as { season: string; competition_id: string; round: string }[];
const furthest = new Map<string, { round: string; ord: number }>();
for (const r of cupRows) {
  const ord = roundOrder[r.round] ?? 5;
  const key = `${r.season}|${r.competition_id}`;
  const cur = furthest.get(key);
  if (!cur || ord > cur.ord) furthest.set(key, { round: r.round, ord });
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
  COALESCE((SELECT COUNT(*) FROM match_lineups l WHERE l.player_id = p.id), 0),
  COALESCE((SELECT COUNT(*) FROM match_lineups l WHERE l.player_id = p.id AND l.started = 1), 0),
  COALESCE((SELECT COUNT(*) FROM match_events e WHERE e.player_id = p.id AND e.type IN ('goal','pen-goal')), 0),
  COALESCE((SELECT COUNT(*) FROM match_events e WHERE e.assist_player_id = p.id AND e.type IN ('goal','pen-goal')), 0),
  (SELECT MIN(m.date) FROM match_lineups l JOIN matches m ON m.id=l.match_id WHERE l.player_id = p.id),
  (SELECT MAX(m.date) FROM match_lineups l JOIN matches m ON m.id=l.match_id WHERE l.player_id = p.id)
FROM players p;
`);

// ---------- meta ----------
const counts = db.prepare(
  `SELECT COUNT(*) n, MIN(date) min_d, MAX(date) max_d FROM matches`,
).get() as { n: number; min_d: string; max_d: string };
const eventsN = (db.prepare("SELECT COUNT(*) n FROM match_events").get() as { n: number }).n;
const lineupsN = (db.prepare("SELECT COUNT(DISTINCT match_id) n FROM match_lineups").get() as { n: number }).n;
const insMeta = db.prepare("INSERT INTO meta VALUES (?,?)");
insMeta.run("built_at", new Date().toISOString());
insMeta.run("matches", String(counts.n));
insMeta.run("first_match", counts.min_d);
insMeta.run("last_match", counts.max_d);
insMeta.run("events", String(eventsN));
insMeta.run("matches_with_lineups", String(lineupsN));

db.close();
console.log(
  `built ${DB_PATH}: ${counts.n} matches (${counts.min_d} → ${counts.max_d}), ${eventsN} events, ${lineupsN} matches with lineups`,
);
