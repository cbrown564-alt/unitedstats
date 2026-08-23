import Link from "next/link";
import type { Metadata } from "next";
import { PageHeader } from "@/components/PageHeader";
import { CURATED_CUTS } from "@/lib/cut";

export const metadata: Metadata = {
  title: "Record receipts",
  description: "Saved cuts of the fixture record — registered slices for citation, not a filter builder.",
  robots: { index: false, follow: true },
  alternates: { canonical: "/cut" },
};

export default function CutIndexPage() {
  return (
    <div className="space-y-7">
      <PageHeader eyebrow="Record receipts" title="Cuts">
        Registered slices of the record. Each receipt ranks one grouping and links back to the matches.
      </PageHeader>
      <div className="grid gap-3 sm:grid-cols-2">
        {CURATED_CUTS.map((cut) => (
          <Link
            key={cut.slug}
            href={`/cut/${cut.slug}`}
            className="group block rounded-lg border border-line bg-panel p-4 transition-colors hover:border-devil/60 hover:bg-panel-2/70 focus-ring"
          >
            <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-devil-bright">{cut.eyebrow}</span>
            <span className="mt-1.5 block display text-sm text-ink group-hover:text-devil-bright">{cut.title}</span>
            <span className="mt-1.5 block text-sm leading-5 text-ink-dim">{cut.blurb}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
