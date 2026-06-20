import Link from "next/link";
import type { CupStage, CupTie, CupGroup, StageOutcome } from "@/lib/cupRun";
import { ClubBadge } from "./ClubBadge";
import { TrophyIcon, MedalIcon } from "./CampaignIcons";
import { scoreline, venuePrefix } from "@/lib/format";

/**
 * United's run through a cup, drawn as a single "road to the final" spine. We
 * only hold United's side of each tie, so this is honestly a *path*, not a
 * two-sided bracket: a red winning line climbs from entry to exit, each rung a
 * tie (one match, a two-legged aggregate, or a replay) or the group stage. The
 * line terminates in the verdict — a gold trophy node for a win, a silver medal
 * for runners-up, a slate stop where the run was knocked out. Position down the
 * ladder *is* round depth; the spine colour *is* the result, so neither needs a
 * legend. See {@link file://lib/cupRun.ts} for the stage model.
 */

/** The spine node — its size and colour grade the stage's outcome at a glance. */
const NODE: Record<StageOutcome, string> = {
  advanced: "h-2.5 w-2.5 bg-win ring-4 ring-win/15",
  winners: "h-4 w-4 bg-gold ring-4 ring-gold/25 shadow-[0_0_10px_rgba(245,197,24,0.55)]",
  "runners-up": "h-3.5 w-3.5 bg-silver ring-4 ring-silver/20",
  out: "h-3 w-3 bg-loss ring-4 ring-loss/15",
};

/** The terminal-node card accent — only the verdict rungs earn a tinted frame. */
const CARD_ACCENT: Record<StageOutcome, string> = {
  advanced: "border-line",
  winners: "border-gold/45 bg-gold/[0.06]",
  "runners-up": "border-silver/35 bg-silver/[0.05]",
  out: "border-loss/35 bg-loss/[0.04]",
};

function ProgressChip({ outcome }: { outcome: StageOutcome }) {
  if (outcome === "winners") {
    return (
      <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-gold/55 bg-gold/15 px-2 py-0.5 text-[11px] font-semibold leading-none text-gold">
        <TrophyIcon className="h-3.5 w-3.5" />
        Winners
      </span>
    );
  }
  if (outcome === "runners-up") {
    return (
      <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-silver/45 bg-silver/10 px-2 py-0.5 text-[11px] font-semibold leading-none text-silver">
        <MedalIcon className="h-3 w-3" />
        Runners-up
      </span>
    );
  }
  if (outcome === "out") {
    return (
      <span className="shrink-0 rounded-full border border-loss/40 bg-loss/10 px-2 py-0.5 text-[11px] font-semibold leading-none text-loss">
        Knocked out
      </span>
    );
  }
  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-win/40 bg-win/10 px-2 py-0.5 text-[11px] font-semibold leading-none text-win">
      <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none" aria-hidden>
        <path d="M3.5 8.5l3 3 6-7" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      Through
    </span>
  );
}

/** A single leg's score, linking to its match; venue prefix keeps legs distinct. */
function LegScore({ id, label }: { id: string; label: string }) {
  return (
    <Link
      href={`/match/${id}`}
      className="stat-num rounded bg-panel px-1.5 py-0.5 text-xs font-semibold whitespace-nowrap transition-colors hover:bg-panel-2 hover:text-devil-bright focus-visible:outline-2 focus-visible:outline-devil-bright"
    >
      {label}
    </Link>
  );
}

function TieRung({ tie }: { tie: CupTie }) {
  return (
    <div className={`rounded-lg border ${CARD_ACCENT[tie.outcome]} bg-panel-2/40 px-2.5 py-2 sm:px-3`}>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <span className="display min-w-[5.5rem] text-[11px] leading-none tracking-wide text-ink-faint">
          {tie.round}
        </span>
        <span className="flex min-w-0 items-center gap-2">
          <ClubBadge id={tie.opponentId} name={tie.opponentName} size="sm" />
          <span className="truncate text-sm font-medium">{tie.opponentName}</span>
        </span>
        <span className="ml-auto flex flex-wrap items-center justify-end gap-1.5">
          {tie.format === "single" ? (
            <LegScore
              id={tie.decisive.id}
              label={scoreline(
                tie.decisive.gf,
                tie.decisive.ga,
                tie.decisive.pen_gf != null ? [tie.decisive.pen_gf, tie.decisive.pen_ga] : null,
                !!tie.decisive.aet,
              )}
            />
          ) : (
            tie.legs.map((m) => (
              <LegScore key={m.id} id={m.id} label={`${venuePrefix(m.venue)} ${m.gf}–${m.ga}`} />
            ))
          )}
          {tie.agg && (
            <span className="stat-num rounded-full border border-line px-2 py-0.5 text-[11px] leading-none text-ink-dim">
              agg {tie.agg.gf}–{tie.agg.ga}
            </span>
          )}
          <ProgressChip outcome={tie.outcome} />
        </span>
      </div>
    </div>
  );
}

function GroupRung({ group }: { group: CupGroup }) {
  const shown = group.opponents.slice(0, 5);
  return (
    <div className={`rounded-lg border ${CARD_ACCENT[group.outcome]} bg-panel-2/40 px-2.5 py-2 sm:px-3`}>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <span className="display min-w-[5.5rem] text-[11px] leading-none tracking-wide text-ink-faint">
          {group.label}
        </span>
        <span className="flex min-w-0 items-center gap-1.5">
          {shown.map((o) => (
            <ClubBadge key={o.id} id={o.id} name={o.name} size="sm" />
          ))}
          {group.opponents.length > shown.length && (
            <span className="stat-num text-xs text-ink-faint">+{group.opponents.length - shown.length}</span>
          )}
        </span>
        <span className="ml-auto flex flex-wrap items-center justify-end gap-1.5">
          <span className="stat-num flex items-center gap-1.5 text-xs">
            <span className="text-win">{group.w}W</span>
            <span className="text-draw">{group.d}D</span>
            <span className="text-loss">{group.l}L</span>
          </span>
          <ProgressChip outcome={group.outcome === "advanced" ? "advanced" : "out"} />
        </span>
      </div>
    </div>
  );
}

export function CupRun({ stages }: { stages: CupStage[] }) {
  const n = stages.length;
  const ended = stages[n - 1]?.outcome;
  const verdict =
    ended === "winners" ? "lifted the trophy" : ended === "runners-up" ? "reached the final" : "ran out";

  return (
    <div>
      <ol className="relative">
        {stages.map((stage, i) => (
          <li key={stage.kind === "group" ? `group-${stage.ord}` : `${stage.round}-${stage.opponentId}`} className="flex gap-3 sm:gap-4">
            {/* The winning spine: a red line climbing through the rungs, the node
                grading each stage, the colour stopping at the verdict. */}
            <div className="relative flex w-3 shrink-0 flex-col items-center">
              <span className={`w-0.5 ${i > 0 ? "h-[1.15rem] bg-win/40" : "h-[1.15rem] bg-transparent"}`} />
              <span className={`z-10 shrink-0 rounded-full ${NODE[stage.outcome]}`} />
              <span className={`w-0.5 flex-1 ${i < n - 1 ? "bg-win/40" : "bg-transparent"}`} />
            </div>
            <div className="min-w-0 flex-1 pb-2.5 sm:pb-3">
              {stage.kind === "tie" ? <TieRung tie={stage} /> : <GroupRung group={stage} />}
            </div>
          </li>
        ))}
      </ol>
      <p className="mt-1 pl-6 text-[11px] leading-4 text-ink-faint">
        United&apos;s path, round by round — the line climbs while they advance and stops where they {verdict}.
        Two-legged ties show both legs and the aggregate.
      </p>
    </div>
  );
}
