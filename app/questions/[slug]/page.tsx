import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { questionBySlug, questionSlugs, isArchivedQuestion } from "@/lib/questions";
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
  const archived = isArchivedQuestion(slug);
  return {
    title: q.question,
    description: q.summary,
    alternates: { canonical: path },
    ...(archived ? { robots: { index: false, follow: true } } : {}),
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
  const archived = isArchivedQuestion(slug);

  return (
    <div className="space-y-8">
      <DetailBreadcrumb
        segments={[
          { label: "Discover", href: "/explore" },
          { label: "Questions", href: "/explore" },
          { label: q.label },
        ]}
      />

      {archived && (
        <p className="rounded-lg border border-line bg-panel-2 px-4 py-3 text-sm text-ink-dim">
          This question is archived — kept for old links, not on the active catalogue.{" "}
          <Link href="/explore" className="text-devil-bright hover:underline focus-ring">
            See the four active myths →
          </Link>
        </p>
      )}

      <Module variant="canonical" />

      <RelatedAnswers links={relatedAnswers(slug)} />
    </div>
  );
}
