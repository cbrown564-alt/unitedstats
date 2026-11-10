import { TrophyIcon, MedalIcon } from "@/components/CampaignIcons";

/**
 * How a competition campaign ended, graded so it can be rendered at the right
 * weight wherever a campaign's outcome is stated — the season detail's
 * competition lanes and the seasons index's fixed cup lanes both read off this,
 * so the same season shows the same gold/silver verdict in both places.
 *
 * `silverware` (a trophy won — league title or cup) and `final-loss` (runners-up)
 * are the critical outcomes that earn an accented chip; everything else is a
 * `neutral` placing stated quietly.
 */
export type CampaignTier = "silverware" | "final-loss" | "neutral";

/** The campaign verdict rendered at a weight that matches its achievement tier. */
export function CampaignVerdict({ label, tier }: { label: string; tier: CampaignTier }) {
  if (tier === "neutral") {
    return <span className="stat-num shrink-0 text-xs text-ink-dim">{label}</span>;
  }
  const silver = tier === "final-loss";
  return (
    <span className={silver ? "verdict-chip verdict-chip--silver" : "verdict-chip verdict-chip--gold"}>
      {silver ? <MedalIcon className="h-3 w-3" /> : <TrophyIcon className="h-3.5 w-3.5" />}
      {label}
    </span>
  );
}
