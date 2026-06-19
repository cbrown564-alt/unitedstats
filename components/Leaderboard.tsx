import Link from "next/link";
import { PlayerPortrait } from "@/components/PlayerPortrait";
import { CoverageNote } from "@/components/CoverageNote";

export interface LeaderboardItem {
  id: string;
  name: string;
  src?: string | null;
  /** Pre-formatted headline figure ("253", "0.69"). */
  figure: string;
  /** Quiet supporting detail under the name ("131 in 191", "1991–2014"). */
  sub?: string;
}

/**
 * A compact ranked answer-object: the top players by one measure, each a linked
 * row of rank → portrait → name → figure. The page leads with a few of these so
 * the reader gets the answer ("who scored most? who was most prolific?") without
 * sorting a 985-row table for it — the table stays below as the auditable
 * register. The figure tone is the measure's accent (goals red, assists gold).
 */
export function Leaderboard({
  title,
  unit,
  items,
  figureTone = "text-ink",
  note,
}: {
  title: string;
  /** Small qualifier beside the title ("per game", "min. 150 apps"). */
  unit?: string;
  items: LeaderboardItem[];
  figureTone?: string;
  /** Coverage caveat at the foot, for partial measures like assists. */
  note?: string;
}) {
  return (
    <section className="flex flex-col rounded-lg border border-line bg-panel">
      <header className="flex items-baseline justify-between gap-2 border-b border-line/70 px-3.5 py-2.5">
        <h3 className="display text-base leading-none">{title}</h3>
        {unit && <span className="text-[11px] uppercase tracking-[0.12em] text-ink-faint">{unit}</span>}
      </header>
      <ol className="flex-1 divide-y divide-line/50">
        {items.map((it, i) => (
          <li key={it.id}>
            <Link
              href={`/player/${it.id}`}
              className="flex items-center gap-2.5 px-3.5 py-2 transition-colors hover:bg-panel-2"
            >
              <span className="stat-num w-4 shrink-0 text-right text-xs text-ink-faint">{i + 1}</span>
              <PlayerPortrait name={it.name} src={it.src} size="xs" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium leading-tight">{it.name}</span>
                {it.sub && <span className="stat-num block truncate text-[11px] leading-tight text-ink-faint">{it.sub}</span>}
              </span>
              <span className={`stat-num shrink-0 text-base font-semibold tabular-nums ${figureTone}`}>{it.figure}</span>
            </Link>
          </li>
        ))}
      </ol>
      {note && <CoverageNote className="px-3.5 pb-2.5 pt-0" coverage={note} />}
    </section>
  );
}
