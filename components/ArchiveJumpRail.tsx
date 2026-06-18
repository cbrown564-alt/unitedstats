import type { MatchRow } from "@/lib/queries";
import { fmtNum } from "@/lib/format";

const chip =
  "shrink-0 rounded-md border border-line bg-panel px-2.5 py-1 text-center transition-colors focus-ring " +
  "hover:border-devil/50 hover:bg-panel-2 hover:text-ink";

/**
 * A jump rail into a season-grouped archive: each chip anchors to a season
 * `<section id="season-…">` rendered by {@link MatchGroups}. Adapts to the span —
 * a handful of seasons get one chip each; a century-long fixture collapses to
 * decade chips that land on that decade's first group. Matches arrive newest-first.
 */
export function ArchiveJumpRail({
  matches,
  idPrefix = "season",
}: {
  matches: MatchRow[];
  /** Anchor id prefix; must match the grouped sections' ids (e.g. "scored", "apps"). */
  idPrefix?: string;
}) {
  // Seasons in archive order (newest first), with per-season counts.
  const seasonOrder: string[] = [];
  const seasonCount = new Map<string, number>();
  for (const m of matches) {
    if (!seasonCount.has(m.season)) seasonOrder.push(m.season);
    seasonCount.set(m.season, (seasonCount.get(m.season) ?? 0) + 1);
  }
  if (seasonOrder.length < 2) return null;

  // Few enough seasons: a chip each, jumping straight to that season.
  if (seasonOrder.length <= 14) {
    return (
      <Rail label="Jump to a season">
        {seasonOrder.map((s) => (
          <a key={s} href={`#${idPrefix}-${s}`} className={chip}>
            <span className="stat-num block text-xs font-semibold leading-tight">{s}</span>
            <span className="stat-num block text-[10px] leading-tight text-ink-faint">{fmtNum(seasonCount.get(s) ?? 0)}</span>
          </a>
        ))}
      </Rail>
    );
  }

  // Long span: decade chips anchoring to the first (newest) season in each decade.
  const decades: { decade: string; anchor: string; n: number }[] = [];
  const decadeIdx = new Map<string, number>();
  for (const m of matches) {
    const dec = `${m.date.slice(0, 3)}0s`;
    let i = decadeIdx.get(dec);
    if (i === undefined) {
      i = decades.length;
      decadeIdx.set(dec, i);
      decades.push({ decade: dec, anchor: m.season, n: 0 });
    }
    decades[i].n++;
  }
  return (
    <Rail label="Jump to a decade">
      {decades.map((d) => (
        <a key={d.decade} href={`#${idPrefix}-${d.anchor}`} className={chip}>
          <span className="stat-num block text-xs font-semibold leading-tight">{d.decade}</span>
          <span className="stat-num block text-[10px] leading-tight text-ink-faint">{fmtNum(d.n)}</span>
        </a>
      ))}
    </Rail>
  );
}

function Rail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-ink-faint">{label}</p>
      <div className="flex gap-1.5 overflow-x-auto pb-1">{children}</div>
    </div>
  );
}
