import { rediscoveryRollPool, type RediscoveryOpts } from "./rediscovery";

export type SurpriseTone = "devil" | "gold" | "win";

/**
 * One charged, faded match-night for the wanderer's "surprise me" door. The
 * route is a rediscovery path, not a mixed content randomizer: every reveal is a
 * scored match with a visible reason and a door to the canonical receipt.
 */
export interface SurpriseFact {
  /** Stable id — React reveal key and de-dupe. */
  id: string;
  kind: "night";
  /** What kind of find this is, in the wanderer's words. */
  eyebrow: string;
  /** The big number/scoreline that *is* the surprise. */
  figure: string;
  /** The clause that completes the figure into a sentence. */
  line: string;
  href: string;
  /** The door's verb ("Open the answer", "Open the cut", "See the match"). */
  cta: string;
  tone: SurpriseTone;
}

/**
 * Assemble the deterministic rediscovery pool. Order stays stable for the
 * server-selected seed and client-side re-roll.
 */
export function surpriseFacts(opts: RediscoveryOpts = {}): SurpriseFact[] {
  const facts: SurpriseFact[] = [];

  for (const p of rediscoveryRollPool(24, opts)) {
    facts.push({
      id: `night-${p.id}`,
      kind: "night",
      eyebrow: "A night you might have forgotten",
      figure: p.score,
      line: `${p.reason} — ${p.opponent}, ${p.dateLine}${p.scoreSuffix ? ` ${p.scoreSuffix}` : ""}`,
      href: p.href,
      cta: "Open the match",
      tone: p.tone === "text-win" ? "win" : p.tone === "text-loss" ? "devil" : "gold",
    });
  }

  return facts;
}

/** Pick an index into a pool of length `len`. `rng` is injectable so the server's
 *  initial pick is testable; the route passes `Math.random`. */
export function pickIndex(len: number, rng: () => number = Math.random): number {
  return Math.min(len - 1, Math.max(0, Math.floor(rng() * len)));
}
