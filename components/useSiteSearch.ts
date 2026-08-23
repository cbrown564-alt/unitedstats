"use client";

import { useEffect, useState } from "react";
import type { SearchEntity, ShapedAnswer } from "@/lib/search";
import type { SearchIndex } from "@/lib/search/clientIndex";
import { runClientSearch } from "@/lib/search/clientSearch";
import { typeaheadTotal } from "@/lib/search/typeaheadTotal";

export interface SiteSearchState {
  shaped: ShapedAnswer[];
  questions: SearchEntity[];
  entities: SearchEntity[];
  total: number;
  displayTotal: number;
}

const EMPTY: SiteSearchState = { shaped: [], questions: [], entities: [], total: 0, displayTotal: 0 };

let indexPromise: Promise<SearchIndex> | null = null;

function loadSearchIndex(): Promise<SearchIndex> {
  indexPromise ??= fetch("/data/search-index.json").then((res) => {
    if (!res.ok) throw new Error(`search index ${res.status}`);
    return res.json() as Promise<SearchIndex>;
  });
  return indexPromise;
}

/**
 * Debounced query over the exported search index, shared by the header dropdown
 * and the ⌘K palette. Returns EMPTY below the 2-char floor and the last good
 * results while a new query is in flight.
 */
export function useSiteSearch(q: string): SiteSearchState {
  const [state, setState] = useState<SiteSearchState>(EMPTY);
  const ready = q.trim().length >= 2;

  useEffect(() => {
    if (!ready) return;
    const ctrl = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const index = await loadSearchIndex();
        if (ctrl.signal.aborted) return;
        const data = runClientSearch(q, index);
        setState({
          shaped: data.shaped,
          questions: data.questions,
          entities: data.entities,
          total: data.total,
          displayTotal: data.displayTotal ?? typeaheadTotal(data.shaped, data.questions, data.entities, data.total),
        });
      } catch {
        // aborted or offline — keep the previous results
      }
    }, 150);
    return () => {
      ctrl.abort();
      clearTimeout(timer);
    };
  }, [q, ready]);

  return ready ? state : EMPTY;
}
