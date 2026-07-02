import {
  compareManagers, comparePlayers, CURATED_DEBATES,
  type CompareMode, type Comparison,
} from "./compare";
import { queryString } from "./url";

export type ExploreCompareMode = Extract<CompareMode, "players" | "managers">;

export interface ExploreDebate {
  mode: ExploreCompareMode;
  label: string;
  hook: string;
  href: string;
  c: Comparison;
}

/** Canonical debate key — order-independent so trails and lookups stay stable. */
export function compareDebateKey(mode: CompareMode, idA: string, idB: string): string {
  return `${mode}:${[idA, idB].sort().join(":")}`;
}

/**
 * Every curated player/manager debate wired for /explore and consistency tests.
 * Both surfaces pull from {@link CURATED_DEBATES} and the live builders so a
 * carousel headline can never drift from the /compare scoreboard.
 */
export function exploreDebates(): ExploreDebate[] {
  const modes: ExploreCompareMode[] = ["players", "managers"];
  return modes.flatMap((mode) =>
    CURATED_DEBATES[mode].flatMap((d) => {
      const c = mode === "players" ? comparePlayers(d.a, d.b) : compareManagers(d.a, d.b);
      if (!c) return [];
      return [{
        mode,
        label: d.label,
        hook: d.hook,
        href: `/compare${queryString({ mode, a: d.a, b: d.b })}`,
        c,
      }];
    }),
  );
}
