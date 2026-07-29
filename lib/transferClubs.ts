import type { TransferRow } from "./queries";
import { transferTotalsForMode, displayFeeGbp } from "./transferAggregates";
import { isMarketTransfer } from "./transferTaxonomy";
import type { InflationIndices, MoneyMode } from "./inflation";

export interface AuthoredClubConnection {
  title: string;
  blurb: string;
}

/**
 * Strong authored historical threads for clubs that do not yet meet the three-deal
 * market gate on their own. Keep this list small and evidence-backed.
 */
export const AUTHORED_CLUB_CONNECTIONS: Record<string, AuthoredClubConnection> = {
  "real-madrid-cf": {
    title: "Record departures to the Bernabéu",
    blurb:
      "Two of United's highest-profile sales left for Real Madrid — Ruud van Nistelrooy in 2006 and the record Cristiano Ronaldo departure in 2009.",
  },
  "borussia-dortmund": {
    title: "Shinji Kagawa's round trip",
    blurb:
      "United signed Shinji Kagawa from Dortmund in 2012 and sold him back two years later — a rare direct return between the clubs.",
  },
  "sporting-lisbon": {
    title: "The Lisbon pipeline",
    blurb:
      "Sporting supplied Cristiano Ronaldo, Nani, and Bruno Fernandes — three signings that shaped separate United eras.",
  },
  "leeds-united": {
    title: "Cantona and the Leeds thread",
    blurb:
      "Eric Cantona arrived from Leeds in 1992; Rio Ferdinand and Alan Smith later moved between the clubs in both directions.",
  },
};

function clubMarketTransfers(transfers: TransferRow[], clubId: string): TransferRow[] {
  return transfers.filter((t) => t.club_id === clubId && isMarketTransfer(t));
}

/** Market-move count per counterparty in one pass — the gate's shared input. */
function marketCountsByClub(transfers: TransferRow[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const t of transfers) {
    if (!t.club_id || !isMarketTransfer(t)) continue;
    counts.set(t.club_id, (counts.get(t.club_id) ?? 0) + 1);
  }
  return counts;
}

function passesGate(
  marketCount: number,
  clubId: string,
  authored: Record<string, AuthoredClubConnection>,
): boolean {
  if (marketCount >= 3) return true;
  return marketCount >= 2 && Boolean(authored[clubId]);
}

/** Public route gate from Rec 5 — thin clubs stay off the index. */
export function passesClubEvidenceGate(
  clubId: string,
  transfers: TransferRow[],
  authored: Record<string, AuthoredClubConnection> = AUTHORED_CLUB_CONNECTIONS,
): boolean {
  return passesGate(clubMarketTransfers(transfers, clubId).length, clubId, authored);
}

/**
 * Gated counterparties, most-traded first. Counts are tallied once rather than
 * re-scanning the full transfer list per row, which kept this quadratic when it
 * ran inside `generateStaticParams`.
 */
export interface GatedClub {
  clubId: string;
  clubName: string;
  marketCount: number;
  authored: boolean;
}

export function gatedClubsByVolume(
  transfers: TransferRow[],
  authored: Record<string, AuthoredClubConnection> = AUTHORED_CLUB_CONNECTIONS,
): GatedClub[] {
  const names = new Map<string, string>();
  for (const t of transfers) {
    if (t.club_id && t.club && !names.has(t.club_id)) names.set(t.club_id, t.club);
  }
  return [...marketCountsByClub(transfers).entries()]
    .filter(([clubId, count]) => passesGate(count, clubId, authored))
    .map(([clubId, marketCount]) => ({
      clubId,
      clubName: names.get(clubId) ?? clubId,
      marketCount,
      authored: Boolean(authored[clubId]),
    }))
    .sort((a, b) => b.marketCount - a.marketCount || a.clubName.localeCompare(b.clubName));
}

export function gatedClubIds(
  transfers: TransferRow[],
  authored: Record<string, AuthoredClubConnection> = AUTHORED_CLUB_CONNECTIONS,
): string[] {
  return gatedClubsByVolume(transfers, authored)
    .map((club) => club.clubId)
    .sort();
}

interface ClubBidirectionalPlayer {
  playerId: string;
  playerName: string;
  inCount: number;
  outCount: number;
}

export interface ClubTransferLens {
  clubId: string;
  clubName: string;
  authored: AuthoredClubConnection | null;
  marketCount: number;
  arrivals: number;
  departures: number;
  totals: ReturnType<typeof transferTotalsForMode>;
  bidirectional: ClubBidirectionalPlayer[];
  transfers: TransferRow[];
}

export function clubDisplayName(transfers: TransferRow[], clubId: string): string {
  const row = transfers.find((t) => t.club_id === clubId && t.club);
  return row?.club ?? clubId;
}

export function buildClubTransferLens(
  clubId: string,
  transfers: TransferRow[],
  mode: MoneyMode,
  indices: InflationIndices,
): ClubTransferLens | null {
  if (!passesClubEvidenceGate(clubId, transfers)) return null;
  const rows = clubMarketTransfers(transfers, clubId);
  const byPlayer = new Map<string, ClubBidirectionalPlayer>();
  for (const t of rows) {
    if (!t.player_id) continue;
    const entry = byPlayer.get(t.player_id) ?? {
      playerId: t.player_id,
      playerName: t.player_name,
      inCount: 0,
      outCount: 0,
    };
    if (t.direction === "in") entry.inCount++;
    else entry.outCount++;
    byPlayer.set(t.player_id, entry);
  }
  const bidirectional = [...byPlayer.values()]
    .filter((p) => p.inCount > 0 && p.outCount > 0)
    .sort((a, b) => b.inCount + b.outCount - (a.inCount + a.outCount));

  return {
    clubId,
    clubName: clubDisplayName(transfers, clubId),
    authored: AUTHORED_CLUB_CONNECTIONS[clubId] ?? null,
    marketCount: rows.length,
    arrivals: rows.filter((t) => t.direction === "in").length,
    departures: rows.filter((t) => t.direction === "out").length,
    totals: transferTotalsForMode(rows, mode, indices),
    bidirectional,
    transfers: rows,
  };
}

/** Known fee total for one direction in the selected money mode. */
export function clubDirectionFees(
  rows: TransferRow[],
  direction: "in" | "out",
  mode: MoneyMode,
  indices: InflationIndices,
): number {
  return rows
    .filter((t) => t.direction === direction)
    .reduce((sum, t) => sum + (displayFeeGbp(t, mode, indices) ?? 0), 0);
}
