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
    <span
      className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold leading-none ${
        silver ? "border-silver/45 bg-silver/10 text-silver" : "border-gold/55 bg-gold/15 text-gold"
      }`}
    >
      {silver ? <MedalIcon className="h-3 w-3" /> : <TrophyIcon className="h-3.5 w-3.5" />}
      {label}
    </span>
  );
}
