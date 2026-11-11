/**
 * Wikimedia occasionally leaves legacy cache-buster queries on otherwise
 * immutable Commons thumbnails. Strip those before handing the URL to
 * next/image so the strict query-free remote pattern remains enforceable.
 */
export function normalizePortraitSrc(src: string | null | undefined): string | null | undefined {
  if (!src?.startsWith("https://")) return src;
  try {
    const url = new URL(src);
    if (url.hostname === "upload.wikimedia.org" && url.pathname.startsWith("/wikipedia/commons/")) {
      url.search = "";
      return url.toString();
    }
  } catch {
    // Let next/image surface malformed non-Wikimedia URLs as before.
  }
  return src;
}
