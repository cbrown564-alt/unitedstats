import Link from "next/link";
import type { EntryKind, EntryPoint } from "@/lib/entryPoints";

// A small tone-dot tells the three doors apart without a label: a person glows
// red (the devil thread), a rivalry gold, an era the quiet ink of the timeline.
const KIND_DOT: Record<EntryKind, string> = {
  player: "bg-devil-bright",
  rivalry: "bg-gold",
  era: "bg-ink-dim",
};

/**
 * The personal entry strip (Phase 18.4). A row of subject chips beneath the
 * search field — a player, a rivalry, an era — for the reader who arrives with a
 * name rather than a query. Each chip lands on an entity page that already opens
 * its own trails, so it branches into the record rather than dead-ending; a
 * "surprise me" tail rolls onto any curated surface for the reader with no name
 * in mind. Server component, plain links — no client JS, the static guardrail.
 */
export function EntryChips({ points }: { points: EntryPoint[] }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {points.map((p) => (
        <Link
          key={p.href}
          href={p.href}
          className="group inline-flex items-center gap-2 rounded-full border border-line bg-panel-2/50 px-3 py-1.5 text-sm transition-colors hover:border-devil/60 hover:bg-panel-2 focus-ring"
        >
          <span aria-hidden className={`h-1.5 w-1.5 shrink-0 rounded-full ${KIND_DOT[p.kind]}`} />
          <span className="font-medium text-ink group-hover:text-devil-bright">{p.label}</span>
          <span className="stat-num text-xs text-ink-faint">{p.hint}</span>
        </Link>
      ))}
      <Link
        href="/surprise"
        prefetch={false}
        className="group inline-flex items-center gap-1.5 rounded-full border border-dashed border-line px-3 py-1.5 text-sm text-ink-dim transition-colors hover:border-devil/60 hover:text-devil-bright focus-ring"
      >
        <span aria-hidden className="text-devil-bright transition-transform group-hover:rotate-180 motion-reduce:transition-none">
          ↻
        </span>
        Surprise me
      </Link>
    </div>
  );
}
