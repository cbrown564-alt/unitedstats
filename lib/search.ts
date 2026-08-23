import { getDb } from "./db";
import { fold, trigrams } from "./search/fold";
import { allIndexRows, type IndexRow } from "./search/resolve";
import { shapedAnswers, headToHead, type ShapedAnswer, type AnswerCoverage } from "./search/intent";
import { matchQuestionPages } from "./search/questionPages";
import { typeaheadTotal } from "./search/typeaheadTotal";

export interface SearchEntity {
  kind: "player" | "manager" | "opponent" | "season" | "competition" | "stadium" | "city" | "match" | "question";
  label: string;
  detail: string;
  href: string;
}

export interface SearchResponse {
  shaped: ShapedAnswer[];
  /** Curated myth pages (`/questions/[slug]`) matched by phrase patterns. */
  questions: SearchEntity[];
  entities: SearchEntity[];
  /** Total entity matches available (entities is the capped slice; this is the full count). */
  total: number;
  /** Shaped answers plus entity matches — for typeahead "See all N results". */
  displayTotal: number;
}

export type { ShapedAnswer, AnswerCoverage };

const KINDS = ["player", "manager", "opponent", "season", "competition", "stadium", "city"] as const;

/**
 * Typo-tolerant fallback: rank by trigram similarity against name + aliases when
 * prefix-FTS finds nothing, so "roony" still surfaces Rooney. Similarity carries
 * the order, nudged by prominence to break near-ties toward the prominent entity.
 */
function fuzzyResults(folded: string, kind: string | undefined, limit: number): IndexRow[] {
  const qg = trigrams(folded);
  const scored: { row: IndexRow; score: number }[] = [];
  for (const row of allIndexRows()) {
    if (kind && row.kind !== kind) continue;
    let sim = 0;
    const fields = [row.name_norm, ...row.name_norm.split(" "), ...(row.aliases?.split(" ") ?? [])].filter(Boolean);
    for (const f of fields) sim = Math.max(sim, jaccard(qg, f));
    if (row.name_norm.includes(folded)) sim = Math.max(sim, 0.7); // substring still strong
    if (sim >= 0.4) scored.push({ row, score: sim + 0.05 * row.prominence });
  }
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map(({ row }) => row);
}

function jaccard(qg: Set<string>, field: string): number {
  const fg = trigrams(field);
  if (!qg.size || !fg.size) return 0;
  let inter = 0;
  for (const g of qg) if (fg.has(g)) inter++;
  return inter / (qg.size + fg.size - inter);
}

const toEntity = (r: Pick<IndexRow, "kind" | "label" | "detail" | "href">): SearchEntity => ({
  kind: r.kind as SearchEntity["kind"],
  label: r.label,
  detail: r.detail,
  href: r.href,
});

/**
 * Rank entities from the FTS5 `search_index` (built in scripts/build-db.ts):
 * bm25 relevance, blended with a per-kind `prominence` prior and an exact-prefix
 * boost so a prominent prefix hit beats an incidental mid-string one. Falls back
 * to a folded substring/trigram scan when FTS finds nothing, so partials/typos
 * still land. Returns the capped slice plus the full match count.
 */
function entityResults(
  q: string,
  opts: { kind?: string; limit?: number; offset?: number } = {},
): { entities: SearchEntity[]; total: number } {
  const db = getDb();
  const { kind, limit = 12, offset = 0 } = opts;
  const out: SearchEntity[] = [];

  // exact date → match (matches aren't in the entity index; lead with it)
  if (!kind && offset === 0 && /^\d{4}-\d{2}-\d{2}$/.test(q.trim())) {
    const matches = db
      .prepare("SELECT id, date, opponent_name, gf, ga FROM matches WHERE date = ? LIMIT 3")
      .all(q.trim()) as { id: string; date: string; opponent_name: string; gf: number; ga: number }[];
    for (const m of matches) {
      out.push({ kind: "match", label: `v ${m.opponent_name} ${m.gf}–${m.ga}`, detail: m.date, href: `/match/${m.id}` });
    }
  }

  const folded = fold(q);
  if (!folded) return { entities: out, total: out.length };
  const matchExpr = ftsExpr(q);

  const kindCond = kind ? "AND s.kind = ?" : "";

  const total = (
    db
      .prepare(
        `SELECT COUNT(*) n FROM search_fts JOIN search_index s ON s.rowid = search_fts.rowid
         WHERE search_fts MATCH ? ${kindCond}`,
      )
      .get(...(kind ? [matchExpr, kind] : [matchExpr])) as { n: number }
  ).n;

  let rows = db
    .prepare(
      `SELECT s.kind, s.label, s.detail, s.href
       FROM search_fts JOIN search_index s ON s.rowid = search_fts.rowid
       WHERE search_fts MATCH ? ${kindCond}
       ORDER BY (
         bm25(search_fts) - 1.5 * s.prominence
         - CASE WHEN s.name_norm LIKE ? THEN 2 ELSE 0 END
       )
       LIMIT ? OFFSET ?`,
    )
    .all(matchExpr, ...(kind ? [kind] : []), `${folded}%`, limit, offset) as Pick<
    IndexRow,
    "kind" | "label" | "detail" | "href"
  >[];

  // Typo-tolerant fallback (trigram similarity) when prefix-FTS is empty.
  if (rows.length === 0 && offset === 0) {
    rows = fuzzyResults(folded, kind, limit);
    out.push(...rows.map(toEntity));
    return { entities: out, total: out.length };
  }

  out.push(...rows.map(toEntity));
  return { entities: out, total: Math.max(total, out.length) };
}

/** A leading `kind:` / `vs:` scoping operator, parsed off the raw query. */
function parseOperator(q: string): { op: string; rest: string } | null {
  const m = /^\s*([a-z]+)\s*:\s*(.+)$/i.exec(q);
  if (!m) return null;
  const op = m[1].toLowerCase();
  if (op !== "vs" && !KINDS.includes(op as (typeof KINDS)[number])) return null;
  return { op, rest: m[2].trim() };
}

export function runSearch(q: string, limit = 12): SearchResponse {
  if (!q || q.trim().length < 2) {
    return { shaped: [], questions: [], entities: [], total: 0, displayTotal: 0 };
  }

  const operator = parseOperator(q);
  if (operator) {
    if (operator.op === "vs") {
      const h2h = headToHead(operator.rest);
      const shaped = h2h ? [h2h] : [];
      const questions = matchQuestionPages(operator.rest);
      const { entities, total } = entityResults(operator.rest, { kind: "opponent", limit });
      return {
        shaped,
        questions,
        entities,
        total,
        displayTotal: typeaheadTotal(shaped, questions, entities, total),
      };
    }
    const questions = matchQuestionPages(operator.rest);
    const { entities, total } = entityResults(operator.rest, { kind: operator.op, limit });
    return {
      shaped: [],
      questions,
      entities,
      total,
      displayTotal: typeaheadTotal([], questions, entities, total),
    };
  }

  const shaped = shapedAnswers(q);
  const questions = matchQuestionPages(q);
  const { entities, total } = entityResults(q, { limit });
  return {
    shaped,
    questions,
    entities,
    total,
    displayTotal: typeaheadTotal(shaped, questions, entities, total),
  };
}

/** Prefix-FTS match expression for a folded query ("ole gun" → "ole* gun*"). */
function ftsExpr(q: string): string {
  return fold(q)
    .split(" ")
    .filter(Boolean)
    .map((t) => `${t}*`)
    .join(" ");
}

export interface SearchPage {
  shaped: ShapedAnswer[];
  questions: SearchEntity[];
  /** When a kind facet is active: that kind's paginated slice. Otherwise: top of each kind. */
  groups: { kind: string; entities: SearchEntity[]; total: number }[];
  counts: { kind: string; n: number }[];
  total: number;
  page: number;
  pages: number;
}
