import Link from "next/link";
import { fmtDate, resultTone, venuePrefix } from "@/lib/format";
import type { RecentDigestCard } from "@/lib/historyDigests";

/**
 * The freshness loop made visible: the most recently changed matches, each
 * leading with the single editorial headline of what it moved in the all-time
 * record. A scannable grid of evidence cards rather than a heavy carousel — the
 * history-changed surface as a destination, not an orphan. Pure server render.
 */
export function RecentlyChanged({ cards }: { cards: RecentDigestCard[] }) {
  if (cards.length === 0) return null;
  return (
    <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((c) => (
        <li key={c.id}>
          <Link
            href={c.path}
            className="group flex h-full flex-col rounded-lg border border-line bg-panel p-3.5 transition-colors hover:border-devil/60 hover:bg-panel-2/60 focus-ring"
          >
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-faint">
                {fmtDate(c.date)}
              </span>
              <span className="truncate text-sm text-ink-dim">
                <span className={`stat-num font-semibold ${resultTone(c.result)}`}>{c.score}</span>{" "}
                <span className="text-ink-faint">{venuePrefix(c.venue)}</span> {c.opponent}
              </span>
            </div>
            <p className="mt-2 text-pretty text-sm leading-6 text-ink-dim group-hover:text-ink">
              {c.lead.text}
            </p>
            <span className="mt-auto pt-3 text-[11px] font-semibold text-devil-bright opacity-0 transition-opacity group-hover:opacity-100">
              What it changed →
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
