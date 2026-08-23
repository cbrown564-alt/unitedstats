/**
 * Client-safe homepage spark selection. No SQLite — the catalog is built at
 * export time and the browser re-picks today's night from it.
 */

export interface GreatNight {
  id: string;
  href: string;
  framing: "on-this-day" | "great-night";
  /** True only when the night is literally today's date — drives the live pulse. */
  live: boolean;
  eyebrow: string;
  year: string;
  /** Base score only — "2–1". Extra-time / pens ride after the opponent in the hero. */
  score: string;
  opponent: string;
  /** "(a.e.t)" / pens footnote when the tie went beyond 90 minutes. */
  scoreSuffix: string;
  /** Result-coloured class from the *outcome* (a shootout win reads as a win). */
  tone: string;
  /** competition · round? · stadium? — the orienting meta line. */
  meta: string;
  /** The emotional lead: an authored stake, else derived texture, else null (then
   *  the scoreline leads instead). */
  line: string | null;
  /** United's goals as name + minute — who scored, when. The soul of the match. */
  scorers: { name: string; minute: string }[];
  /** The night's own shape for the thread-as-timeline monument: each United goal
   *  placed on the match clock (minute incl. stoppage), the last flagged as the
   *  knot. Empty when goal minutes aren't on record — the hero then falls back to
   *  the ghosted-year monument rather than fake a position. */
  timeline: { clock: number; label: string; name: string; winner: boolean }[];
  /** A face to carry the night: the match-winner's (last United scorer's) portrait,
   *  used as a faded monument. Null when no scorer image is on file. */
  image: { src: string; name: string } | null;
  cta: string;
}

export interface HomepageNightCatalog {
  pool: GreatNight[];
  leadByMonthDay: Record<string, GreatNight>;
}

/** Zero-based day index within the UTC year. */
export function dayOfYear(d: Date): number {
  const start = Date.UTC(d.getUTCFullYear(), 0, 0);
  const today = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  return Math.floor((today - start) / 86_400_000);
}

export function monthDayOfDate(d: Date): string {
  return `${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

export function selectGreatNights(
  catalog: HomepageNightCatalog,
  now: Date,
): { nights: GreatNight[]; seed: number } {
  const todayKey = monthDayOfDate(now);
  const lead = catalog.leadByMonthDay[todayKey];
  const pool: GreatNight[] = catalog.pool.map((night) => ({
    ...night,
    live: false,
    framing: "great-night",
  }));
  if (lead) {
    const index = pool.findIndex((night) => night.id === lead.id);
    if (index >= 0) {
      pool[index] = lead;
      return { nights: pool, seed: index };
    }
    return { nights: [lead, ...pool], seed: 0 };
  }
  if (pool.length > 0) return { nights: pool, seed: dayOfYear(now) % pool.length };
  return { nights: [], seed: 0 };
}
