import type { SeasonSummary } from "@/lib/queries";
import { CampaignVerdict } from "@/components/CampaignVerdict";
import { cupVerdict, type Lane } from "@/components/seasons/seasonLedgerLanes";

const CUP_SHORT: Record<string, string> = {
  "charity-shield": "Shield",
  "uefa-super-cup": "Super Cup",
  "screen-sport-super-cup": "S.S. Cup",
  "fifa-club-world-cup": "Club World",
  "intercontinental-cup": "Interc.",
  "test-match": "Test",
};

/** One fixed lane's cell for a season: the campaign verdict(s), or an em dash if absent. */
export function CupCell({
  lane,
  comps,
  results,
}: {
  lane: Lane;
  comps: SeasonSummary[];
  results: Map<string, string>;
}) {
  if (comps.length === 0) {
    return <span className="text-ink-faint/55" aria-hidden>–</span>;
  }
  return (
    <div className="flex flex-col items-start gap-1">
      {comps.map((c) => {
        const v = cupVerdict(c, results.get(`${c.season}:${c.competition_id}`));
        return (
          <span key={c.competition_id} className="inline-flex items-center gap-1.5">
            {lane === "other" && (
              <span className="text-[10px] leading-none text-ink-faint">{CUP_SHORT[c.competition_id] ?? ""}</span>
            )}
            {v.tier === "neutral" ? (
              <span className="stat-num text-xs text-ink-dim">{v.label || "—"}</span>
            ) : (
              <CampaignVerdict label={v.label} tier={v.tier} />
            )}
          </span>
        );
      })}
    </div>
  );
}
