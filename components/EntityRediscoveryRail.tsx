"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { RediscoveryRail } from "@/components/RediscoveryRail";
import type { RediscoveryPrompt } from "@/lib/rediscoveryPrompt";

type EntityScope = "player" | "opponent" | "season";

function EntityRediscoveryRailInner({
  scope,
  entityId,
  initialPrompt,
}: {
  scope: EntityScope;
  entityId: string;
  initialPrompt: RediscoveryPrompt | null;
}) {
  const searchParams = useSearchParams();
  const since = searchParams.get("since");
  const [prompt, setPrompt] = useState<RediscoveryPrompt | null>(initialPrompt);

  useEffect(() => {
    if (!since) {
      setPrompt(initialPrompt);
      return;
    }
    const ac = new AbortController();
    const qs = new URLSearchParams({ scope, id: entityId, since });
    fetch(`/api/v1/rediscovery?${qs}`, { signal: ac.signal })
      .then((res) => (res.ok ? res.json() : null))
      .then((body: { data?: { prompt?: RediscoveryPrompt | null } } | null) => {
        if (!ac.signal.aborted) setPrompt(body?.data?.prompt ?? null);
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
      });
    return () => ac.abort();
  }, [since, scope, entityId, initialPrompt]);

  if (!prompt) return null;
  return <RediscoveryRail prompt={prompt} />;
}

/** Keeps entity pages static while honouring optional ?since= era bias client-side. */
export function EntityRediscoveryRail({
  scope,
  entityId,
  initialPrompt,
}: {
  scope: EntityScope;
  entityId: string;
  initialPrompt: RediscoveryPrompt | null;
}) {
  if (!initialPrompt) return null;
  return (
    <Suspense fallback={<RediscoveryRail prompt={initialPrompt} />}>
      <EntityRediscoveryRailInner scope={scope} entityId={entityId} initialPrompt={initialPrompt} />
    </Suspense>
  );
}
