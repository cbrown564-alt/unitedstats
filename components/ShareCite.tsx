"use client";

import { useState, useSyncExternalStore } from "react";

const NOOP = () => () => {};
const hasNativeShare = () => typeof navigator !== "undefined" && typeof navigator.share === "function";

/**
 * The share affordance for any answer or detail page — one subtle control, the
 * same on every surface (the host renders it top-right of the plate/hero):
 *
 *  - **Share** (when the browser exposes `navigator.share`): opens the OS share
 *    sheet for the page link.
 *  - **Copy link** (the fallback where there is no share sheet).
 *
 * We share the **link only** — never the card image as a file. The link already
 * unfurls to the route's own OG card on every platform, so attaching the file was
 * redundant; worse, macOS copied *both* the file and the link-preview image from
 * the share sheet, pasting two copies of the same card. (Cite and Save-card were
 * removed earlier for similar reasons — scope that didn't earn its place.)
 *
 * Absolute URLs are built from the live origin at click time, so they are correct
 * regardless of which surface this is embedded in.
 */
export function ShareCite({ path, title }: { path: string; title: string }) {
  const [copied, setCopied] = useState(false);

  // The server can't know the client's share capability, so the server snapshot
  // is `false`: first paint is the Copy-link markup, then Share swaps in after
  // hydration without a setState-in-effect cascade.
  const canShare = useSyncExternalStore(NOOP, hasNativeShare, () => false);

  const absolute = () => (typeof window === "undefined" ? path : `${window.location.origin}${path}`);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(absolute());
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard unavailable — nothing to recover */
    }
  };

  // Share the link only. A cancelled sheet (AbortError) is a no-op, not a failure.
  const share = async () => {
    try {
      await navigator.share({ title, url: absolute() });
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
