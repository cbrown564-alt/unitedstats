import Link from "next/link";
import { StoryProgress } from "@/components/journey/StoryProgress";
import type { ComponentType } from "react";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import TwoNoSevensStory from "@/app/journey/page";
import ElevenDaysInMayStory from "@/app/journey/treble/page";
import FortressOtStory from "@/app/journey/fortress/page";
import FergieTimeStory from "@/app/journey/fergie-time/page";
import ThreadOfNightsStory from "@/app/journey/forgotten-night/page";
import { JOURNEY_CHAPTERS, journeyChapterBySlug, type JourneyChapterSlug } from "@/lib/journey";


const STORY_COMPONENTS: Record<JourneyChapterSlug, ComponentType> = {
  "two-no-7s": TwoNoSevensStory,
  "eleven-days-in-may": ElevenDaysInMayStory,
  "fortress-ot": FortressOtStory,
  "fergie-time": FergieTimeStory,
  "a-thread-of-nights": ThreadOfNightsStory,
};

export const dynamicParams = false;

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
  // This never shipped as a public story, but preserves the prototype URL that
  // may still be open locally while the broader B-story takes its place.
  if (slug === "rome-before-the-seven" || slug === "forgotten-night") redirect("/stories/a-thread-of-nights");
  const chapter = journeyChapterBySlug(slug);
  if (!chapter) notFound();

  const Story = STORY_COMPONENTS[chapter.slug];
  return <><nav aria-label="Leave story" className="fixed left-3 top-3 z-[100] flex gap-4 rounded-full border border-line bg-pitch/95 px-4 py-3 text-sm text-ink shadow-lg"><Link href="/explore" className="focus-ring">← Discover</Link><Link href="/matches" className="focus-ring">Match archive</Link></nav><div className="pt-16"><Story /></div><StoryProgress slug={chapter.slug} /></>;
}
