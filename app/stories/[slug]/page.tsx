import type { ComponentType } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import TwoNoSevensStory from "@/app/journey/page";
import ElevenDaysInMayStory from "@/app/journey/treble/page";
import FortressOtStory from "@/app/journey/fortress/page";
import FergieTimeStory from "@/app/journey/fergie-time/page";
import { JOURNEY_CHAPTERS, journeyChapterBySlug, type JourneyChapterSlug } from "@/lib/journey";

export const revalidate = 86400;

const STORY_COMPONENTS: Record<JourneyChapterSlug, ComponentType> = {
  "two-no-7s": TwoNoSevensStory,
  "eleven-days-in-may": ElevenDaysInMayStory,
  "fortress-ot": FortressOtStory,
  "fergie-time": FergieTimeStory,
};

export function generateStaticParams() {
  return JOURNEY_CHAPTERS.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const chapter = journeyChapterBySlug((await params).slug);
  if (!chapter) return {};

  return {
    title: `Story — ${chapter.title}`,
    description: chapter.description,
    robots: { index: false, follow: false },
  };
}

/** Published, standalone Red Thread stories. The shelf lives at /stories. */
export default async function StoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const chapter = journeyChapterBySlug(slug);
  if (!chapter) notFound();

  const Story = STORY_COMPONENTS[chapter.slug];
  return <Story />;
}
