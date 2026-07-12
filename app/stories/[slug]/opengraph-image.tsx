import { immutableDataHeaders } from "@/lib/cache";
import { journeyChapterBySlug } from "@/lib/journey";
import { entityCard, localOgMedia, OG_CONTENT_TYPE, OG_SIZE, storyCard, trustStrip } from "@/lib/og-card";
import { OG_MEDIA, type CuratedOgMedia } from "@/lib/og-media";

export const dynamic = "force-dynamic";
export const alt = "Red Thread story — Manchester United history, evidenced";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

const STORY_MEDIA: Record<string, { media: CuratedOgMedia; marker: string }> = {
  "two-no-7s": { media: OG_MEDIA.cristianoRonaldo2008, marker: "1968 TO 2008" },
  "eleven-days-in-may": { media: OG_MEDIA.campNou1999, marker: "16–26 MAY 1999" },
  "fortress-ot": { media: OG_MEDIA.oldTrafford, marker: "OLD TRAFFORD" },
  "fergie-time": { media: OG_MEDIA.brunoFernandes, marker: "90′ + TIME" },
  "a-thread-of-nights": { media: OG_MEDIA.wembley, marker: "1909 TO 2024" },
};

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const chapter = journeyChapterBySlug(slug);
  const authored = STORY_MEDIA[slug];
  const media = authored ? await localOgMedia(authored.media.src, authored.media) : undefined;
  if (!chapter || !authored || !media) {
    return entityCard({ eyebrow: "RED THREAD STORY", title: chapter?.title ?? "Manchester United history, answered.", subtitle: chapter?.description ?? "Every match carries a story.", strip: trustStrip() }, immutableDataHeaders);
  }
  return storyCard({ chapter: chapter.number, title: chapter.title, claim: chapter.description, marker: authored.marker, media, strip: trustStrip() }, immutableDataHeaders);
}
