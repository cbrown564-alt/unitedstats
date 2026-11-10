/**
 * Players and opponents each have a static page. Matches outside the
 * prerendered set open in the single record reader instead.
 */
export function recordHref(kind: "match" | "player" | "opponent", id: string): string {
  if (kind === "match") return `/record?kind=match&id=${encodeURIComponent(id)}`;
  return `/${kind}/${encodeURIComponent(id)}`;
}
