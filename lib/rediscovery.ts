import { getDb } from "./db";
import type { MatchRow } from "./queries";
import type { ChargeComponents, ReasonKind } from "./charge";
import { scoreline } from "./format";

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
  const { since, limit = 10, entityId, entityKind, excludeIds = [], minScore = 0 } = opts;

  const where: string[] = ["mc.score > @minScore"];
  if (entityId && entityKind) where.push(ENTITY_CLAUSE[entityKind]);

  // Candidate pool: when an era bias is in play it can reorder, so pull wider than
  // `limit` and re-rank. Entity slices are already small.
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
    .all({ minScore, entityId: entityId ?? null, pool }) as ChargeJoinRow[];

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
 * The recognition line for a pick — plain, human, year-anchored (the on-site copy
 * voice the restraint pass calls for; refine when the surfaces land). Keyed by the
 * dominant `reason` so the line names what made the night, then the score and the
 * year do the recognising.
 */
function promptFor(m: MatchRow, reason: ReasonKind | "none"): string {
  const year = m.date.slice(0, 4);
  const opp = m.opponent_name;
  const at = `${venuePhrase(m.venue)} ${opp}`;
  const score = scoreline(m.gf, m.ga, [m.pen_gf, m.pen_ga], !!m.aet);
  const comp = m.competition_name;
  const won = m.result === "W";

  let body: string;
  switch (reason) {
    case "knockoutExit":
      body = `going out of the ${comp} ${at}`;
      break;
    case "upset":
      body = won ? `stunning ${opp}` : `${opp} stunning United, ${score}`;
      break;
    case "comeback":
      body = `the comeback ${at}`;
      break;
    case "collapse":
      body = won ? `${at}` : `throwing it away ${at}, ${score}`;
      break;
    case "lateDrama":
      body = won ? `the late win ${at}` : `the late heartbreak ${at}`;
      break;
    case "rivalry":
      body = `that ${opp} ${score}`;
      break;
    case "scoreline":
      body = `the ${score} ${at}`;
      break;
    case "streakEnder":
      body = `the run ending ${at}`;
      break;
    case "crowd":
      body = `the night the ground filled ${at}`;
      break;
    default:
      body = `${score} ${at}`;
  }
  return `Do you remember ${body}, back in ${year}?`;
}
