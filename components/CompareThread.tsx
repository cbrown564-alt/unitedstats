import type { ReactNode } from "react";

export type CompareStation = { id: string; label: string; node: ReactNode };

/**
 * A resolved comparison as a fixed thread — the same dot-and-spine vocabulary as
 * {@link AnswerThread}, but without scroll tracking. Each station is a leg of the
 * argument: verdict, signature visual, measures, coverage.
 */
export function CompareThread({ stations }: { stations: CompareStation[] }) {
  return (
    <ol>
      {stations.map((s, i) => {
        const isLast = i === stations.length - 1;
        return (
          <li
            key={s.id}
            id={s.id}
            className="grid scroll-mt-24 grid-cols-[1.25rem_minmax(0,1fr)] gap-x-3 sm:grid-cols-[1.5rem_minmax(0,1fr)] sm:gap-x-4"
          >
            <div className="flex flex-col items-center" aria-hidden>
              <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-devil-bright ring-4 ring-devil-bright/20" />
              {!isLast && <span className="my-0 w-px flex-1 bg-devil-bright sm:my-1.5" />}
            </div>
            <div className={`min-w-0 ${isLast ? "pb-1" : "pb-8 sm:pb-12"}`}>
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-ink">
                {s.label}
              </p>
              {s.node}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
