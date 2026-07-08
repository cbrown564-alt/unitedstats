"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { RediscoveryRail } from "@/components/RediscoveryRail";
import type { RediscoveryPrompt } from "@/lib/rediscovery-prompt";

function parseSinceParam(raw: string | null): number | null {
  if (!raw) return null;
  const y = Number(raw);
  const now = new Date().getUTCFullYear();
  if (!Number.isInteger(y) || y < 1960 || y > now) return null;
  return y;
}

/**
 * Era-aware rediscovery rail for statically generated entity pages.
 * Reads optional `?since=` on the client so the page shell stays SSG.
 */
export function EntityRediscoveryRail({
  kind,
  id,
  prompt: basePrompt,
}: {
  kind: "season" | "opponent" | "player";
  id: string;
  prompt: RediscoveryPrompt | null;
}) {
  const searchParams = useSearchParams();
  const sinceYear = parseSinceParam(searchParams.get("since"));
  const [prompt, setPrompt] = useState(basePrompt);

  useEffect(() => {
    if (sinceYear == null) {
      setPrompt(basePrompt);
      return;
    }

    let cancelled = false;
    fetch(`/api/v1/rediscovery/${kind}/${encodeURIComponent(id)}?since=${sinceYear}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((body: { data?: { prompt?: RediscoveryPrompt | null } } | null) => {
        if (!cancelled) setPrompt(body?.data?.prompt ?? basePrompt);
      })
      .catch(() => {
        if (!cancelled) setPrompt(basePrompt);
      });

    return () => {
      cancelled = true;
    };
  }, [kind, id, sinceYear, basePrompt]);

  if (!prompt) return null;
  return <RediscoveryRail prompt={prompt} />;
}
