import { apiJson } from "@/lib/api";

export const dynamic = "force-dynamic";

/** Index of the public read-only API. */
export async function GET() {
  return apiJson({
    endpoints: {
      "/api/v1/meta": "Dataset metadata: match counts, date range, coverage figures.",
      "/api/v1/matches":
        "Match list. Filters: season, opponent, competition, venue (H/A/N), result (W/D/L), type (league/cup/european/...), from, to (ISO dates), q (opponent name), limit, offset.",
      "/api/v1/matches/{id}": "One match with goal events, lineups, Elo, and source facets.",
      "/api/v1/seasons": "Season summaries per competition, with league positions where known.",
      "/api/v1/seasons/{season}": "One season (e.g. 1998-99): summaries plus every match.",
      "/api/v1/players": "Player totals (apps, starts, goals, assists). limit, offset.",
      "/api/v1/players/{id}": "One player with per-season splits.",
      "/api/v1/managers": "Managers with overall records and tenures.",
      "/api/v1/opponents": "All opponents with head-to-head records.",
      "/api/v1/competitions": "Competitions with type and match counts.",
      "/api/v1/answers": "Machine-facing answer index with stable citable answer IDs and cache policy.",
      "/api/v1/answers/cuts/{slug}": "Answer-shaped payload for a curated Cut.",
      "/api/v1/answers/history-digests/{id}": "Answer-shaped payload for a history-changed digest.",
    },
    downloads: "/data#downloads",
  });
}
