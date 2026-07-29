import { adjustFeeGbp, type InflationIndices, type MoneyMode } from "@/lib/inflation";
import { loadInflationIndices } from "@/lib/inflationIndices";
import { feeLabel, fmtFee, fmtMonthYear, fmtNum } from "@/lib/format";
import { getDb } from "@/lib/db";
import {
  allTransfers,
  managerById,
  managerTransferSummary,
  managerTransfers,
  playerById,
  playerTransfers,
  seasonsIndex,
  transferById,
  type TransferRow,
} from "@/lib/queries";
import {
  latestTransferSeasonSummary,
  transferRecordSummary,
  transferTotalsForMode,
} from "@/lib/transferAggregates";

export type TransferShareCardKind = "deal" | "window" | "manager-era" | "analytical";

/** Payload contract for transfer share cards — one headline, three facts, one coverage cue. */
export interface TransferShareCardPayload {
  kind: TransferShareCardKind;
  eyebrow: string;
  headline: string;
  facts: readonly [string, string, string];
  coverageCue: string;
  /** Active signing spells carry an explicit ongoing marker on the card. */
  marker?: string;
  mediaPlayerId?: string;
  /** Optional in/out lanes for window and manager cards. */
  lanes?: { in: number; out: number };
}

/** Representative transfer ids for OG review and payload tests. */
export const TRANSFER_OG_EXEMPLARS = {
  recordSigning: "2016-08-09-paul-pogba-in",
  recordSale: "2009-07-01-cristiano-ronaldo-out",
  lowCostIcon: "1992-11-26-eric-cantona-in",
  freeTransfer: "2023-09-01-jonny-evans-in",
  undisclosedFee: "2025-02-01-ayden-heaven-in",
  activeSigning: "2024-07-18-leny-yoro-in",
  trebleWindow: "1998-99",
  fergusonEra: "alex-ferguson",
} as const;

const BANNED_CARD_WORDS = /\b(flop|disaster|genius|proved)\b/i;

export function assertTransferCardCopy(text: string): void {
  if (BANNED_CARD_WORDS.test(text)) {
    throw new Error(`transfer share card copy must stay analytical: ${text}`);
  }
}

function seasonLabel(season: string): string {
  const [start, end] = season.split("-");
  return `${start}–${end}`;
}

function transferWhen(t: TransferRow): string {
  if (!t.date) return "—";
  if (t.date_precision === "day") return fmtMonthYear(t.date);
  if (t.date_precision === "month") return fmtMonthYear(t.date);
  return t.date.slice(0, 4);
}

function isKnownFee(t: Pick<TransferRow, "fee_kind" | "fee_gbp">): boolean {
  return t.fee_kind === "fee" && t.fee_gbp != null;
}

function spellAppsAfterSigning(playerId: string, signingDate: string, exitDate?: string | null): number | null {
  const upper = exitDate ?? "9999-12-31";
  const row = getDb()
    .prepare(
      `SELECT COUNT(*) apps
       FROM match_lineups l
       JOIN matches m ON m.id = l.match_id
       WHERE l.player_id = ?
         AND l.player_side = 'united'
         AND l.bench = 0
         AND m.date >= ?
         AND m.date <= ?`,
    )
    .get(playerId, signingDate, upper) as { apps: number };
  return row.apps;
}

function nextPermanentExit(playerId: string, afterDate: string): TransferRow | undefined {
  return playerTransfers(playerId)
    .filter((t) => t.direction === "out" && t.type === "permanent" && t.date && t.date > afterDate)
    .sort((a, b) => a.date!.localeCompare(b.date!))
    .at(-1);
}

function signingIsOngoing(t: TransferRow): boolean {
  if (t.direction !== "in" || !t.player_id || !t.date) return false;
  const player = playerById(t.player_id);
  if (!player) return false;
  const exit = nextPermanentExit(t.player_id, t.date);
  if (exit) return false;
  return player.last_date == null || player.last_date >= t.date;
}

function adjustedFeeLine(
  t: TransferRow,
  mode: MoneyMode = "football",
  indices: InflationIndices = loadInflationIndices(),
): string | null {
  if (!isKnownFee(t)) return null;
  const adjusted = adjustFeeGbp(t.fee_gbp, t.fee_kind, t.date, t.season, mode, indices);
  if (adjusted == null || adjusted === t.fee_gbp) return null;
  return `${fmtFee(adjusted)} in football-inflation terms`;
}

function leagueFinishLine(season: string): string | null {
  const league = seasonsIndex().find(
    (row) =>
      row.season === season &&
      row.type === "league" &&
      (row.competition_name === "Premier League" || row.competition_name === "First Division"),
  );
  if (!league || league.position == null) return null;
  if (league.position === 1) return `${seasonLabel(season)} finished as champions`;
  const suffix =
    league.position === 2
      ? "nd"
      : league.position === 3
        ? "rd"
        : "th";
  return `${seasonLabel(season)} finished ${league.position}${suffix} in the league`;
}

function validatePayload(payload: TransferShareCardPayload): TransferShareCardPayload {
  const copy = [payload.headline, ...payload.facts, payload.coverageCue, payload.marker ?? ""].join(" ");
  assertTransferCardCopy(copy);
  if (payload.facts.length !== 3) throw new Error("transfer share cards require exactly three facts");
  return payload;
}

/** Deal receipt: player, fee, adjusted comparison, United career outcome. */
export function buildDealReceiptPayload(transferId: string): TransferShareCardPayload | null {
  const t = transferById(transferId);
  if (!t) return null;

  const indices = loadInflationIndices();
  const ongoing = signingIsOngoing(t);
  const club = t.club ?? "—";
  const directionLabel = t.direction === "in" ? "Signed from" : "Sold to";
  const headline = `${t.player_name} — ${directionLabel} ${club}`;

  const feeFact = `${t.direction === "in" ? "Fee" : "Receipt"} · ${feeLabel(t.fee_kind, t.fee_gbp)}`;
  const adjusted = adjustedFeeLine(t, "football", indices);
  const feeWithAdjusted = adjusted ? `${feeFact} · ${adjusted}` : feeFact;

  let outcomeFact = "United spell · appearances not linked to this deal";
  if (t.player_id && t.date && t.direction === "in") {
    const exit = nextPermanentExit(t.player_id, t.date);
    const apps = spellAppsAfterSigning(t.player_id, t.date, exit?.date);
    const player = playerById(t.player_id);
    if (apps != null && player) {
      outcomeFact = ongoing
        ? `${fmtNum(apps)} appearances since signing · spell ongoing`
        : `${fmtNum(apps)} appearances during this United spell · ${fmtNum(player.goals)} goals in career record`;
    } else if (ongoing) {
      outcomeFact = "Spell ongoing · career outcome still accumulating";
    }
  } else if (t.direction === "out" && t.player_id) {
    const player = playerById(t.player_id);
    if (player) {
      outcomeFact = `${fmtNum(player.apps)} United appearances · ${fmtNum(player.goals)} goals in the career record`;
    }
  }

  const contextFact =
    t.season != null
      ? `${seasonLabel(t.season)} window · ${transferWhen(t)}`
      : `Recorded ${transferWhen(t)} · ${t.type === "loan" ? "loan" : t.type === "youth" ? "academy" : "permanent"} deal`;

  const knownFeeNote = isKnownFee(t) ? "Published fee from transfer archive" : "No published fee — kind shown, not £0";

  return validatePayload({
    kind: "deal",
    eyebrow: "TRANSFER RECEIPT",
    headline,
    facts: [feeWithAdjusted, outcomeFact, contextFact],
    coverageCue: knownFeeNote,
    marker: ongoing ? "ONGOING" : undefined,
    mediaPlayerId: t.player_id ?? undefined,
  });
}

/** Window receipt: arrivals, departures, known net, what followed. */
export function buildWindowReceiptPayload(season: string): TransferShareCardPayload | null {
  const transfers = allTransfers().filter((row) => row.season === season);
  if (transfers.length === 0) return null;

  const indices = loadInflationIndices();
  const totals = transferTotalsForMode(transfers, "nominal", indices);
  const arrivals = transfers.filter((row) => row.direction === "in").length;
  const departures = transfers.filter((row) => row.direction === "out").length;
  const knownNet = totals.gross_spend - totals.gross_received;
  const knownFees = transfers.filter(isKnownFee).length;

  const netLabel =
    totals.spend_rows > 0 || totals.received_rows > 0
      ? `Known net · ${fmtFee(knownNet)} on ${totals.spend_rows + totals.received_rows} published fees`
      : "Known net · no published fees in this window";

  const follow = leagueFinishLine(season);
  const latestSeason = latestTransferSeasonSummary(allTransfers())?.season;
  const followFact =
    follow ??
    (season === latestSeason
      ? "Campaign ongoing · league finish not yet recorded"
      : "Season outcome · league finish not in record");

  const verified = transfers.reduce<string | null>(
    (latest, row) => (!row.date || (latest && row.date <= latest) ? latest : row.date),
    null,
  );

  return validatePayload({
    kind: "window",
    eyebrow: "TRANSFER WINDOW",
    headline: `${seasonLabel(season)} window`,
    facts: [
      `${fmtNum(arrivals)} arrivals · ${fmtNum(departures)} departures`,
      netLabel,
      followFact,
    ],
    coverageCue: `${fmtNum(knownFees)} of ${fmtNum(transfers.length)} deals carry a published fee${verified ? ` · verified through ${fmtMonthYear(verified)}` : ""}`,
    lanes: { in: arrivals, out: departures },
  });
}

/** Hub card for `/transfers`: latest window when it has business, otherwise the full record span. */
export function buildTransfersHubPayload(): TransferShareCardPayload {
  const transfers = allTransfers();
  const summary = transferRecordSummary(transfers);
  const latest = latestTransferSeasonSummary(transfers);

  if (latest && (latest.arrivals > 0 || latest.departures > 0)) {
    const window = buildWindowReceiptPayload(latest.season);
    if (window) return window;
  }

  const indices = loadInflationIndices();
  const totals = transferTotalsForMode(transfers, "nominal", indices);

  return validatePayload({
    kind: "window",
    eyebrow: "TRANSFER HISTORY",
    headline: "Manchester United transfer history",
    facts: [
      `${fmtNum(summary.total)} recorded deals · ${summary.firstYear}–${summary.lastYear}`,
      `${fmtNum(totals.signings)} arrivals · ${fmtNum(totals.departures)} departures in archive`,
      `Known spend · ${fmtFee(totals.gross_spend)} on ${fmtNum(totals.spend_rows)} published fees`,
    ],
    coverageCue: `${fmtNum(summary.knownFees)} of ${fmtNum(summary.total)} deals carry a published fee · undisclosed and unknown fees are not shown as £0`,
    lanes: { in: totals.signings, out: totals.departures },
  });
}

/** Manager era: deals, known spend, completed-spell outcomes — separate from the career OG card. */
export function buildManagerEraPayload(managerId: string): TransferShareCardPayload | null {
  const manager = managerById(managerId);
  const market = managerTransferSummary(managerId);
  if (!manager || !market) return null;

  const transfers = managerTransfers(managerId);
  const permanentSignings = transfers.filter(
    (row) => row.direction === "in" && row.type === "permanent" && row.player_id && row.date,
  );
  const withApps = permanentSignings.filter((row) => {
    const exit = nextPermanentExit(row.player_id!, row.date!);
    return (spellAppsAfterSigning(row.player_id!, row.date!, exit?.date) ?? 0) > 0;
  }).length;

  const era =
    manager.first && manager.last
      ? `${manager.first.slice(0, 4)}–${manager.last.slice(0, 4)}`
      : undefined;

  return validatePayload({
    kind: "manager-era",
    eyebrow: "MANAGER TRANSFER ERA",
    headline: `${manager.name}${era ? ` · ${era}` : ""}`,
    facts: [
      `${fmtNum(market.signings)} signings · ${fmtNum(market.departures)} departures`,
      `Known spend · ${fmtFee(market.spend)} in · ${fmtFee(market.received)} out`,
      `${fmtNum(withApps)} signings with recorded spell appearances`,
    ],
    coverageCue: "Manager lens · aggregates link to underlying deals on the page",
    lanes: { in: market.signings, out: market.departures },
  });
}

/** Analytical finding card — lab stub only while A0 keeps modelling closed. */
export function buildAnalyticalStubPayload(): TransferShareCardPayload {
  return validatePayload({
    kind: "analytical",
    eyebrow: "ANALYSIS PREVIEW · NOT PUBLISHED",
    headline: "Does paying more make a signing more likely to succeed?",
    facts: [
      "A0 audit · descriptive study only",
      "Probability model and best-value ranking closed",
      "Cards ship after analysis publication gate passes",
    ],
    coverageCue: "Lab stub · not for production metadata",
  });
}
