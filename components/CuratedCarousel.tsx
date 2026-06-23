import Link from "next/link";

/**
 * The curated-cut launcher. A horizontal, scroll-snapping film-strip of answer
 * cards — each one *launches* its full answer page rather than reproducing its
 * depth, so the carousel stays a front door and never competes with /questions.
 *
 * Design call (Phase 11, recorded in docs/ROADMAP.md): one peek-carousel at every
 * breakpoint, not a grid on desktop. A 3×3 grid of question cards would read as a
 * portal and flatten the answer-first hierarchy; a peek-carousel reads as "there's
 * more, swipe on", keeps each card large enough to lead with its question, and is
 * one component with no media-query divergence. It is pure CSS scroll-snap, so it
 * stays a server component and adds no client JS. A static right-edge fade plus the
 * partial peek of the next card cue that the strip scrolls.
 */
export interface CarouselCard {
  href: string;
  eyebrow?: string;
  title: string;
  blurb: string;
  /** Call to action shown on hover/focus; defaults to "Open the answer →". */
  cta?: string;
}

export function CuratedCarousel({
  cards,
  label,
}: {
  cards: CarouselCard[];
  label: string;
}) {
  return (
    <div className="relative -mx-4 sm:mx-0">
      <ul
        aria-label={label}
        className="scrollbar-none flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 sm:px-0"
      >
        {cards.map((c) => (
          <li key={c.href} className="w-[16.5rem] shrink-0 snap-start sm:w-[18rem]">
            <Link
              href={c.href}
              className="group flex h-full flex-col rounded-xl border border-line bg-panel p-4 transition-colors hover:border-devil/60 hover:bg-panel-2/60 focus-ring"
            >
              {c.eyebrow && (
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-devil-bright/80">
                  {c.eyebrow}
                </span>
              )}
              <span className="display mt-1 text-balance text-lg leading-tight text-ink group-hover:text-devil-bright">
                {c.title}
              </span>
              <span className="mt-2 text-pretty text-sm text-ink-dim">{c.blurb}</span>
              <span className="mt-auto pt-3 text-xs text-devil-bright opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                {c.cta ?? "Open the answer →"}
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 hidden w-12 bg-gradient-to-l from-pitch to-transparent sm:block"
      />
    </div>
  );
}
