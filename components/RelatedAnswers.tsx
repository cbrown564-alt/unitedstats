import Link from "next/link";
import type { RelatedLink } from "@/lib/related";

/**
 * The trail at the foot of an answer (Phase 18.3): two or three curated next
 * steps, each framed by a connective hook so a single question becomes a session.
 * The thread metaphor made literal — "pull the thread further" — closing the
 * answer page by handing the reader the next answer rather than a dead end. Pure
 * server render; the curated graph lives in `lib/related.ts`.
 */
export function RelatedAnswers({ links }: { links: RelatedLink[] }) {
  if (links.length === 0) return null;
  return (
    <section aria-label="Where this leads" className="border-t border-line/60 pt-8">
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-ink-faint">
        Pull the thread further
      </h2>
      <ul className="grid gap-2 sm:grid-cols-3">
        {links.map((l) => (
          <li key={l.href}>
            <Link
              href={l.href}
              className="group flex h-full flex-col rounded-lg border border-line bg-panel p-3.5 transition-colors hover:border-devil/60 hover:bg-panel-2/60 focus-ring"
            >
              <span className="text-pretty text-sm font-medium leading-snug text-ink group-hover:text-devil-bright">
                {l.label}
              </span>
              <p className="mt-1.5 text-pretty text-[13px] leading-5 text-ink-dim">{l.hook}</p>
              <span className="mt-auto pt-3 text-[11px] font-semibold text-devil-bright opacity-0 transition-opacity group-hover:opacity-100">
                Follow the thread →
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
