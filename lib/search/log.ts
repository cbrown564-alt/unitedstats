/**
 * How a query fared, so the parser's ceiling is a *measured* number before anyone
 * reaches past Tier 0 for a model (DISCOVERY §5). `zero` = nothing at all; `fell`
 * = entity rows but no computed answer (the settler's drop to entity-lookup). A
 * shaped answer — including a tentative best guess — is a hit, so neither fires.
 */
export type SearchMiss = "zero" | "fell";

export function classifyMiss(resultCount: number, shaped: number): SearchMiss | undefined {
  if (shaped > 0) return undefined;
  return resultCount === 0 ? "zero" : "fell";
}
