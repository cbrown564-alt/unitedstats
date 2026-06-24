import fs from "node:fs";
import path from "node:path";
import { canonicalStringify, claimVersion, historyDigestRef, matchSourceProvenance, type ClaimProvenance, type CitableRef } from "./citations";
import { getDb } from "./db";
import { clubName, fmtDateLong, venueLabel } from "./format";
import { matchById, sourcesForMatch, type MatchRow } from "./queries";

const HISTORY_DIGEST_SCHEMA_VERSION = 1;
export const HISTORY_DIGEST_DIR = path.join(process.cwd(), "data", "history-digests");

export type HistoryDigestClaimKind =
  | "result"
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

export interface RecentDigestCard {
  id: string;
  path: string;
  date: string;
  opponent: string;
  score: string;
  result: "W" | "D" | "L";
  venue: "H" | "A" | "N";
  competition: string;
  /** The editorially-ranked headline change, already humanised. */
  lead: { kind: HistoryDigestClaimKind; title: string; text: string };
}

/** The most recently changed matches, newest first — the live tail of the record
 *  for the explore/home "recently changed" strip. Reads the generated artifacts
 *  only, so it stays a build-time, zero-query call. */
export function recentHistoryDigests(n = 6, dir = HISTORY_DIGEST_DIR): RecentDigestCard[] {
  return historyDigestIds(dir)
    .map((id) => readHistoryDigest(id, dir))
    .filter((d): d is HistoryDigest => d != null)
    .sort((a, b) => (a.match.date === b.match.date ? (a.matchId < b.matchId ? 1 : -1) : a.match.date < b.match.date ? 1 : -1))
    .slice(0, n)
    .map((d) => {
      const lead = rankedClaims(d.claims)[0];
      return {
        id: d.matchId,
        path: d.ref.path,
        date: d.match.date,
        opponent: d.match.opponent,
        score: d.match.score,
        result: d.match.result,
        venue: d.match.venue,
        competition: d.match.competition,
        lead: { kind: lead.kind, title: lead.title, text: lead.text },
      };
    });
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
  // The result claim always fires, so every digest can lead with what actually
  // happened on the pitch rather than an Elo line when nothing bigger landed.
  const claims: Omit<HistoryDigestClaim, "id">[] = [
    ...resultClaims(m, prior),
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
  return claims.map((c, i) => digestClaim(m.id, i + 1, c));
}

/** Prose score, en-dashed for reading (the canonical `score()` stays hyphenated). */
function proseScore(m: SeqMatch): string {
  return `${m.gf}–${m.ga}`;
}

const VENUE_PHRASE: Record<SeqMatch["venue"], string> = {
  H: "at home",
  A: "away",
  N: "at a neutral venue",
};

/** The human floor: what this match was, in plain football language, with one
 *  bit of season context when United won. Always emitted, so an ordinary result
 *  still leads with the game rather than with Elo plumbing. */
function resultClaims(m: SeqMatch, prior: SeqMatch[]): Omit<HistoryDigestClaim, "id">[] {
  const club = clubName(m.date);
  const opp = m.opponent_name;
  const s = proseScore(m);
  const where = VENUE_PHRASE[m.venue];
  let title: string;
  let text: string;
  if (m.result === "W") {
    const n = prior.filter((p) => p.season === m.season && p.competition_name === m.competition_name && p.result === "W").length + 1;
    title = `${club} beat ${opp}`;
    text = `${club} beat ${opp} ${s} ${where}.`;
    if (n >= 2) text += ` Their ${ordinal(n)} ${m.competition_name} win of ${m.season}.`;
  } else if (m.result === "D") {
    title = `${club} drew with ${opp}`;
    text = `${club} drew ${s} with ${opp} ${where}.`;
  } else {
    title = `${club} lost to ${opp}`;
    text = `${club} lost ${s} to ${opp} ${where}.`;
  }
  return [baseClaim(m, "result", title, text, m.result)];
}

function recordClaims(m: SeqMatch, prior: SeqMatch[]): Omit<HistoryDigestClaim, "id">[] {
  const club = clubName(m.date);
  const priorGoals = prior.length ? Math.max(...prior.map((p) => p.gf)) : null;
  const priorMargin = prior.length ? Math.max(...prior.map((p) => p.gf - p.ga)) : null;
  const out: Omit<HistoryDigestClaim, "id">[] = [];
  if (priorGoals === null || m.gf > priorGoals) {
    out.push(baseClaim(m, "record", "A new club scoring high", `${club}'s ${m.gf} goals past ${m.opponent_name} were the most they had ever scored in an official match.`, m.gf));
  } else if (m.gf === priorGoals && m.gf >= 5) {
    out.push(baseClaim(m, "record", "Equalled the scoring high", `Those ${m.gf} goals matched the most ${club} had ever scored in a single official match.`, m.gf));
  }
  const margin = m.gf - m.ga;
  if (margin > 0 && (priorMargin === null || margin > priorMargin)) {
    out.push(baseClaim(m, "record", "A new record winning margin", `The ${proseScore(m)} win was ${club}'s biggest official victory to date, by ${margin} goal${margin === 1 ? "" : "s"}.`, margin));
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
        if (len >= 3) out.push(baseClaim(seq[index], "streak-started", `The start of a ${len}-match ${streakNoun(kind)} run`, `This match opened a ${len}-match ${streakNoun(kind)} run.`, len));
      }
    } else if (index > 0 && streakHolds(seq[index - 1], kind)) {
      const len = runLengthBackward(seq, index - 1, kind);
      if (len >= 3) out.push(baseClaim(seq[index], "streak-ended", `A ${len}-match ${streakNoun(kind)} run ends`, `This result snapped a ${len}-match ${streakNoun(kind)} run.`, len));
    }
  }
  return out;
}

/** Only the top of the all-time table is a "history changed" story. A match that
 *  leaves United rated 2,600th-best of all time hasn't changed history; one that
 *  climbs into their hundred best-ever ratings — or sets a new peak — has. */
const RANK_NOTABLE = 100;

function rankClaims(seq: SeqMatch[], index: number): Omit<HistoryDigestClaim, "id">[] {
  const m = seq[index];
  if (m.elo_post == null) return [];
  const before = index > 0 ? eloRank(seq.slice(0, index), seq[index - 1].elo_post) : null;
  const after = eloRank(seq.slice(0, index + 1), m.elo_post);
  if (after == null || after > RANK_NOTABLE) return [];
  // Fire on a climb into (or within) the all-time elite, or a brand-new peak —
  // not on every match of a long peak era, which would just repeat itself.
  const climbed = before == null || after < before;
  if (!climbed) return [];
  if (after === 1) {
    return [baseClaim(m, "rank-change", "A new Elo peak", `This result lifted United's Elo to the highest it had ever been — a new all-time peak rating.`, 1)];
  }
  return [baseClaim(m, "rank-change", "Among United's best-ever ratings", `United's Elo climbed to the ${ordinal(after)}-best rating in their history to that date.`, after)];
}

function managerClaims(m: SeqMatch, prior: SeqMatch[]): Omit<HistoryDigestClaim, "id">[] {
  if (!m.manager_id || !m.manager_name) return [];
  const n = prior.filter((p) => p.manager_id === m.manager_id).length + 1;
  return MILESTONES.has(n)
    ? [baseClaim(m, "manager-milestone", `${m.manager_name}'s ${ordinal(n)} match in charge`, `This was ${m.manager_name}'s ${ordinal(n)} match as ${clubName(m.date)} manager.`, n)]
    : [];
}

function opponentClaims(m: SeqMatch, prior: SeqMatch[]): Omit<HistoryDigestClaim, "id">[] {
  const n = prior.filter((p) => p.opponent_id === m.opponent_id).length + 1;
  return MILESTONES.has(n)
    ? [baseClaim(m, "opponent-milestone", `The ${ordinal(n)} meeting with ${m.opponent_name}`, `${clubName(m.date)} met ${m.opponent_name} for the ${ordinal(n)} time in official competition.`, n)]
    : [];
}

function scorelineClaims(m: SeqMatch, prior: SeqMatch[]): Omit<HistoryDigestClaim, "id">[] {
  const club = clubName(m.date);
  const total = m.gf + m.ga;
  const margin = Math.abs(m.gf - m.ga);
  const same = prior.filter((p) => p.gf === m.gf && p.ga === m.ga).length;
  if (margin >= 5) return [baseClaim(m, "unusual-scoreline", "A rout, either way", `A ${proseScore(m)} scoreline — a ${margin}-goal gap is the rare, lopsided end of ${club}'s results.`, margin)];
  if (total >= 7) return [baseClaim(m, "unusual-scoreline", "A goal feast", `${total} goals in one match: the ${proseScore(m)} put this among ${club}'s wildest scorelines.`, total)];
  if (same === 0 && total >= 5) return [baseClaim(m, "unusual-scoreline", "A scoreline never seen before", `${club} had never recorded a ${proseScore(m)} official result until this match.`, score(m))];
  return [];
}

function venueClaims(m: SeqMatch, prior: SeqMatch[]): Omit<HistoryDigestClaim, "id">[] {
  const venueCount = prior.filter((p) => p.venue === m.venue).length + 1;
  if (MILESTONES.has(venueCount)) {
    return [baseClaim(m, "venue-fact", `${clubName(m.date)}'s ${ordinal(venueCount)} ${venueLabel(m.venue).toLowerCase()} match`, `This was ${clubName(m.date)}'s ${ordinal(venueCount)} ${venueLabel(m.venue).toLowerCase()} match in the official record.`, venueCount)];
  }
  if (m.stadium_id && !prior.some((p) => p.stadium_id === m.stadium_id)) {
    return [baseClaim(m, "venue-fact", "A new ground in the record", `${m.stadium_name ?? "This ground"} entered ${clubName(m.date)}'s official venue trail for the first time.`, m.stadium_id)];
  }
  return [];
}

function eloClaims(seq: SeqMatch[], index: number): Omit<HistoryDigestClaim, "id">[] {
  const m = seq[index];
  if (m.elo_pre == null || m.elo_post == null) return [];
  const delta = m.elo_post - m.elo_pre;
  if (Math.abs(delta) < 5) return [];
  const word = delta > 0 ? "climbed" : "dropped";
  return [baseClaim(m, "elo-movement", `Elo ${word} ${Math.abs(delta).toFixed(1)} points`, `The result moved United's Elo rating by ${delta > 0 ? "+" : "−"}${Math.abs(delta).toFixed(1)} (${Math.round(m.elo_pre)} → ${Math.round(m.elo_post)}).`, Number(delta.toFixed(1)))];
}

function percentileClaims(seq: SeqMatch[], index: number): Omit<HistoryDigestClaim, "id">[] {
  const m = seq[index];
  if (m.elo_post == null) return [];
  const values = seq.slice(0, index + 1).map((p) => p.elo_post).filter((v): v is number => v != null);
  const belowOrEqual = values.filter((v) => v <= m.elo_post!).length;
  const percentile = (100 * belowOrEqual) / values.length;
  if (percentile >= 95) {
    return [baseClaim(m, "historical-percentile", "Near United's strongest-ever form", `By Elo, United were rated stronger than at all but ${(100 - percentile).toFixed(1)}% of moments in their history to that date (${percentile.toFixed(1)}th percentile).`, Number(percentile.toFixed(1)))];
  }
  if (percentile <= 5) {
    return [baseClaim(m, "historical-percentile", "Near United's lowest-ever ebb", `By Elo, United were rated weaker than at all but ${percentile.toFixed(1)}% of moments in their history to that date (${percentile.toFixed(1)}th percentile).`, Number(percentile.toFixed(1)))];
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

/** Editorial weight by claim kind: all-time records and runs are the strongest
 *  "history changed" stories; the plain result is the human floor that leads only
 *  when nothing bigger fired; Elo plumbing sits at the bottom. */
const KIND_RANK: Record<HistoryDigestClaimKind, number> = {
  record: 0,
  "streak-ended": 1,
  "streak-started": 1,
  "manager-milestone": 2,
  "opponent-milestone": 2,
  "unusual-scoreline": 3,
  "historical-percentile": 4,
  "rank-change": 5,
  result: 6,
  "elo-movement": 7,
  "venue-fact": 8,
  "ledger-entry": 9,
};

function claimMagnitude(claim: HistoryDigestClaim): number {
  return typeof claim.value === "number" ? Math.abs(claim.value) : 0;
}

/** Claims most-significant first, so the page (and summary) lead with the change
 *  that mattered most rather than whatever the detectors emitted first. Ties within
 *  a kind break by magnitude (a 24-match run leads a 3-match one). */
export function rankedClaims(claims: HistoryDigestClaim[]): HistoryDigestClaim[] {
  return [...claims].sort((a, b) => {
    if (KIND_RANK[a.kind] !== KIND_RANK[b.kind]) return KIND_RANK[a.kind] - KIND_RANK[b.kind];
    return claimMagnitude(b) - claimMagnitude(a);
  });
}

export function digestTitle(digest: HistoryDigest): string {
  return `What ${fmtDateLong(digest.match.date)} changed`;
}

export function digestSummary(digest: HistoryDigest): string {
  const first = rankedClaims(digest.claims)[0];
  if (!first) return `${digest.match.score} v ${digest.match.opponent}, added to the UnitedStats record.`;
  // The result claim already names the score and opponent; anything else needs
  // that context prepended so the summary stands alone.
  return first.kind === "result" ? first.text : `${digest.match.score} v ${digest.match.opponent}: ${first.text}`;
}
