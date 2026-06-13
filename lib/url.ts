/**
 * Build a query string from params, dropping empty/undefined/null values.
 * Returns "" when nothing is set, otherwise a leading-"?" string ready to
 * append to a path.
 */
export function queryString(params: Record<string, string | number | undefined | null>): string {
  const u = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "") u.set(k, String(v));
  }
  const s = u.toString();
  return s ? `?${s}` : "";
}
