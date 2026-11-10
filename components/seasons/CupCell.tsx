import type { SeasonSummary } from "@/lib/queries";
import { CampaignVerdict } from "@/components/CampaignVerdict";
import { cupVerdict, LANE_LABEL, type Lane } from "@/components/seasons/seasonLedgerLanes";

const CUP_SHORT: Record<string, string> = {
  "charity-shield": "Shield",
  "uefa-super-cup": "Super Cup",
  "screen-sport-super-cup": "S.S. Cup",
  "fifa-club-world-cup": "Club World",
  "intercontinental-cup": "Interc.",
  "test-match": "Test",
};

/**
 * One fixed lane's cell for a season: the campaign verdict(s), or an en dash if
 * absent. Below `sm` the cell carries its own lane label and an empty lane drops out.
 */
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
    return <span className="ledger-cup__none" aria-hidden>–</span>;
  }
  return (
    <div className="ledger-cup">
      <span className="ledger-cup__lane">{LANE_LABEL[lane]}</span>
      {comps.map((c) => {
        const v = cupVerdict(c, results.get(`${c.season}:${c.competition_id}`));
        return (
          <span key={c.competition_id} className="ledger-cup__entry">
            {lane === "other" && (
              <span className="ledger-cup__short">{CUP_SHORT[c.competition_id] ?? ""}</span>
            )}
            {v.tier === "neutral" ? (
              <span className="stat-num ledger-cup__round">{v.label || "—"}</span>
            ) : (
              <CampaignVerdict label={v.label} tier={v.tier} />
            )}
          </span>
        );
      })}
    </div>
  );
}
