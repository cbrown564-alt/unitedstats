import { getDb } from "./db";
import type { MatchRow } from "./queries";
import type { ChargeComponents, ReasonKind } from "./charge";

/**
 * The rediscovery *selector* (Phase 3a — `CONTEXT.md` §6, `docs/RESTRAINT-PASS.md`).
 * The charge scorer (`lib/charge.ts`) bakes a per-match `score` (charge × fadedness)
 * into `match_charge` at build time; this reads that cheaply and adds the one piece
 * that is *per-reader* and so can't be precomputed: the optional **"your era" bias**.
 *
 * The win it delivers (per the spec's honest limit): the roll only ever surfaces
 * *forgotten + charged* nights — and, when a `since` year is supplied, leans into
 * the reader's own living memory — turning a calendar coincidence into *that* night.
 *
 * Output is a **recognition prompt** ("Do you remember…?"), not a fixture row. No
 * surface is wired yet (engine-first pass); this returns enough for the homepage
 * rail, entity rails, and the `/surprise` nostalgia mode to render later.
 */

export interface RediscoveryPick {
  match: MatchRow;
  /** Final rank value: base score × era bias. */
  score: number;
  /** `match_charge.score` (charge × fadedness), before the reader's era bias. */
  baseScore: number;
  charge: number;
  fadedness: number;
  reason: ReasonKind | "none";
  components: ChargeComponents;
  /** The recognition line — "the night United went out to Liverpool, back in 2016". */
  prompt: string;
}

export interface RediscoveryOpts {
  /** The year the reader started following — biases the roll into their era. */
  since?: number;
  limit?: number;
  /** Confine to one entity's history. */
  entityId?: string;
  entityKind?: "opponent" | "season" | "manager" | "player";
  /** Match ids to drop (e.g. the night already on screen). */
  excludeIds?: string[];
  /** Floor on the base score, so a rail never surfaces a flat match. */
  minScore?: number;
  /** Constrain to these results (e.g. `["W"]` for a warm, ungated first roll —
   *  the base ranking skews to forgotten *defeats*, so warmth must be asked for). */
  results?: Array<"W" | "D" | "L">;
  /** Confine candidates to matches in `[fromYear, toYear]` (inclusive). The
   *  reader's *formative window* — so "your years" leans into the early-years
   *  nights that have aged into the right kind of bittersweet, not just the
   *  highest-charge night anywhere after they started watching. */
  fromYear?: number;
  toYear?: number;
}

interface ChargeJoinRow extends MatchRow {
  charge: number;
  fadedness: number;
  base_score: number;
  reason: ReasonKind | "none";
  components: string;
}

/**
 * How much to favour a night that falls in the reader's living memory. A night
 * from their era is strongly boosted; one from just before they started following
 * is softened, not killed (they may have caught up on it); a long-ago night is
 * faded further. Neutral (1) when no era is supplied.
 */
export function eraBias(year: number, since?: number): number {
  if (since == null) return 1;
  if (year >= since) return 1.8;
  const gap = since - year;
  return gap <= 5 ? 0.8 : 0.4;
}

const ENTITY_CLAUSE: Record<NonNullable<RediscoveryOpts["entityKind"]>, string> = {
  opponent: "m.opponent_id = @entityId",
  season: "m.season = @entityId",
  manager: "m.manager_id = @entityId",
  player:
    "m.id IN (SELECT match_id FROM match_lineups WHERE player_id = @entityId " +
    "UNION SELECT match_id FROM match_events WHERE player_id = @entityId)",
};

/**
 * The most rediscoverable nights, ranked. Reads `match_charge` joined to the match
 * record, applies the optional era bias, drops excluded ids, and frames each as a
 * recognition prompt. A generous candidate pool is pulled by base score and
 * re-ranked in memory so the era bias can lift an in-era night past a marginally
 * higher-scoring one — cheap, since the pool is small and indexed.
 */
export function topRediscoveries(opts: RediscoveryOpts = {}): RediscoveryPick[] {
  const {
    since, limit = 10, entityId, entityKind, excludeIds = [], minScore = 0, results, fromYear, toYear,
  } = opts;

  const where: string[] = ["mc.score > @minScore"];
  if (entityId && entityKind) where.push(ENTITY_CLAUSE[entityKind]);
  // Tone filter (typed to W/D/L, so a literal IN-list is safe).
  const tone = (results ?? []).filter((r) => r === "W" || r === "D" || r === "L");
  if (tone.length) where.push(`m.result IN (${tone.map((r) => `'${r}'`).join(", ")})`);
  // Formative-window filter — dates are ISO strings, so lexical compare on the
  // year boundary is exact.
  if (fromYear != null) where.push("m.date >= @fromDate");
  if (toYear != null) where.push("m.date <= @toDate");

  // Candidate pool: when an era bias is in play it can reorder, so pull wider than
  // `limit` and re-rank. Entity slices and windowed slices are already small.
  const pool = since != null ? 2000 : Math.max(limit * 4, 60);

  const rows = getDb()
    .prepare(
      `SELECT m.*, c.name AS competition_name, c.type AS competition_type,
              s.name AS stadium_name, mg.name AS manager_name,
              mc.charge, mc.fadedness, mc.score AS base_score, mc.reason, mc.components
       FROM match_charge mc
       JOIN matches m ON m.id = mc.match_id
       JOIN competitions c ON c.id = m.competition_id
       LEFT JOIN stadiums s ON s.id = m.stadium_id
       LEFT JOIN managers mg ON mg.id = m.manager_id
       WHERE ${where.join(" AND ")}
       ORDER BY mc.score DESC
       LIMIT @pool`,
    )
    .all({
      minScore,
      entityId: entityId ?? null,
      pool,
      fromDate: fromYear != null ? `${fromYear}-01-01` : null,
      toDate: toYear != null ? `${toYear}-12-31` : null,
    }) as ChargeJoinRow[];

  const exclude = new Set(excludeIds);
  const picks = rows
    .filter((r) => !exclude.has(r.id))
    .map((r) => toPick(r, since))
    .sort((a, b) => b.score - a.score || b.baseScore - a.baseScore || a.match.id.localeCompare(b.match.id));

  return picks.slice(0, limit);
}

function toPick(r: ChargeJoinRow, since?: number): RediscoveryPick {
  const { charge, fadedness, base_score, reason, components, ...match } = r;
  const year = Number(match.date.slice(0, 4));
  return {
    match: match as MatchRow,
    baseScore: base_score,
    score: base_score * eraBias(year, since),
    charge,
    fadedness,
    reason,
    components: JSON.parse(components) as ChargeComponents,
    prompt: promptFor(match as MatchRow, reason),
  };
}

// ---------------------------------------------------------------- prompt copy

/** Natural venue phrasing for a sentence ("away at Liverpool"). */
function venuePhrase(v: string): string {
  return v === "H" ? "at home to" : v === "A" ? "away at" : "against";
}

/**
 * The recognition line for a pick — the curiosity-gap prompt. It names the
 * *occasion* (venue, opponent, sometimes the competition's flavour) and the year,
 * but **withholds the result** — the scoreline and the win/loss are the reveal's
 * job, not the question's. Naming "the late heartbreak" or "stunning United, 1–2"
 * up front would close the loop before the reader strains to remember; the gap is
 * the whole mechanic. Stays neutral on outcome so a forgotten win and a forgotten
 * gut-punch read the same until revealed.
 */
function promptFor(m: MatchRow, reason: ReasonKind | "none"): string {
  const year = m.date.slice(0, 4);
  const opp = m.opponent_name;
  const at = `${venuePhrase(m.venue)} ${opp}`;
  const t = m.competition_type;

  let occasion: string;
  if (reason === "crowd") {
    occasion = `the night the ground filled, ${at}`; // big crowd — outcome-neutral
  } else if (reason === "rivalry") {
    occasion = `that ${opp} night`;
  } else if (t === "european") {
    occasion = `that European night ${at}`;
  } else if (t === "domestic-cup" || t === "league-cup") {
    occasion = `that cup tie ${at}`;
  } else {
    occasion = `that night ${at}`;
  }
  return `Do you remember ${occasion}, back in ${year}?`;
}

/**
 * The line shown *after* the reveal, once the scoreline is on screen — here the
 * emotional framing is welcome, because the loop is closed. Keyed by the dominant
 * `reason` and the result. First-draft copy; gets the editorial voice pass with the
 * rest of the on-site copy.
 */
export function revealCaption(m: MatchRow, reason: ReasonKind | "none"): string {
  const won = m.result === "W";
  const lost = m.result === "L";
  switch (reason) {
    case "knockoutExit":
      return "The night the run ended.";
    case "upset":
      return won ? "A giant-killing." : "Nobody saw it coming.";
    case "comeback":
      return "Down — then back.";
    case "collapse":
      return lost ? "Ahead, then undone." : "A lead let slip.";
    case "lateDrama":
      return won ? "Won in the dying minutes." : "Lost it at the death.";
    case "rivalry":
      return "A night against the old rivals.";
    case "scoreline":
      return won ? "A rout." : "A hammering.";
    case "streakEnder":
      return "The night a long run ended.";
    case "crowd":
      return "A full house, under the lights.";
    default:
      return "A night worth remembering.";
  }
}
