import type { Metadata } from "next";
import Link from "next/link";
import { JOURNEY_CHAPTERS, type JourneyChapterSlug } from "@/lib/journey";
import { seoMetadata } from "@/lib/seo";

export const metadata: Metadata = seoMetadata(
  "Red Thread stories — Manchester United history",
  "Short, evidence-led stories from Manchester United's record: people, place, and the moments history rhymes.",
  { alternates: { canonical: "/stories" } },
);

function StoryMark({ slug }: { slug: JourneyChapterSlug }) {
  if (slug === "two-no-7s") {
    return (
      <div className="stories-mark stories-mark--sevens" aria-hidden>
        <span>1968</span><b>7</b><span>2008</span>
      </div>
    );
  }

  if (slug === "eleven-days-in-may") {
    return (
      <div className="stories-mark stories-mark--may" aria-hidden>
        <span>16</span><i /><span>22</span><i /><span>26</span>
        <small>11 days</small>
      </div>
    );
  }

  if (slug === "fortress-ot") {
    return (
      <div className="stories-mark stories-mark--fortress" aria-hidden>
        <span className="stories-fortress-box"><i /><i /><i /></span>
        <b>40</b><small>years holding the lead</small>
      </div>
    );
  }

  if (slug === "fergie-time") {
    return (
      <div className="stories-mark stories-mark--board" aria-hidden>
        <div className="stories-time-board">
          <span className="stories-time-board__label">Added time</span>
          <span className="stories-time-board__digits"><b>90</b><i>+</i></span>
          <span className="stories-time-board__foot">Minutes played</span>
        </div>
      </div>
    );
  }

  return (
    <div className="stories-mark stories-mark--nights" aria-hidden>
      {[1909, 1948, 1954, 1976, 1983, 1985, 1995, 2001, 2016, 2024].map((year) => (
        <span key={year}><i />{year}</span>
      ))}
    </div>
  );
}

/** An authored threshold into the Red Thread collection, rather than a card shelf. */
export default function StoriesPage() {
  return (
    <div className="stories-index full-bleed-viewport">
      <header className="stories-index-hero">
        <div className="stories-index-hero__glow" aria-hidden />
        <p className="stories-index-eyebrow">Red Thread / Stories</p>
        <h1 className="display">History doesn&apos;t repeat.</h1>
        <p className="stories-index-rhyme">It rhymes.</p>
        <p className="stories-index-intro">
          Five patterns hiding in the record. Follow the line from one unlikely echo to the next.
        </p>
        <Link href="/explore" className="mt-6 inline-flex min-h-11 items-center text-devil-bright">Browse stories, questions and comparisons →</Link>
        <a className="stories-index-cue focus-ring" href="#story-01">
          Pull the thread <span aria-hidden>↓</span>
        </a>
      </header>

      <main className="stories-thread" aria-label="Red Thread stories">
        <span className="stories-thread-line" aria-hidden />

        <ol className="stories-thread-list">
          {JOURNEY_CHAPTERS.map((chapter) => {
            return (
              <li id={`story-${chapter.number}`} key={chapter.slug} className="stories-knot">
                <Link href={chapter.href} className="stories-knot-link group focus-ring">
                  <span className="stories-knot-point" aria-hidden><i /></span>
                  <div className="stories-knot-copy">
                    <p className="stories-knot-kicker">
                      <span>Red Thread / {chapter.number}</span>
                      <span>{chapter.kicker}</span>
                    </p>
                    <h2 className="display">
                      {chapter.shelfTitle ?? chapter.title}
                    </h2>
                    <p>{chapter.prompt}</p>
                    <span className="stories-knot-action">
                      Read the story <span aria-hidden>→</span>
                    </span>
                  </div>
                  <StoryMark slug={chapter.slug} />
                </Link>
              </li>
            );
          })}
        </ol>
      </main>

      <footer className="stories-index-end">
        <span className="stories-index-end__knot" aria-hidden />
        <p className="stories-index-eyebrow">The record is still moving</p>
        <h2 className="display">More threads will surface.</h2>
        <p>Every match leaves a shape. These are the first five we pulled loose.</p>
      </footer>
    </div>
  );
}
