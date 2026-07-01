import Link from "next/link";
import type { ReactNode } from "react";
import type { MatchRow } from "@/lib/queries";
import { fmtNum } from "@/lib/format";
import { queryString } from "@/lib/url";
import { ArchiveJumpRail } from "@/components/ArchiveJumpRail";
import { EvidenceLink } from "@/components/EvidenceLink";
import { MatchList } from "@/components/MatchList";

type GoalMatch = MatchRow & { goals: number; minutes?: string | null };

/** Jump rail only when the career span is long enough to need coarse navigation. */
const JUMP_RAIL_MIN_SEASONS = 15;

const chevron =
  "h-3.5 w-3.5 shrink-0 text-ink-faint transition-transform duration-200 group-open:rotate-90";

const summaryCls =
  "flex cursor-pointer list-none items-center gap-3 px-3 py-2.5 transition-colors hover:bg-panel-2 focus-visible:outline-2 focus-visible:outline-devil-bright sm:px-4 [&::-webkit-details-marker]:hidden";

function Chevron() {
  return (
    <svg className={chevron} viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ScoringSeasonRow({
  season,
  matches,
  playerId,
  open = false,
  renderExtra,
}: {
  season: string;
  matches: GoalMatch[];
  playerId: string;
  open?: boolean;
  renderExtra: (m: GoalMatch) => ReactNode;
}) {
  const seasonGoals = matches.reduce((a, m) => a + m.goals, 0);

  return (
    <details
      id={`scored-${season}`}
      open={open}
      className="group scroll-mt-28 overflow-hidden rounded-lg border border-line bg-panel"
    >
      <summary className={summaryCls}>
        <Chevron />
        <h3 className="display w-[5.25rem] shrink-0 text-base leading-none">{season}</h3>
        <span className="stat-num min-w-0 text-xs text-ink">
          <span className="text-devil-bright">{fmtNum(seasonGoals)} goal{seasonGoals === 1 ? "" : "s"}</span>
          <span className="text-ink-dim"> · Scored in {fmtNum(matches.length)} match{matches.length === 1 ? "" : "es"}</span>
        </span>
      </summary>
      <div className="border-t border-line">
        <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1 border-b border-line/60 px-3 py-2 sm:px-4">
          <Link href={`/seasons/${season}`} className="text-xs text-ink-dim hover:text-devil-bright focus-ring">
            View {season} →
          </Link>
          <EvidenceLink
            href={`/matches${queryString({ scorer: playerId, season })}`}
            label="Filter in match browser →"
          />
        </div>
        <MatchList matches={matches} accentResult renderExtra={renderExtra} />
      </div>
    </details>
  );
}

/**
 * Season-by-season scoring archive: one expandable row per season, newest open
 * first. The summary is the whole tap target — expand to the full {@link MatchList}
 * with goal badges, without leaving the player page. Long careers get a pinned
 * {@link ArchiveJumpRail} above the stack.
 */
export function PlayerScoringArchive({
  playerId,
  groups,
  renderExtra,
}: {
  playerId: string;
  groups: { season: string; matches: GoalMatch[] }[];
  renderExtra: (m: GoalMatch) => ReactNode;
}) {
  const matches = groups.flatMap((g) => g.matches);
  const total = matches.length;
  const showRail = groups.length >= JUMP_RAIL_MIN_SEASONS;

  return (
    <div>
      {showRail && <ArchiveJumpRail matches={matches} idPrefix="scored" sticky />}
      <div className={`flex flex-wrap items-baseline justify-between gap-3 ${showRail ? "mt-4" : ""}`}>
        <h3 className="text-sm font-medium text-ink-dim">Seasons where he scored</h3>
        <EvidenceLink
          href={`/matches${queryString({ scorer: playerId })}`}
          label={`Open all ${fmtNum(total)} in the match browser →`}
        />
      </div>
      <div className="mt-3 space-y-2">
        {groups.map(({ season, matches: ms }, i) => (
          <ScoringSeasonRow
            key={season}
            season={season}
            matches={ms}
            playerId={playerId}
            open={i === 0}
            renderExtra={renderExtra}
          />
        ))}
      </div>
    </div>
  );
}
