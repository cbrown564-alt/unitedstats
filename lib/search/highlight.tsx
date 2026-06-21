import type { ReactNode } from "react";

/**
 * Highlight the parts of `text` that match the query's tokens. Folds both sides
 * (diacritics stripped, lowercased) so the highlight tracks what actually matched
 * on the server — "solskjaer" lights up the "Solskjær" in the label. No hooks, so
 * it renders in both server (results page) and client (dropdown/palette) trees.
 */
export function highlight(text: string, query: string): ReactNode {
  const tokens = query
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length >= 2);
  if (tokens.length === 0) return text;
  const folded = text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  // Mark every character covered by a token's prefix match against the folded text.
  const hit = new Array<boolean>(text.length).fill(false);
  for (const tok of tokens) {
    let from = 0;
    for (;;) {
      const at = folded.indexOf(tok, from);
      if (at === -1) break;
      for (let i = at; i < at + tok.length && i < text.length; i++) hit[i] = true;
      from = at + tok.length;
    }
  }
  const parts: ReactNode[] = [];
  let i = 0;
  while (i < text.length) {
    const on = hit[i];
    let j = i;
    while (j < text.length && hit[j] === on) j++;
    const chunk = text.slice(i, j);
    parts.push(
      on ? (
        <mark key={i} className="bg-transparent text-devil-bright font-semibold">
          {chunk}
        </mark>
      ) : (
        chunk
      ),
    );
    i = j;
  }
  return parts;
}
