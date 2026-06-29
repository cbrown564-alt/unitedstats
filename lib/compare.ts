import { getDb } from "./db";
import { playerCareerSpan } from "./format";
import {
  CUP_WON_PREDICATE, managerById, managerHonours, playerById, playerHatTricks, playerSplitsBySeason,
} from "./queries";

/**
 * Side-by-side comparison on shared, coverage-aware metrics — player vs player,
 * manager vs manager, era vs era. Every builder returns the same {@link Comparison}
 * shape so one component renders all three modes, and each metric can carry its
 * own coverage caveat (assists before the curated lane, scorer-sparse early eras)
 * so a comparison never implies a fairer like-for-like than the record supports.
 *
 * Beyond the shared metrics, each mode carries a {@link CompareSignature}: the one
 * artifact from its own world that actually carries the story — a career-arc duel
 * for players, a trophy cabinet for managers, a league-finish skyline for eras.
 */

export type CompareMode = "players" | "managers" | "eras";

/** A curated head-to-head: a labelled fixture between two resolvable subjects. */
export interface CuratedDebate {
  label: string;
  /** Subject ids/keys that resolve exactly: player ids, manager ids, era keys. */
  a: string;
  b: string;
  hook: string;
}

/**
 * Curated head-to-heads per mode — the "great debates". The /compare empty state
 * leads with these rather than a blank form, and the /explore discovery home pulls
 * its Compare launcher from the same list, so the two surfaces never drift. Every
 * id/key resolves exactly (players by canonical id, managers by id, eras by
 * ERA_CATALOGUE key), so a suggestion is never a dead end.
 */
export const CURATED_DEBATES: Record<CompareMode, CuratedDebate[]> = {
  players: [
    { label: "Rooney vs Charlton", a: "wayne-rooney", b: "bobby-charlton", hook: "The two men at the top of the all-time scoring charts." },
    { label: "Ronaldo vs Best", a: "cristiano-ronaldo", b: "george-best", hook: "Two No. 7s, two icons — a generation apart." },
    { label: "Giggs vs Scholes", a: "ryan-giggs", b: "paul-scholes", hook: "The home-grown spine of the Ferguson dynasty, compared season by season." },
    { label: "Cantona vs Van Persie", a: "eric-cantona", b: "robin-van-persie", hook: "Two catalyst signings whose arrival instantly tilted the title race." },
  ],
  managers: [
    { label: "Ferguson vs Busby", a: "alex-ferguson", b: "matt-busby", hook: "The two architects, a quarter-century each in charge." },
    { label: "Ferguson vs Mourinho", a: "alex-ferguson", b: "jose-mourinho", hook: "A 27-year reign against a stormy three." },
    { label: "Busby vs Mangnall", a: "matt-busby", b: "ernest-mangnall", hook: "The club’s first two dynasty-builders." },
  ],
  eras: [
    { label: "Busby era vs Ferguson era", a: "busby", b: "ferguson", hook: "The club’s two defining reigns and their trophy hauls, side by side." },
    { label: "1990s vs 2010s", a: "1990s", b: "2010s", hook: "The relentless title machine of the nineties against the post-Ferguson transition." },
    { label: "1950s vs 2000s", a: "1950s", b: "2000s", hook: "The tragic brilliance of the Busby Babes against the peak of the Ronaldo era." },
  ],
};

export interface CompareSide {
  id: string;
  label: string;
  /** Career span / era years / tenure — secondary identity line. */
  sublabel?: string;
  href?: string;
  thumb?: string | null;
}

export interface CompareMetric {
  label: string;
  a: number | null;
  b: number | null;
  fmt: "int" | "pct" | "dec1" | "dec2";
  /** Direction of "leads" for the highlight; omit for a neutral, un-judged metric. */
  better?: "higher" | "lower";
  /** Per-metric coverage caveat, surfaced under the label. */
  note?: string;
  /** False when the two sides' coverage differs enough to make a like-for-like
   *  judgement misleading (assists across the 1987-88 recording boundary). Shown
   *  but never scored, with a "coverage differs" pill. */
  comparable?: boolean;
  /** Rate-mode counterpart for the per-game toggle. When set, the metric renders
   *  its rate form under "per game" and its total form under "total"; the scoreline
   *  follows whichever mode is active. Absent ⇒ no per-game meaning (Appearances,
   *  Trophies, Win rate). */
  rate?: { a: number | null; b: number | null; label: string; fmt: CompareMetric["fmt"] };
}

// ---- signatures: the per-mode hero visualisation -------------------------

/** One season of a player's United career, indexed from their first (n = 1). */
export interface CareerSeason {
  n: number;
  season: string;
  goals: number;
  apps: number;
  assists: number;
  /** Minutes played this season — the per-90 denominator. */
  minutes: number;
}

/** A trophy count for one competition category (only categories actually won). */
interface TrophyCategory {
  key: string;
  label: string;
  n: number;
}

/** One trophy a manager won, at season granularity — the hover/click detail behind
 *  each cabinet glyph. `href` opens the season page for a league title (a
 *  season-long achievement, with its league table) or the deciding final for a
 *  cup (a single match), so each glyph is a doorway into how it was won. */
export interface TrophyEntry {
  cat: string;
  season: string;
  competition: string;
  /** → the deciding match. */
  href: string;
}

export interface TrophyHaul {
  total: number;
  categories: TrophyCategory[];
  /** Per-trophy detail, chronological — one entry per glyph. Populated for
   *  managers (each trophy → its deciding match); absent for players and eras,
   *  whose attribution is by medal rule / era span rather than a single match. */
  entries?: TrophyEntry[];
}

/** A season's top-flight league finish (or a lower-tier season, topFlight=false).
 *  `ppg` is the league record restated as three-points-per-game — the one-number
 *  squad context the interactive skyline surfaces in its hover. */
export interface EraFinish {
  season: string;
  position: number | null;
  topFlight: boolean;
  champion: boolean;
  /** Three-points-for-a-win points per game across the league season. */
  ppg: number | null;
}

export type CompareSignature =
  | { kind: "career"; a: CareerSeason[]; b: CareerSeason[]; aCovered: boolean; bCovered: boolean }
  | { kind: "trophies"; a: TrophyHaul; b: TrophyHaul }
  | { kind: "skyline"; a: EraFinish[]; b: EraFinish[] };

export interface Comparison {
  mode: CompareMode;
  a: CompareSide;
  b: CompareSide;
  metrics: CompareMetric[];
  /** The mode's hero artifact. */
  signature?: CompareSignature;
  /** One-line plain-language verdict, leading with the most dramatic difference. */
  headline?: string;
  /** Career convergences — shared shirt number, same peak season, overlapping years.
   *  The "where they rhymed" callout; the headline is the divergence. */
  rhymes?: { label: string; detail: string }[];
  /** Module-level coverage note. */
  coverage?: string;
  /** Evidence links — "the matches behind each side". */
  evidence?: { label: string; href: string }[];
}

/** First season of the curated assists lane; before it, assists are unrecorded. */
const ASSISTS_COVERED_FROM = "1987-88";

/** A player's career is "assist-covered" when most of their matches fall in
 *  seasons from the curated lane onward — so an assist total is a fair figure,
 *  not an artifact of when they happened to play. */
function assistCovered(seasons: { season: string; apps: number }[]): boolean {
  let total = 0;
  let covered = 0;
  for (const s of seasons) {
    total += s.apps;
    if (s.season >= ASSISTS_COVERED_FROM) covered += s.apps;
  }
  return total > 0 && covered / total >= 0.8;
}

/** The season of a player's highest goal return, on the normalized career axis —
 *  the single-season peak the career graph plots as a dot. Null when the player
 *  never scored (so a 0 isn't dressed up as a "best season"). */
function peakSeason(arc: CareerSeason[]): { n: number; season: string; goals: number } | null {
  if (!arc.length) return null;
  const peak = arc.reduce((m, p) => (p.goals > m.goals ? p : m), arc[0]);
  return peak.goals > 0 ? { n: peak.n, season: peak.season, goals: peak.goals } : null;
}

// ----------------------------------------------------------------- players

export function comparePlayers(idA: string, idB: string): Comparison | null {
  const a = playerById(idA);
  const b = playerById(idB);
  if (!a || !b || a.player_id === b.player_id) return null;

  const span = (p: typeof a): string => playerCareerSpan(p) ?? "";
  // The football-standard rate is per 90 minutes, not per appearance — a sub's
  // goal is worth the same in a per-app average as a starter's, which flatters
  // 90-minute accumulators. Minutes are derived from the lineup record across
  // the whole dataset, so per-90 is available wherever the career is.
  const per90 = (n: number, minutes: number): number | null => (minutes > 0 ? (n * 90) / minutes : null);
  const arc = (id: string): CareerSeason[] =>
    playerSplitsBySeason(id).map((s, i) => ({ n: i + 1, season: s.season, goals: s.goals, apps: s.apps, assists: s.assists, minutes: s.minutes }));

  const aArc = arc(a.player_id);
  const bArc = arc(b.player_id);
  const aMinutes = aArc.reduce((t, s) => t + s.minutes, 0);
  const bMinutes = bArc.reduce((t, s) => t + s.minutes, 0);

  // Assist coverage: the curated lane starts 1987-88. A career largely before it
  // produces a literal 0 that isn't a figure — so assists only count toward the
  // verdict when both careers fall inside the recorded window.
  const aCovered = assistCovered(aArc);
  const bCovered = assistCovered(bArc);
  const assistsComparable = aCovered && bCovered;
  const uncoveredName = !aCovered && !bCovered
    ? "Both careers"
    : !aCovered
      ? a.name
      : !bCovered
        ? b.name
        : "";

  const goalLeader = a.goals === b.goals ? null : a.goals > b.goals ? a : b;
  const headline = goalLeader
    ? `${goalLeader.name} out-scored ${(goalLeader === a ? b : a).name} ${Math.max(a.goals, b.goals)}–${Math.min(a.goals, b.goals)}.`
    : `${a.name} and ${b.name} are level on goals — ${a.goals} apiece.`;

  // Scoring depth beyond the volume total: hat-tricks (dominant single games)
  // and the best season's goal return (the peak the career graph plots). Both
  // derive from the match-attributed record, so they are honest wherever the
  // goal events are — the whole career for every curated debate.
  const aHat = playerHatTricks(a.player_id);
  const bHat = playerHatTricks(b.player_id);
  const pa = peakSeason(aArc);
  const pb = peakSeason(bArc);
  // Silverware: a player's medal count, attributed the same way as a manager's
  // haul (appeared in the deciding match). Match-attributed and complete across
  // every curated pair, so no coverage gate is needed.
  const aHaul = playerTrophyHaul(a.player_id);
  const bHaul = playerTrophyHaul(b.player_id);

  return {
    mode: "players",
    a: { id: a.player_id, label: a.name, sublabel: span(a), href: `/player/${a.player_id}`, thumb: a.player_thumb_url ?? a.player_image_url },
    b: { id: b.player_id, label: b.name, sublabel: span(b), href: `/player/${b.player_id}`, thumb: b.player_thumb_url ?? b.player_image_url },
    metrics: [
      { label: "Appearances", a: a.apps, b: b.apps, fmt: "int", better: "higher" },
      {
        label: "Goals", a: a.goals, b: b.goals, fmt: "int", better: "higher",
        rate: { a: per90(a.goals, aMinutes), b: per90(b.goals, bMinutes), label: "Goals per 90", fmt: "dec2" },
      },
      {
        label: "Hat-tricks", a: aHat, b: bHat, fmt: "int", better: "higher",
        note: "Three or more in one match — match-attributed, like the career graph.",
      },
      {
        label: "Assists", a: a.assists, b: b.assists, fmt: "int", better: "higher", comparable: assistsComparable,
        note: assistsComparable
          ? "Curated 1987–88 to 2014–15 lane plus match events after."
          : `${uncoveredName} predates assist recording (from 1987–88) — the gap is an artifact of the record, not the player.`,
        rate: { a: per90(a.assists, aMinutes), b: per90(b.assists, bMinutes), label: "Assists per 90", fmt: "dec2" },
      },
      ...(pa || pb ? [{
        label: "Best season",
        a: pa?.goals ?? 0,
        b: pb?.goals ?? 0,
        fmt: "int" as const,
        better: "higher" as const,
        note: [pa && `${a.name}: ${pa.goals} in ${pa.season}`, pb && `${b.name}: ${pb.goals} in ${pb.season}`]
          .filter(Boolean).join("; ") + ".",
      }] : []),
      {
        label: "Trophies", a: aHaul.total, b: bHaul.total, fmt: "int", better: "higher",
        note: "Medals by the medal rules: 5+ appearances in a title-winning league season, one appearance anywhere in a cup won.",
      },
    ],
    signature: aArc.length || bArc.length ? { kind: "career", a: aArc, b: bArc, aCovered, bCovered } : undefined,
    headline,
    rhymes: playerRhymes(a, b, aArc, bArc, aHaul.total, bHaul.total),
    coverage:
      "Appearances and goals are the official club record (Wikipedia's List of Manchester United F.C. players); the career graph plots match-attributed goals per season, so its totals can sit just under the official figure where early matches are unrecorded. Assists combine the curated lane with match events, so the two careers are only fully like-for-like from 2012-13 on. Trophies follow the medal rules — 5+ league appearances in a title season, one in a cup won.",
    evidence: [
      { label: `${a.name}'s matches →`, href: `/player/${a.player_id}` },
      { label: `${b.name}'s matches →`, href: `/player/${b.player_id}` },
    ],
  };
}

/**
 * Convergences between two careers — the moments two otherwise different players
 * lined up on the same number. Surfaced as the "where they rhymed" callout to
 * balance the headline's "who won". Only signals the data actually carries:
 * shared shirt number, same career-peak season (on the normalized n axis, which
 * is why a generation-apart pair can rhyme), the same debut year, and
 * overlapping United careers.
 */
function playerRhymes(
  a: { name: string; primary_shirt: number | null; first_year: number | null; last_year: number | null },
  b: { name: string; primary_shirt: number | null; first_year: number | null; last_year: number | null },
  aArc: CareerSeason[],
  bArc: CareerSeason[],
  aTrophies: number,
  bTrophies: number,
): { label: string; detail: string }[] | undefined {
  const out: { label: string; detail: string }[] = [];

  if (a.primary_shirt && b.primary_shirt && a.primary_shirt === b.primary_shirt) {
    out.push({
      label: `Both wore #${a.primary_shirt}`,
      detail: `${a.name} and ${b.name} each made the #${a.primary_shirt} their own.`,
    });
  }

  const pa = peakSeason(aArc);
  const pb = peakSeason(bArc);
  if (pa && pb && pa.n === pb.n) {
    out.push({
      label: `Both peaked in season ${pa.n}`,
      detail: `${a.name}'s best was ${pa.season} (${pa.goals} goals); ${b.name}'s, ${pb.season} (${pb.goals}).`,
    });
  }

  if (a.first_year && b.first_year && a.first_year === b.first_year) {
    out.push({
      label: `Same debut season`,
      detail: `${a.name} and ${b.name} both made their United first-team bows in ${a.first_year}-${a.first_year + 1}.`,
    });
  }

  if (aTrophies > 0 && aTrophies === bTrophies) {
    out.push({
      label: `Level on ${aTrophies} medal${aTrophies === 1 ? "" : "s"}`,
      detail: `${a.name} and ${b.name} each won ${aTrophies} United medal${aTrophies === 1 ? "" : "s"}.`,
    });
  }

  if (a.first_year && a.last_year && b.first_year && b.last_year) {
    const lo = Math.max(a.first_year, b.first_year);
    const hi = Math.min(a.last_year, b.last_year);
    if (lo <= hi) {
      const seasons = hi - lo + 1;
      out.push({
        label: `Team-mates for ${seasons} season${seasons === 1 ? "" : "s"}`,
        detail: `Their United careers overlapped from ${lo} to ${hi}.`,
      });
    }
  }

  return out.length ? out : undefined;
}

// ----------------------------------------------------------------- managers

/** Convergences between two managerial reigns — the moments two otherwise
 *  different tenures lined up on the same number. Only signals the data carries:
 *  a shared decade of appointment, the same trophy count, squad members who
 *  featured under both, and overlapping time in charge. */
function managerRhymes(
  a: { id: string; name: string; first: string | null; last: string | null },
  b: { id: string; name: string; first: string | null; last: string | null },
  aTot: number,
  bTot: number,
): { label: string; detail: string }[] | undefined {
  const out: { label: string; detail: string }[] = [];
  const yr = (d: string | null): number | null => (d ? Number(d.slice(0, 4)) : null);

  if (aTot > 0 && aTot === bTot) {
    out.push({
      label: `Level on ${aTot} ${aTot === 1 ? "trophy" : "trophies"}`,
      detail: `${a.name} and ${b.name} each won ${aTot} as United manager.`,
    });
  }

  const ay = yr(a.first);
  const by = yr(b.first);
  if (ay != null && by != null) {
    const ad = Math.floor(ay / 10) * 10;
    const bd = Math.floor(by / 10) * 10;
    if (ad === bd) {
      out.push({
        label: `Both took charge in the ${ad}s`,
        detail: `${a.name} and ${b.name} each began their United reign in the ${ad}s.`,
      });
    }
  }

  // Squad members who featured under both — match-attributed via the lineup record.
  const shared = getDb()
    .prepare(
      `SELECT l.player_id, COALESCE(p.name, l.player_name) name, COUNT(DISTINCT m.id) apps
       FROM match_lineups l
       JOIN matches m ON m.id = l.match_id
       LEFT JOIN players p ON p.id = l.player_id
       WHERE l.player_side = 'united' AND (l.started = 1 OR l.sub_on IS NOT NULL)
         AND m.manager_id IN (?, ?)
       GROUP BY l.player_id
       HAVING COUNT(DISTINCT m.manager_id) = 2
       ORDER BY apps DESC`,
    )
    .all(a.id, b.id) as { player_id: string; name: string; apps: number }[];
  if (shared.length > 0) {
    const top = shared[0];
    const more = shared.length - 1;
    out.push({
      label: `Shared squad`,
      detail:
        more > 0
          ? `${top.name} and ${more} other${more === 1 ? "" : "s"} featured under both managers.`
          : `${top.name} featured under both managers.`,
    });
  }

  const al = yr(a.last);
  const bl = yr(b.last);
  if (ay != null && al != null && by != null && bl != null) {
    const lo = Math.max(ay, by);
    const hi = Math.min(al, bl);
    if (lo <= hi) {
      out.push({
        label: `Reigns overlapped`,
        detail: `${a.name} and ${b.name} were both in charge between ${lo} and ${hi}.`,
      });
    }
  }

  return out.length ? out : undefined;
}

/** Display order + labels for trophy categories. */
const TROPHY_CATS: { key: string; label: string }[] = [
  { key: "league", label: "League titles" },
  { key: "european", label: "European" },
  { key: "domestic-cup", label: "FA Cup" },
  { key: "league-cup", label: "League Cup" },
  { key: "super-cup", label: "Shields and Super Cups" },
  { key: "world", label: "World" },
];

function buildHaul(rows: { cat: string; n: number }[]): TrophyHaul {
  const byKey = new Map(rows.map((r) => [r.cat, r.n]));
  const categories = TROPHY_CATS.map((c) => ({ key: c.key, label: c.label, n: byKey.get(c.key) ?? 0 })).filter(
    (c) => c.n > 0,
  );
  return { total: categories.reduce((s, c) => s + c.n, 0), categories };
}

/** Category counts (in display order) from a flat list of trophy category keys. */
function categoriesFromCats(cats: string[]): TrophyCategory[] {
  const counts = new Map<string, number>();
  for (const cat of cats) counts.set(cat, (counts.get(cat) ?? 0) + 1);
  return TROPHY_CATS.map((c) => ({ key: c.key, label: c.label, n: counts.get(c.key) ?? 0 })).filter((c) => c.n > 0);
}

/** Trophies a manager won, each at season granularity with a link through. League
 *  titles attribute to whoever managed the last league match of the title season;
 *  cups to the winning-final manager (the shared {@link CUP_WON_PREDICATE}).
 *  Each glyph opens the season page (league) or the deciding final (cup) — how the
 *  trophy was actually won. Ordered chronologically. */
export function managerTrophyHaul(id: string): TrophyHaul {
  const rows = getDb()
    .prepare(
      `WITH league_titles AS (
         SELECT ss.season season, ss.competition_id competition_id,
                (SELECT m.id FROM matches m
                 WHERE m.season = ss.season AND m.competition_id = ss.competition_id
                 ORDER BY m.date DESC LIMIT 1) match_id
         FROM season_summaries ss JOIN competitions c ON c.id = ss.competition_id
         WHERE c.type = 'league' AND ss.position = 1 AND c.name IN ('First Division','Premier League')
       ),
       honours AS (
         SELECT 'league' cat, lt.season season, lc.name competition, lt.match_id match_id
         FROM league_titles lt JOIN competitions lc ON lc.id = lt.competition_id
         UNION ALL
         SELECT c.type cat, m.season season, c.name competition, m.id match_id
         FROM matches m JOIN competitions c ON c.id = m.competition_id
         WHERE ${CUP_WON_PREDICATE}
       )
       SELECT h.cat cat, h.season season, h.competition competition, m.id match_id
       FROM honours h JOIN matches m ON m.id = h.match_id
       WHERE m.manager_id = ?
       ORDER BY m.date`,
    )
    .all(id) as { cat: string; season: string; competition: string; match_id: string }[];
  const entries: TrophyEntry[] = rows.map((r) => ({
    cat: r.cat,
    season: r.season,
    competition: r.competition,
    // A league title is a season-long achievement — open the season page (with its
    // league table). A cup is won in one match — open the deciding final.
    href: r.cat === "league" ? `/seasons/${r.season}` : `/match/${r.match_id}`,
  }));
  return { total: entries.length, categories: categoriesFromCats(rows.map((r) => r.cat)), entries };
}

/** Trophies a *player* won, split by competition category. Attribution follows
 *  the real medal rules: a league-title medal requires 5+ appearances in that
 *  league competition over the title-winning season (the modern Premier League
 *  threshold); a cup medal requires a single appearance anywhere in that cup
 *  competition that season (one game in the tournament is enough — the final
 *  itself is not required). Fully match-attributed, no judgment data; the two
 *  thresholds are the documented medal rules, not a judgment call. */
function playerTrophyHaul(id: string): TrophyHaul {
  const rows = getDb()
    .prepare(
      `WITH honours AS (
         SELECT ss.competition_id, ss.season, 'league' cat
         FROM season_summaries ss JOIN competitions c ON c.id = ss.competition_id
         WHERE c.type = 'league' AND ss.position = 1 AND c.name IN ('First Division','Premier League')
         UNION ALL
         SELECT m.competition_id, m.season, c.type cat
         FROM matches m JOIN competitions c ON c.id = m.competition_id
         WHERE ${CUP_WON_PREDICATE}
       )
       SELECT h.cat cat, COUNT(*) n
       FROM honours h
       WHERE EXISTS (
         SELECT 1 FROM match_lineups l JOIN matches m ON m.id = l.match_id
         WHERE l.player_id = ? AND l.player_side = 'united' AND l.bench = 0
           AND m.competition_id = h.competition_id AND m.season = h.season
         GROUP BY m.competition_id, m.season
         HAVING COUNT(*) >= CASE WHEN h.cat = 'league' THEN 5 ELSE 1 END
       )
       GROUP BY h.cat`,
    )
    .all(id) as { cat: string; n: number }[];
  return buildHaul(rows);
}

/** Trophies per manager (league titles + cups won), summed from {@link managerHonours}. */
function trophyCounts(): Map<string, number> {
  const out = new Map<string, number>();
  for (const h of managerHonours()) out.set(h.manager_id, (out.get(h.manager_id) ?? 0) + h.n);
  return out;
}

/** A trophy-led verdict: the silverware gap as a multiple, the most evocative cut. */
function trophyHeadline(
  aLabel: string,
  bLabel: string,
  aTot: number,
  bTot: number,
  aWin: number | null,
  bWin: number | null,
): string {
  const [hi, lo, hiName] = aTot >= bTot ? [aTot, bTot, aLabel] : [bTot, aTot, bLabel];
  if (hi === 0) {
    const [wHi, wLo, wName] = (aWin ?? 0) >= (bWin ?? 0) ? [aWin ?? 0, bWin ?? 0, aLabel] : [bWin ?? 0, aWin ?? 0, bLabel];
    return `Neither lifted a trophy here — ${wName} edges it on win rate, ${wHi.toFixed(0)}% to ${wLo.toFixed(0)}%.`;
  }
  if (lo === 0) return `${hiName} won every trophy between them — ${hi} to none.`;
  const ratio = hi / lo;
  return ratio >= 1.15
    ? `${hiName} won ${ratio.toFixed(1)}× the silverware — ${hi} trophies to ${lo}.`
    : `${hiName} shades the silverware, ${hi} trophies to ${lo}.`;
}

export function compareManagers(idA: string, idB: string): Comparison | null {
  const a = managerById(idA);
  const b = managerById(idB);
  if (!a || !b || a.id === b.id) return null;

  const trophies = trophyCounts();
  const points = (r: typeof a): number => 3 * r.w + r.d; // three-for-a-win convention, see note
  const ppg = (r: typeof a): number | null => (r.p > 0 ? points(r) / r.p : null);
  const winPct = (r: typeof a): number | null => (r.p > 0 ? (100 * r.w) / r.p : null);
  const per = (n: number, p: number): number | null => (p > 0 ? n / p : null);
  const span = (r: typeof a): string =>
    r.first && r.last ? `${r.first.slice(0, 4)}–${r.last.slice(0, 4)}` : "";

  const aTot = trophies.get(a.id) ?? 0;
  const bTot = trophies.get(b.id) ?? 0;

  return {
    mode: "managers",
    a: { id: a.id, label: a.name, sublabel: span(a), href: `/manager/${a.id}`, thumb: a.thumb_url ?? a.image_url },
    b: { id: b.id, label: b.name, sublabel: span(b), href: `/manager/${b.id}`, thumb: b.thumb_url ?? b.image_url },
    metrics: [
      { label: "Matches", a: a.p, b: b.p, fmt: "int" },
      { label: "Win rate", a: winPct(a), b: winPct(b), fmt: "pct", better: "higher" },
      {
        label: "Points", a: points(a), b: points(b), fmt: "int", better: "higher",
        note: "Three points for a win applied across all eras, a modern convention.",
        rate: { a: ppg(a), b: ppg(b), label: "Points per game", fmt: "dec1" },
      },
      {
        label: "Goals", a: a.gf, b: b.gf, fmt: "int", better: "higher",
        rate: { a: per(a.gf, a.p), b: per(b.gf, b.p), label: "Goals per game", fmt: "dec1" },
      },
      {
        label: "Conceded", a: a.ga, b: b.ga, fmt: "int", better: "lower",
        rate: { a: per(a.ga, a.p), b: per(b.ga, b.p), label: "Conceded per game", fmt: "dec1" },
      },
      { label: "Trophies", a: aTot, b: bTot, fmt: "int", better: "higher" },
    ],
    signature: { kind: "trophies", a: managerTrophyHaul(a.id), b: managerTrophyHaul(b.id) },
    headline: trophyHeadline(a.name, b.name, aTot, bTot, winPct(a), winPct(b)),
    rhymes: managerRhymes(a, b, aTot, bTot),
    coverage:
      "Records cover every competitive match. Points restate older eras in three-points-for-a-win terms; trophies count league titles and the cups whose deciding final was won.",
    evidence: [
      { label: `${a.name}'s matches →`, href: `/matches?manager=${a.id}` },
      { label: `${b.name}'s matches →`, href: `/matches?manager=${b.id}` },
    ],
  };
}

// ----------------------------------------------------------------- eras

export interface EraDef {
  key: string;
  label: string;
  /** Inclusive start year, exclusive end year (calendar years of the appointments). */
  from: number;
  to: number;
}

/**
 * Named eras bounded by the two longest reigns (Busby, Ferguson) — the same frame
 * as the managers index — plus every decade, so an era comparison can be the broad
 * historical sweep or a decade-on-decade cut. Boundaries are by calendar year of
 * the appointment, matching the managers-index reading aid.
 */
export const ERA_CATALOGUE: EraDef[] = [
  { key: "secretaries", label: "Secretary-managers (pre-1945)", from: 1886, to: 1945 },
  { key: "busby", label: "The Busby era (1945–1969)", from: 1945, to: 1969 },
  { key: "between", label: "Between Busby and Ferguson (1969–1986)", from: 1969, to: 1986 },
  { key: "ferguson", label: "The Ferguson era (1986–2013)", from: 1986, to: 2013 },
  { key: "after", label: "After Ferguson (2013–now)", from: 2013, to: 2100 },
  ...[1890, 1900, 1910, 1920, 1930, 1940, 1950, 1960, 1970, 1980, 1990, 2000, 2010, 2020].map((d) => ({
    key: `${d}s`,
    label: `The ${d}s`,
    from: d,
    to: d + 10,
  })),
];

function eraByKey(key: string): EraDef | undefined {
  return ERA_CATALOGUE.find((e) => e.key === key);
}

interface EraRecord {
  p: number;
  w: number;
  d: number;
  l: number;
  gf: number;
  ga: number;
}

/** Aggregate official-match record for an era's date span. */
function eraRecord(era: EraDef): EraRecord {
  const db = getDb();
  return db
    .prepare(
      `SELECT COUNT(*) p, COALESCE(SUM(result='W'),0) w, COALESCE(SUM(result='D'),0) d,
              COALESCE(SUM(result='L'),0) l, COALESCE(SUM(gf),0) gf, COALESCE(SUM(ga),0) ga
       FROM matches m JOIN competitions c ON c.id = m.competition_id
       WHERE c.type != 'unofficial' AND m.date >= ? AND m.date < ?`,
    )
    .get(`${era.from}-01-01`, `${era.to}-01-01`) as EraRecord;
}

/** Trophies won within an era's span, split by competition category. */
function eraTrophies(era: EraDef): TrophyHaul {
  const rows = getDb()
    .prepare(
      `WITH honours AS (
         SELECT 'league' cat,
                (SELECT MAX(m.date) FROM matches m WHERE m.season = ss.season AND m.competition_id = ss.competition_id) date
         FROM season_summaries ss JOIN competitions c ON c.id = ss.competition_id
         WHERE c.type = 'league' AND ss.position = 1 AND c.name IN ('First Division','Premier League')
         UNION ALL
         SELECT c.type cat, m.date FROM matches m JOIN competitions c ON c.id = m.competition_id WHERE ${CUP_WON_PREDICATE}
       )
       SELECT cat, COUNT(*) n FROM honours WHERE date >= ? AND date < ? GROUP BY cat`,
    )
    .all(`${era.from}-01-01`, `${era.to}-01-01`) as { cat: string; n: number }[];
  return buildHaul(rows);
}

/** Season-by-season league finish across an era (top-flight on the main scale,
 *  lower divisions flagged), each carrying its league record as PPG — the
 *  one-number squad context the interactive skyline surfaces on hover. */
export function eraFinishes(era: EraDef): EraFinish[] {
  const rows = getDb()
    .prepare(
      `SELECT ss.season, ss.position, c.name, ss.p, ss.w, ss.d
       FROM season_summaries ss JOIN competitions c ON c.id = ss.competition_id
       WHERE c.type = 'league'
         AND CAST(substr(ss.season,1,4) AS INTEGER) >= ? AND CAST(substr(ss.season,1,4) AS INTEGER) < ?
       ORDER BY ss.season`,
    )
    .all(era.from, era.to) as { season: string; position: number | null; name: string; p: number; w: number; d: number }[];
  return rows.map((r) => {
    const topFlight = r.name === "First Division" || r.name === "Premier League";
    const ppg = r.p > 0 ? (3 * r.w + r.d) / r.p : null;
    return { season: r.season, position: r.position, topFlight, champion: topFlight && r.position === 1, ppg };
  });
}

/** Convergences between two eras — the moments two otherwise different spans of
 *  the club's history lined up. Only signals the data carries: the same trophy
 *  count, squad members who featured across both spans, and overlapping years. */
function eraRhymes(
  eraA: EraDef,
  eraB: EraDef,
  aTot: number,
  bTot: number,
): { label: string; detail: string }[] | undefined {
  const out: { label: string; detail: string }[] = [];

  if (aTot > 0 && aTot === bTot) {
    out.push({
      label: `Level on ${aTot} ${aTot === 1 ? "trophy" : "trophies"}`,
      detail: `${eraA.label} and ${eraB.label} each yielded ${aTot}.`,
    });
  }

  // Players who featured in both spans — a career long enough to bridge them, or
  // the overlap when the spans themselves cross. Match-attributed via the lineup
  // record, so it is honest wherever the matches are.
  const shared = getDb()
    .prepare(
      `SELECT l.player_id, COALESCE(p.name, l.player_name) name
       FROM match_lineups l
       JOIN matches m ON m.id = l.match_id
       LEFT JOIN players p ON p.id = l.player_id
       WHERE l.player_side = 'united' AND (l.started = 1 OR l.sub_on IS NOT NULL)
         AND ( (m.date >= ? AND m.date < ?) OR (m.date >= ? AND m.date < ?) )
       GROUP BY l.player_id
       HAVING SUM(m.date >= ? AND m.date < ?) > 0
          AND SUM(m.date >= ? AND m.date < ?) > 0
       ORDER BY MAX(m.date) DESC`,
    )
    .all(
      `${eraA.from}-01-01`, `${eraA.to}-01-01`,
      `${eraB.from}-01-01`, `${eraB.to}-01-01`,
      `${eraA.from}-01-01`, `${eraA.to}-01-01`,
      `${eraB.from}-01-01`, `${eraB.to}-01-01`,
    ) as { player_id: string; name: string }[];
  if (shared.length > 0) {
    const top = shared[0];
    const more = shared.length - 1;
    out.push({
      label: `Shared squad`,
      detail:
        more > 0
          ? `${top.name} and ${more} other${more === 1 ? "" : "s"} featured across both eras.`
          : `${top.name} featured across both eras.`,
    });
  }

  // Overlapping spans — the seasons the two eras share (named era vs decade, etc.).
  const lo = Math.max(eraA.from, eraB.from);
  const hi = Math.min(eraA.to, eraB.to);
  if (lo < hi) {
    const seasons = hi - lo;
    out.push({
      label: `Overlapping span`,
      detail: `${eraA.label} and ${eraB.label} share ${seasons} year${seasons === 1 ? "" : "s"}, from ${lo} to ${hi === 2100 ? "now" : hi}.`,
    });
  }

  return out.length ? out : undefined;
}

export function compareEras(keyA: string, keyB: string): Comparison | null {
  const eraA = eraByKey(keyA);
  const eraB = eraByKey(keyB);
  if (!eraA || !eraB || eraA.key === eraB.key) return null;

  const ra = eraRecord(eraA);
  const rb = eraRecord(eraB);
  const haulA = eraTrophies(eraA);
  const haulB = eraTrophies(eraB);
  const points = (r: EraRecord): number => 3 * r.w + r.d; // three-for-a-win convention, see note
  const winPct = (r: EraRecord): number | null => (r.p > 0 ? (100 * r.w) / r.p : null);
  const ppg = (r: EraRecord): number | null => (r.p > 0 ? points(r) / r.p : null);
  const per = (n: number, p: number): number | null => (p > 0 ? n / p : null);
  const hrefFor = (era: EraDef): string => `/matches?from=${era.from}&to=${era.to - 1}&sort=oldest`;
  const shortLabel = (era: EraDef): string => era.label.replace(/\s*\(.*\)$/, "");

  return {
    mode: "eras",
    a: { id: eraA.key, label: eraA.label, sublabel: `${eraA.from}–${eraA.to === 2100 ? "now" : eraA.to}`, href: hrefFor(eraA) },
    b: { id: eraB.key, label: eraB.label, sublabel: `${eraB.from}–${eraB.to === 2100 ? "now" : eraB.to}`, href: hrefFor(eraB) },
    metrics: [
      { label: "Matches", a: ra.p, b: rb.p, fmt: "int" },
      { label: "Win rate", a: winPct(ra), b: winPct(rb), fmt: "pct", better: "higher" },
      {
        label: "Points", a: points(ra), b: points(rb), fmt: "int", better: "higher",
        note: "Three points for a win applied across all eras.",
        rate: { a: ppg(ra), b: ppg(rb), label: "Points per game", fmt: "dec1" },
      },
      {
        label: "Goals", a: ra.gf, b: rb.gf, fmt: "int", better: "higher",
        rate: { a: per(ra.gf, ra.p), b: per(rb.gf, rb.p), label: "Goals per game", fmt: "dec1" },
      },
      {
        label: "Conceded", a: ra.ga, b: rb.ga, fmt: "int", better: "lower",
        rate: { a: per(ra.ga, ra.p), b: per(rb.ga, rb.p), label: "Conceded per game", fmt: "dec1" },
      },
      { label: "Trophies", a: haulA.total, b: haulB.total, fmt: "int", better: "higher" },
    ],
    signature: { kind: "skyline", a: eraFinishes(eraA), b: eraFinishes(eraB) },
    headline: trophyHeadline(shortLabel(eraA), shortLabel(eraB), haulA.total, haulB.total, winPct(ra), winPct(rb)),
    rhymes: eraRhymes(eraA, eraB, haulA.total, haulB.total),
    coverage:
      "Official matches only (friendlies and wartime excluded). Eras are bounded by the calendar year of the appointment, so a few matches around a handover fall to the adjacent era; the skyline shows top-flight league finishes (lower-division seasons sit below the line); points per game restates older eras in three-points terms.",
    evidence: [
      { label: `${eraA.label} matches →`, href: hrefFor(eraA) },
      { label: `${eraB.label} matches →`, href: hrefFor(eraB) },
    ],
  };
}
