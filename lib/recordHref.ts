/** A single static page opens any record without generating an HTML page per ID. */
export function recordHref(kind: "match" | "player" | "opponent", id: string): string {
  return `/record?kind=${kind}&id=${encodeURIComponent(id)}`;
}
