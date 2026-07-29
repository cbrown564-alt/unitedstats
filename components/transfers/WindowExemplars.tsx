import { SectionHead } from "@/components/SectionHead";
import { CoverageNote } from "@/components/CoverageNote";
import { TransferHistoryLink } from "@/components/transfers/TransferHistoryLink";
import type { TransferWindowExemplar } from "@/lib/transferFeature";

/**
 * The way into the window pages. Only the authored exemplars appear, because
 * only they have a page — a season with one undated move has no contextual job
 * to do, and the ledger below already holds every one of them.
 */
export function WindowExemplars({ windows }: { windows: TransferWindowExemplar[] }) {
  if (windows.length === 0) return null;

  return (
    <section id="window-pages" className="scroll-mt-28 space-y-3">
      <SectionHead title="Windows in context" aside="business set against the season that followed" />
      <ul className="grid gap-2 lg:grid-cols-3">
        {windows.map((window) => (
          <li key={window.season}>
            <TransferHistoryLink
              href={`/transfers/${window.season}`}
              destination="window"
              source="window_exemplars"
              className="group flex h-full flex-col gap-1.5 rounded-lg border border-line bg-panel px-4 py-3.5 transition-colors hover:bg-panel-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-devil-bright"
            >
              <span className="stat-num text-xs font-medium text-devil-bright">{window.label}</span>
              <span className="display text-base leading-tight text-ink group-hover:text-devil-bright">
                {window.title}
              </span>
              <span className="text-xs leading-5 text-ink-dim">{window.blurb}</span>
              <span className="mt-auto pt-1.5 text-[10px] uppercase tracking-[0.14em] text-ink-faint">
                {window.frame}
              </span>
            </TransferHistoryLink>
          </li>
        ))}
      </ul>
      <CoverageNote slice="authored transfer windows">
        Three deliberately different shapes — a settled squad addition, a managerial transition, and an open window
        whose season is unplayed. Every other season stays in the full ledger below rather than becoming a thin page.
      </CoverageNote>
    </section>
  );
}
