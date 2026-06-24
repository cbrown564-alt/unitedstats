"use client";

import { useState } from "react";
import { SITE_URL } from "@/lib/site";

/** Creator affordance: copyable iframe code for a curated cut's embed card. */
export function EmbedCut({ slug, width, height }: { slug: string; width: number; height: number }) {
  const [copied, setCopied] = useState(false);
  const src = `${SITE_URL}/embed/cut/${slug}`;
  const snippet = `<iframe src="${src}" width="${width}" height="${height}" loading="lazy" style="border:0;border-radius:12px" title="UnitedStats cut"></iframe>`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(snippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked — the snippet is selectable below */
    }
  };

  return (
    <details className="rounded-xl border border-line bg-panel">
      <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-ink-dim hover:text-ink focus-ring">
        <span className="text-ink-faint">&lt;/&gt;</span> Embed this cut
      </summary>
      <div className="space-y-3 border-t border-line p-4">
        <p className="text-xs text-ink-faint">
          A live {width}×{height} card that updates with the record. Paste it into any page.
        </p>
        <pre className="overflow-x-auto rounded border border-line bg-black/25 p-3 text-xs leading-5 text-ink-dim">
          {snippet}
        </pre>
        <button
          type="button"
          onClick={copy}
          className="rounded border border-line bg-panel px-3 py-1.5 text-sm font-semibold text-ink transition-colors hover:border-devil/50 hover:text-devil-bright focus-ring"
        >
          {copied ? "Copied ✓" : "Copy embed code"}
        </button>
      </div>
    </details>
  );
}
