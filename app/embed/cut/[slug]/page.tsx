import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CURATED_CUTS } from "@/lib/cut";
import { cutEmbed } from "@/lib/embeds";

export const dynamicParams = false;

export function generateStaticParams() {
  return CURATED_CUTS.map((cut) => ({ slug: cut.slug }));
}

export async function generateMetadata(): Promise<Metadata> {
  return { title: "UnitedStats embed", robots: { index: false, follow: false } };
}

export default async function CutEmbedPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const embed = cutEmbed(slug);
  if (!embed) notFound();
  const { curated, result } = embed;
  return (
    <main className="min-h-screen border border-line bg-panel p-4 text-ink">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-devil-bright">UnitedStats embed</p>
      <h1 className="mt-2 text-xl font-semibold">{curated.title}</h1>
      {result.headline ? (
        <div className="mt-4">
          <p className="text-3xl font-semibold text-gold">{result.headline.figure}</p>
          <p className="mt-1 text-sm text-ink-dim">
            {result.headline.subject}; {result.headline.gloss}.
          </p>
        </div>
      ) : (
        <p className="mt-4 text-sm text-ink-dim">No records matched this Cut.</p>
      )}
      <p className="mt-4 text-xs text-ink-faint">{result.coverage.basis}</p>
    </main>
  );
}
