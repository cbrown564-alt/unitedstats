export type MoneyMode = "nominal" | "cpi" | "football";

export interface CpiIndex {
  baseYear: number;
  earliestYear: number;
  deflator: Record<string, number>;
}

export interface PlFootballIndex {
  source: string;
  baseSeason: string;
  earliestSeason: string;
  plEraStart: string;
  corpusSize?: number;
  scrapeSeasons?: number;
  seasons: Record<string, { count: number; meanGbp: number; factor: number }>;
}

export interface InflationIndices {
  cpi: CpiIndex;
  football: PlFootballIndex;
}

function calendarYear(isoDate: string): number {
  return Number.parseInt(isoDate.slice(0, 4), 10);
}

/** Best canonical season label for a transfer row. */
export function transferSeason(date: string | null, season: string | null): string | null {
  if (season && /^\d{4}-\d{2}$/.test(season)) return season;
  if (!date) return null;
  const y = calendarYear(date);
  const m = Number.parseInt(date.slice(5, 7), 10);
  const start = m >= 8 ? y : y - 1;
  const end = String((start + 1) % 100).padStart(2, "0");
  return `${start}-${end}`;
}

function cpiDeflator(year: number, cpi: CpiIndex): number {
  const clamped = Math.max(cpi.earliestYear, Math.min(cpi.baseYear, year));
  return cpi.deflator[String(clamped)] ?? 1;
}

function footballFactor(season: string | null, football: PlFootballIndex): number | null {
  if (!season || season < football.plEraStart) return null;
  return football.seasons[season]?.factor ?? null;
}

/**
 * Inflation-adjust a nominal GBP fee to today's terms.
 * Returns null when the fee is not adjustable (non-fee rows).
 */
export function adjustFeeGbp(
  feeGbp: number | null,
  feeKind: string,
  date: string | null,
  season: string | null,
  mode: MoneyMode,
  indices: InflationIndices,
): number | null {
  if (mode === "nominal" || feeKind !== "fee" || feeGbp == null) return feeGbp;

  if (mode === "cpi") {
    if (!date) return feeGbp;
    return Math.round(feeGbp * cpiDeflator(calendarYear(date), indices.cpi));
  }

  const resolvedSeason = transferSeason(date, season);
  const factor = footballFactor(resolvedSeason, indices.football);
  if (factor != null) return Math.round(feeGbp * factor);

  // Pre-PL era: football mode falls back to CPI (documented in UI).
  if (!date) return feeGbp;
  return Math.round(feeGbp * cpiDeflator(calendarYear(date), indices.cpi));
}

export function moneyModeLabel(mode: MoneyMode): string {
  switch (mode) {
    case "nominal":
      return "Nominal";
    case "cpi":
      return "UK CPI";
    case "football":
      return "PL football inflation";
    default: {
      const _exhaustive: never = mode;
      return _exhaustive;
    }
  }
}

export function moneyModeShort(mode: MoneyMode): string {
  switch (mode) {
    case "nominal":
      return "At the time";
    case "cpi":
      return "Today’s prices";
    case "football":
      return "Football market";
    default: {
      const _exhaustive: never = mode;
      return _exhaustive;
    }
  }
}
