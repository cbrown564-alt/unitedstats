import fs from "node:fs";
import path from "node:path";
import { canonicalStringify, claimVersion, historyDigestRef, matchSourceProvenance, type ClaimProvenance, type CitableRef } from "./citations";
import { getDb } from "./db";
import { fmtDateLong, venueLabel } from "./format";
import { matchById, sourcesForMatch, type MatchRow } from "./queries";

const HISTORY_DIGEST_SCHEMA_VERSION = 1;
export const HISTORY_DIGEST_DIR = path.join(process.cwd(), "data", "history-digests");

export type HistoryDigestClaimKind =
  | "ledger-entry"
  | "record"
  | "streak-started"
  | "streak-ended"
  | "rank-change"
  | "manager-milestone"
  | "opponent-milestone"
  | "unusual-scoreline"
  | "venue-fact"
  | "elo-movement"
  | "historical-percentile";

interface HistoryDigestClaim {
  id: string;
  kind: HistoryDigestClaimKind;
  title: string;
  text: string;
  evidencePath: string;
  evidenceUrl: string;
  value?: number | string;
}

export interface HistoryDigest {
  schemaVersion: number;
  ref: CitableRef;
  claimVersion: string;
  matchId: string;
  canonicalUrl: string;
  match: {
    id: string;
    date: string;
    season: string;
    opponent: string;
    competition: string;
    venue: "H" | "A" | "N";
    score: string;
    result: "W" | "D" | "L";
    manager: string | null;
  };
  evidenceLinks: { label: string; path: string; url: string }[];
  provenance: ClaimProvenance[];
  claims: HistoryDigestClaim[];
}

interface SeqMatch {
  id: string;
  date: string;
  season: string;
  opponent_id: string;
  opponent_name: string;
  competition_name: string;
  venue: "H" | "A" | "N";
  stadium_id: string | null;
  stadium_name: string | null;
  gf: number;
  ga: number;
  result: "W" | "D" | "L";
  manager_id: string | null;
  manager_name: string | null;
  elo_post: number | null;
  elo_pre: number | null;
  expected: number | null;
}

type StreakKind = "unbeaten" | "winning" | "scoring" | "clean-sheet";

const MILESTONES = new Set([1, 10, 25, 50, 100, 250, 500, 1000, 1500]);

function digestClaim(matchId: string, n: number, claim: Omit<HistoryDigestClaim, "id">): HistoryDigestClaim {
  const ref = historyDigestRef(matchId);
  return {
    ...claim,
    id: `${ref.id}:claim-${String(n).padStart(2, "0")}-${claim.kind}`,
  };
}

function score(m: Pick<SeqMatch | MatchRow, "gf" | "ga">): string {
  return `${m.gf}-${m.ga}`;
}

function officialSequence(): SeqMatch[] {
  return getDb()
    .prepare(
      `SELECT m.id, m.date, m.season, m.opponent_id, m.opponent_name,
              c.name AS competition_name, m.venue, m.stadium_id, s.name AS stadium_name,
              m.gf, m.ga, m.result, m.manager_id, mg.name AS manager_name,
              e.elo_pre, e.elo_post, e.expected
       FROM matches m
       JOIN competitions c ON c.id = m.competition_id
       LEFT JOIN stadiums s ON s.id = m.stadium_id
       LEFT JOIN managers mg ON mg.id = m.manager_id
       LEFT JOIN elo_history e ON e.match_id = m.id
       WHERE c.type != 'unofficial'
       ORDER BY m.date, m.id`,
    )
    .all() as SeqMatch[];
}

export function allHistoryDigestMatchIds(): string[] {
  return officialSequence().map((m) => m.id);
}

export function latestHistoryDigestMatchIds(n: number): string[] {
  if (n <= 0) return [];
  return getDb()
    .prepare(
      `SELECT id FROM (
         SELECT m.id, m.date
         FROM matches m JOIN competitions c ON c.id = m.competition_id
         WHERE c.type != 'unofficial'
         ORDER BY m.date DESC, m.id DESC
         LIMIT ?
       ) ORDER BY date, id`,
    )
    .all(n)
    .map((r) => (r as { id: string }).id);
}

function historyDigestPath(matchId: string, dir = HISTORY_DIGEST_DIR): string {
  return path.join(dir, `${matchId}.json`);
}

export function historyDigestIds(dir = HISTORY_DIGEST_DIR): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => f.replace(/\.json$/, ""))
    .sort();
}

export function readHistoryDigest(matchId: string, dir = HISTORY_DIGEST_DIR): HistoryDigest | null {
  const file = historyDigestPath(matchId, dir);
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, "utf8")) as HistoryDigest;
}

export function buildHistoryDigest(matchId: string): HistoryDigest {
  const seq = officialSequence();
  const index = seq.findIndex((m) => m.id === matchId);
  if (index < 0) throw new Error(`no official match with id "${matchId}"`);
  const m = seq[index];
  const ref = historyDigestRef(matchId);
  const claims = buildClaims(seq, index);
  const sources = sourcesForMatch(matchId);
  const provenance = sources.length
    ? sources.map((s) => matchSourceProvenance(s, matchId))
    : [];
  const evidenceLinks = [
    { label: "Match page", path: `/match/${matchId}`, url: ref.url.replace(`/history-changed/${matchId}`, `/match/${matchId}`) },
    { label: "API record", path: `/api/v1/matches/${matchId}`, url: ref.url.replace(`/history-changed/${matchId}`, `/api/v1/matches/${matchId}`) },
  ];
  const body = {
    schemaVersion: HISTORY_DIGEST_SCHEMA_VERSION,
    ref,
    matchId,
    canonicalUrl: ref.url,
    match: {
      id: m.id,
      date: m.date,
      season: m.season,
      opponent: m.opponent_name,
      competition: m.competition_name,
      venue: m.venue,
      score: score(m),
      result: m.result,
      manager: m.manager_name,
    },
    evidenceLinks,
    provenance,
    claims,
  };
  return { ...body, claimVersion: claimVersion(body) };
}

export function writeHistoryDigests(matchIds: string[], dir = HISTORY_DIGEST_DIR): string[] {
  if (matchIds.length === 0) return [];
  fs.mkdirSync(dir, { recursive: true });
  const written: string[] = [];
  for (const id of orderHistoryDigestMatchIds(matchIds)) {
    const digest = buildHistoryDigest(id);
    fs.writeFileSync(historyDigestPath(id, dir), `${canonicalStringify(digest)}\n`);
    written.push(id);
  }
  return written;
}

export function orderHistoryDigestMatchIds(
  matchIds: string[],
  lookup: (id: string) => Pick<MatchRow, "date"> | undefined = matchById,
): string[] {
  return [...matchIds].sort((a, b) => {
    const ad = lookup(a)?.date ?? "";
    const bd = lookup(b)?.date ?? "";
    if (ad !== bd) return ad < bd ? -1 : 1;
    if (a === b) return 0;
    return a < b ? -1 : 1;
  });
}

function buildClaims(seq: SeqMatch[], index: number): HistoryDigestClaim[] {
  const m = seq[index];
  const prior = seq.slice(0, index);
  const claims: Omit<HistoryDigestClaim, "id">[] = [
    ...recordClaims(m, prior),
    ...streakClaims(seq, index),
    ...rankClaims(seq, index),
    ...managerClaims(m, prior),
    ...opponentClaims(m, prior),
    ...scorelineClaims(m, prior),
    ...venueClaims(m, prior),
    ...eloClaims(seq, index),
    ...percentileClaims(seq, index),
  ];
  if (claims.length === 0) {
    claims.push({
      kind: "ledger-entry",
      title: "A result added to the ledger",
      text: `United ${score(m)} ${m.opponent_name} became match ${index + 1} in the official record.`,
      evidencePath: `/match/${m.id}`,
      evidenceUrl: historyDigestRef(m.id).url.replace(`/history-changed/${m.id}`, `/match/${m.id}`),
      value: index + 1,
    });
  }
  return claims.map((c, i) => digestClaim(m.id, i + 1, c));
}

function recordClaims(m: SeqMatch, prior: SeqMatch[]): Omit<HistoryDigestClaim, "id">[] {
  const priorGoals = prior.length ? Math.max(...prior.map((p) => p.gf)) : null;
  const priorMargin = prior.length ? Math.max(...prior.map((p) => p.gf - p.ga)) : null;
  const out: Omit<HistoryDigestClaim, "id">[] = [];
  if (priorGoals === null || m.gf > priorGoals) {
    out.push(baseClaim(m, "record", "United goals record extended", `United's ${m.gf} goals against ${m.opponent_name} set a new high for goals scored in one official match.`, m.gf));
  } else if (m.gf === priorGoals && m.gf >= 5) {
    out.push(baseClaim(m, "record", "Joined the top-scoring tier", `United's ${m.gf} goals matched the existing single-match scoring high.`, m.gf));
  }
  const margin = m.gf - m.ga;
  if (margin > 0 && (priorMargin === null || margin > priorMargin)) {
    out.push(baseClaim(m, "record", "Biggest-win margin extended", `The ${score(m)} result moved United's biggest official winning margin to ${margin}.`, margin));
  }
  return out;
}

function streakClaims(seq: SeqMatch[], index: number): Omit<HistoryDigestClaim, "id">[] {
  const out: Omit<HistoryDigestClaim, "id">[] = [];
  const kinds: StreakKind[] = ["unbeaten", "winning", "scoring", "clean-sheet"];
  for (const kind of kinds) {
    if (streakHolds(seq[index], kind)) {
      const prevHolds = index > 0 && streakHolds(seq[index - 1], kind);
      if (!prevHolds) {
        const len = runLengthForward(seq, index, kind);
        if (len >= 3) out.push(baseClaim(seq[index], "streak-started", `${streakLabel(kind)} run started`, `This match began a ${len}-match ${streakNoun(kind)} run.`, len));
      }
    } else if (index > 0 && streakHolds(seq[index - 1], kind)) {
      const len = runLengthBackward(seq, index - 1, kind);
      if (len >= 3) out.push(baseClaim(seq[index], "streak-ended", `${streakLabel(kind)} run ended`, `This result ended a ${len}-match ${streakNoun(kind)} run.`, len));
    }
  }
  return out;
}

function rankClaims(seq: SeqMatch[], index: number): Omit<HistoryDigestClaim, "id">[] {
  const m = seq[index];
  if (m.elo_post == null || index === 0) return [];
  const before = eloRank(seq.slice(0, index), seq[index - 1].elo_post);
  const after = eloRank(seq.slice(0, index + 1), m.elo_post);
  if (before == null || after == null || before === after) return [];
  const direction = after < before ? "rose" : "fell";
  return [baseClaim(m, "rank-change", "Elo rank changed", `United's Elo ${direction} from historical rank ${before} to ${after} after this match.`, after)];
}

function managerClaims(m: SeqMatch, prior: SeqMatch[]): Omit<HistoryDigestClaim, "id">[] {
  if (!m.manager_id || !m.manager_name) return [];
  const n = prior.filter((p) => p.manager_id === m.manager_id).length + 1;
  return MILESTONES.has(n)
    ? [baseClaim(m, "manager-milestone", "Manager milestone", `${m.manager_name} reached ${n} official match${n === 1 ? "" : "es"} in charge.`, n)]
    : [];
}

function opponentClaims(m: SeqMatch, prior: SeqMatch[]): Omit<HistoryDigestClaim, "id">[] {
  const n = prior.filter((p) => p.opponent_id === m.opponent_id).length + 1;
  return MILESTONES.has(n)
    ? [baseClaim(m, "opponent-milestone", "Opponent milestone", `United met ${m.opponent_name} for the ${ordinal(n)} time in official competition.`, n)]
    : [];
}

function scorelineClaims(m: SeqMatch, prior: SeqMatch[]): Omit<HistoryDigestClaim, "id">[] {
  const total = m.gf + m.ga;
  const margin = Math.abs(m.gf - m.ga);
  const same = prior.filter((p) => p.gf === m.gf && p.ga === m.ga).length;
  if (margin >= 5) return [baseClaim(m, "unusual-scoreline", "Extreme score margin", `A ${score(m)} scoreline sits in United's extreme-margin bucket.`, margin)];
  if (total >= 7) return [baseClaim(m, "unusual-scoreline", "Seven-goal match", `The ${score(m)} scoreline made this one of United's high-total matches.`, total)];
  if (same === 0 && total >= 5) return [baseClaim(m, "unusual-scoreline", "New scoreline", `United had not previously recorded a ${score(m)} official result.`, score(m))];
  return [];
}

function venueClaims(m: SeqMatch, prior: SeqMatch[]): Omit<HistoryDigestClaim, "id">[] {
  const venueCount = prior.filter((p) => p.venue === m.venue).length + 1;
  if (MILESTONES.has(venueCount)) {
    return [baseClaim(m, "venue-fact", `${venueLabel(m.venue)} venue milestone`, `This was United's ${ordinal(venueCount)} ${venueLabel(m.venue).toLowerCase()} match in the official record.`, venueCount)];
  }
  if (m.stadium_id && !prior.some((p) => p.stadium_id === m.stadium_id)) {
    return [baseClaim(m, "venue-fact", "New ground in the record", `${m.stadium_name ?? "This ground"} entered United's official venue trail.`, m.stadium_id)];
  }
  return [];
}

function eloClaims(seq: SeqMatch[], index: number): Omit<HistoryDigestClaim, "id">[] {
  const m = seq[index];
  if (m.elo_pre == null || m.elo_post == null) return [];
  const delta = m.elo_post - m.elo_pre;
  if (Math.abs(delta) < 5) return [];
  const word = delta > 0 ? "gained" : "lost";
  return [baseClaim(m, "elo-movement", "Elo moved sharply", `United ${word} ${Math.abs(delta).toFixed(1)} Elo points, from ${Math.round(m.elo_pre)} to ${Math.round(m.elo_post)}.`, Number(delta.toFixed(1)))];
}

function percentileClaims(seq: SeqMatch[], index: number): Omit<HistoryDigestClaim, "id">[] {
  const m = seq[index];
  if (m.elo_post == null) return [];
  const values = seq.slice(0, index + 1).map((p) => p.elo_post).filter((v): v is number => v != null);
  const belowOrEqual = values.filter((v) => v <= m.elo_post!).length;
  const percentile = (100 * belowOrEqual) / values.length;
  if (percentile >= 95) {
    return [baseClaim(m, "historical-percentile", "Top-five-percent Elo", `The post-match rating sat in the ${percentile.toFixed(1)}th percentile of United's history to that date.`, Number(percentile.toFixed(1)))];
  }
  if (percentile <= 5) {
    return [baseClaim(m, "historical-percentile", "Bottom-five-percent Elo", `The post-match rating sat in the ${percentile.toFixed(1)}th percentile of United's history to that date.`, Number(percentile.toFixed(1)))];
  }
  return [];
}

function baseClaim(
  m: SeqMatch,
  kind: HistoryDigestClaimKind,
  title: string,
  text: string,
  value?: number | string,
): Omit<HistoryDigestClaim, "id"> {
  const match = historyDigestRef(m.id).url.replace(`/history-changed/${m.id}`, `/match/${m.id}`);
  return { kind, title, text, evidencePath: `/match/${m.id}`, evidenceUrl: match, ...(value !== undefined ? { value } : {}) };
}

function streakHolds(m: SeqMatch, kind: StreakKind): boolean {
  switch (kind) {
    case "unbeaten":
      return m.result !== "L";
    case "winning":
      return m.result === "W";
    case "scoring":
      return m.gf > 0;
    case "clean-sheet":
      return m.ga === 0;
  }
}

function streakLabel(kind: StreakKind): string {
  return kind === "clean-sheet" ? "Clean-sheet" : kind.charAt(0).toUpperCase() + kind.slice(1);
}

function streakNoun(kind: StreakKind): string {
  switch (kind) {
    case "unbeaten":
      return "unbeaten";
    case "winning":
      return "winning";
    case "scoring":
      return "scoring";
    case "clean-sheet":
      return "clean-sheet";
  }
}

function runLengthForward(seq: SeqMatch[], start: number, kind: StreakKind): number {
  let n = 0;
  for (let i = start; i < seq.length && streakHolds(seq[i], kind); i++) n++;
  return n;
}

function runLengthBackward(seq: SeqMatch[], end: number, kind: StreakKind): number {
  let n = 0;
  for (let i = end; i >= 0 && streakHolds(seq[i], kind); i--) n++;
  return n;
}

function eloRank(seq: SeqMatch[], rating: number | null): number | null {
  if (rating == null) return null;
  const higher = seq.filter((m) => m.elo_post != null && m.elo_post > rating).length;
  return higher + 1;
}

function ordinal(n: number): string {
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${n}th`;
  switch (n % 10) {
    case 1:
      return `${n}st`;
    case 2:
      return `${n}nd`;
    case 3:
      return `${n}rd`;
    default:
      return `${n}th`;
  }
}

export function digestTitle(digest: HistoryDigest): string {
  return `What ${fmtDateLong(digest.match.date)} changed`;
}

export function digestSummary(digest: HistoryDigest): string {
  const first = digest.claims[0];
  return first
    ? `${digest.match.score} v ${digest.match.opponent}: ${first.text}`
    : `${digest.match.score} v ${digest.match.opponent}, added to the UnitedStats record.`;
}
