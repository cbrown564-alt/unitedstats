"use client";

import { useEffect, useState } from "react";
import { EXAMPLE_QUERIES } from "@/lib/search/examples";

/**
 * Cycle a teaching example through the search placeholder so the field advertises
 * the grammar it understands — natural questions, venue cuts, comparisons — without
 * a manual (DISCOVERY §6, "surface what's askable from the field itself"). Pauses
 * for `prefers-reduced-motion` and whenever the field is inactive; drawing from the
 * single `EXAMPLE_QUERIES` source keeps the teased queries ones the parser answers.
 * Returns index 0 on first render (server and client agree, so no hydration drift).
 */
export function useRotatingPlaceholder(active: boolean): string {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (!active) return;
    if (typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setI((n) => (n + 1) % EXAMPLE_QUERIES.length), 3800);
    return () => clearInterval(t);
  }, [active]);
  return EXAMPLE_QUERIES[i] ?? EXAMPLE_QUERIES[0];
}
