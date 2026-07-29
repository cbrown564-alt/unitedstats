import type { TransferRow } from "./queries";
import { transferTotalsForMode, displayFeeGbp } from "./transferAggregates";
import type { InflationIndices, MoneyMode } from "./inflation";

const OFF_MARKET_TYPES = new Set(["youth", "released", "retired"]);

/** Permanent and loan business with a counterparty club. */
export function isMarketTransfer(t: Pick<TransferRow, "type">): boolean {
  return !OFF_MARKET_TYPES.has(t.type);
}

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

export function clubMarketTransfers(transfers: TransferRow[], clubId: string): TransferRow[] {
  return transfers.filter((t) => t.club_id === clubId && isMarketTransfer(t));
}

export function clubMarketTransferCount(transfers: TransferRow[], clubId: string): number {
  return clubMarketTransfers(transfers, clubId).length;
}

/** Public route gate from Rec 5 — thin clubs stay off the index. */
export function passesClubEvidenceGate(
  clubId: string,
  transfers: TransferRow[],
  authored: Record<string, AuthoredClubConnection> = AUTHORED_CLUB_CONNECTIONS,
): boolean {
  const marketCount = clubMarketTransferCount(transfers, clubId);
  if (marketCount >= 3) return true;
  if (marketCount >= 2 && authored[clubId]) return true;
  return false;
}

export function gatedClubIds(
  transfers: TransferRow[],
  authored: Record<string, AuthoredClubConnection> = AUTHORED_CLUB_CONNECTIONS,
): string[] {
  const ids = new Set<string>();
  for (const t of transfers) {
    if (!t.club_id || !isMarketTransfer(t)) continue;
    if (passesClubEvidenceGate(t.club_id, transfers, authored)) ids.add(t.club_id);
  }
  return [...ids].sort();
}

export interface ClubBidirectionalPlayer {
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
