import { immutableDataHeaders } from "@/lib/cache";
import { journeyChapterBySlug } from "@/lib/journey";
import { entityCard, localOgMedia, OG_CONTENT_TYPE, OG_SIZE, storyCard, trustStrip } from "@/lib/og-card";

export const dynamic = "force-dynamic";
export const alt = "Red Thread story — Manchester United history, evidenced";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

const STORY_MEDIA: Record<string, { src: string; position?: string; marker: string }> = {
  "two-no-7s": { src: "/media/journey/cristiano-ronaldo.webp", position: "62% 25%", marker: "1968 TO 2008" },
  "eleven-days-in-may": { src: "/media/journey/camp-nou.webp", position: "58% 42%", marker: "16–26 MAY 1999" },
  "fortress-ot": { src: "/media/journey/old-trafford.webp", position: "60% 48%", marker: "OLD TRAFFORD" },
  "fergie-time": { src: "/media/journey/bruno-fernandes.webp", position: "64% 24%", marker: "90′ + TIME" },
  "a-thread-of-nights": { src: "/media/journey/wembley.webp", position: "58% 42%", marker: "1909 TO 2024" },
};

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const chapter = journeyChapterBySlug(slug);
  const authored = STORY_MEDIA[slug];
  const media = authored ? await localOgMedia(authored.src, { position: authored.position, treatment: "full" }) : undefined;
  if (!chapter || !authored || !media) {
    return entityCard({ eyebrow: "RED THREAD STORY", title: chapter?.title ?? "Manchester United history, answered.", subtitle: chapter?.description ?? "Every match carries a story.", strip: trustStrip() }, immutableDataHeaders);
  }
  return storyCard({ chapter: chapter.number, title: chapter.title, claim: chapter.description, marker: authored.marker, media, strip: trustStrip() }, immutableDataHeaders);
}
