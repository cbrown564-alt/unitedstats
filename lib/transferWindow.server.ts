import type Database from "better-sqlite3";
import { getDb } from "./db";
import { CURATED_NIGHTS } from "./curatedNights";
import { chargeRankedNights } from "./rediscovery";
import { scoreline } from "./format";
import type { InflationIndices } from "./inflation";
import { CUP_WON_PREDICATE, seasonMatches, type TransferRow } from "./queries";
import { isKnownFee, isMarketTransfer, seasonDashLabel } from "./transferTaxonomy";
import { buildTransferReceipt, shouldRenderTransferReceipt } from "./transferReceipt";
import { transferWindowExemplars } from "./transferFeature";
import {
  buildWindowLanes,
  POSITION_GROUP_LABELS,
  POSITION_GROUP_ORDER,
  type TransferWindowCampaign,
  type TransferWindowManagerSpell,
  type TransferWindowModel,
  type TransferWindowNight,
  type TransferWindowPositionRow,
} from "./transferWindow";
import type { PositionGroup } from "./currentTransferWindow";
import type { TransferReceipt } from "./transferReceiptTypes";

/** Receipts shown inline on a window page — the rest stay in the ledger below. */
const WINDOW_RECEIPT_LIMIT = 3;

function previousSeason(season: string): string | null {
  const startYear = Number.parseInt(season.slice(0, 4), 10);
  if (!Number.isFinite(startYear)) return null;
  return `${startYear - 1}-${String(startYear % 100).padStart(2, "0")}`;
}

/**
 * The squad that actually took the field in a season — a recorded fact, not a
 * registered-squad list, which the record does not hold. Bench-only appearances
 * are excluded to match every other appearance aggregate in the repository.
 */
function squadPositionCounts(
  db: Database.Database,
  season: string,
): { counts: Map<PositionGroup, number>; covered: number; total: number } {
  const rows = db
    .prepare(
      `SELECT DISTINCT l.player_id id, pp.bucket bucket
       FROM match_lineups l
       JOIN matches m ON m.id = l.match_id
       LEFT JOIN player_positions pp ON pp.player_id = l.player_id
       WHERE l.player_side = 'united' AND l.bench = 0 AND m.season = ?`,
    )
    .all(season) as Array<{ id: string; bucket: string | null }>;

  const counts = new Map<PositionGroup, number>();
  let covered = 0;
  for (const row of rows) {
    if (!row.bucket) continue;
    covered++;
    const group = row.bucket as PositionGroup;
    counts.set(group, (counts.get(group) ?? 0) + 1);
  }
  return { counts, covered, total: rows.length };
}

/**
 * Position balance either side of the window: who played the season before, who
 * played the season after. Suppressed entirely when the following season has no
 * recorded appearances — an open window has no "after" to show, and a zero
 * column would read as a squad that vanished.
 */
function positionBalance(
  db: Database.Database,
  season: string,
  rows: TransferRow[],
  positionOf: (playerId: string) => PositionGroup | null,
): { balance: TransferWindowPositionRow[] | null; coverage: { covered: number; total: number } } {
  const after = squadPositionCounts(db, season);
  const prior = previousSeason(season);
  const before = prior
    ? squadPositionCounts(db, prior)
    : { counts: new Map<PositionGroup, number>(), covered: 0, total: 0 };
  const coverage = {
    covered: before.covered + after.covered,
    total: before.total + after.total,
  };
  if (after.total === 0 || before.total === 0) return { balance: null, coverage };

  const arrivals = new Map<PositionGroup, number>();
  const departures = new Map<PositionGroup, number>();
  for (const row of rows) {
    if (!row.player_id) continue;
    const group = positionOf(row.player_id);
    if (!group) continue;
    const bucket = row.direction === "in" ? arrivals : departures;
    bucket.set(group, (bucket.get(group) ?? 0) + 1);
  }

  return {
    balance: POSITION_GROUP_ORDER.map((group) => ({
      group,
      label: POSITION_GROUP_LABELS[group],
      before: before.counts.get(group) ?? 0,
      after: after.counts.get(group) ?? 0,
      arrivals: arrivals.get(group) ?? 0,
      departures: departures.get(group) ?? 0,
    })),
    coverage,
  };
}

/** Deals attributed to whoever held the job on the transfer date, in date order. */
function managerSpells(db: Database.Database, rows: TransferRow[]): TransferWindowManagerSpell[] {
  const stmt = db.prepare(
    `SELECT mt.manager_id id, m.name name
     FROM manager_tenures mt
     JOIN managers m ON m.id = mt.manager_id
     WHERE ? >= mt.date_from AND (mt.date_to IS NULL OR ? <= mt.date_to)
     ORDER BY mt.date_from DESC
     LIMIT 1`,
  );
  const spells = new Map<string, TransferWindowManagerSpell>();
  for (const row of [...rows].sort((a, b) => (a.date ?? "").localeCompare(b.date ?? ""))) {
    if (!row.date) continue;
    const manager = stmt.get(row.date, row.date) as { id: string; name: string } | undefined;
    if (!manager) continue;
    const spell = spells.get(manager.id) ?? {
      managerId: manager.id,
      managerName: manager.name,
      deals: 0,
      firstDealDate: row.date,
      lastDealDate: row.date,
    };
    spell.deals++;
    spell.lastDealDate = row.date;
    spells.set(manager.id, spell);
  }
  return [...spells.values()].sort((a, b) => (a.firstDealDate ?? "").localeCompare(b.firstDealDate ?? ""));
}

function campaignForSeason(db: Database.Database, season: string): TransferWindowCampaign | null {
  const matches = seasonMatches(season);
  if (matches.length === 0) return null;

  let wins = 0;
  let draws = 0;
  let losses = 0;
  let goalsFor = 0;
  let goalsAgainst = 0;
  for (const match of matches) {
    if (match.result === "W") wins++;
    else if (match.result === "D") draws++;
    else losses++;
    goalsFor += match.gf;
    goalsAgainst += match.ga;
  }

  const league = db
    .prepare(
      `SELECT c.name name, ss.position position, ss.league_size league_size
       FROM season_summaries ss JOIN competitions c ON c.id = ss.competition_id
       WHERE ss.season = ? AND c.type = 'league'
       ORDER BY ss.position IS NULL, ss.position
       LIMIT 1`,
    )
    .get(season) as { name: string; position: number | null; league_size: number | null } | undefined;

  // Honours are the same predicate the rest of the repository uses: a top-flight
  // title, or a cup whose deciding final was won. Nothing is inferred.
  const cups = db
    .prepare(
      `SELECT DISTINCT c.name name
       FROM matches m JOIN competitions c ON c.id = m.competition_id
       WHERE m.season = ? AND ${CUP_WON_PREDICATE}`,
    )
    .all(season) as Array<{ name: string }>;
  const honours = cups.map((cup) => cup.name);
  if (league && league.position === 1 && (league.name === "First Division" || league.name === "Premier League")) {
    honours.unshift(league.name);
  }

  return {
    season,
    played: matches.length,
    wins,
    draws,
    losses,
    goalsFor,
    goalsAgainst,
    leagueName: league?.name ?? null,
    leaguePosition: league?.position ?? null,
    leagueSize: league?.league_size ?? null,
    honours,
  };
}

/** Curated stakes win where they exist; otherwise the charge scorer's own reason. */
function definingNights(season: string, limit = 3): TransferWindowNight[] {
  const matches = seasonMatches(season);
  if (matches.length === 0) return [];
  const stakesById = new Map(CURATED_NIGHTS.map((night) => [night.id, night.stakes]));
  return chargeRankedNights(matches, limit).map((night) => {
    const authored = stakesById.get(night.match.id);
    // The charge reason is a sentence fragment ("a semi-final") built for inline
    // prose; on a card it stands alone, so it needs a capital.
    const computed = night.reason.charAt(0).toUpperCase() + night.reason.slice(1);
    return {
      matchId: night.match.id,
      date: night.match.date,
      opponent: night.match.opponent_name,
      score: scoreline(
        night.match.gf,
        night.match.ga,
        night.match.pen_gf != null ? [night.match.pen_gf, night.match.pen_ga] : null,
        !!night.match.aet,
      ),
      competition: night.match.competition_name,
      note: authored ?? computed,
      authored: authored != null,
    };
  });
}

/** The window's most consequential deals by published fee, receipts-first. */
function windowReceipts(
  rows: TransferRow[],
  indices: InflationIndices,
  transfers: TransferRow[],
): TransferReceipt[] {
  const receipts: TransferReceipt[] = [];
  const ranked = rows
    .filter((row) => isMarketTransfer(row) && isKnownFee(row))
    .sort((a, b) => b.fee_gbp! - a.fee_gbp!);
  for (const row of ranked) {
    if (receipts.length >= WINDOW_RECEIPT_LIMIT) break;
    const receipt = buildTransferReceipt(row.id, indices, transfers);
    if (receipt && shouldRenderTransferReceipt(receipt)) receipts.push(receipt);
  }
  return receipts;
}

export function buildTransferWindow(
  season: string,
  transfers: TransferRow[],
  indices: InflationIndices,
  positionMap: Record<string, string>,
  db: Database.Database = getDb(),
): TransferWindowModel | null {
  const exemplars = transferWindowExemplars(transfers);
  const exemplar = exemplars.find((entry) => entry.season === season);
  if (!exemplar) return null;

  const rows = transfers.filter((row) => row.season === season);
  if (rows.length === 0) return null;

  const positionOf = (playerId: string): PositionGroup | null =>
    (positionMap[playerId] as PositionGroup | undefined) ?? null;
  const { balance, coverage } = positionBalance(db, season, rows, positionOf);
  const index = exemplars.findIndex((entry) => entry.season === season);

  return {
    season,
    seasonLabel: seasonDashLabel(season),
    exemplar,
    transfers: rows,
    lanes: buildWindowLanes(rows),
    managers: managerSpells(db, rows),
    positionBalance: balance,
    positionCoverage: coverage,
    campaign: campaignForSeason(db, season),
    definingNights: definingNights(season),
    receipts: windowReceipts(rows, indices, transfers),
    feeCoverage: { known: rows.filter(isKnownFee).length, total: rows.length },
    verifiedAt: rows.reduce<string | null>(
      (latest, row) => (!row.date || (latest && row.date <= latest) ? latest : row.date),
      null,
    ),
    // Exemplars are ordered newest first, so the *next* window is the earlier index.
    neighbours: {
      next: exemplars[index - 1] ?? null,
      previous: exemplars[index + 1] ?? null,
    },
  };
}
