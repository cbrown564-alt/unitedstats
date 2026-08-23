"use client";

import { RediscoveryRail } from "@/components/RediscoveryRail";
import type { RediscoveryPrompt } from "@/lib/rediscovery-prompt";

/**
 * Rediscovery rail for statically generated entity pages. Era `?since=` stays
 * on the URL for shareable links; the prompt itself is baked at build time.
 */
export function EntityRediscoveryRail({
  prompt: basePrompt,
}: {
  kind: "season" | "opponent" | "player";
  id: string;
  prompt: RediscoveryPrompt | null;
}) {
  if (!basePrompt) return null;
  return <RediscoveryRail prompt={basePrompt} />;
}
