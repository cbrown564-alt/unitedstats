import type { DecadeBucket } from "@/components/matches/FilterZones";
import type { MatchSort } from "@/lib/matchFilterFromUrl";
import type { MatchEventBadge, MatchRow, MatchesSummary } from "@/lib/queries";
import type { SequenceMatch } from "@/lib/trails";

export const MATCHES_PAGE_SIZE = 50;

export type MatchPageChip = { key: string; label: string };

export type MatchPageView = {
  params: Record<string, string | undefined>;
  page: number;
  pages: number;
  sort: MatchSort;
  chronological: boolean;
  dateSort: "date-desc" | "date-asc";
  goalDiffSort: "gd-desc" | "gd-asc";
  rows: MatchRow[];
  total: number;
  summary: MatchesSummary;
  sequence: SequenceMatch[];
  seasons: string[];
  decades: DecadeBucket[];
  hasFilters: boolean;
  chips: MatchPageChip[];
  eventBadges: Record<string, MatchEventBadge>;
  pinnedResult?: string;
  heroValue: string;
  heroLabel: string;
  heroTone: string;
  heroSub: string | null;
  matchHref?: string;
  /** Full-season match counts for "n of N" group headers. */
  seasonTotals: Record<string, number>;
};

export function hasActiveMatchFilters(sp: Record<string, string | undefined>): boolean {
  return Boolean(
    sp.q || sp.competition || sp.opponent || sp.manager || sp.season || sp.venue || sp.result || sp.type ||
    sp.round || sp.stadium || sp.city || sp.scorer || sp.assister || sp.player || sp.aet || sp.goalWindow ||
    sp.goalFrom || sp.goalTo || sp.from || sp.to,
  );
}

/** Default cached SSR; client-fetch when the URL narrows or paginates the archive. */
export function matchesPageNeedsClientFetch(sp: Record<string, string | undefined>): boolean {
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
  if (page > 1) return true;
  const raw = sp.sort;
  const sort =
    raw === "date-desc" || raw === "date-asc" || raw === "gd-desc" || raw === "gd-asc"
      ? raw
      : raw === "oldest"
        ? "date-asc"
        : raw === "margin"
          ? "gd-desc"
          : raw === "defeat"
            ? "gd-asc"
            : "date-desc";
  if (sort !== "date-desc") return true;
  return hasActiveMatchFilters(sp);
}
