import Link from "next/link";
import type { AssistPartnership } from "@/lib/queries";
import { PlayerPortrait } from "@/components/PlayerPortrait";
import { CoverageNote } from "@/components/CoverageNote";
import { fmtNum } from "@/lib/format";

type Partner = { id: string; name: string; thumb: string | null; goals: number };

/**
 * A two-sided supply map centred on the player: goals he *created* for others
 * (gold, the assist colour) on one side, goals he *scored from* a team-mate's
 * pass (devil-red, the goal colour) on the other. Each partner carries a bar
 * scaled to the strongest pairing across both sides, so the longest bar *is*
 * his favourite combination before any number is read. Replaces the flat
 * "A assisted B" sentence list — direction now lives in the layout, not prose.
 */
export function AssistPartnerships({
  playerId,
  rows,
  hideTitle = false,
  hideCoverageNote = false,
}: {
  playerId: string;
  rows: AssistPartnership[];
  /** Omit section title and lead sentence when wrapped in a parent disclosure. */
  hideTitle?: boolean;
  /** Omit footer note when coverage is aggregated on the parent page. */
  hideCoverageNote?: boolean;
}) {
  // Split by direction. A goal event never has scorer === assister, so the two
  // lanes are disjoint: assister-side rows are his playmaking, scorer-side rows
  // are his supply line.
  const created: Partner[] = rows
    .filter((r) => r.assister_id === playerId)
    .map((r) => ({ id: r.scorer_id, name: r.scorer_name, thumb: r.scorer_thumb, goals: r.goals }));
  const supplied: Partner[] = rows
    .filter((r) => r.scorer_id === playerId)
    .map((r) => ({ id: r.assister_id, name: r.assister_name, thumb: r.assister_thumb, goals: r.goals }));

  const max = Math.max(1, ...rows.map((r) => r.goals));
  const createdTotal = created.reduce((a, p) => a + p.goals, 0);
  const suppliedTotal = supplied.reduce((a, p) => a + p.goals, 0);

  // Strongest pairing overall leads the section as the answer-object. Rows arrive
  // goals-desc, so rows[0] is the peak; direction sets the verb.
  const top = rows[0];
  const topCreated = top && top.assister_id === playerId;
  const topPartner = top ? (topCreated ? top.scorer_name : top.assister_name) : null;

  const bothSides = created.length > 0 && supplied.length > 0;

  return (
    <section>
      {!hideTitle && (
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <h2 className="display text-xl">Assist partnerships</h2>
          <span className="stat-num text-xs text-ink-faint">recorded combinations</span>
        </div>
      )}

      {!hideTitle && topPartner && top.goals > 1 && (
        <p className="mb-3 text-sm text-ink-dim">
          Most productive with{" "}
          <Link
            href={`/player/${topCreated ? top.scorer_id : top.assister_id}`}
            className="font-medium text-ink hover:text-devil-bright"
          >
            {topPartner}
          </Link>{" "}
          — {topCreated ? "he set up" : "he scored"}{" "}
          <span className="stat-num text-ink">{fmtNum(top.goals)}</span> goals
          {topCreated ? "" : " from their pass"}.
        </p>
      )}

      <div
        className={`overflow-hidden rounded-xl border border-line bg-panel ${
          bothSides ? "grid divide-y divide-line sm:grid-cols-2 sm:divide-x sm:divide-y-0" : ""
        }`}
      >
        {created.length > 0 && (
          <Column
            label="He set up"
            total={createdTotal}
            partners={created}
            max={max}
            color="var(--color-gold)"
            countClass="text-gold"
          />
        )}
        {supplied.length > 0 && (
          <Column
            label="Set up by"
            total={suppliedTotal}
            partners={supplied}
            max={max}
            color="var(--color-devil)"
            countClass="text-devil-bright"
          />
        )}
      </div>

      {!hideCoverageNote && (
        <CoverageNote
          slice="recorded match-event assists, both directions"
          coverage="goals where both scorer and assister are recorded; curated season assists are not pairwise and are excluded here."
        />
      )}
    </section>
  );
}

function Column({
  label,
  total,
  partners,
  max,
  color,
  countClass,
}: {
  label: string;
  total: number;
  partners: Partner[];
  max: number;
  color: string;
  countClass: string;
}) {
  return (
    <div className="p-4 sm:p-5">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <p className="text-[11px] uppercase tracking-[0.14em] text-ink-faint">{label}</p>
        <span className="stat-num text-xs text-ink-dim">
          <span className={countClass}>{fmtNum(total)}</span> goals
        </span>
      </div>
      <ul className="space-y-2.5">
        {partners.map((p) => (
          <li key={p.id} className="flex items-center gap-2.5">
            <PlayerPortrait name={p.name} src={p.thumb} size="xs" />
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <Link
                  href={`/player/${p.id}`}
                  className="truncate text-sm font-medium text-ink hover:text-devil-bright"
                >
                  {p.name}
                </Link>
                <span className="stat-num shrink-0 text-xs text-ink-dim">{fmtNum(p.goals)}</span>
              </div>
              <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-panel-2">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${(100 * p.goals) / max}%`, background: color }}
                />
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
