/**
 * Folding + trigram primitives shared by the entity index search (lib/search.ts)
 * and the intent parser (lib/search/intent.ts). Kept in one place so the runtime
 * fold can never drift from the build-time fold in scripts/build-db.ts.
 */

/**
 * Fold a string to a matchable form: strip diacritics, lowercase, reduce to
 * space-separated alphanumeric tokens. Mirrors the `fold()` in
 * scripts/build-db.ts so "solskjaer" matches the indexed "Solskjær".
 */
export function fold(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Trigram set of a folded string (space-padded so prefixes/suffixes count). */
export function trigrams(s: string): Set<string> {
  const p = `  ${s} `;
  const out = new Set<string>();
  for (let i = 0; i < p.length - 2; i++) out.add(p.slice(i, i + 3));
  return out;
}

/** Jaccard overlap of two trigram sets, 0..1. */
export function triSim(a: Set<string>, b: Set<string>): number {
  if (!a.size || !b.size) return 0;
  let inter = 0;
  for (const g of a) if (b.has(g)) inter++;
  return inter / (a.size + b.size - inter);
}
