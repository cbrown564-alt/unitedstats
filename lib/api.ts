/**
 * Helpers for the public read-only API (/api/v1). Responses are plain JSON
 * with permissive CORS so the dataset can be used from anywhere; every
 * payload carries its attribution and a pointer to the docs on /data.
 */
import { immutableDataHeaders } from "./cache";

export const API_ATTRIBUTION = {
  source: "UnitedStats, the open Manchester United match history",
  docs: "/data#api",
  note: "Read-only. Result data: engsoccerdata, openfootball, Wikipedia. Coverage varies by facet; see /api/v1/meta.",
};

// The dataset is immutable between deploys, and every deploy is a fresh build
// (a new cache key), so the CDN can hold responses hard: 5 min in the browser,
// a day at the edge, served stale for a week while it revalidates. This keeps
// runtime SQLite hits rare even though the search/list endpoints stay dynamic.
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  ...immutableDataHeaders,
};

export function apiJson(data: unknown, extra?: Record<string, unknown>): Response {
  return Response.json({ ...extra, data, attribution: API_ATTRIBUTION }, { headers: CORS_HEADERS });
}

export function apiError(status: number, message: string): Response {
  return Response.json({ error: message, attribution: API_ATTRIBUTION }, { status, headers: CORS_HEADERS });
}

/** Clamp user-supplied pagination to sane bounds. */
export function pagination(url: URL, defaultLimit = 50, maxLimit = 200): { limit: number; offset: number } {
  const limit = Math.min(maxLimit, Math.max(1, parseInt(url.searchParams.get("limit") ?? "", 10) || defaultLimit));
  const offset = Math.max(0, parseInt(url.searchParams.get("offset") ?? "", 10) || 0);
  return { limit, offset };
}
