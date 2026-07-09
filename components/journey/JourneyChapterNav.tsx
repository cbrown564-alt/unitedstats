import Link from "next/link";
import { JOURNEY_CHAPTERS } from "@/lib/journey";

/**
 * The light chapter index — a quiet row on each chapter's door (docs/JOURNEY.md
 * §4b packaging). The current chapter reads as a landed knot; the others are
 * doors, in the same filament-knot register as JourneySourceLink. Deliberately
 * not nav chrome: it renders once, at the end, after the chapter has finished.
 */
export function JourneyChapterNav({ current }: { current: string }) {
  return (
    <nav aria-label="Journey chapters" className="mt-16 flex flex-col items-center gap-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-ink-faint">
        Red Thread journeys
      </p>
      <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-3">
        {JOURNEY_CHAPTERS.map((ch) =>
          ch.href === current ? (
            <span
              key={ch.href}
              aria-current="page"
              className="inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.16em] text-ink-dim"
            >
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-gold" aria-hidden />
              <span className="stat-num">{ch.number}</span>
              <span>{ch.title}</span>
            </span>
          ) : (
            <Link
              key={ch.href}
              href={ch.href}
              className="group inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.16em] text-ink-faint transition hover:text-gold focus-ring"
            >
              <span className="h-1 w-1 shrink-0 rounded-full bg-devil-bright/35 transition group-hover:bg-gold/70" aria-hidden />
              <span className="stat-num">{ch.number}</span>
              <span>{ch.title}</span>
              <span className="opacity-50 transition group-hover:translate-x-0.5 group-hover:opacity-90" aria-hidden>
                →
              </span>
            </Link>
          ),
        )}
      </div>
    </nav>
  );
}
