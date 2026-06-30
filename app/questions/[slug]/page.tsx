import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { questionBySlug, questionSlugs } from "@/lib/questions";
import { relatedAnswers } from "@/lib/related";
import { QUESTION_COMPONENTS } from "@/components/QuestionModules";
import { RelatedAnswers } from "@/components/RelatedAnswers";

export function generateStaticParams() {
  return questionSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const q = questionBySlug(slug);
  if (!q) return {};
  const path = `/questions/${slug}`;
  return {
    title: q.question,
    description: q.summary,
    alternates: { canonical: path },
    openGraph: {
      type: "article",
      title: `${q.question} · Red Thread`,
      description: q.summary,
      url: path,
    },
    twitter: { card: "summary_large_image", title: q.question, description: q.summary },
  };
}

export default async function QuestionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const q = questionBySlug(slug);
  const Module = QUESTION_COMPONENTS[slug];
  if (!q || !Module) notFound();

  return (
    <div className="space-y-8">
      <nav className="text-xs text-ink-faint" aria-label="Breadcrumb">
        <Link href="/explore" className="hover:text-devil-bright">Discover</Link>
        <span className="mx-1.5">/</span>
        <span className="text-ink-dim">{q.label}</span>
      </nav>

      <Module variant="canonical" />

      <RelatedAnswers links={relatedAnswers(slug)} />
    </div>
  );
}
