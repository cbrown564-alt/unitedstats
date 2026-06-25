import Link from "next/link";
import type { RelatedKind, RelatedLink } from "@/lib/related";

// What each onward step is, in the reader's words — the structural signal that
// the trail is varied moves, not a flat see-also list.
const KIND_LABEL: Record<RelatedKind, string> = {
  question: "Another question",
  cut: "A way to slice it",
  debate: "Head to head",
};

/**
 * The trail at the foot of an answer (Phase 18.3): the page's red-thread spine
 * doesn't stop at the answer — it carries on into the next questions. Rendered as
 * a continuing thread of stations (the same dot-and-spine vocabulary as
 * `AnswerThread`), each a curated next step introduced by a connective hook, so
 * "follow the thread to the next answer" is the literal structure of the close,
 * not a row of cards. Pure server render; the curated graph lives in
 * `lib/related.ts`.
 */
export function RelatedAnswers({ links }: { links: RelatedLink[] }) {
  if (links.length === 0) return null;
  return (
    <section aria-label="Where this leads next" className="border-t border-line/60 pt-8">
      <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-faint">
        Pull the thread further
      </h2>
      <ol className="mt-5">
        {links.map((l, i) => {
          const isLast = i === links.length - 1;
          return (
            <li
              key={l.href}
              className="group grid grid-cols-[1.25rem_minmax(0,1fr)] gap-x-3 sm:grid-cols-[1.5rem_minmax(0,1fr)] sm:gap-x-4"
            >
              <div className="flex flex-col items-center" aria-hidden>
                <span className="mt-[0.2rem] h-2.5 w-2.5 shrink-0 rounded-full bg-devil-bright ring-devil-bright/20 transition-all duration-300 group-hover:ring-4" />
                {!isLast && <span className="my-1.5 w-px flex-1 bg-devil/25" />}
              </div>
              <Link
                href={l.href}
                className={`block rounded focus-ring ${isLast ? "pb-0" : "pb-8 sm:pb-9"}`}
              >
                <span className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-faint">
                  {KIND_LABEL[l.kind]}
                </span>
                <p className="mt-1.5 flex items-start gap-1.5 text-pretty text-[15px] font-semibold leading-snug text-ink transition-colors group-hover:text-devil-bright">
                  <span>{l.label}</span>
                  <span aria-hidden className="mt-0.5 shrink-0 transition-transform group-hover:translate-x-0.5">→</span>
                </p>
                <p className="mt-1.5 text-pretty text-[13px] leading-5 text-ink-dim">{l.hook}</p>
              </Link>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
