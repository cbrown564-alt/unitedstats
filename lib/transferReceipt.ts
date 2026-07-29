import { getDb } from "./db";
import { adjustFeeGbp, transferSeason, type InflationIndices } from "./inflation";
import { loadInflationIndices } from "./inflationIndices";
import { CURATED_NIGHTS } from "./curatedNights";
import { allTransfers, type TransferRow } from "./queries";
import { topTransfersForMode } from "./transferAggregates";
import type {
  AssistCoverage,
  TransferFeeBand,
  TransferReceipt,
  TransferReceiptDeal,
  TransferReceiptDefiningNight,
  TransferReceiptExit,
  TransferReceiptLeagueFinish,
  TransferReceiptSpell,
  TransferReceiptTeamContext,
  TransferSpellState,
} from "./transferReceiptTypes";

export type {
  AssistCoverage,
  TransferFeeBand,
  TransferReceipt,
  TransferReceiptDeal,
  TransferReceiptDefiningNight,
  TransferReceiptExit,
  TransferReceiptLeagueFinish,
  TransferReceiptSpell,
  TransferReceiptTeamContext,
  TransferSpellState,
} from "./transferReceiptTypes";
export { displayReceiptFee } from "./transferReceiptTypes";

const CURATED_ASSISTS_LAST_SEASON = "2014-15";
const RECEIPT_MIN_YEAR = 1900;

/** Authored deals that always merit a receipt when linked to a player. */
export const AUTHORED_RECEIPT_TRANSFER_IDS = new Set([
  "2016-08-09-paul-pogba-in",
  "2009-07-01-cristiano-ronaldo-out",
  "1992-11-27-eric-cantona-in",
]);

interface SpellWindow {
  spellId: string;
  spellIndex: number;
  spellCount: number;
  repeatPlayer: boolean;
  signingTransferId: string;
  signingDate: string | null;
  endDate: string | null;
  exitTransferId: string | null;
  nextSigningTransferId: string | null;
  state: TransferSpellState;
}

interface SpellStats {
  apps: number;
  starts: number;
  goals: number;
  assists: number;
  teamMatches: number;
  observationSeasons: number;
  seasons: string[];
  debutDate: string | null;
  finalAppearanceDate: string | null;
  peakSeason: string | null;
  peakSeasonApps: number;
}

function chronological(transfers: TransferRow[]): TransferRow[] {
  return [...transfers].sort((a, b) => {
    if (!a.date && !b.date) return 0;
    if (!a.date) return 1;
    if (!b.date) return -1;
    return a.date.localeCompare(b.date);
  });
}

function permanentSignings(transfers: TransferRow[]): TransferRow[] {
  return chronological(transfers).filter((t) => t.direction === "in" && t.type === "permanent" && t.date);
}

function parseSourceIds(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((entry) => {
      if (typeof entry === "string") return [entry];
      if (entry && typeof entry === "object" && "source_id" in entry) {
        const value = (entry as { source_id?: unknown }).source_id;
        return typeof value === "string" ? [value] : [];
      }
      return [];
    });
  } catch {
    return [];
  }
}

function feeBandFromMultiple(multiple: number | null): TransferFeeBand | null {
  if (multiple == null || !Number.isFinite(multiple)) return null;
  if (multiple >= 4) return "extreme";
  if (multiple >= 2) return "high";
  if (multiple >= 1) return "upper-middle";
  if (multiple >= 0.5) return "lower-middle";
  return "low";
}

function feeBandLabel(band: TransferFeeBand | null): string | null {
  if (!band) return null;
  const labels: Record<TransferFeeBand, string> = {
    low: "Low relative cost",
    "lower-middle": "Lower-middle relative cost",
    "upper-middle": "Upper-middle relative cost",
    high: "High relative cost",
    extreme: "Record-level relative cost",
  };
  return labels[band];
}

function managerAtDate(date: string | null): { managerId: string | null; managerName: string | null } {
  if (!date) return { managerId: null, managerName: null };
  const row = getDb()
    .prepare(
      `SELECT mt.manager_id managerId, m.name managerName
       FROM manager_tenures mt
       JOIN managers m ON m.id = mt.manager_id
       WHERE ? >= mt.date_from AND (mt.date_to IS NULL OR ? <= mt.date_to)
       ORDER BY mt.date_from DESC
       LIMIT 1`,
    )
    .get(date, date) as { managerId: string; managerName: string } | undefined;
  return row ?? { managerId: null, managerName: null };
}

function seasonStart(season: string): string {
  return `${season.slice(0, 4)}-07-01`;
}

function spellStats(playerId: string, start: string, end: string | null): SpellStats | null {
  const upper = end ?? "9999-12-31";
  const db = getDb();
  const appearances = db
    .prepare(
      `SELECT COUNT(*) apps,
              COALESCE(SUM(l.started = 1), 0) starts,
              COUNT(DISTINCT m.season) observation_seasons
       FROM match_lineups l
       JOIN matches m ON m.id = l.match_id
       WHERE l.player_id = ?
         AND l.player_side = 'united'
         AND l.bench = 0
         AND m.date >= ?
         AND m.date <= ?`,
    )
    .get(playerId, start, upper) as { apps: number; starts: number; observation_seasons: number };

  const perSeason = db
    .prepare(
      `SELECT m.season season, COUNT(*) apps,
              MIN(m.date) debut, MAX(m.date) latest
       FROM match_lineups l
       JOIN matches m ON m.id = l.match_id
       WHERE l.player_id = ?
         AND l.player_side = 'united'
         AND l.bench = 0
         AND m.date >= ?
         AND m.date <= ?
       GROUP BY m.season
       ORDER BY m.season`,
    )
    .all(playerId, start, upper) as { season: string; apps: number; debut: string; latest: string }[];

  const events = db
    .prepare(
      `SELECT
         COALESCE(SUM(CASE
           WHEN e.player_id = ?
             AND ((e.player_side = 'united' AND e.type IN ('goal','pen-goal')) OR e.type = 'own-goal-for')
           THEN 1 ELSE 0 END), 0) goals,
         COALESCE(SUM(CASE
           WHEN e.assist_player_id = ?
             AND e.assist_side = 'united'
             AND e.type IN ('goal','pen-goal')
           THEN 1 ELSE 0 END), 0) assists
       FROM match_events e
       JOIN matches m ON m.id = e.match_id
       WHERE m.date >= ? AND m.date <= ?`,
    )
    .get(playerId, playerId, start, upper) as { goals: number; assists: number };

  const teamMatches = (
    db.prepare("SELECT COUNT(*) n FROM matches WHERE date >= ? AND date <= ?").get(start, upper) as { n: number }
  ).n;

  const peak = perSeason.reduce<{ season: string; apps: number } | null>(
    (best, row) => (!best || row.apps > best.apps ? { season: row.season, apps: row.apps } : best),
    null,
  );

  return {
    apps: appearances.apps,
    starts: appearances.starts,
    goals: events.goals,
    assists: events.assists,
    teamMatches,
    observationSeasons: appearances.observation_seasons,
    seasons: perSeason.map((row) => row.season),
    debutDate: perSeason[0]?.debut ?? null,
    finalAppearanceDate: perSeason.at(-1)?.latest ?? null,
    peakSeason: peak?.season ?? null,
    peakSeasonApps: peak?.apps ?? 0,
  };
}

function assistCoverageForSeasons(seasons: string[]): AssistCoverage {
  if (seasons.length === 0) return "unavailable";
  const sorted = [...seasons].sort();
  const first = sorted[0];
  const last = sorted.at(-1)!;
  if (last <= CURATED_ASSISTS_LAST_SEASON) return "curated-lane";
  if (first > CURATED_ASSISTS_LAST_SEASON) return "match-attributed";
  return "partial";
}

function honourSeasonsForWindow(
  playerId: string,
  startSeason: string | null,
  endSeason: string | null,
): string[] {
  const rows = getDb()
    .prepare(
      `WITH honours AS (
         SELECT ss.competition_id, ss.season, 'league' cat
         FROM season_summaries ss JOIN competitions c ON c.id = ss.competition_id
         WHERE c.type = 'league' AND ss.position = 1 AND c.name IN ('First Division','Premier League')
         UNION ALL
         SELECT m.competition_id, m.season, c.type cat
         FROM matches m JOIN competitions c ON c.id = m.competition_id
         WHERE c.type IN ('domestic-cup','league-cup','european','super-cup','world')
           AND m.outcome = 'W'
           AND m.date = (
             SELECT MAX(m2.date) FROM matches m2
             WHERE m2.season = m.season AND m2.competition_id = m.competition_id
           )
           AND (
             (m.round LIKE '%final%' AND m.round NOT LIKE '%semi%' AND m.round NOT LIKE '%quarter%')
             OR (c.type IN ('super-cup','world') AND m.round IS NULL)
           )
       )
       SELECT DISTINCT h.season
       FROM honours h
       WHERE EXISTS (
         SELECT 1 FROM match_lineups l JOIN matches m ON m.id = l.match_id
         WHERE l.player_id = ? AND l.player_side = 'united' AND l.bench = 0
           AND m.competition_id = h.competition_id AND m.season = h.season
         GROUP BY m.competition_id, m.season
         HAVING COUNT(*) >= CASE WHEN h.cat = 'league' THEN 5 ELSE 1 END
       )
       ORDER BY h.season`,
    )
    .all(playerId) as { season: string }[];

  return rows
    .map((row) => row.season)
    .filter((season) => (!startSeason || season >= startSeason) && (!endSeason || season <= endSeason));
}

function leagueFinishesForWindow(startSeason: string | null, endSeason: string | null): TransferReceiptLeagueFinish[] {
  if (!startSeason && !endSeason) return [];
  const rows = getDb()
    .prepare(
      `SELECT ss.season, ss.position, c.name
       FROM season_summaries ss JOIN competitions c ON c.id = ss.competition_id
       WHERE c.type = 'league'
         AND (? IS NULL OR ss.season >= ?)
         AND (? IS NULL OR ss.season <= ?)
       ORDER BY ss.season`,
    )
    .all(startSeason, startSeason, endSeason, endSeason) as {
    season: string;
    position: number | null;
    name: string;
  }[];

  return rows.map((row) => {
    const topFlight = row.name === "First Division" || row.name === "Premier League";
    return {
      season: row.season,
      position: row.position,
      topFlight,
      champion: topFlight && row.position === 1,
    };
  });
}

function definingNightsInWindow(
  playerId: string,
  start: string | null,
  end: string | null,
): TransferReceiptDefiningNight[] {
  if (!start) return [];
  const upper = end ?? "9999-12-31";
  const curatedIds = CURATED_NIGHTS.map((night) => night.id);
  if (curatedIds.length === 0) return [];

  const placeholders = curatedIds.map(() => "?").join(",");
  const rows = getDb()
    .prepare(
      `SELECT m.id, m.date, m.opponent_name opponent, m.gf, m.ga, m.result
       FROM matches m
       JOIN match_lineups l ON l.match_id = m.id
       WHERE m.id IN (${placeholders})
         AND l.player_id = ?
         AND l.player_side = 'united'
         AND l.bench = 0
         AND m.date >= ?
         AND m.date <= ?
       ORDER BY m.date DESC
       LIMIT 3`,
    )
    .all(...curatedIds, playerId, start, upper) as {
    id: string;
    date: string;
    opponent: string;
    gf: number;
    ga: number;
    result: string;
  }[];

  const stakesById = new Map(CURATED_NIGHTS.map((night) => [night.id, night.stakes]));
  return rows.map((row) => ({
    matchId: row.id,
    stakes: stakesById.get(row.id) ?? "A defining night during the spell.",
    date: row.date,
    opponent: row.opponent,
    score: `${row.gf}–${row.ga}`,
  }));
}

function resolveSpellWindow(deal: TransferRow, playerTransfers: TransferRow[]): SpellWindow | null {
  if (!deal.player_id) return null;

  const signings = permanentSignings(playerTransfers);
  if (signings.length === 0 && deal.direction === "out") return null;

  const exits = chronological(playerTransfers).filter(
    (t) => t.direction === "out" && t.date && t.type !== "loan",
  );

  if (deal.direction === "in" && deal.type === "permanent" && deal.date) {
    const spellIndex = signings.findIndex((row) => row.id === deal.id);
    if (spellIndex < 0) return null;
    const nextSigning = signings[spellIndex + 1];
    const exit =
      exits.find(
        (row) =>
          row.date! >= deal.date! &&
          (!nextSigning?.date || row.date! < nextSigning.date!) &&
          row.date! >= deal.date!,
      ) ?? null;
    const endDate = exit?.date ?? nextSigning?.date ?? null;
    const state = resolveSpellState(deal.player_id, deal.date, endDate, exit, nextSigning);
    return {
      spellId: `${deal.player_id}:${spellIndex + 1}`,
      spellIndex: spellIndex + 1,
      spellCount: signings.length,
      repeatPlayer: signings.length > 1,
      signingTransferId: deal.id,
      signingDate: deal.date,
      endDate,
      exitTransferId: exit?.id ?? null,
      nextSigningTransferId: nextSigning?.id ?? null,
      state,
    };
  }

  if (deal.direction === "out" && deal.date) {
    const signing =
      [...signings].reverse().find((row) => row.date && row.date <= deal.date!) ?? null;
    if (!signing?.date) return null;
    const spellIndex = signings.findIndex((row) => row.id === signing.id);
    const nextSigning = signings[spellIndex + 1];
    const state = resolveSpellState(deal.player_id, signing.date, deal.date, deal, nextSigning);
    return {
      spellId: `${deal.player_id}:${spellIndex + 1}`,
      spellIndex: spellIndex + 1,
      spellCount: signings.length,
      repeatPlayer: signings.length > 1,
      signingTransferId: signing.id,
      signingDate: signing.date,
      endDate: deal.date,
      exitTransferId: deal.id,
      nextSigningTransferId: nextSigning?.id ?? null,
      state,
    };
  }

  // Loan or other deal types: window from deal date to next permanent move or latest appearance.
  if (!deal.date) return null;
  const endDate =
    exits.find((row) => row.date! > deal.date!)?.date ??
    signings.find((row) => row.date! > deal.date!)?.date ??
    null;
  return {
    spellId: `transfer:${deal.id}`,
    spellIndex: 1,
    spellCount: 1,
    repeatPlayer: signings.length > 1,
    signingTransferId: deal.id,
    signingDate: deal.date,
    endDate,
    exitTransferId: deal.direction === "out" ? deal.id : null,
    nextSigningTransferId: signings.find((row) => row.date! > deal.date!)?.id ?? null,
    state: resolveSpellState(deal.player_id, deal.date, endDate, null, null),
  };
}

function resolveSpellState(
  playerId: string,
  start: string | null,
  end: string | null,
  exit: TransferRow | null,
  nextSigning: TransferRow | undefined | null,
): TransferSpellState {
  if (!playerId || !start) return "unresolved";
  if (exit || nextSigning) return "completed";
  const latestMatch = getDb()
    .prepare(
      `SELECT MAX(m.date) last_date
       FROM match_lineups l JOIN matches m ON m.id = l.match_id
       WHERE l.player_id = ? AND l.player_side = 'united' AND l.bench = 0`,
    )
    .get(playerId) as { last_date: string | null };
  const latestSeason = getDb()
    .prepare("SELECT season FROM matches ORDER BY date DESC LIMIT 1")
    .get() as { season: string };
  const activeThreshold = seasonStart(latestSeason.season);
  if (latestMatch.last_date && latestMatch.last_date >= activeThreshold) return "ongoing";
  return "unclosed";
}

function buildDealSection(deal: TransferRow, indices: InflationIndices): TransferReceiptDeal {
  const sourcesRow = getDb()
    .prepare("SELECT sources FROM transfers WHERE id = ?")
    .get(deal.id) as { sources: string | null } | undefined;
  const resolvedSeason = transferSeason(deal.date, deal.season);
  const footballSeason = resolvedSeason ? indices.football.seasons[resolvedSeason] : undefined;
  const feePlMeanMultiple =
    deal.fee_kind === "fee" && deal.fee_gbp != null && footballSeason
      ? deal.fee_gbp / footballSeason.meanGbp
      : null;
  const feeBand = feeBandFromMultiple(feePlMeanMultiple);
  const manager = managerAtDate(deal.date);

  return {
    transferId: deal.id,
    playerId: deal.player_id,
    playerName: deal.player_name,
    thumbUrl: deal.thumb_url,
    direction: deal.direction,
    date: deal.date,
    datePrecision: deal.date_precision,
    season: resolvedSeason,
    club: deal.club,
    type: deal.type,
    feeGbp: deal.fee_kind === "fee" ? deal.fee_gbp : null,
    feeKind: deal.fee_kind,
    feeCpiGbp: adjustFeeGbp(deal.fee_gbp, deal.fee_kind, deal.date, deal.season, "cpi", indices),
    feeFootballGbp: adjustFeeGbp(deal.fee_gbp, deal.fee_kind, deal.date, deal.season, "football", indices),
    feeBand,
    feeBandLabel: feeBandLabel(feeBand),
    managerId: manager.managerId,
    managerName: manager.managerName,
    sources: parseSourceIds(sourcesRow?.sources ?? null),
  };
}

function buildExitSection(
  exitTransfer: TransferRow | null,
  indices: InflationIndices,
  subsequentSigningId: string | null,
): TransferReceiptExit | null {
  if (!exitTransfer) return null;
  return {
    transferId: exitTransfer.id,
    date: exitTransfer.date,
    datePrecision: exitTransfer.date_precision,
    destination: exitTransfer.club,
    feeGbp: exitTransfer.fee_kind === "fee" ? exitTransfer.fee_gbp : null,
    feeKind: exitTransfer.fee_kind,
    feeCpiGbp: adjustFeeGbp(
      exitTransfer.fee_gbp,
      exitTransfer.fee_kind,
      exitTransfer.date,
      exitTransfer.season,
      "cpi",
      indices,
    ),
    feeFootballGbp: adjustFeeGbp(
      exitTransfer.fee_gbp,
      exitTransfer.fee_kind,
      exitTransfer.date,
      exitTransfer.season,
      "football",
      indices,
    ),
    subsequentSigningId,
  };
}

function roleNote(stats: SpellStats | null): string | null {
  if (!stats || stats.teamMatches === 0) return null;
  const share = stats.apps / stats.teamMatches;
  if (share >= 0.45) return `Selected for ${Math.round(share * 100)}% of United matches during the spell.`;
  if (share >= 0.2) return `Involved in ${Math.round(share * 100)}% of United matches during the spell.`;
  if (stats.apps > 0) return `Recorded in ${stats.apps} matches during the spell.`;
  return null;
}

export function transferById(transferId: string, transfers?: TransferRow[]): TransferRow | undefined {
  const rows = transfers ?? allTransfers();
  return rows.find((row) => row.id === transferId);
}

export function buildTransferReceipt(
  transferId: string,
  indices: InflationIndices = loadInflationIndices(),
  transfers?: TransferRow[],
): TransferReceipt | null {
  const allRows = transfers ?? allTransfers();
  const dealRow = transferById(transferId, allRows);
  if (!dealRow) return null;

  const deal = buildDealSection(dealRow, indices);
  const playerRows = dealRow.player_id
    ? allRows.filter((row) => row.player_id === dealRow.player_id)
    : [];
  const window = resolveSpellWindow(dealRow, playerRows);

  let spell: TransferReceiptSpell | null = null;
  let teamContext: TransferReceiptTeamContext | null = null;
  let exit: TransferReceiptExit | null = null;
  let definingNights: TransferReceiptDefiningNight[] = [];

  if (window && dealRow.player_id && window.signingDate) {
    const stats = spellStats(dealRow.player_id, window.signingDate, window.endDate);
    if (stats) {
      spell = {
        spellId: window.spellId,
        spellIndex: window.spellIndex,
        spellCount: window.spellCount,
        repeatPlayer: window.repeatPlayer,
        signingTransferId: window.signingTransferId,
        apps: stats.apps,
        starts: stats.starts,
        subs: stats.apps - stats.starts,
        goals: stats.goals,
        assists: stats.assists,
        assistCoverage: assistCoverageForSeasons(stats.seasons),
        seasons: stats.seasons,
        position:
          (
            getDb()
              .prepare("SELECT bucket FROM player_positions WHERE player_id = ?")
              .get(dealRow.player_id) as { bucket: string } | undefined
          )?.bucket ?? null,
        debutDate: stats.debutDate,
        finalAppearanceDate: stats.finalAppearanceDate,
        peakSeason: stats.peakSeason,
        peakSeasonApps: stats.peakSeasonApps,
        state: window.state,
        appearanceShare:
          stats.teamMatches > 0 ? Number((stats.apps / stats.teamMatches).toFixed(4)) : null,
      };

      const startSeason = transferSeason(window.signingDate, dealRow.season);
      const endSeason = window.endDate
        ? transferSeason(window.endDate, null)
        : stats.seasons.at(-1) ?? startSeason;
      teamContext = {
        honourSeasons: honourSeasonsForWindow(dealRow.player_id, startSeason, endSeason),
        leagueFinishes: leagueFinishesForWindow(startSeason, endSeason),
        roleNote: roleNote(stats),
      };
      definingNights = definingNightsInWindow(dealRow.player_id, window.signingDate, window.endDate);
    }

    const exitRow = window.exitTransferId ? transferById(window.exitTransferId, allRows) ?? null : null;
    exit = buildExitSection(exitRow, indices, window.nextSigningTransferId);
  }

  const linkedTransferIds = playerRows
    .filter((row) => row.id !== dealRow.id && row.date)
    .map((row) => row.id);

  return { deal, spell, teamContext, exit, definingNights, linkedTransferIds };
}

/** Whether the receipt has enough evidence to render — avoids empty nineteenth-century shells. */
export function shouldRenderTransferReceipt(receipt: TransferReceipt): boolean {
  const { deal, spell } = receipt;
  if (AUTHORED_RECEIPT_TRANSFER_IDS.has(deal.transferId)) return deal.playerId != null;
  if (deal.feeKind === "fee" && deal.feeGbp != null && deal.playerId) return true;

  const dealYear = Number.parseInt((deal.date ?? deal.season ?? "").slice(0, 4), 10);
  if (Number.isFinite(dealYear) && dealYear < RECEIPT_MIN_YEAR && !spell?.apps) return false;

  if (!deal.playerId) return false;
  if ((spell?.apps ?? 0) > 0) return true;
  if (deal.type === "loan" && (spell?.apps ?? 0) >= 1) return true;
  return false;
}

export function buildTransferReceiptsForPlayer(
  playerId: string,
  indices: InflationIndices = loadInflationIndices(),
  transfers?: TransferRow[],
): TransferReceipt[] {
  const allRows = transfers ?? allTransfers();
  const playerRows = allRows.filter((row) => row.player_id === playerId);
  return chronological(playerRows)
    .map((row) => buildTransferReceipt(row.id, indices, allRows))
    .filter((receipt): receipt is TransferReceipt => receipt != null && shouldRenderTransferReceipt(receipt));
}

export function buildRecordDealReceiptMap(
  transfers: TransferRow[],
  indices: InflationIndices,
  limit = 30,
): Record<string, TransferReceipt> {
  const ids = new Set<string>();
  for (const direction of ["in", "out"] as const) {
    for (const row of topTransfersForMode(transfers, direction, limit, "nominal", indices)) {
      ids.add(row.id);
    }
  }

  const map: Record<string, TransferReceipt> = {};
  for (const id of ids) {
    const receipt = buildTransferReceipt(id, indices, transfers);
    if (receipt && shouldRenderTransferReceipt(receipt)) {
      map[id] = receipt;
    }
  }
  return map;
}
