import { fold, trigrams } from "./fold";
import { matchQuestionPagesLite } from "./questionPatterns";
import { typeaheadTotal } from "./typeaheadTotal";
import type { SearchIndex } from "./clientIndex";
import type { IndexRow } from "./resolve";
import type { SearchEntity, SearchPage, SearchResponse } from "../search";

const KINDS = ["player", "manager", "opponent", "season", "competition", "stadium", "city"] as const;

function jaccard(queryGrams: Set<string>, field: string): number {
  const fieldGrams = trigrams(field);
  if (!queryGrams.size || !fieldGrams.size) return 0;
  let inter = 0;
  for (const gram of queryGrams) if (fieldGrams.has(gram)) inter++;
  return inter / (queryGrams.size + fieldGrams.size - inter);
}

function scoreRow(row: IndexRow, folded: string, queryGrams: Set<string>): number {
  if (row.name_norm.startsWith(folded) || row.name_norm.split(" ").some((token) => token.startsWith(folded))) {
    return 2 + row.prominence;
  }
  if (row.name_norm.includes(folded) || (row.aliases?.includes(folded) ?? false)) {
    return 0.7 + 0.05 * row.prominence;
  }
  let similarity = 0;
  const fields = [row.name_norm, ...row.name_norm.split(" "), ...(row.aliases?.split(" ") ?? [])].filter(Boolean);
  for (const field of fields) similarity = Math.max(similarity, jaccard(queryGrams, field));
  if (similarity >= 0.4) return similarity + 0.05 * row.prominence;
  return 0;
}

function toEntity(row: Pick<IndexRow, "kind" | "label" | "detail" | "href">): SearchEntity {
  return {
    kind: row.kind as SearchEntity["kind"],
    label: row.label,
    detail: row.detail,
    href: row.href,
  };
}

function parseOperator(q: string): { op: string; rest: string } | null {
  const match = /^\s*([a-z]+)\s*:\s*(.+)$/i.exec(q);
  if (!match) return null;
  const op = match[1].toLowerCase();
  if (op !== "vs" && !KINDS.includes(op as (typeof KINDS)[number])) return null;
  return { op, rest: match[2].trim() };
}

function dateEntities(q: string, index: SearchIndex): SearchEntity[] {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(q.trim())) return [];
  return (index.dates[q.trim()] ?? []).slice(0, 3).map((match) => ({
    kind: "match" as const,
    label: `v ${match.opponent_name} ${match.gf}–${match.ga}`,
    detail: q.trim(),
    href: `/match/${match.id}`,
  }));
}

function rankedEntities(
  q: string,
  index: SearchIndex,
  opts: { kind?: string; limit?: number; offset?: number },
): { entities: SearchEntity[]; total: number } {
  const { kind, limit = 12, offset = 0 } = opts;
  const out = kind ? [] : dateEntities(q, index);
  const folded = fold(q);
  if (!folded) return { entities: out, total: out.length };

  const queryGrams = trigrams(folded);
  const scored: { row: IndexRow; score: number }[] = [];
  for (const row of index.rows) {
    if (kind && row.kind !== kind) continue;
    const score = scoreRow(row, folded, queryGrams);
    if (score > 0) scored.push({ row, score });
  }
  scored.sort((a, b) => b.score - a.score);
  const total = scored.length + out.length;
  const slice = scored.slice(offset, offset + limit).map(({ row }) => toEntity(row));
  return { entities: [...out, ...slice], total };
}

export function runClientSearch(q: string, index: SearchIndex, limit = 12): SearchResponse {
  if (!q || q.trim().length < 2) {
    return { shaped: [], questions: [], entities: [], total: 0, displayTotal: 0 };
  }

  const operator = parseOperator(q);
  if (operator) {
    const questions = matchQuestionPagesLite(operator.rest);
    const kind = operator.op === "vs" ? "opponent" : operator.op;
    const { entities, total } = rankedEntities(operator.rest, index, { kind, limit });
    return {
      shaped: [],
      questions,
      entities,
      total,
      displayTotal: typeaheadTotal([], questions, entities, total),
    };
  }

  const questions = matchQuestionPagesLite(q);
  const { entities, total } = rankedEntities(q, index, { limit });
  return {
    shaped: [],
    questions,
    entities,
    total,
    displayTotal: typeaheadTotal([], questions, entities, total),
  };
}

export function searchPageClient(
  q: string,
  index: SearchIndex,
  opts: { kind?: string; page?: number; pageSize?: number; perGroup?: number } = {},
): SearchPage {
  const { kind, pageSize = 25, perGroup = 6 } = opts;
  const page = Math.max(1, opts.page ?? 1);
  const folded = fold(q);
  const queryGrams = trigrams(folded);
  const countsMap = new Map<string, number>();
  if (folded) {
    for (const row of index.rows) {
      if (scoreRow(row, folded, queryGrams) > 0) {
        countsMap.set(row.kind, (countsMap.get(row.kind) ?? 0) + 1);
      }
    }
  }
  const counts = [...countsMap.entries()]
    .map(([countKind, n]) => ({ kind: countKind, n }))
    .sort((a, b) => b.n - a.n);
  const total = counts.reduce((acc, count) => acc + count.n, 0);
  const questions = kind ? [] : matchQuestionPagesLite(q);

  if (kind) {
    const n = counts.find((count) => count.kind === kind)?.n ?? 0;
    const { entities } = rankedEntities(q, index, { kind, limit: pageSize, offset: (page - 1) * pageSize });
    return {
      shaped: [],
      questions,
      groups: entities.length ? [{ kind, entities, total: n }] : [],
      counts,
      total,
      page,
      pages: Math.max(1, Math.ceil(n / pageSize)),
    };
  }

  const groups = counts
    .map((count) => ({
      kind: count.kind,
      total: count.n,
      entities: rankedEntities(q, index, { kind: count.kind, limit: perGroup }).entities,
    }))
    .filter((group) => group.entities.length > 0);
  return { shaped: [], questions, groups, counts, total, page: 1, pages: 1 };
}
