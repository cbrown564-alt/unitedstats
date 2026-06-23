"use client";

import { useState } from "react";
import { readCollection, writeCollection } from "@/lib/collectionShare";

/** Copy the shareable URL, or pull a shared collection into this device's set. */
export function CollectionActions({ hrefs }: { hrefs: string[] }) {
  const [copied, setCopied] = useState(false);
  const [savedCount, setSavedCount] = useState<number | null>(null);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked — no-op */
    }
  };

  const saveMine = () => {
    setSavedCount(writeCollection([...readCollection(), ...hrefs]).length);
  };

  return (
    <div className="flex flex-wrap items-center gap-3 text-sm font-semibold">
      <button
        type="button"
        onClick={copyLink}
        className="rounded border border-line bg-panel px-3 py-1.5 text-ink transition-colors hover:border-devil/50 hover:text-devil-bright focus-ring"
      >
        {copied ? "Link copied ✓" : "Copy share link"}
      </button>
      <button
        type="button"
        onClick={saveMine}
        className="rounded border border-line bg-panel px-3 py-1.5 text-ink transition-colors hover:border-devil/50 hover:text-devil-bright focus-ring"
      >
        {savedCount != null ? `Saved ✓ (${savedCount} on this device)` : "Save to my collection"}
      </button>
      <span className="text-xs font-normal text-ink-faint">Collections live on your device and in this link.</span>
    </div>
  );
}
