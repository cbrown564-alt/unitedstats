import type { ReactNode } from "react";
import { competitionMark } from "@/lib/competitionColors";
import { CampaignVerdict, type CampaignTier } from "@/components/CampaignVerdict";
import { FinishLadder } from "@/components/seasons/FinishLadder";
import { WdlBar, WdlRecord } from "@/components/WdlBar";
import { pct } from "@/lib/format";
import type { MatchRow, SeasonSummary } from "@/lib/queries";

const CHEVRON =
  "h-3.5 w-3.5 shrink-0 text-ink-faint transition-transform duration-200 group-open:rotate-90";

/**
 * One competition campaign within a season — a quiet summary row that expands to
 * the match list or cup bracket. Deliberately not a dashboard tile: no shouty
 * display type, no saturated abbreviation chips; a thin competition-colour lead
 * and typographic record instead.
 */
export function SeasonCompetitionLane({
  name,
  competitionId,
  competitionType,
  matches,
  summary,
  outcome,
  children,
}: {
  name: string;
  competitionId: string;
  competitionType: string;
  matches: MatchRow[];
  summary?: SeasonSummary;
  outcome: { label: string; tier: CampaignTier } | null;
  children: ReactNode;
}) {
  const w = matches.filter((m) => m.result === "W").length;
  const d = matches.filter((m) => m.result === "D").length;
  const l = matches.filter((m) => m.result === "L").length;
  const total = matches.length;
  const mark = competitionMark(competitionId, name, competitionType);

  const trophyAccent =
    outcome?.tier === "silverware"
      ? "border-l-gold/55 bg-gold/[0.03]"
      : outcome?.tier === "final-loss"
        ? "border-l-silver/45"
        : "";

  return (
    <details
      className={`group overflow-hidden border border-line border-x-0 border-l-2 bg-panel sm:rounded-lg sm:border-x ${trophyAccent}`}
      style={trophyAccent ? undefined : { borderLeftColor: `${mark.bg}55` }}
    >
      <summary
        className={`cursor-pointer list-none py-3 pr-3 pl-3 transition-colors hover:bg-panel-2/50 focus-visible:outline-2 focus-visible:outline-devil-bright sm:pr-4 [&::-webkit-details-marker]:hidden ${
          outcome?.tier === "silverware" ? "bg-gold/[0.02]" : ""
        }`}
      >
        <div className="flex items-start gap-2.5 sm:gap-3">
          <svg className={`${CHEVRON} mt-0.5`} viewBox="0 0 16 16" fill="none" aria-hidden>
            <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
          </svg>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <h3 className="text-sm font-medium leading-snug text-ink">{name}</h3>
              {outcome && <CampaignVerdict label={outcome.label} tier={outcome.tier} />}
            </div>

            {summary?.type === "league" && summary.position != null && (
              <div className="mt-2 max-w-xs">
                <FinishLadder league={summary} />
              </div>
            )}

            <div className="mt-1.5 flex flex-wrap items-center gap-x-2 text-[11px] leading-none text-ink-faint">
              <WdlRecord w={w} d={d} l={l} />
              <span aria-hidden className="text-ink-faint/60">
                ·
              </span>
              <span>
                <span className="stat-num text-ink-dim">{pct(w, total)}</span> won
              </span>
              <span aria-hidden className="text-ink-faint/60">
                ·
              </span>
              <span className="stat-num">
                {total} {total === 1 ? "match" : "matches"}
              </span>
            </div>

            <div className="mt-2 sm:hidden">
              <WdlBar w={w} d={d} l={l} size="xs" tooltip={false} />
            </div>
          </div>

          <div className="mt-1 hidden w-24 shrink-0 sm:block lg:w-32">
            <WdlBar w={w} d={d} l={l} size="xs" tooltip={false} />
          </div>
        </div>
      </summary>

      <div className="border-t border-line p-2 sm:p-3">{children}</div>
    </details>
  );
}
