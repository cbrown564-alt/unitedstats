"use client";

import Link from "next/link";
import { MAX_COLLECTION_CUTS, collectionShareHref, writeCollection } from "@/lib/collectionShare";
import { useCollection } from "@/lib/useCollection";

/** The writer the collection loop was missing: gather the current Cut into a
 *  device-local working set, then jump to the shareable collection URL. */
export function SaveToCollection({ href }: { href: string }) {
  const saved = useCollection();
  const inCollection = saved.includes(href);
  const full = saved.length >= MAX_COLLECTION_CUTS;

  const toggle = () => {
    writeCollection(inCollection ? saved.filter((h) => h !== href) : full ? saved : [...saved, href]);
  };

  return (
    <div className="flex flex-wrap items-center gap-3 border-y border-line/70 py-3">
      <button
        type="button"
        onClick={toggle}
        disabled={!inCollection && full}
        aria-pressed={inCollection}
        className={`rounded border px-3 py-1.5 text-sm font-semibold transition-colors focus-ring ${
          inCollection
            ? "border-gold/50 bg-gold/10 text-gold"
            : full
              ? "cursor-not-allowed border-line bg-panel text-ink-faint"
              : "border-line bg-panel text-ink hover:border-devil/50 hover:text-devil-bright"
        }`}
      >
        {inCollection ? "✓ Saved to collection" : full ? `Collection full (${MAX_COLLECTION_CUTS})` : "+ Save to collection"}
      </button>
      {saved.length > 0 && (
        <Link
          href={collectionShareHref(saved)}
          className="text-sm font-semibold text-devil-bright hover:underline focus-ring"
        >
          View collection ({saved.length}) →
        </Link>
      )}
      <span className="text-xs text-ink-faint">Kept on this device — share the link to keep it.</span>
    </div>
  );
}
