/**
 * Helpers for the public read-only API (/api/v1). Responses are plain JSON
 * with permissive CORS so the dataset can be used from anywhere; every
 * payload carries its attribution and a pointer to the docs on /data.
 */

const ATTRIBUTION = {
  source: "UnitedStats, the open Manchester United match history",
  docs: "/data#api",
  note: "Read-only. Result data: engsoccerdata, openfootball, Wikipedia. Coverage varies by facet; see /api/v1/meta.",
};

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Cache-Control": "public, max-age=300",
};

export function apiJson(data: unknown, extra?: Record<string, unknown>): Response {
  return Response.json({ ...extra, data, attribution: ATTRIBUTION }, { headers: CORS_HEADERS });
}

export function apiError(status: number, message: string): Response {
  return Response.json({ error: message, attribution: ATTRIBUTION }, { status, headers: CORS_HEADERS });
}

/** Clamp user-supplied pagination to sane bounds. */
export function pagination(url: URL, defaultLimit = 50, maxLimit = 200): { limit: number; offset: number } {
  const limit = Math.min(maxLimit, Math.max(1, parseInt(url.searchParams.get("limit") ?? "", 10) || defaultLimit));
  const offset = Math.max(0, parseInt(url.searchParams.get("offset") ?? "", 10) || 0);
  return { limit, offset };
}
