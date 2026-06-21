"use client";

import { useEffect, useState } from "react";
import type { SearchEntity, ShapedAnswer } from "@/lib/search";

export interface SiteSearchState {
  shaped: ShapedAnswer[];
  entities: SearchEntity[];
  total: number;
}

const EMPTY: SiteSearchState = { shaped: [], entities: [], total: 0 };

/**
 * Debounced query → /api/search fetch, shared by the header dropdown and the ⌘K
 * palette so both speak to the same engine with the same 150ms cadence and
 * abort-on-keystroke behaviour. Returns EMPTY below the 2-char floor and the last
 * good results while a new query is in flight.
 */
export function useSiteSearch(q: string): SiteSearchState {
  const [state, setState] = useState<SiteSearchState>(EMPTY);
  const ready = q.trim().length >= 2;

  useEffect(() => {
    if (!ready) return;
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, { signal: ctrl.signal });
        const data = (await res.json()) as { shaped: ShapedAnswer[]; entities: SearchEntity[]; total?: number };
        setState({ shaped: data.shaped, entities: data.entities, total: data.total ?? data.entities.length });
      } catch {
        // aborted or offline — keep the previous results
      }
    }, 150);
    return () => {
      ctrl.abort();
      clearTimeout(t);
    };
  }, [q, ready]);

  return ready ? state : EMPTY;
}
