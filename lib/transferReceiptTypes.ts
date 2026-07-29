import { adjustFeeGbp, type InflationIndices, type MoneyMode } from "./inflation";
import type { CostBandId } from "./transferTaxonomy";

/** Relative cost band when a season mean benchmark exists (1992+ known fees). */
type TransferFeeBand = CostBandId;

export type TransferSpellState = "completed" | "ongoing" | "unclosed" | "unresolved";

export type AssistCoverage = "match-attributed" | "curated-lane" | "partial" | "unavailable";

type TransferDatePrecision = "day" | "month" | "year" | null;

export interface TransferReceiptDeal {
  transferId: string;
  playerId: string | null;
  playerName: string;
  thumbUrl: string | null;
  direction: "in" | "out";
  date: string | null;
  datePrecision: TransferDatePrecision;
  season: string | null;
  club: string | null;
  type: string;
  feeGbp: number | null;
  feeKind: string;
  feeCpiGbp: number | null;
  feeFootballGbp: number | null;
  feeBand: TransferFeeBand | null;
  feeBandLabel: string | null;
  /** Reviewed authored line, when this deal has one. Never generated. */
  editorialNote: string | null;
  managerId: string | null;
  managerName: string | null;
  sources: string[];
}

export interface TransferReceiptSpell {
  spellId: string;
  spellIndex: number;
  spellCount: number;
  repeatPlayer: boolean;
  signingTransferId: string;
  apps: number | null;
  starts: number | null;
  subs: number | null;
  goals: number | null;
  assists: number | null;
  assistCoverage: AssistCoverage;
  seasons: string[];
  position: string | null;
  debutDate: string | null;
  finalAppearanceDate: string | null;
  peakSeason: string | null;
  peakSeasonApps: number | null;
  state: TransferSpellState;
  appearanceShare: number | null;
}

export interface TransferReceiptLeagueFinish {
  season: string;
  position: number | null;
  topFlight: boolean;
  champion: boolean;
}

export interface TransferReceiptTeamContext {
  honourSeasons: string[];
  leagueFinishes: TransferReceiptLeagueFinish[];
  roleNote: string | null;
}

export interface TransferReceiptExit {
  transferId: string | null;
  date: string | null;
  datePrecision: TransferDatePrecision;
  destination: string | null;
  feeGbp: number | null;
  feeKind: string | null;
  feeCpiGbp: number | null;
  feeFootballGbp: number | null;
  subsequentSigningId: string | null;
}

export interface TransferReceiptDefiningNight {
  matchId: string;
  stakes: string;
  date: string;
  opponent: string;
  score: string;
}

export interface TransferReceipt {
  deal: TransferReceiptDeal;
  spell: TransferReceiptSpell | null;
  teamContext: TransferReceiptTeamContext | null;
  exit: TransferReceiptExit | null;
  definingNights: TransferReceiptDefiningNight[];
  linkedTransferIds: string[];
}

export function displayReceiptFee(
  feeGbp: number | null,
  feeKind: string,
  date: string | null,
  season: string | null,
  mode: MoneyMode,
  indices: InflationIndices,
): number | null {
  if (feeKind !== "fee" || feeGbp == null) return null;
  return adjustFeeGbp(feeGbp, feeKind, date, season, mode, indices);
}
