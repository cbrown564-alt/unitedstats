import { questionBySlug, questionSlugs } from "@/lib/questions";
import { immutableDataHeaders } from "@/lib/cache";
import { questionAnswer } from "@/lib/questionCardData";
import { OG_CONTENT_TYPE, OG_SIZE, evidenceCard, localOgMedia, questionCard, trustStrip } from "@/lib/og-card";
import { OG_MEDIA, type CuratedOgMedia } from "@/lib/og-media";

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return questionSlugs().map((slug) => ({ slug }));
}

// On-demand + CDN-cached: the cards carry live counts read from the DB, so they
// can't be baked at build time the way the evergreen text card was.
export const alt = "Red Thread question — a sourced answer about Manchester United history";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

const CURATED_MEDIA: Record<string, CuratedOgMedia> = {
  treble: OG_MEDIA.campNou1999,
  fortress: OG_MEDIA.oldTrafford,
  europe: OG_MEDIA.barcelona,
  "late-goals": OG_MEDIA.brunoFernandes,
};

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const q = questionBySlug(slug);
  const answer = q ? questionAnswer(slug) : null;

  if (q && answer) {
    const curated = CURATED_MEDIA[slug];
    return questionCard(
      { question: q.question, figure: answer.figure, gloss: answer.gloss, visual: answer.visual, accent: answer.accent, strip: trustStrip(), media: curated ? await localOgMedia(curated.src, { position: curated.position, treatment: "panel" }) : undefined },
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
