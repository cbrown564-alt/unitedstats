"use client";

import Link from "next/link";
import { collectionShareHref } from "@/lib/collectionShare";
import { useCollection } from "@/lib/useCollection";

/** Bridges this device's working set to the rendered collection: a bare
 *  /collection visit can open the cuts saved here, or learn how to start one. */
export function OpenMyCollection() {
  const hrefs = useCollection();

  if (hrefs.length === 0) {
    return (
      <div className="space-y-3 border border-line bg-panel p-5 text-sm text-ink-dim">
        <p>
          Your collection is empty. Save any Cut — a curated answer or a fork of your own — and it gathers here on this
          device.
        </p>
        <Link href="/explore" className="control inline-flex items-center font-semibold hover:text-devil-bright focus-ring">
          Explore the cuts →
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3 border border-line bg-panel p-5">
      <p className="text-sm text-ink-dim">
        You have <span className="font-semibold text-ink">{hrefs.length}</span> {hrefs.length === 1 ? "Cut" : "Cuts"}{" "}
        saved on this device.
      </p>
      <Link
        href={collectionShareHref(hrefs)}
        className="inline-flex rounded bg-devil px-4 py-2 text-sm font-semibold text-white hover:bg-devil-bright focus-ring"
      >
        Open my collection →
      </Link>
    </div>
  );
}
