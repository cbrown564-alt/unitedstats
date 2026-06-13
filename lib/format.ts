const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function fmtDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

export function fmtDateLong(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  const dow = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][date.getUTCDay()];
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  return `${dow} ${d} ${months[m - 1]} ${y}`;
}

export function fmtNum(n: number | null | undefined): string {
  if (n == null) return "—";
  return n.toLocaleString("en-GB");
}

export function pct(part: number, whole: number): string {
  if (!whole) return "—";
  return `${((100 * part) / whole).toFixed(1)}%`;
}

export function venueLabel(v: string): string {
  return v === "H" ? "Home" : v === "A" ? "Away" : "Neutral";
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

export type Outcome = "W" | "D" | "L";

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
