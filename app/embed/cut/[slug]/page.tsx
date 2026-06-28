import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CURATED_CUTS, cutHref } from "@/lib/cut";
import { cutEmbed } from "@/lib/embeds";
import { SITE_URL } from "@/lib/site";

export const dynamicParams = false;

export function generateStaticParams() {
  return CURATED_CUTS.map((cut) => ({ slug: cut.slug }));
}

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Red Thread embed", robots: { index: false, follow: false } };
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export default async function CutEmbedPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const embed = cutEmbed(slug);
  if (!embed) notFound();
  const { curated, cut, result } = embed;
  const headline = result.headline;
  const canonical = `${SITE_URL}${cutHref(cut)}`;
  const evidence = headline ? `${SITE_URL}${headline.href}` : canonical;

  return (
    <main className="flex h-screen w-screen overflow-hidden bg-pitch text-ink">
      {/* Red thread spine — the brand mark every card carries (mirrors the OG card). */}
      <div className="w-2.5 shrink-0 bg-devil-bright" aria-hidden />
      <div className="relative flex flex-1 flex-col justify-between gap-3 p-5 sm:p-6">
        <div className="hero-grid pointer-events-none absolute inset-0 opacity-40" aria-hidden />
        <div
          className="pointer-events-none absolute -right-16 -top-20 h-48 w-1/2 rounded-full opacity-[0.10] blur-3xl"
          style={{ backgroundColor: "var(--color-gold)" }}
          aria-hidden
        />

        <div className="relative flex items-center justify-between gap-3">
          <a href={canonical} target="_blank" rel="noopener" className="text-[13px] font-extrabold uppercase tracking-[0.2em]">
            <span className="text-devil-bright">Red</span> Thread
          </a>
          <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-faint">{curated.eyebrow}</span>
        </div>

        {headline ? (
          <div className="relative min-w-0">
            <p className="truncate text-xs font-semibold uppercase tracking-[0.14em] text-ink-dim">{curated.title}</p>
            <div className="mt-1.5 flex items-end gap-3">
              <span className="stat-num shrink-0 text-5xl font-semibold leading-none text-gold sm:text-6xl">
                {headline.figure}
              </span>
              <a href={evidence} target="_blank" rel="noopener" className="min-w-0 pb-1 hover:underline">
                <span className="block truncate text-lg font-semibold leading-tight">{headline.subject}</span>
                <span className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
                  {headline.metric}
                </span>
              </a>
            </div>
            <p className="mt-2 line-clamp-2 text-sm leading-snug text-ink-dim">{capitalize(headline.gloss)}.</p>
          </div>
        ) : (
          <p className="relative text-sm text-ink-dim">No records matched this Cut.</p>
        )}

        <div className="relative flex items-center justify-between gap-3 border-t border-line pt-2.5">
          <span className="truncate text-[11px] text-ink-faint">Open dataset · every figure links to its matches</span>
          <a href={canonical} target="_blank" rel="noopener" className="shrink-0 text-[11px] font-semibold text-devil-bright hover:underline">
            View on Red Thread →
          </a>
        </div>
      </div>
    </main>
  );
}
