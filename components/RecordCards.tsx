import Link from "next/link";
import { ShareCite } from "@/components/ShareCite";

/**
 * One all-time record as an answer-object: the eyebrow says *which* record, the
 * figure is the record itself (a scoreline, a crowd, a tally), and the card is a
 * link to its evidence — the match, the season, or the run's slice of the browser.
 */
export interface RecordCard {
  /** Which record this is ("Biggest win"). */
  eyebrow: string;
  /** The dominant figure — the record's own unit, not always a count. */
  figure: string;
  /** Small qualifier after the figure ("goals", "matches"); omit for scorelines. */
  unit?: string;
  /** Figure colour: result tone for scorelines, gold for the crowd, red for goals. */
  tone: "win" | "loss" | "gold" | "devil";
  /** Primary context — the opponent, the season, or the run's span. */
  detail: React.ReactNode;
  /** Secondary line — the date, competition, or a slice note. */
  meta: React.ReactNode;
  href: string;
}

const TONE: Record<RecordCard["tone"], string> = {
  win: "text-win",
  loss: "text-loss",
  gold: "text-gold",
  devil: "text-devil-bright",
};

function shareTitle(r: RecordCard) {
  const unit = r.unit ? ` ${r.unit}` : "";
  return `${r.eyebrow}: ${r.figure}${unit}`;
}

/**
 * The records chapter as a grid of answer-objects rather than links to a sort.
 * Each card leads with the record figure and routes to the match, season, or
 * filtered slice that proves it; the component renders whatever real records it
 * is handed (see {@link clubRecords}) and nothing when handed none.
 */
export function RecordCards({ records }: { records: RecordCard[] }) {
  if (records.length === 0) return null;
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {records.map((r) => (
        <div
          key={r.eyebrow}
          className="group relative flex flex-col rounded-xl border border-line bg-panel transition-colors hover:border-devil/60 hover:bg-panel-2/60"
        >
          <Link href={r.href} className="tap-target flex flex-1 flex-col px-4 py-3 pr-20 focus-ring">
            <p className="text-[11px] uppercase tracking-[0.14em] text-ink-faint">{r.eyebrow}</p>
            <div className="mt-1.5 flex items-baseline gap-1.5">
              <span className={`stat-num text-3xl font-semibold sm:text-4xl ${TONE[r.tone]}`}>{r.figure}</span>
              {r.unit && <span className="text-xs uppercase tracking-[0.14em] text-ink-faint">{r.unit}</span>}
            </div>
            <p className="mt-2 break-words line-clamp-2 text-sm font-medium text-ink-dim group-hover:text-devil-bright sm:line-clamp-1 sm:truncate">{r.detail}</p>
            <p className="stat-num mt-0.5 break-words line-clamp-2 text-xs text-ink-faint sm:line-clamp-1 sm:truncate">{r.meta}</p>
          </Link>
          <div className="absolute right-3 top-3 z-10">
            <ShareCite path={r.href} title={shareTitle(r)} />
          </div>
        </div>
      ))}
    </div>
  );
}
