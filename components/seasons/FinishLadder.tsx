import { TrophyIcon } from "@/components/CampaignIcons";
import type { SeasonSummary } from "@/lib/queries";

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0]);
}

const isTopFlight = (s: { competition_name: string }) =>
  s.competition_name === "First Division" || s.competition_name === "Premier League";

/**
 * League finish as a position track — shared by the seasons index table and
 * mobile season cards.
 */
export function FinishLadder({ league }: { league: SeasonSummary }) {
  if (league.position == null) {
    return <span className="stat-num text-xs text-ink-faint">No league finish</span>;
  }
  const top = isTopFlight(league);
  const size = league.league_size ?? 0;
  const pos = league.position;
  const frac = size > 1 ? (pos - 1) / (size - 1) : 0;
  const champ = pos === 1;
  const danger = top && !champ && frac >= 0.8;
  const relZone = size > 1 ? Math.min(22, (3 / size) * 100) : 16;

  const marker = champ
    ? top
      ? "bg-gold border-pitch"
      : "bg-pitch border-gold"
    : danger
      ? "bg-loss border-pitch"
      : top
        ? "bg-ink border-pitch"
        : "bg-ink-faint border-pitch";
  const placingTone = champ
    ? top
      ? "text-gold"
      : "text-gold/85"
    : danger
      ? "text-loss"
      : "text-ink-dim";
  const placingLabel = champ ? (top ? "Champions" : "Winners") : ordinal(pos);

  return (
    <div className="min-w-0">
      <div className="relative">
        <div className="h-2 w-full overflow-hidden rounded-full bg-panel-2/70 ring-1 ring-inset ring-line/60">
          {top ? (
            <>
              <div className="absolute inset-y-0 left-0 w-[7%] bg-gold/30" />
              <div className="absolute inset-y-0 right-0 bg-loss/25" style={{ width: `${relZone}%` }} />
            </>
          ) : (
            <div className="absolute inset-y-0 left-0 w-[12%] bg-ink/12" />
          )}
        </div>
        <span
          className={`absolute top-1 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 shadow-[0_1px_2px_rgb(0_0_0/0.5)] ${marker}`}
          style={{ left: `${frac * 100}%` }}
        />
      </div>
      <div className="mt-1.5 flex items-center justify-between gap-2 text-[11px] leading-none">
        <span className={`flex items-center gap-1 font-semibold ${placingTone}`}>
          {champ && top && <TrophyIcon className="h-3 w-3" />}
          {!top && (
            <span className="rounded bg-panel-2 px-1 py-px text-[9px] font-bold uppercase tracking-wide text-ink-faint">
              Div 2
            </span>
          )}
          {placingLabel}
        </span>
        {size > 0 && <span className="stat-num shrink-0 text-ink-faint">{size} teams</span>}
      </div>
    </div>
  );
}
