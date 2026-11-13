/** Hand-trimmed canonical nights — shared by the spark and rediscovery engine. */
import { liveList } from "./editorial";

export interface CuratedSpec {
  id: string;
  stakes: string;
  group: "european" | "finals" | "drama" | "modern";
}

/** Edited in EmDash (`nights`); read from the request's live entries or the committed seed. */
export const CURATED_NIGHTS: readonly CuratedSpec[] = liveList("nights", (e) => ({
  id: e.data.match_id,
  stakes: e.data.stakes,
  group: e.data.group,
}));

/** Nights everyone already knows — excluded from the faded rediscovery pool.
 *  Built once from the seed; a night published since the last deploy joins it then. */
export const CANONICAL_FAME = new Set(CURATED_NIGHTS.map((c) => c.id));
