"use client";

import { createContext, useContext, useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
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

const subscribeNever = () => () => {};
const clientSnapshot = () => true;
const serverSnapshot = () => false;

export function useMatchesCatalog(): MatchesCatalog | null {
  const fromContext = useContext(MatchesCatalogContext);
  const local = useCatalogState();
  // The server renders without the catalog, but a lazily-hydrating Suspense boundary
  // can reach its hydration render after the provider has already loaded it. Withhold
  // the catalog until hydration is done so the first client render matches the HTML.
  const hydrated = useSyncExternalStore(subscribeNever, clientSnapshot, serverSnapshot);
  if (!hydrated) return null;
  return fromContext === undefined ? local : fromContext;
}
