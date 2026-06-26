/** Dataset pages only change on deploy; edge-cache HTML and API per URL for a day. */
export const PAGE_REVALIDATE_SECONDS = 86_400;

/** Use this literal in `export const revalidate` — Next.js requires an inline constant. */
export const PAGE_REVALIDATE = 86400 as const;
