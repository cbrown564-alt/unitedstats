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

export function scoreline(gf: number, ga: number, pens?: [number | null, number | null] | null, aet?: boolean): string {
  let s = `${gf}–${ga}`;
  if (aet) s += " aet";
  if (pens && pens[0] != null) s += ` (${pens[0]}–${pens[1]} pens)`;
  return s;
}
