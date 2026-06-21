const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTHS_LONG = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function fmtDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

/** Short "Mon YYYY" label from an ISO date. */
export function fmtMonthYear(iso: string): string {
  const [y, m] = iso.split("-").map(Number);
  return `${MONTHS[m - 1]} ${y}`;
}

export function fmtDateLong(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return `${WEEKDAYS[date.getUTCDay()]} ${d} ${MONTHS_LONG[m - 1]} ${y}`;
}

export function fmtNum(n: number | null | undefined): string {
  if (n == null) return "—";
  return n.toLocaleString("en-GB");
}

/** Round to an integer, group with en-GB thousands separators, append an optional suffix. */
export function fmtAxisNumber(value: number | string, suffix = ""): string {
  return `${Math.round(Number(value)).toLocaleString("en-GB")}${suffix}`;
}

export function pct(part: number, whole: number): string {
  if (!whole) return "—";
  return `${((100 * part) / whole).toFixed(1)}%`;
}

/**
 * Compact GBP transfer fee: £92.3m, £40m, £575k, £900, £1.24bn. Null-safe.
 * Whole millions drop the decimal; aggregates roll up to billions.
 */
export function fmtFee(gbp: number | null | undefined): string {
  if (gbp == null) return "—";
  const sign = gbp < 0 ? "−" : "";
  const n = Math.abs(gbp);
  if (n >= 1_000_000_000) return `${sign}£${(n / 1e9).toFixed(2)}bn`;
  if (n >= 1_000_000) {
    const m = n / 1e6;
    return `${sign}£${m % 1 === 0 ? m.toFixed(0) : m.toFixed(1)}m`;
  }
  if (n >= 1_000) return `${sign}£${Math.round(n / 1e3)}k`;
  return `${sign}£${n}`;
}

/** Compact EUR market value: €70m, €4.5m, €750k. Null-safe. */
export function fmtEur(eur: number | null | undefined): string {
  if (eur == null) return "—";
  if (eur >= 1_000_000_000) return `€${(eur / 1e9).toFixed(2)}bn`;
  if (eur >= 1_000_000) {
    const m = eur / 1e6;
    return `€${m % 1 === 0 ? m.toFixed(0) : m.toFixed(1)}m`;
  }
  if (eur >= 1_000) return `€${Math.round(eur / 1e3)}k`;
  return `€${eur}`;
}

/**
 * Display label for a transfer fee, honouring its kind. A real fee shows the
 * amount; everything else names why there is no figure rather than implying £0.
 */
export function feeLabel(kind: string, gbp: number | null | undefined): string {
  if (kind === "fee" && gbp != null) return fmtFee(gbp);
  if (kind === "free") return "Free";
  if (kind === "undisclosed") return "Undisclosed";
  return "—"; // unknown fee, or "none" (academy / released / retired)
}

export function venueLabel(v: string): string {
  return v === "H" ? "Home" : v === "A" ? "Away" : "Neutral";
}

/** Compact glyph prefixing an opponent name: "v" home, "@" away, "n" neutral. */
export function venuePrefix(v: string): string {
  return v === "H" ? "v" : v === "A" ? "@" : "n";
}

/** Round/stage label for display. Collapses the verbose league "N. Matchday"
 * scraped form to a compact "Game N"; leaves cup stages (Final, Round 3) as-is. */
export function fmtRound(round: string | null | undefined): string {
  if (!round) return "";
  const md = round.match(/^(\d+)\.\s*Matchday$/i);
  return md ? `Game ${md[1]}` : round;
}

/** Club display name by era. */
export function clubName(date: string): string {
  if (date < "1902-04-26") return "Newton Heath";
  return "Manchester United";
}

/**
 * Competition colour category. Three readable groups carry the product's
 * narrative axes — the league grind, cup nights, and European nights — while
 * the specific competition name still does the precise labelling.
 */
export type CompetitionTone = "league" | "cup" | "europe" | "muted";

export function competitionTone(type: string | null | undefined): CompetitionTone {
  switch (type) {
    case "european":
      return "europe";
    case "domestic-cup":
    case "league-cup":
    case "super-cup":
    case "world":
      return "cup";
    case "league":
      return "league";
    default:
      return "muted";
  }
}

type Outcome = "W" | "D" | "L";

const RESULT_LABELS: Record<Outcome, string> = { W: "Won", D: "Drawn", L: "Lost" };
const RESULT_TONES: Record<Outcome, string> = { W: "text-win", D: "text-draw", L: "text-loss" };

/** Past-tense word for a result/outcome code ("W" → "Won"). */
export function resultLabel(outcome: string): string {
  return RESULT_LABELS[outcome as Outcome] ?? outcome;
}

/**
 * Result-coloured text class. Tone follows the outcome, never brand red by
 * default — a heavy defeat should not read as a celebration.
 */
export function resultTone(outcome: string): string {
  return RESULT_TONES[outcome as Outcome] ?? "text-draw";
}

/**
 * Human labels for competition `type` codes. `cup` is a virtual grouping used
 * by the matches filter (domestic + league cups together); the rest map 1:1.
 */
export const COMPETITION_TYPE_LABELS: Record<string, string> = {
  league: "League",
  cup: "All cups",
  "domestic-cup": "FA Cup",
  "league-cup": "League Cup",
  european: "Europe",
  "super-cup": "Shields & Super Cups",
  world: "World",
  playoff: "Test Matches",
  unofficial: "Wartime & friendlies",
};

/** Count wins/draws/losses over a list of result-bearing rows. */
export function tallyWdl(rows: { result: string }[]): { w: number; d: number; l: number } {
  let w = 0, d = 0, l = 0;
  for (const r of rows) {
    if (r.result === "W") w++;
    else if (r.result === "D") d++;
    else if (r.result === "L") l++;
  }
  return { w, d, l };
}

export function scoreline(gf: number, ga: number, pens?: [number | null, number | null] | null, aet?: boolean): string {
  let s = `${gf}–${ga}`;
  if (aet) s += " aet";
  if (pens && pens[0] != null) s += ` (${pens[0]}–${pens[1]} pens)`;
  return s;
}
