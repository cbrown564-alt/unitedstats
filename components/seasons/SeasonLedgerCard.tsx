import Link from "next/link";
import type { SeasonSummary } from "@/lib/queries";
import { WdlBar } from "@/components/WdlBar";
import { CampaignVerdict, type CampaignTier } from "@/components/CampaignVerdict";
import { FinishLadder } from "@/components/seasons/FinishLadder";

export type SeasonCupOutcome = {
  laneLabel: string;
  label: string;
  tier: CampaignTier;
  competitionShort?: string;
};

/**
 * Mobile season row — one card in the ledger stream. Answer-first: season,
 * league finish, W-D-L, then cup lanes as a quiet subline. Desktop keeps the
 * grid table on `/seasons`.
 */
export function SeasonLedgerCard({
  season,
  href,
  league,
  totalP,
  cups,
  glory,
  eraClass = "",
}: {
  season: string;
  href: string;
  league?: SeasonSummary;
  totalP: number;
  cups: SeasonCupOutcome[];
  glory?: boolean;
  eraClass?: string;
}) {
  return (
    <li className={`register-card-item ${eraClass}`}>
      <Link
        href={href}
        className={`season-card block rounded-xl border px-4 py-3.5 transition-colors focus-ring ${
          glory ? "border-gold/35 bg-gold/[0.04] hover:border-gold/50" : "border-line/80 hover:border-devil/35 hover:bg-panel-2/40"
        }`}
      >
        <div className="flex items-baseline justify-between gap-3">
          <span className="display text-lg leading-tight">{season}</span>
          <span className="stat-num shrink-0 text-[11px] text-ink-faint">{totalP} matches</span>
        </div>

        <div className="mt-3 space-y-3">
          {league ? (
            <>
              <FinishLadder league={league} />
              <WdlBar w={league.w} d={league.d} l={league.l} size="md" showLabels tooltip={false} />
            </>
          ) : (
            <p className="text-xs text-ink-faint">Cup competitions only</p>
          )}

          {cups.length > 0 && (
            <ul className="flex flex-wrap gap-x-3 gap-y-1.5 text-[11px] leading-tight">
              {cups.map((c) => (
                <li key={`${c.laneLabel}-${c.label}`} className="inline-flex items-center gap-1.5">
                  <span className="text-ink-faint">{c.laneLabel}</span>
                  {c.competitionShort && (
                    <span className="text-ink-faint/80">{c.competitionShort}</span>
                  )}
                  {c.tier === "neutral" ? (
                    <span className="stat-num text-ink-dim">{c.label || "—"}</span>
                  ) : (
                    <CampaignVerdict label={c.label} tier={c.tier} />
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </Link>
    </li>
  );
}
