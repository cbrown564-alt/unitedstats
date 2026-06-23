import { questionBySlug, questionSlugs } from "@/lib/questions";
import { OG_CONTENT_TYPE, OG_SIZE, evidenceCard, trustStrip } from "@/lib/og-card";

export const alt = "UnitedStats question — a sourced answer about Manchester United history";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export function generateStaticParams() {
  return questionSlugs().map((slug) => ({ slug }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const q = questionBySlug(slug);
  return evidenceCard({
    question: q?.question ?? "Manchester United history, answered.",
    summary: q?.summary ?? "Ask a question, get a sourced answer, and every match behind it.",
    strip: trustStrip(),
  });
}
