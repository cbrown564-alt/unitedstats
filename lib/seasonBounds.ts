/** ISO bounds for a football season (Jul 1 → Jun 30). */
export function seasonBounds(season: string): { from: string; to: string } {
  const start = parseInt(season.slice(0, 4), 10);
  return { from: `${start}-07-01`, to: `${start + 1}-06-30` };
}

/** `allSeasons()` is newest-first; the slider reads oldest → newest. */
export function seasonsAscending(seasons: string[]): string[] {
  return [...seasons].reverse();
}

/** Normalise a `from`/`to` URL param to an ISO date for comparisons. */
function paramToIsoDate(v: string | undefined, edge: "from" | "to"): string | null {
  if (!v) return null;
  if (/^\d{4}$/.test(v)) return edge === "from" ? `${v}-01-01` : `${v}-12-31`;
  return v.slice(0, 10);
}

/** Map URL date bounds to inclusive season indices on an ascending season list. */
export function seasonIndicesFromParams(
  seasonsAsc: string[],
  fromParam?: string,
  toParam?: string,
): [number, number] {
  const n = seasonsAsc.length;
  if (n === 0) return [0, 0];

  const fromDate = paramToIsoDate(fromParam, "from");
  const toDate = paramToIsoDate(toParam, "to");
  let lo = 0;
  let hi = n - 1;

  if (fromDate) {
    const idx = seasonsAsc.findIndex((s) => seasonBounds(s).to >= fromDate);
    lo = idx < 0 ? 0 : idx;
  }
  if (toDate) {
    for (let i = n - 1; i >= 0; i--) {
      if (seasonBounds(seasonsAsc[i]).from <= toDate) {
        hi = i;
        break;
      }
    }
  }

  return [Math.min(lo, hi), Math.max(lo, hi)];
}

/** First season index whose start year falls in `decade` (e.g. 1990 → 1990–1999). */
export function seasonIndicesForDecade(seasonsAsc: string[], decade: number): [number, number] {
  const n = seasonsAsc.length;
  if (n === 0) return [0, 0];
  const end = decade + 9;
  let lo = n - 1;
  let hi = 0;
  for (let i = 0; i < n; i++) {
    const y = parseInt(seasonsAsc[i].slice(0, 4), 10);
    if (y >= decade && y <= end) {
      lo = Math.min(lo, i);
      hi = Math.max(hi, i);
    }
  }
  if (lo > hi) return [0, n - 1];
  return [lo, hi];
}

/** Decade labels to show under the track (first season in each decade). */
export function decadeMarkers(seasonsAsc: string[]): { decade: number; index: number }[] {
  const seen = new Set<number>();
  const out: { decade: number; index: number }[] = [];
  for (let i = 0; i < seasonsAsc.length; i++) {
    const decade = Math.floor(parseInt(seasonsAsc[i].slice(0, 4), 10) / 10) * 10;
    if (!seen.has(decade)) {
      seen.add(decade);
      out.push({ decade, index: i });
    }
  }
  return out;
}
