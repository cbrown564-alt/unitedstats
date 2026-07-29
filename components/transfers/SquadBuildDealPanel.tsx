import { PlayerPortrait } from "@/components/PlayerPortrait";
import { TransferHistoryLink } from "@/components/transfers/TransferHistoryLink";
import { fmtDate } from "@/lib/format";
import type { SquadBuildThread } from "@/lib/squadBuild";

/**
 * Compact deal panel for squad-build selection.
 *
 * Full {@link TransferReceipt} is available elsewhere on the hub — this stays
 * intentionally slim so the timeline can swap to the shared receipt later.
 */
export function SquadBuildDealPanel({ thread }: { thread: SquadBuildThread | null }) {
  if (!thread) {
    return (
      <div className="rounded-lg border border-line bg-panel px-4 py-5 text-sm leading-6 text-ink-dim">
        Select a move on the timeline or in the ledger to inspect the deal.
      </div>
    );
  }

  const playerHref = thread.playerId ? `/player/${thread.playerId}` : null;
  const directionLabel = thread.direction === "in" ? "Arrival" : "Departure";
  const meta = [thread.season, thread.club ?? "—", thread.date ? fmtDate(thread.date) : "—"].join(" · ");

  const body = (
    <>
      <div className="flex items-start gap-3">
        <PlayerPortrait name={thread.playerName} src={thread.thumbUrl} size="md" />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-faint">{directionLabel}</p>
          <p className="truncate text-lg font-semibold leading-tight text-ink">{thread.playerName}</p>
          <p className="stat-num mt-1 text-2xl font-semibold leading-none text-ink">{thread.feeDisplay}</p>
          <p className="stat-num mt-1 text-[11px] text-ink-faint">{meta}</p>
        </div>
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 border-t border-line/70 pt-4 text-sm">
        <div>
          <dt className="text-xs text-ink-faint">Position</dt>
          <dd className="text-ink">{thread.positionLabel ?? thread.position}</dd>
        </div>
        <div>
          <dt className="text-xs text-ink-faint">Type</dt>
          <dd className="capitalize text-ink">{thread.type}</dd>
        </div>
        <div className="col-span-2">
          <dt className="text-xs text-ink-faint">Manager at deal</dt>
          <dd className="text-ink">{thread.managerName ?? "—"}</dd>
        </div>
      </dl>
    </>
  );

  return (
    <div className="rounded-lg border border-line bg-panel px-4 py-4">
      {playerHref ? (
        <TransferHistoryLink
          href={playerHref}
          destination="player"
          source="squad_build"
          className="block transition-colors hover:text-devil-bright focus-ring"
        >
          {body}
          <p className="mt-4 text-sm font-semibold text-devil-bright">Open player profile →</p>
        </TransferHistoryLink>
      ) : (
        body
      )}
    </div>
  );
}
