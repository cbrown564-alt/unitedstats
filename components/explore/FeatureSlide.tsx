import Link from "next/link";
import type { ReactNode } from "react";

/**
 * One slide of an Explore feature strip — the shared shell behind the Answering
 * (questions), Asking (comparisons), and Exploring (cuts) strips. A near-full-view
 * card: a text column beside a signature visual, with the whole card as the jump
 * target.
 *
 * A stretched link covers the card; the content grid is `pointer-events-none` so
 * clicks on the chart area reach the link without nesting `<a>` inside `<a>`.
 * `group` on the card keeps hover styling on the heading and cue when the pointer
 * is anywhere on the slide. The lg padding clears the desktop edge arrows.
 */
export function FeatureSlide({
  href,
  ariaLabel,
  children,
  visual,
}: {
  href: string;
  ariaLabel: string;
  /** The text column (eyebrow, heading, finding/verdict, cue). */
  children: ReactNode;
  /** The signature visual beside the text. */
  visual: ReactNode;
}) {
  return (
    <li className="w-[calc(100%-1.5rem)] shrink-0 snap-start sm:w-[calc(100%-4rem)]">
      <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-panel transition-colors hover:border-devil/60">
        <Link
          href={href}
          aria-label={ariaLabel}
          className="absolute inset-0 z-10 rounded-2xl focus-ring"
        />
        <div className="pointer-events-none grid flex-1 gap-6 p-5 sm:p-7 lg:min-h-[17rem] lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:items-center lg:px-16">
          <div>{children}</div>
          <div className="min-w-0">{visual}</div>
        </div>
      </article>
    </li>
  );
}
