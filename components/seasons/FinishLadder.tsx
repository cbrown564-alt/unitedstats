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

  // The marker defaults to an ink dot on a pitch ring (`.finish-ladder__marker`).
  const marker = champ
    ? top
      ? " bg-gold"
      : " bg-pitch border-gold"
    : danger
      ? " bg-loss"
      : top
        ? ""
        : " bg-ink-faint";
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
        <div className="finish-ladder__track">
          {top ? (
            <>
              <div className="absolute inset-y-0 left-0 w-[7%] bg-gold/30" />
              <div className="absolute inset-y-0 right-0 bg-loss/25" style={{ width: `${Math.round(relZone * 10) / 10}%` }} />
            </>
          ) : (
            <div className="absolute inset-y-0 left-0 w-[12%] bg-ink/12" />
          )}
        </div>
        <span
          className={`finish-ladder__marker${marker}`}
          style={{ left: `${Math.round(frac * 1000) / 10}%` }}
        />
      </div>
      <div className="finish-ladder__meta">
        <span className={`finish-ladder__place ${placingTone}`}>
          {champ && top && <TrophyIcon className="h-3 w-3" />}
          {!top && (
            <span className="finish-ladder__div2">
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
