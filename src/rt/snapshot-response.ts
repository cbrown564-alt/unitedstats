/** Serve a private build-time snapshot at its public route. */
export function snapshotResponse(res: Response, reason: string): Response {
  const headers = new Headers(res.headers);
  // ASSETS fetched /live-snapshot/*, which correctly carries noindex. The
  // public route must use the Worker's environment-level indexing policy.
  headers.delete("x-robots-tag");
  headers.set("x-redthread-live", `snapshot; ${reason}`);
  headers.set("cache-control", "no-store");
  return new Response(res.body, { status: res.ok ? 200 : 500, headers });
}
