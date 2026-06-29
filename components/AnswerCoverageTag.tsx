import type { AnswerCoverage } from "@/lib/search";

/**
 * The trust signal that travels beside a shaped verdict — in the typeahead and on
 * `/search` — so the answer and its coverage read in one glance (DISCOVERY §6). A
 * neutral marker, never a result colour: a filled dot for the complete result
 * record, a hollow dot plus the partial facet's name for an event-derived answer.
 * Pure markup, so the client dropdown and the server results page share one tag.
 */
export function AnswerCoverageTag({ coverage }: { coverage: AnswerCoverage }) {
  const complete = coverage.grade === "complete";
  return (
    <span
      className={`inline-flex items-center gap-1 whitespace-nowrap text-[10px] uppercase tracking-wider ${
        complete ? "text-ink-dim" : "text-ink-faint"
      }`}
    >
      <span
        aria-hidden
        className={`inline-block h-1.5 w-1.5 rounded-full ${complete ? "bg-ink-dim" : "border border-ink-faint"}`}
      />
      {complete ? "complete" : `partial · ${coverage.label}`}
    </span>
  );
}
