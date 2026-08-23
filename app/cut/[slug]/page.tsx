import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CutReceipt, cutDescription, cutTitle } from "@/components/cut/CutReceipt";
import { CURATED_CUTS, curatedCut, cutHref } from "@/lib/cut";

export const dynamicParams = false;

export function generateStaticParams() {
  return CURATED_CUTS.map((cut) => ({ slug: cut.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const entry = CURATED_CUTS.find((cut) => cut.slug === slug);
  if (!entry) return {};
  const cut = curatedCut(entry);
  const title = cutTitle(cut);
  const description = cutDescription(cut);
  return {
    title,
    description,
    alternates: { canonical: cutHref(cut) },
    openGraph: { type: "article", title: `${title} · Red Thread`, description, url: cutHref(cut) },
    twitter: { card: "summary_large_image", title, description },
    robots: { index: false, follow: true },
  };
}

export default async function CutSlugPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const entry = CURATED_CUTS.find((cut) => cut.slug === slug);
  if (!entry) notFound();
  return <CutReceipt cut={curatedCut(entry)} />;
}
