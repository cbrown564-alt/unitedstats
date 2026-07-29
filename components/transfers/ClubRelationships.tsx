import { SectionHead } from "@/components/SectionHead";
import { CoverageNote } from "@/components/CoverageNote";
import { ClubBadge } from "@/components/ClubBadge";
import { TransferHistoryLink } from "@/components/transfers/TransferHistoryLink";
import { fmtNum } from "@/lib/format";
import type { GatedClub } from "@/lib/transferClubs";

/**
 * The way into the counterparty lenses. Only gated clubs appear, and only the
 * most-traded handful — the full set stays reachable through the season ledger
 * rather than becoming a directory page.
 */
export function ClubRelationships({ clubs }: { clubs: GatedClub[] }) {
  if (clubs.length === 0) return null;

  return (
    <section id="club-relationships" className="scroll-mt-28 space-y-3">
      <SectionHead title="The clubs United trade with" aside="market moves · both directions" />
      <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {clubs.map((club) => (
          <li key={club.clubId}>
            <TransferHistoryLink
              href={`/transfers/club/${club.clubId}`}
              destination="club"
              source="club_relationships"
              className="group flex min-h-14 items-center gap-3 rounded-lg border border-line bg-panel px-3 py-2 transition-colors hover:bg-panel-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-devil-bright"
            >
              <ClubBadge id={club.clubId} name={club.clubName} size="sm" />
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-ink group-hover:text-devil-bright">
                  {club.clubName}
                </span>
                <span className="stat-num block text-xs text-ink-faint">
                  {fmtNum(club.marketCount)} recorded moves
                  {club.authored ? " · authored thread" : ""}
                </span>
              </span>
            </TransferHistoryLink>
          </li>
        ))}
      </ul>
      <CoverageNote slice="counterparty club relationships">
        A club gets its own page only when at least three market transfers involve it, or two plus an authored
        historical connection. Academy intakes, releases and retirements have no counterparty and are excluded from
        these counts.
      </CoverageNote>
    </section>
  );
}
