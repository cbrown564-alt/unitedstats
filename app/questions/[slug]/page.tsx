import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { QUESTIONS, questionBySlug, questionSlugs } from "@/lib/questions";
import { QUESTION_COMPONENTS } from "@/components/QuestionModules";

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
      title: `${q.question} · UnitedStats`,
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

  const others = QUESTIONS.filter((other) => other.slug !== slug);

  return (
    <div className="space-y-8">
      <nav className="text-xs text-ink-faint" aria-label="Breadcrumb">
        <Link href="/explore" className="hover:text-devil-bright">Explore</Link>
        <span className="mx-1.5">/</span>
        <span className="text-ink-dim">{q.label}</span>
      </nav>

      <Module variant="canonical" />

      <section aria-label="More questions" className="space-y-3">
        <h2 className="text-sm font-medium text-ink-dim">More questions, same record</h2>
        <ul className="grid gap-2 sm:grid-cols-2">
          {others.map((other) => (
            <li key={other.slug}>
              <Link
                href={`/questions/${other.slug}`}
                className="group flex items-start gap-2 rounded-lg border border-line bg-panel px-4 py-3 transition-colors hover:border-devil/60"
              >
                <div className="min-w-0">
                  <div className="font-medium group-hover:text-devil-bright">{other.question}</div>
                  <p className="mt-0.5 text-xs text-ink-faint text-pretty">{other.summary}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
