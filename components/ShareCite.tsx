"use client";

import { useState, useSyncExternalStore } from "react";

const NOOP = () => () => {};
const hasNativeShare = () => typeof navigator !== "undefined" && typeof navigator.share === "function";

/**
 * Share affordance for any answer or detail page. One action, capability-aware:
 *
 *  - **Share** (when the browser exposes `navigator.share`): opens the OS share
 *    sheet. Where the browser can also share files, it hands over the page's own
 *    OG card *image* — so it lands in a story or chat as a picture, not just a
 *    link — falling back to a url+title share.
 *  - **Copy link** (the desktop fallback, where there is no share sheet).
 *
 * (Earlier this also offered Cite and Save-card; both were dropped — nobody asked
 * for them, and the saved match card was a link-unfurl, not a post-worthy image.
 * The energy moved to making the OG card itself worth sharing.)
 *
 * The OG card is the route's own `opengraph-image` (every page that renders this
 * has one colocated), so it is always same-origin and needs nothing threaded in.
 * Absolute URLs are built from the live origin at click time, so they are correct
 * regardless of which surface this is embedded in.
 */
export function ShareCite({
  path,
  title,
  variant = "bar",
}: {
  path: string;
  title: string;
  /** `bar` is the default right-aligned button; `hero` is the glass pill used
   *  under a match-night headline. */
  variant?: "bar" | "hero";
}) {
  const [copied, setCopied] = useState(false);

  // The server can't know the client's share capability, so the server snapshot
  // is `false`: first paint matches the Copy-link markup, then the Share button
  // swaps in after hydration without a setState-in-effect cascade.
  const canShare = useSyncExternalStore(NOOP, hasNativeShare, () => false);

  const absolute = () =>
    typeof window === "undefined" ? path : `${window.location.origin}${path}`;

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
    const data =
      file && navigator.canShare?.({ files: [file] })
        ? { files: [file], title, text: title, url }
        : { title, text: title, url };
    try {
      await navigator.share(data);
    } catch {
      /* sheet dismissed or share rejected — nothing to recover */
    }
  };

  // Hero: a single glass pill sitting on the floodlit headline, the brand red
  // threading in on hover.
  if (variant === "hero") {
    const seg =
      "group/sc inline-flex items-center gap-1.5 rounded-full border border-line/70 bg-panel/40 px-4 py-2 text-xs text-ink-dim backdrop-blur-sm transition-colors hover:bg-panel-2/70 hover:text-ink focus-ring";
    const ic = "text-ink-faint transition-colors group-hover/sc:text-devil-bright";
    return (
      <div className="inline-flex" aria-label="Share this match">
        {canShare ? (
          <button type="button" onClick={share} className={seg}>
            <span className={ic}><ShareIcon /></span>Share
          </button>
        ) : (
          <button type="button" onClick={copyLink} className={seg}>
            <span className={ic}><LinkIcon /></span>{copied ? "Link copied" : "Copy link"}
          </button>
        )}
      </div>
    );
  }

  const btn =
    "inline-flex items-center gap-1 rounded-md border border-line px-2 py-1 text-ink-dim transition-colors hover:border-devil/60 hover:text-ink focus-ring";

  return (
    <div className="flex flex-wrap items-center justify-end gap-2 text-xs" aria-label="Share this answer">
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

const ICON = "h-3.5 w-3.5";

function ShareIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={ICON} aria-hidden>
      <path d="M12 15V4" />
      <path d="m8 8 4-4 4 4" />
      <path d="M5 12v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={ICON} aria-hidden>
      <path d="M10 13a5 5 0 0 0 7 0l2-2a5 5 0 0 0-7-7l-1 1" />
      <path d="M14 11a5 5 0 0 0-7 0l-2 2a5 5 0 0 0 7 7l1-1" />
    </svg>
  );
}

/** Fetch the route's OG card PNG as a shareable File, or null. */
async function fetchCardFile(url: string, filename: string): Promise<File | null> {
  const res = await fetch(url);
  if (!res.ok) return null;
  const blob = await res.blob();
  return new File([blob], filename, { type: blob.type || "image/png" });
}
