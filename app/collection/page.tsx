import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { CoverageNote } from "@/components/CoverageNote";
import { decodeCollection } from "@/lib/collections";

type SP = Record<string, string | undefined>;

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Saved collection", robots: { index: false, follow: true } };
}

export default async function CollectionPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const decoded = decodeCollection(sp.c ?? "");
  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Saved collection" title="Saved Cuts">
        Accountless, URL-encoded Cuts with their evidence links intact.
      </PageHeader>
      {!decoded.ok ? (
        <p className="border border-line bg-panel p-4 text-sm text-ink-dim">{decoded.error}</p>
      ) : (
        <section className="grid gap-4 md:grid-cols-2">
          {decoded.collection.cuts.map(({ href, result }, index) => (
            <article key={`${href}-${index}`} className="border border-line bg-panel p-4">
              <p className="stat-num text-xs text-ink-faint">Cut {index + 1}</p>
              <h2 className="mt-1 text-lg font-semibold text-ink">{result.headline?.subject ?? "Empty cut"}</h2>
              {result.headline && (
                <p className="mt-2 text-sm text-ink-dim">
                  {result.headline.figure} {result.headline.metric}; {result.headline.gloss}.
                </p>
              )}
              <div className="mt-3 flex flex-wrap gap-3 text-sm font-semibold">
                <Link href={href} className="text-devil-bright hover:underline">Open Cut</Link>
                {result.headline && <Link href={result.headline.href} className="text-devil-bright hover:underline">Evidence</Link>}
              </div>
              <CoverageNote className="mt-3" slice={`${result.played} records`} coverage={result.coverage.basis} />
            </article>
          ))}
        </section>
      )}
    </div>
  );
}
