import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { CoverageNote } from "@/components/CoverageNote";
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
        {cuts.length} {cuts.length === 1 ? "Cut" : "Cuts"} gathered into one shareable set — every figure still links to
        the matches behind it.
      </PageHeader>

      <CollectionActions hrefs={hrefs} />

      <section className="grid gap-4 md:grid-cols-2">
        {cuts.map(({ href, result }, index) => {
          const removeHref = hrefs.length > 1 ? collectionShareHref(hrefs.filter((_, i) => i !== index)) : "/collection";
          return (
            <article key={`${href}-${index}`} className="relative overflow-hidden rounded-xl border border-line bg-panel p-5">
              <div className="flex items-start justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-devil-bright">Cut {index + 1}</p>
                <Link
                  href={removeHref}
                  aria-label={`Remove cut ${index + 1}`}
                  className="text-xs font-semibold text-ink-faint transition-colors hover:text-devil-bright focus-ring"
                >
                  Remove ×
                </Link>
              </div>

              {result.headline ? (
                <>
                  <h2 className="display mt-3 text-xl leading-tight text-ink">{result.headline.subject}</h2>
                  <p className="mt-1 text-sm leading-6 text-ink-dim">{capitalize(result.headline.gloss)}.</p>
                  <div className="mt-3 flex items-end justify-between gap-4">
                    <span className="stat-num text-4xl font-semibold text-gold">{result.headline.figure}</span>
                    <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-faint">
                      {result.headline.metric}
                    </span>
                  </div>
                </>
              ) : (
                <p className="mt-3 text-sm text-ink-dim">This Cut’s slice is empty.</p>
              )}

              <div className="mt-4 flex flex-wrap gap-3 text-sm font-semibold">
                <Link href={href} className="text-devil-bright hover:underline focus-ring">
                  Open Cut →
                </Link>
                {result.headline && (
                  <Link href={result.headline.href} className="text-devil-bright hover:underline focus-ring">
                    Evidence →
                  </Link>
                )}
              </div>
              <CoverageNote className="mt-3" slice={`${result.played} records`} coverage={result.coverage.basis} />
            </article>
          );
        })}
      </section>
    </div>
  );
}
