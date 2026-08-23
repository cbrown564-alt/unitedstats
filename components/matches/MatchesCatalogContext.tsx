"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { loadMatchesCatalog, peekMatchesCatalog } from "@/lib/matches/loadCatalog";
import type { MatchesCatalog } from "@/lib/matches/catalogTypes";

const MatchesCatalogContext = createContext<MatchesCatalog | null | undefined>(undefined);

function useCatalogState(): MatchesCatalog | null {
  const [catalog, setCatalog] = useState<MatchesCatalog | null>(peekMatchesCatalog);

  useEffect(() => {
    let cancelled = false;
    loadMatchesCatalog()
      .then((data) => {
        if (!cancelled) setCatalog(data);
      })
      .catch(() => {
        if (!cancelled) setCatalog(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return catalog;
}

export function MatchesCatalogProvider({ children }: { children: ReactNode }) {
  const catalog = useCatalogState();
  return <MatchesCatalogContext.Provider value={catalog}>{children}</MatchesCatalogContext.Provider>;
}

export function useMatchesCatalog(): MatchesCatalog | null {
  const fromContext = useContext(MatchesCatalogContext);
  const local = useCatalogState();
  return fromContext === undefined ? local : fromContext;
}
