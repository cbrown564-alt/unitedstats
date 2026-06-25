import Link from "next/link";
import { PlayerPortrait } from "@/components/PlayerPortrait";
import { ClubBadge } from "@/components/ClubBadge";
import type { EntryPoint } from "@/lib/entryPoints";

/**
 * The personal entry strip (Phase 18.4). A row of subject chips beneath the
 * search field — a player, a rivalry, an era — for the reader who arrives with a
 * name rather than a query. Each chip lands on an entity page that already opens
 * its own trails, so it branches into the record rather than dead-ending; a
 * "surprise me" tail rolls onto any curated surface for the reader with no name
 * in mind.
 *
 * The chips lead with a *face or a crest* (Phase 18.4 design call): a round player
 * portrait, the club's generated badge, a gold star for an era — so you enter
 * through something you recognise, not a grey pill. Server component, plain links,
 * shared visuals (PlayerPortrait / ClubBadge) — no client JS, the static guardrail.
 */
function ChipVisual({ point }: { point: EntryPoint }) {
  if (point.kind === "player" && point.photo) {
    return <PlayerPortrait size="xs" src={point.photo.src} name={point.photo.name} />;
  }
  if (point.kind === "rivalry" && point.crest) {
    return <ClubBadge size="sm" id={point.crest.id} name={point.crest.name} />;
  }
  // Era — a gold marker for a defining campaign or reign (no single face to show).
  return (
    <span
      aria-hidden
      className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-gold/15 text-sm text-gold shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]"
    >
      ★
    </span>
  );
}

export function EntryChips({ points }: { points: EntryPoint[] }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {points.map((p) => (
        <Link
          key={p.href}
          href={p.href}
          className="group inline-flex items-center gap-2.5 rounded-full border border-line bg-panel-2/50 py-1.5 pl-2 pr-4 transition-colors hover:border-devil/60 hover:bg-panel-2 focus-ring"
        >
          <ChipVisual point={p} />
          <span className="flex items-baseline gap-2 leading-tight">
            <span className="text-sm font-semibold text-ink group-hover:text-devil-bright">{p.label}</span>
            <span className="stat-num text-xs text-ink-faint">{p.hint}</span>
          </span>
        </Link>
      ))}
      <Link
        href="/surprise"
        prefetch={false}
        className="group inline-flex items-center gap-1.5 self-stretch rounded-full border border-dashed border-line px-4 text-sm text-ink-dim transition-colors hover:border-devil/60 hover:text-devil-bright focus-ring"
      >
        <span aria-hidden className="text-devil-bright transition-transform group-hover:rotate-180 motion-reduce:transition-none">
          ↻
        </span>
        Surprise me
      </Link>
    </div>
  );
}
