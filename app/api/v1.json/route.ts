import { apiJson } from "@/lib/api";

export const dynamic = "force-static";


/** Index of the public read-only API. */
export async function GET() {
  return apiJson({
    endpoints: {
      "/api/v1/meta": "Dataset metadata: match counts, date range, coverage figures.",
      "/api/v1/matches.json":
        "First page of the match archive (50 rows). Query filters are not applied; use /data/matches-catalog.json in the browser.",
      "/api/v1/matches/{id}": "One match with goal events, lineups, Elo, and source facets.",
      "/api/v1/seasons.json": "Season summaries per competition, with league positions where known.",
      "/api/v1/seasons/{season}": "One season (e.g. 1998-99): summaries plus every match.",
      "/api/v1/players.json": "Player totals (apps, starts, goals, assists). Full list snapshot.",
      "/api/v1/players/{id}": "One player with per-season splits.",
      "/api/v1/managers": "Managers with overall records and tenures.",
      "/api/v1/opponents": "All opponents with head-to-head records.",
      "/api/v1/competitions": "Competitions with type and match counts.",
      "/api/v1/answers.json": "Machine-facing answer index with stable citable answer IDs and cache policy.",
      "/api/v1/answers/cuts/{slug}": "Answer-shaped payload for a curated Cut.",
    },
    downloads: "/data#downloads",
  });
}
