"use client";

import { useEffect, useState } from "react";
import type { SearchEntity, ShapedAnswer } from "@/lib/search";
import type { SearchIndex } from "@/lib/search/clientIndex";
import { runClientSearch } from "@/lib/search/clientSearch";
import { typeaheadTotal } from "@/lib/search/typeaheadTotal";
import { trackProductEvent } from "@/lib/analytics";

export interface SiteSearchState {
  shaped: ShapedAnswer[];
  questions: SearchEntity[];
  entities: SearchEntity[];
  total: number;
  displayTotal: number;
  status: "idle" | "loading" | "ready" | "error";
}
const EMPTY: SiteSearchState = { shaped: [], questions: [], entities: [], total: 0, displayTotal: 0, status: "idle" };
let indexPromise: Promise<SearchIndex> | null = null;
function loadSearchIndex(): Promise<SearchIndex> {
  indexPromise ??= fetch("/data/search-index.json").then(res => {
    if (!res.ok) throw new Error(`search index ${res.status}`);
    return res.json() as Promise<SearchIndex>;
  }).catch(error => { indexPromise = null; throw error; });
  return indexPromise;
}

/** Query-bound state prevents old results or premature empty messages while typing. */
export function useSiteSearch(q: string): SiteSearchState & { retry: () => void } {
  const [state, setState] = useState<{ query: string; result: SiteSearchState }>({ query: "", result: EMPTY });
  const [attempt, setAttempt] = useState(0);
  const ready = q.trim().length >= 2;
  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    let emptyTimer: ReturnType<typeof setTimeout> | undefined;
    const timer = setTimeout(async () => {
      try {
        const index = await loadSearchIndex();
        if (cancelled) return;
        const data = runClientSearch(q, index);
        const displayTotal = data.displayTotal ?? typeaheadTotal(data.shaped, data.questions, data.entities, data.total);
        setState({ query: q, result: { ...data, displayTotal, status: "ready" } });
        if (displayTotal === 0) emptyTimer = setTimeout(() => trackProductEvent("search_empty", { query_length: Math.min(q.trim().length, 100) }), 1000);
      } catch {
        if (!cancelled) setState({ query: q, result: { ...EMPTY, status: "error" } });
      }
    }, 150);
    return () => { cancelled = true; clearTimeout(timer); clearTimeout(emptyTimer); };
  }, [q, ready, attempt]);
  return { ...(ready ? state.query === q ? state.result : { ...EMPTY, status: "loading" as const } : EMPTY), retry: () => { setState({ query: "", result: EMPTY }); setAttempt(n => n + 1); } };
}
