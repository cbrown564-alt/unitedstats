import { getDb } from "./db";

/**
 * Auto-written season and era briefs, generated deterministically from the
 * match record. The voice is a curious guide, not a pundit: every sentence
 * states a checkable fact from the data, scorer claims carry their coverage,
 * and nothing is written that the fixture record cannot back.
 */

interface LeagueLine {
  season: string;
  competition_name: string;
  position: number | null;
  league_size: number | null;
}

function leagueLine(season: string): LeagueLine | undefined {
  return getDb()
    .prepare(
      `SELECT ss.season, c.name competition_name, ss.position, ss.league_size
       FROM season_summaries ss JOIN competitions c ON c.id = ss.competition_id
       WHERE ss.season = ? AND c.type = 'league'`,
    )
    .get(season) as LeagueLine | undefined;
}

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0]);
}

function titleCountThrough(season: string): number {
  return (
    getDb()
      .prepare(
        `SELECT COUNT(*) n FROM season_summaries ss
         JOIN competitions c ON c.id = ss.competition_id
         WHERE c.type = 'league' AND ss.position = 1 AND ss.season <= ?`,
      )
      .get(season) as { n: number }
  ).n;
}

/** Cup campaigns whose last match was a final, with the outcome of that final. */
function cupFinals(season: string): { competition_name: string; round: string; won: boolean; opponent: string }[] {
  const rows = getDb()
    .prepare(
      `SELECT c.name competition_name, m.round, m.outcome = 'W' won, m.opponent_name opponent
       FROM matches m JOIN competitions c ON c.id = m.competition_id
       WHERE m.season = ? AND c.type NOT IN ('league','unofficial')
         AND m.round LIKE '%final%' AND m.round NOT LIKE '%semi%' AND m.round NOT LIKE '%quarter%'
         AND m.date = (
           SELECT MAX(m2.date) FROM matches m2
           WHERE m2.season = m.season AND m2.competition_id = m.competition_id
         )`,
    )
    .all(season) as { competition_name: string; round: string; won: 0 | 1; opponent: string }[];
  return rows.map((r) => ({ ...r, won: Boolean(r.won) }));
}

/**
 * A short data-derived brief for a season: league outcome with context,
 * venue tilt, cup finals, the recorded top scorer with coverage, and
 * mid-season management changes.
 */
export function seasonNarrative(season: string): string[] {
  const db = getDb();
  const sentences: string[] = [];

  const league = leagueLine(season);
  if (league?.position) {
    const seasons = (
      db.prepare("SELECT DISTINCT season FROM matches ORDER BY season").all() as { season: string }[]
    ).map((r) => r.season);
    const prev = seasons[seasons.indexOf(season) - 1];
    const prevLeague = prev ? leagueLine(prev) : undefined;
    if (league.position === 1) {
      const nth = titleCountThrough(season);
      sentences.push(
        `Champions of the ${league.competition_name}, the ${ordinal(nth)} league title on record.`,
      );
    } else {
      let move = "";
      if (prevLeague?.position) {
        if (prevLeague.position > league.position) move = `, up from ${ordinal(prevLeague.position)} the season before`;
        else if (prevLeague.position < league.position) move = `, down from ${ordinal(prevLeague.position)} the season before`;
      }
      sentences.push(
        `Finished ${ordinal(league.position)} of ${league.league_size} in the ${league.competition_name}${move}.`,
      );
    }
  }

  const venues = db
    .prepare(
      `SELECT venue, COUNT(*) p, SUM(result='W') w FROM matches
       WHERE season = ? AND venue IN ('H','A') GROUP BY venue`,
    )
    .all(season) as { venue: "H" | "A"; p: number; w: number }[];
  const home = venues.find((v) => v.venue === "H");
  const away = venues.find((v) => v.venue === "A");
  if (home && away && home.p >= 10 && away.p >= 10) {
    const hPct = (100 * home.w) / home.p;
    const aPct = (100 * away.w) / away.p;
    if (hPct - aPct >= 30) {
      sentences.push(
        `The record leaned heavily on home form: ${hPct.toFixed(0)}% of home matches won against ${aPct.toFixed(0)}% away.`,
      );
    } else if (aPct >= hPct) {
      sentences.push(
        `Unusually, away form held up to home form: ${aPct.toFixed(0)}% won on the road against ${hPct.toFixed(0)}% at home.`,
      );
    }
  }

  for (const final of cupFinals(season)) {
    sentences.push(
      final.won
        ? `Won the ${final.competition_name}, beating ${final.opponent} in the ${final.round.toLowerCase()}.`
        : `Reached the ${final.competition_name} ${final.round.toLowerCase()}, losing to ${final.opponent}.`,
    );
  }

  const goals = db
    .prepare("SELECT SUM(gf) gf FROM matches WHERE season = ?")
    .get(season) as { gf: number };
  const topScorer = db
    .prepare(
      `SELECT p.name, COUNT(*) goals FROM match_events e
       JOIN matches m ON m.id = e.match_id JOIN players p ON p.id = e.player_id
       WHERE m.season = ? AND e.type IN ('goal','pen-goal')
       GROUP BY e.player_id ORDER BY goals DESC LIMIT 1`,
    )
    .get(season) as { name: string; goals: number } | undefined;
  const recorded = db
    .prepare(
      `SELECT COUNT(*) n FROM match_events e JOIN matches m ON m.id = e.match_id
       WHERE m.season = ? AND e.type IN ('goal','pen-goal','own-goal-for')`,
    )
    .get(season) as { n: number };
  if (topScorer && goals.gf > 0 && recorded.n > 0) {
    const cov = Math.min(100, Math.round((100 * recorded.n) / goals.gf));
    if (cov >= 60 && topScorer.goals >= 5) {
      sentences.push(
        `Recorded scorers credit ${topScorer.name} with ${topScorer.goals} of the ${goals.gf} goals (scorer data covers ${cov}% of them).`,
      );
    }
  }

  const managers = db
    .prepare(
      `SELECT DISTINCT mg.name FROM matches m JOIN managers mg ON mg.id = m.manager_id
       WHERE m.season = ? ORDER BY m.date`,
    )
    .all(season) as { name: string }[];
  if (managers.length > 1) {
    sentences.push(`Management changed hands mid-season: ${managers.map((m) => m.name).join(", then ")}.`);
  }

  return sentences;
}

export interface DecadeBrief {
  decade: string;
  seasons: number;
  matches: number;
  winPct: number;
  titles: number;
  cupsWon: number;
  bestPosition: number | null;
  worstPosition: number | null;
}

/** Aggregate brief per decade for the seasons index. */
export function decadeBriefs(): Map<string, DecadeBrief> {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT substr(season,1,3) || '0s' decade,
              COUNT(DISTINCT season) seasons, COUNT(*) matches,
              ROUND(100.0 * SUM(result='W') / COUNT(*), 1) winPct
       FROM matches GROUP BY 1`,
    )
    .all() as { decade: string; seasons: number; matches: number; winPct: number }[];
  const positions = db
    .prepare(
      `SELECT substr(ss.season,1,3) || '0s' decade,
              SUM(ss.position = 1) titles,
              MIN(ss.position) bestPosition, MAX(ss.position) worstPosition
       FROM season_summaries ss JOIN competitions c ON c.id = ss.competition_id
       WHERE c.type = 'league' AND ss.position IS NOT NULL GROUP BY 1`,
    )
    .all() as { decade: string; titles: number; bestPosition: number; worstPosition: number }[];
  const cups = db
    .prepare(
      `SELECT substr(m.season,1,3) || '0s' decade, COUNT(*) cupsWon
       FROM matches m JOIN competitions c ON c.id = m.competition_id
       WHERE c.type NOT IN ('league','unofficial')
         AND m.round LIKE '%final%' AND m.round NOT LIKE '%semi%' AND m.round NOT LIKE '%quarter%'
         AND m.outcome = 'W'
         AND m.date = (
           SELECT MAX(m2.date) FROM matches m2
           WHERE m2.season = m.season AND m2.competition_id = m.competition_id
         )
       GROUP BY 1`,
    )
    .all() as { decade: string; cupsWon: number }[];
  const posMap = new Map(positions.map((p) => [p.decade, p]));
  const cupMap = new Map(cups.map((c) => [c.decade, c.cupsWon]));
  return new Map(
    rows.map((r) => [
      r.decade,
      {
        ...r,
        titles: posMap.get(r.decade)?.titles ?? 0,
        cupsWon: cupMap.get(r.decade) ?? 0,
        bestPosition: posMap.get(r.decade)?.bestPosition ?? null,
        worstPosition: posMap.get(r.decade)?.worstPosition ?? null,
      },
    ]),
  );
}
