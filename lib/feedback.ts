/**
 * Public feedback via an embedded Google Form. Set
 * `NEXT_PUBLIC_FEEDBACK_FORM_EMBED_URL` to the form's embed URL (Send →
 * <> embed → copy the iframe `src`, or append `?embedded=true` to the
 * viewform link).
 *
 * Optional: `NEXT_PUBLIC_FEEDBACK_FORM_PAGE_ENTRY` — the entry ID for a
 * "Which page?" field so `/feedback?from=/match/...` can prefill it.
 */
const RAW_EMBED_URL = process.env.NEXT_PUBLIC_FEEDBACK_FORM_EMBED_URL?.trim();
const PAGE_ENTRY = process.env.NEXT_PUBLIC_FEEDBACK_FORM_PAGE_ENTRY?.trim();

export const FEEDBACK_FORM_CONFIGURED = Boolean(RAW_EMBED_URL);

export function feedbackFormEmbedSrc(fromPath?: string | null): string | null {
  if (!RAW_EMBED_URL) return null;

  let url: URL;
  try {
    url = new URL(RAW_EMBED_URL);
  } catch {
    return null;
  }

  if (!url.searchParams.has("embedded")) url.searchParams.set("embedded", "true");

  const page = fromPath?.trim();
  if (page && PAGE_ENTRY) {
    url.searchParams.set(`entry.${PAGE_ENTRY}`, page.startsWith("/") ? page : `/${page}`);
  }

  return url.toString();
}
