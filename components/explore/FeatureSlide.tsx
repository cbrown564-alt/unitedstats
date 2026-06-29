import Link from "next/link";
import type { ReactNode } from "react";

/**
 * One slide of an Explore feature strip — the shared shell behind both the
 * Answering (questions) and Asking (comparisons) strips. A near-full-view card:
 * a text column that is the jump link, beside a signature visual.
 *
 * The visual sits *outside* the link on purpose: a signature can carry its own
 * links (a CupLeanBar's player names, a comparison's subjects), and an <a> inside
 * an <a> is invalid. `group` lives on the card so a hover anywhere still lights the
 * heading and the cue. The lg padding clears the desktop edge arrows.
 */
export function FeatureSlide({
  href,
  ariaLabel,
  children,
  visual,
}: {
  href: string;
  ariaLabel: string;
  /** The text column (eyebrow, heading, finding/verdict, cue) — the jump link. */
  children: ReactNode;
  /** The signature visual, rendered beside the text and kept out of the link. */
  visual: ReactNode;
}) {
  return (
    <li className="w-[calc(100%-1.5rem)] shrink-0 snap-start sm:w-[calc(100%-4rem)]">
      <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-panel transition-colors hover:border-devil/60">
        <div className="grid flex-1 gap-6 p-5 sm:p-7 lg:min-h-[17rem] lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:items-center lg:px-16">
          <Link href={href} aria-label={ariaLabel} className="block rounded-lg focus-ring">
            {children}
          </Link>
          <div className="min-w-0">{visual}</div>
        </div>
      </article>
    </li>
  );
}
