import Link from "next/link";
import type { ReactNode } from "react";

/**
 * One entry in an Explore summary rail — the skimmable list beneath each feature
 * carousel (Answering, Asking, Exploring). Every card reads top-down: the
 * scannable lead (the question, the debate, the cut) over a supporting answer
 * line that gives the figure its meaning, so a bare number never sits next to a
 * question that doesn't decode it. The answer line clamps to two lines rather than
 * truncating mid-word, and `h-full` keeps a row of cards level.
 */
export function RailCard({
  href,
  lead,
  stat,
  statTone,
  detail,
}: {
  href: string;
  /** The scannable headline — the question, debate label, or cut title. */
  lead: string;
  /** The answer figure, already formatted; omitted where a debate has no single number. */
  stat?: string;
  /** Result-palette colour class for the figure. */
  statTone?: string;
  /** What the figure means — a short clause, or a subject + gloss for cuts. */
  detail?: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="group flex h-full flex-col gap-1 rounded-lg border border-line bg-panel px-4 py-3 transition-colors hover:border-devil/60 hover:bg-panel-2/60 focus-ring"
    >
      <span className="text-sm font-medium leading-snug text-ink group-hover:text-devil-bright">
        {lead}
      </span>
      {(stat || detail) && (
        <span className="line-clamp-2 text-xs leading-5 text-ink-faint">
          {stat && <span className={`stat-num font-semibold ${statTone ?? "text-ink-dim"}`}>{stat} </span>}
          {detail}
        </span>
      )}
    </Link>
  );
}
