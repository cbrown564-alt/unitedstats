import Link from "next/link";
import { PlayerPortrait } from "@/components/PlayerPortrait";
import { CoverageNote } from "@/components/CoverageNote";
import { fmtNum } from "@/lib/format";
import type { AssistPartnership } from "@/lib/queries";

/**
 * Supply lines as barbell rows — assister ↔ scorer, bar width = goals. Replaces
 * the flat ranked list so direction lives in the layout, not prose.
 */
export function SupplyLineRows({ rows }: { rows: AssistPartnership[] }) {
  const max = Math.max(1, ...rows.map((r) => r.goals));

  return (
    <div className="rounded-lg border border-line bg-panel p-4 shadow-[0_1px_0_rgb(255_255_255_/_0.025)_inset]">
      {rows.length > 0 ? (
        <ul className="space-y-3">
          {rows.map((row) => (
            <li key={`${row.assister_id}-${row.scorer_id}`}>
              <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 sm:gap-3">
                <Link
                  href={`/player/${row.assister_id}`}
                  className="group/end flex min-w-0 items-center justify-end gap-2 text-right transition-colors hover:text-devil-bright"
                >
                  <span className="min-w-0 truncate text-sm font-medium leading-tight group-hover/end:text-devil-bright">
                    {row.assister_name}
                  </span>
                  <PlayerPortrait name={row.assister_name} src={row.assister_thumb} size="xs" />
                </Link>

                <div className="flex min-w-[5.5rem] flex-col items-center gap-1 px-1 sm:min-w-[7rem]">
                  <div className="relative h-2 w-full overflow-hidden rounded-full bg-panel-2" aria-hidden>
                    <div
                      className="absolute inset-y-0 left-1/2 h-full -translate-x-1/2 rounded-full bg-gradient-to-r from-gold via-devil/80 to-devil"
                      style={{ width: `${(row.goals / max) * 100}%` }}
                    />
                  </div>
                  <span className="stat-num text-sm font-semibold text-devil-bright">{fmtNum(row.goals)}</span>
                </div>

                <Link
                  href={`/player/${row.scorer_id}`}
                  className="group/end flex min-w-0 items-center gap-2 transition-colors hover:text-devil-bright"
                >
                  <PlayerPortrait name={row.scorer_name} src={row.scorer_thumb} size="xs" />
                  <span className="min-w-0 truncate text-sm font-medium leading-tight group-hover/end:text-devil-bright">
                    {row.scorer_name}
                  </span>
                </Link>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-ink-dim">
          Assist fields are wired through the data and player pages; no current source in the checked-in dataset
          records assists for these matches.
        </p>
      )}

      <CoverageNote
        collapsible
        coverage="assist events exist only from 2012–13 onward (transfermarkt-datasets); no open source records United assists before then, so earlier seasons are blank by source limitation, not omission."
      >
        Bar width scales to the top pairing.
      </CoverageNote>
    </div>
  );
}
