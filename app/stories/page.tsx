import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { JOURNEY_CHAPTERS } from "@/lib/journey";
import { seoMetadata } from "@/lib/seo";

export const metadata: Metadata = seoMetadata(
  "Red Thread stories — Manchester United history",
  "Short, evidence-led stories from Manchester United's record: people, place, and the moments history rhymes.",
  { alternates: { canonical: "/stories" } },
);

/** The shelf for published standalone stories; each card enters a chrome-off chapter. */
export default function StoriesPage() {
  return (
    <div className="space-y-10">
      <PageHeader eyebrow="Red Thread" title="Stories" deferOnMobile>
        Short routes through the record — each begins with one surprising shape, then opens into the matches behind it.
      </PageHeader>

      <ol className="grid gap-3 lg:grid-cols-3">
        {JOURNEY_CHAPTERS.map((chapter) => (
          <li key={chapter.slug}>
            <Link
              href={chapter.href}
              className="group relative flex min-h-64 flex-col overflow-hidden border border-line bg-panel p-5 transition hover:border-devil-bright/75 hover:bg-panel-2 focus-ring"
            >
              <span
                className="pointer-events-none absolute -right-2 -top-8 stat-num text-9xl font-bold leading-none text-devil-bright/[0.07] transition group-hover:text-devil-bright/[0.12]"
                aria-hidden
              >
                {chapter.number}
              </span>
              <p className="relative text-[11px] font-semibold uppercase tracking-[0.2em] text-devil-bright">
                Red Thread / {chapter.number}
              </p>
              <h2 className="relative display mt-auto text-3xl leading-tight text-ink group-hover:text-devil-bright">
                {chapter.title}
              </h2>
              <p className="relative mt-3 max-w-sm text-sm leading-6 text-ink-dim">{chapter.description}</p>
              <span className="relative mt-6 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-gold">
                Read the story <span className="transition group-hover:translate-x-0.5" aria-hidden>→</span>
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}
