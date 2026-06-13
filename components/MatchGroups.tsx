import type { MatchRow } from "@/lib/queries";
import { MatchList } from "./MatchList";
import { WdlBar } from "./WdlBar";

/**
 * Season-segmented view of a fixture list. Rows arrive date-ordered, so seasons
 * group consecutively; each subheader carries that season's W-D-L so the list
 * reads as a sequence of slices rather than one undifferentiated stream.
 */
export function MatchGroups({ matches }: { matches: MatchRow[] }) {
  if (matches.length === 0) return <MatchList matches={[]} />;

  const groups: { season: string; rows: MatchRow[] }[] = [];
  for (const m of matches) {
    const last = groups[groups.length - 1];
    if (last && last.season === m.season) last.rows.push(m);
    else groups.push({ season: m.season, rows: [m] });
  }

  return (
    <div className="space-y-6">
      {groups.map((g) => {
        const w = g.rows.filter((r) => r.result === "W").length;
        const d = g.rows.filter((r) => r.result === "D").length;
        const l = g.rows.filter((r) => r.result === "L").length;
        return (
          <section key={`${g.season}-${g.rows[0].id}`}>
            <div className="mb-2 flex items-center gap-3">
              <h2 className="display text-lg leading-none">{g.season}</h2>
              <span className="stat-num text-xs text-ink-faint">
                {g.rows.length} {g.rows.length === 1 ? "match" : "matches"} · {w}–{d}–{l}
              </span>
              <WdlBar w={w} d={d} l={l} size="xs" tooltip={false} className="ml-auto max-w-[8rem]" />
            </div>
            <MatchList matches={g.rows} />
          </section>
        );
      })}
    </div>
  );
}
