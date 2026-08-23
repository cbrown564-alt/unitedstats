/**
 * Helpers for the public read-only API (/api/v1). Responses are plain JSON
 * with permissive CORS so the dataset can be used from anywhere; every
 * payload carries its attribution and a pointer to the docs on /data.
 */
import { immutableDataHeaders } from "./cache";
import { SITE_TAGLINE } from "./site";

export const API_ATTRIBUTION = {
  source: `Red Thread — ${SITE_TAGLINE}`,
  docs: "/data#api",
  note: "Read-only. Result data: engsoccerdata, openfootball, Wikipedia. Coverage varies by facet; see /api/v1/meta.",
};

// Static-export JSON dumps. CORS stays open so the dataset can be reused;
// cache headers are a no-op on most static hosts but stay honest for CDNs
// that honor them on /api/*.
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

