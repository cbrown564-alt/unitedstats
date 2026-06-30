import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { questionBySlug, questionSlugs } from "@/lib/questions";
import { relatedAnswers } from "@/lib/related";
import { QUESTION_COMPONENTS } from "@/components/QuestionModules";
import { RelatedAnswers } from "@/components/RelatedAnswers";
import { DetailBreadcrumb } from "@/components/DetailBreadcrumb";

// Questions are a fixed, finite set — always fully prerendered, never sampled.
export const dynamicParams = false;

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
      <DetailBreadcrumb
        segments={[
          { label: "Discover", href: "/explore" },
          { label: "Questions", href: "/questions" },
          { label: q.label },
        ]}
      />

      <Module variant="canonical" />

      <RelatedAnswers links={relatedAnswers(slug)} />
    </div>
  );
}
