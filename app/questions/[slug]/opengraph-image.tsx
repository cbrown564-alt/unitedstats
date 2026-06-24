import { questionBySlug } from "@/lib/questions";
import { immutableDataHeaders } from "@/lib/cache";
import { questionAnswer } from "@/lib/questionCardData";
import { OG_CONTENT_TYPE, OG_SIZE, evidenceCard, questionCard, trustStrip } from "@/lib/og-card";

// On-demand + CDN-cached: the cards carry live counts read from the DB, so they
// can't be baked at build time the way the evergreen text card was.
export const dynamic = "force-dynamic";
export const alt = "UnitedStats question — a sourced answer about Manchester United history";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const q = questionBySlug(slug);
  const answer = q ? questionAnswer(slug) : null;

  if (q && answer) {
    return questionCard(
      { question: q.question, figure: answer.figure, gloss: answer.gloss, visual: answer.visual, accent: answer.accent, strip: trustStrip() },
      immutableDataHeaders,
    );
  }

  // Deferred questions and unknown slugs keep the evergreen text card.
  return evidenceCard(
    {
      question: q?.question ?? "Manchester United history, answered.",
      summary: q?.summary ?? "Ask a question, get a sourced answer, and every match behind it.",
      strip: trustStrip(),
    },
    immutableDataHeaders,
  );
}
