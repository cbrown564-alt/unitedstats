"use client";

import Link from "next/link";
import { MAX_COLLECTION_CUTS, collectionShareHref, writeCollection } from "@/lib/collectionShare";
import { useCollection } from "@/lib/useCollection";

/** The writer the collection loop was missing — kept subtle: a bookmark toggle
 *  in the header's empty space, with a quiet count that links to the collection. */
export function SaveToCollection({ href }: { href: string }) {
  const saved = useCollection();
  const inCollection = saved.includes(href);
  const full = saved.length >= MAX_COLLECTION_CUTS;
  const disabled = !inCollection && full;

  const toggle = () => {
    writeCollection(inCollection ? saved.filter((h) => h !== href) : full ? saved : [...saved, href]);
  };

  const label = inCollection
    ? "Saved to collection — remove"
    : full
      ? `Collection full (${MAX_COLLECTION_CUTS})`
      : "Save this cut to your collection";

  return (
    <div className="flex items-center justify-end gap-2.5 self-start">
      {saved.length > 0 && (
        <Link
          href={collectionShareHref(saved)}
          className="text-xs font-medium text-ink-faint transition-colors hover:text-devil-bright focus-ring"
        >
          {saved.length} saved
        </Link>
      )}
      <button
        type="button"
        onClick={toggle}
        disabled={disabled}
        aria-pressed={inCollection}
        aria-label={label}
        title={label}
        className={`tap-target inline-grid place-items-center rounded p-1 transition-colors focus-ring ${
          inCollection
            ? "text-gold"
            : disabled
              ? "cursor-not-allowed text-ink-faint/60"
              : "text-ink-faint hover:text-gold"
        }`}
      >
        <svg
          viewBox="0 0 24 24"
          width="20"
          height="20"
          fill={inCollection ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M6 4h12a1 1 0 0 1 1 1v15l-7-4-7 4V5a1 1 0 0 1 1-1z" />
        </svg>
      </button>
    </div>
  );
}
