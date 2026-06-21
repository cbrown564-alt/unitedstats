import { getDb } from "../db";
import { fold, trigrams, triSim } from "./fold";

/** A row of the FTS-backed `search_index` (built in scripts/build-db.ts). */
export interface IndexRow {
  kind: string;
  entity_id: string;
  label: string;
  detail: string;
  href: string;
  name_norm: string;
  aliases: string | null;
  prominence: number;
}

const COLS = "kind, entity_id, label, detail, href, name_norm, aliases, prominence";

// The whole index is small (~1.4k rows); cache it for the trigram fallbacks so a
// typo doesn't cost a table scan + per-row work on a cold prepare each keystroke.
let indexCache: IndexRow[] | null = null;
export function allIndexRows(): IndexRow[] {
  if (!indexCache) {
    indexCache = getDb().prepare(`SELECT ${COLS} FROM search_index`).all() as IndexRow[];
  }
  return indexCache;
}

type KindFilter = string | string[] | undefined;

function kindMatches(rowKind: string, kind: KindFilter): boolean {
  if (!kind) return true;
  return Array.isArray(kind) ? kind.includes(rowKind) : rowKind === kind;
}

/**
 * Resolve a free-text fragment to the single best entity in the index, optionally
 * constrained to one or more kinds. Prefix-FTS first (bm25 blended with a prominence
 * prior and an exact-prefix boost — the same ranking as the dropdown), then a
 * trigram-similarity fallback so "ferguson"/"roony"/"arsنal" still land. This is the
 * shared entity resolver the intent parser uses to turn slots into ids.
 */
export function resolveEntity(text: string, kind?: KindFilter): IndexRow | undefined {
  const folded = fold(text);
  if (!folded) return undefined;
  const db = getDb();

  const matchExpr = folded
    .split(" ")
    .filter(Boolean)
    .map((t) => `${t}*`)
    .join(" ");

  const kinds = kind === undefined ? null : Array.isArray(kind) ? kind : [kind];
  const kindCond = kinds ? `AND s.kind IN (${kinds.map(() => "?").join(",")})` : "";
  const params: (string | number)[] = [matchExpr, `${folded}%`, ...(kinds ?? [])];

  const row = db
    .prepare(
      `SELECT ${COLS.split(", ").map((c) => `s.${c}`).join(", ")}
       FROM search_fts JOIN search_index s ON s.rowid = search_fts.rowid
       WHERE search_fts MATCH ? ${kindCond}
       ORDER BY (
         bm25(search_fts) - 1.5 * s.prominence
         - CASE WHEN s.name_norm LIKE ? THEN 2 ELSE 0 END
       )
       LIMIT 1`,
    )
    .get(...params) as IndexRow | undefined;
  if (row) return row;

  // Trigram fallback (typo tolerance) over the cached index, kind-filtered.
  const qg = trigrams(folded);
  let best: IndexRow | undefined;
  let bestScore = 0;
  for (const r of allIndexRows()) {
    if (!kindMatches(r.kind, kind)) continue;
    let sim = triSim(qg, trigrams(r.name_norm));
    const fields = [...r.name_norm.split(" "), ...(r.aliases?.split(" ") ?? [])].filter(Boolean);
    for (const f of fields) sim = Math.max(sim, triSim(qg, trigrams(f)));
    if (r.name_norm.includes(folded)) sim = Math.max(sim, 0.7);
    const score = sim + 0.05 * r.prominence;
    if (sim >= 0.4 && score > bestScore) {
      bestScore = score;
      best = r;
    }
  }
  return best;
}
