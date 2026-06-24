"use client";

import { useState, useSyncExternalStore } from "react";

const NOOP = () => () => {};
const hasNativeShare = () => typeof navigator !== "undefined" && typeof navigator.share === "function";

/**
 * Share affordance for any answer or detail page. Three progressive layers:
 *
 *  - **Share** (when the browser exposes `navigator.share`): opens the OS share
 *    sheet. Where the browser can also share files, it shares the page's own OG
 *    card *image* — so it lands in a story or chat as a picture, not just a link —
 *    falling back to a url+title share. The sheet already carries "copy", so we
 *    drop the explicit Copy-link button whenever native share is present.
 *  - **Copy link** (the desktop fallback when there is no share sheet).
 *  - **Cite**: a formatted citation carrying the reader's retrieval date — not
 *    something any share sheet offers, so it always shows.
 *  - **Save card**: downloads the page's branded OG card as a PNG.
 *
 * The OG card is the route's own `opengraph-image` (every page that renders this
 * has one colocated), so it is always same-origin and needs nothing threaded in.
 * Absolute URLs are built from the live origin at click time, so they are correct
 * regardless of which surface this is embedded in.
 */
export function ShareCite({ path, title }: { path: string; title: string }) {
  const [copied, setCopied] = useState<"" | "link" | "cite">("");
  const [saving, setSaving] = useState<"" | "busy" | "done">("");

  // The server can't know the client's share capability, so the server snapshot
  // is `false`: first paint matches the no-share markup, then the Share button
  // swaps in after hydration without a setState-in-effect cascade.
  const canShare = useSyncExternalStore(NOOP, hasNativeShare, () => false);

  const flash = (which: "link" | "cite") => {
    setCopied(which);
    window.setTimeout(() => setCopied(""), 1600);
  };

  const absolute = () =>
    typeof window === "undefined" ? path : `${window.location.origin}${path}`;

  const cardUrl = `${path}/opengraph-image`;
  const cardFilename = `red-thread-${
    title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "card"
  }.png`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(absolute());
      flash("link");
    } catch {
      /* clipboard unavailable — nothing to recover */
    }
  };

  const copyCitation = async () => {
    const retrieved = new Date().toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    const citation = `${title} — Red Thread, ${absolute()} (retrieved ${retrieved}).`;
    try {
      await navigator.clipboard.writeText(citation);
      flash("cite");
    } catch {
      /* clipboard unavailable — nothing to recover */
    }
  };

  // Try to hand the share sheet the actual card image; fall back to a url share.
  // Both run inside the click so the user-activation the share sheet requires is
  // preserved. A cancelled sheet (AbortError) is a no-op, not a failure.
  const share = async () => {
    const url = absolute();
    // Build the card image first, in its own try — a fetch failure just means we
    // share the link instead. Then call navigator.share exactly ONCE. Calling it
    // a second time was the bug: dismissing the sheet rejects the share with an
    // AbortError, and a fall-through second call simply re-opened the sheet.
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

  const saveCard = async () => {
    setSaving("busy");
    try {
      const file = await fetchCardFile(cardUrl, cardFilename);
      if (!file) throw new Error("no card");
      const href = URL.createObjectURL(file);
      const a = document.createElement("a");
      a.href = href;
      a.download = cardFilename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(href);
      setSaving("done");
      window.setTimeout(() => setSaving(""), 1600);
    } catch {
      setSaving("");
    }
  };

  const btn =
    "inline-flex items-center gap-1 rounded-md border border-line px-2 py-1 text-ink-dim transition-colors hover:border-devil/60 hover:text-ink focus-ring disabled:opacity-60";

  return (
    <div className="flex flex-wrap items-center justify-end gap-2 text-xs" aria-label="Share this answer">
      {canShare ? (
        <button type="button" onClick={share} className={btn}>
          Share
        </button>
      ) : (
        <button type="button" onClick={copyLink} className={btn}>
          {copied === "link" ? "Link copied" : "Copy link"}
        </button>
      )}
      <button type="button" onClick={copyCitation} className={btn}>
        {copied === "cite" ? "Citation copied" : "Cite"}
      </button>
      <button type="button" onClick={saveCard} disabled={saving === "busy"} className={btn}>
        {saving === "busy" ? "Saving…" : saving === "done" ? "Card saved" : "Save card"}
      </button>
    </div>
  );
}

/** Fetch the route's OG card PNG as a shareable/downloadable File, or null. */
async function fetchCardFile(url: string, filename: string): Promise<File | null> {
  const res = await fetch(url);
  if (!res.ok) return null;
  const blob = await res.blob();
  return new File([blob], filename, { type: blob.type || "image/png" });
}
