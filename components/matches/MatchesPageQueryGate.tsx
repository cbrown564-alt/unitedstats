"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { matchesPageNeedsClientFetch, type MatchPageView } from "@/lib/matchPageView";
import { MatchesPageBody } from "@/components/matches/MatchesPageBody";
import { MatchesPageLoading } from "@/components/matches/MatchesPageLoading";

/**
 * Serves the cached default /matches SSR body when the URL is unfiltered; swaps
 * to a client fetch when query params narrow or paginate the archive.
 */
export function MatchesPageQueryGate({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<MatchesPageLoading />}>
      <MatchesPageQueryGateInner>{children}</MatchesPageQueryGateInner>
    </Suspense>
  );
}

function MatchesPageQueryGateInner({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const params = useMemo(
    () => Object.fromEntries(searchParams.entries()),
    [searchParams],
  );
  const needsFetch = matchesPageNeedsClientFetch(params);
  const [view, setView] = useState<MatchPageView | null>(null);
  const [loading, setLoading] = useState(needsFetch);

  useEffect(() => {
    if (!needsFetch) {
      setView(null);
      setLoading(false);
      return;
    }
    const ac = new AbortController();
    setLoading(true);
    const qs = searchParams.toString();
    fetch(`/api/v1/matches/view${qs ? `?${qs}` : ""}`, { signal: ac.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`matches view ${res.status}`);
        return res.json() as Promise<{ data: MatchPageView }>;
      })
      .then((json) => {
        if (!ac.signal.aborted) {
          setView(json.data);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        if (!ac.signal.aborted) setLoading(false);
      });
    return () => ac.abort();
  }, [needsFetch, searchParams]);

  if (needsFetch) {
    if (loading || !view) return <MatchesPageLoading />;
    return <MatchesPageBody view={view} />;
  }
  return <>{children}</>;
}
