import type { SeasonSummary } from "@/lib/queries";
import type { CampaignTier } from "@/components/CampaignVerdict";

export type Lane = "fa-cup" | "league-cup" | "europe" | "other";

const LANE_ORDER: Lane[] = ["fa-cup", "league-cup", "europe", "other"];

export const LANE_LABEL: Record<Lane, string> = {
  "fa-cup": "FA Cup",
  "league-cup": "League Cup",
  europe: "Europe",
  other: "Other",
};

export function laneOf(type: string): Lane | null {
  switch (type) {
    case "domestic-cup":
      return "fa-cup";
    case "league-cup":
      return "league-cup";
    case "european":
      return "europe";
    case "super-cup":
    case "world":
    case "playoff":
      return "other";
    default:
      return null;
  }
}

function shortRound(round: string | null): string {
  if (!round) return "";
  const r = round.toLowerCase();
  if (r.includes("semi")) return "SF";
  if (r.includes("quarter")) return "QF";
  if (r.includes("round of 16")) return "R16";
  if (r.includes("group")) return "Group";
  if (r.includes("play-off") || r.includes("playoff")) return "Play-off";
  if (r.includes("qualifying")) return "Qual.";
  const m = round.match(/round\s*(\d+)/i);
  if (m) return `R${m[1]}`;
  if (r.includes("final")) return "Final";
  return round;
}

export function cupVerdict(
  s: SeasonSummary,
  lastOutcome: string | undefined,
): { label: string; tier: CampaignTier } {
  if (s.type === "playoff") {
    return { label: lastOutcome === "W" ? "Won" : "Lost", tier: "neutral" };
  }
  const oneOff = s.type === "super-cup" || s.type === "world";
  const fr = s.furthest_round ?? "";
  const reachedFinal = oneOff || (/final/i.test(fr) && !/(semi|quarter)/i.test(fr));
  if (reachedFinal && lastOutcome) {
    return lastOutcome === "W" ? { label: "Won", tier: "silverware" } : { label: "Final", tier: "final-loss" };
  }
  return { label: shortRound(s.furthest_round), tier: "neutral" };
}

export function lanesForComps(comps: SeasonSummary[]): Lane[] {
  const laneSet = new Set<Lane>();
  for (const c of comps) {
    const ln = laneOf(c.type);
    if (ln) laneSet.add(ln);
  }
  return LANE_ORDER.filter((l) => laneSet.has(l));
}
