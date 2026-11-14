/**
 * Curated compare fixtures. Kept off `lib/compare.ts` so client pages can list
 * debates without pulling SQLite into the browser bundle.
 */
import { liveList } from "./editorial";

export type CompareMode = "players" | "managers" | "eras";

export function curatedComparisonKey(
  mode: Extract<CompareMode, "players" | "managers">,
  a: string,
  b: string,
): string {
  return `${mode}:${a}:${b}`;
}

/** A curated head-to-head: a labelled fixture between two resolvable subjects. */
export interface CuratedDebate {
  label: string;
  /** Subject ids/keys that resolve exactly: player ids, manager ids, era keys. */
  a: string;
  b: string;
  hook: string;
}

/**
 * Curated head-to-heads per mode — the "great debates". The /compare empty state
 * leads with these rather than a blank form, and the /explore discovery home pulls
 * its Compare launcher from the same list, so the two surfaces never drift.
 * Edited in EmDash (`debates`).
 */
export const CURATED_DEBATES: Record<CompareMode, readonly CuratedDebate[]> = {
  players: debates("players"),
  managers: debates("managers"),
  eras: debates("eras"),
};

function debates(mode: CompareMode): readonly CuratedDebate[] {
  return liveList(
    "debates",
    (e) => ({ label: e.data.label, a: e.data.a, b: e.data.b, hook: e.data.hook }),
    (e) => e.data.mode === mode,
  );
}
