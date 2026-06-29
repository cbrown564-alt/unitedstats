"use client";

import { useState, useSyncExternalStore } from "react";

const NOOP = () => () => {};
const hasNativeShare = () => typeof navigator !== "undefined" && typeof navigator.share === "function";

/**
 * The share affordance for any answer or detail page — one subtle control, the
 * same on every surface (the host renders it top-right of the plate/hero):
 *
 *  - **Share** (when the browser exposes `navigator.share`): opens the OS share
 *    sheet, handing over the page's own OG card *image* where the browser can
 *    share files, else a plain url+title share.
 *  - **Copy link** (the fallback where there is no share sheet).
 *
 * (Cite and Save-card were removed — scope creep; the saved card was a link-unfurl,
 * not a post-worthy image. The energy went into the OG card itself.)
 *
 * The OG card is the route's own `opengraph-image`, always same-origin; absolute
 * URLs are built from the live origin at click time, correct on any surface.
 */
export function ShareCite({ path, title }: { path: string; title: string }) {
  const [copied, setCopied] = useState(false);

  // The server can't know the client's share capability, so the server snapshot
  // is `false`: first paint is the Copy-link markup, then Share swaps in after
  // hydration without a setState-in-effect cascade.
  const canShare = useSyncExternalStore(NOOP, hasNativeShare, () => false);

  const absolute = () => (typeof window === "undefined" ? path : `${window.location.origin}${path}`);
  const cardUrl = `${path}/opengraph-image`;
  const cardFilename = `red-thread-${
    title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "card"
  }.png`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(absolute());
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard unavailable — nothing to recover */
    }
  };

  // Try to hand the share sheet the actual card image; fall back to a url share.
  // Both run inside the click so the user-activation the share sheet requires is
  // preserved. A cancelled sheet (AbortError) is a no-op, not a failure.
  const share = async () => {
    const url = absolute();
    let file: File | null = null;
    try {
      file = await fetchCardFile(cardUrl, cardFilename);
    } catch {
      file = null;
    }
    // Only `url` + `title` — deliberately no separate `text`. A `text` that
    // duplicated the title made the OS "Copy" action paste the link *and* the
    // title (two strings), which read as a double copy.
    const data =
      file && navigator.canShare?.({ files: [file] })
        ? { files: [file], title, url }
        : { title, url };
    try {
      await navigator.share(data);
    } catch {
      /* sheet dismissed or share rejected — nothing to recover */
    }
  };

  const btn =
    "inline-flex items-center gap-1 rounded-md border border-line px-2 py-1 text-ink-dim transition-colors hover:border-devil/60 hover:text-ink focus-ring";

  return (
    <div className="flex flex-wrap items-center justify-end gap-2 text-xs" aria-label="Share this page">
      {canShare ? (
        <button type="button" onClick={share} className={btn}>
          Share
        </button>
      ) : (
        <button type="button" onClick={copyLink} className={btn}>
          {copied ? "Link copied" : "Copy link"}
        </button>
      )}
    </div>
  );
}

/** Fetch the route's OG card PNG as a shareable File, or null. */
async function fetchCardFile(url: string, filename: string): Promise<File | null> {
  const res = await fetch(url);
  if (!res.ok) return null;
  const blob = await res.blob();
  return new File([blob], filename, { type: blob.type || "image/png" });
}
