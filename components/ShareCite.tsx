"use client";

import { useState } from "react";

/**
 * Copy-link and copy-citation affordance for any answer or detail page. Builds
 * the absolute URL from the live origin at click time, so it is always correct
 * regardless of which surface the answer is embedded in and needs no server
 * origin threaded through. The citation carries the reader's retrieval date.
 */
export function ShareCite({ path, title }: { path: string; title: string }) {
  const [copied, setCopied] = useState<"" | "link" | "cite">("");

  const flash = (which: "link" | "cite") => {
    setCopied(which);
    window.setTimeout(() => setCopied(""), 1600);
  };

  const absolute = () =>
    typeof window === "undefined" ? path : `${window.location.origin}${path}`;

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
    const citation = `${title} — UnitedStats, ${absolute()} (retrieved ${retrieved}).`;
    try {
      await navigator.clipboard.writeText(citation);
      flash("cite");
    } catch {
      /* clipboard unavailable — nothing to recover */
    }
  };

  const btn =
    "inline-flex items-center gap-1 rounded-md border border-line px-2 py-1 text-ink-dim transition-colors hover:border-devil/60 hover:text-ink focus-ring";

  return (
    <div className="flex items-center gap-2 text-xs" aria-label="Share this answer">
      <button type="button" onClick={copyLink} className={btn}>
        {copied === "link" ? "Link copied" : "Copy link"}
      </button>
      <button type="button" onClick={copyCitation} className={btn}>
        {copied === "cite" ? "Citation copied" : "Cite"}
      </button>
    </div>
  );
}
