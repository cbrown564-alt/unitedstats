import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { CollectionActions } from "@/components/collection/CollectionActions";
import { OpenMyCollection } from "@/components/collection/OpenMyCollection";
import { decodeCollection } from "@/lib/collections";
import { collectionShareHref } from "@/lib/collectionShare";

type SP = Record<string, string | undefined>;

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Saved collection", robots: { index: false, follow: true } };
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export default async function CollectionPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const encoded = sp.c ?? "";
  const decoded = decodeCollection(encoded);

  if (!decoded.ok) {
    return (
      <div className="space-y-8">
        <PageHeader eyebrow="Saved collection" title="Saved Cuts">
          A collection is a set of Cuts you gather as you explore — accountless, kept in the link so you can share it.
        </PageHeader>
        {encoded ? (
          <p className="border border-line bg-panel p-4 text-sm text-ink-dim">{decoded.error}</p>
        ) : (
          <OpenMyCollection />
        )}
      </div>
    );
  }

  const cuts = decoded.collection.cuts;
  const hrefs = cuts.map((cut) => cut.href);

  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Saved collection" title="Saved Cuts">
        {cuts.length} {cuts.length === 1 ? "Cut" : "Cuts"} gathered into one shareable set — open any to see the matches
        behind it.
      </PageHeader>

      <CollectionActions hrefs={hrefs} />

      <ul className="divide-y divide-line overflow-hidden rounded-lg border border-line bg-panel">
        {cuts.map(({ href, result }, index) => {
          const removeHref = hrefs.length > 1 ? collectionShareHref(hrefs.filter((_, i) => i !== index)) : "/collection";
          return (
            <li key={`${href}-${index}`} className="flex items-center gap-3 p-4">
              <p className="w-12 shrink-0 text-xs font-semibold uppercase tracking-[0.16em] text-ink-faint">
                Cut {index + 1}
              </p>
              <div className="min-w-0 flex-1">
                {result.headline ? (
                  <>
                    <p className="truncate text-sm font-semibold text-ink">{result.headline.subject}</p>
                    <p className="mt-0.5 truncate text-sm text-ink-dim">{capitalize(result.headline.gloss)}.</p>
                  </>
                ) : (
                  <p className="text-sm text-ink-dim">This Cut’s slice is empty.</p>
                )}
              </div>
              <Link
                href={href}
                className="shrink-0 text-sm font-semibold text-devil-bright hover:underline focus-ring"
              >
                Open →
              </Link>
              <Link
                href={removeHref}
                aria-label={`Remove cut ${index + 1}`}
                className="shrink-0 text-xs font-semibold text-ink-faint transition-colors hover:text-devil-bright focus-ring"
              >
                Remove ×
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
