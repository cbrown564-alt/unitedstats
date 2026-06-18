import type { MatchRow } from "@/lib/queries";
import { tallyWdl } from "@/lib/format";
import { MatchList } from "./MatchList";
import { WdlBar, WdlColumns } from "./WdlBar";

/**
 * Season-segmented view of a fixture list. Rows arrive date-ordered, so seasons
 * group consecutively; each subheader carries that season's W-D-L so the list
 * reads as a sequence of slices rather than one undifferentiated stream.
 */
export function MatchGroups({
  matches,
  showAttendance = false,
  accentResult = false,
}: {
  matches: MatchRow[];
  showAttendance?: boolean;
  accentResult?: boolean;
}) {
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
        const { w, d, l } = tallyWdl(g.rows);
        return (
          <section key={`${g.season}-${g.rows[0].id}`} id={`season-${g.season}`} className="scroll-mt-28">
            <div className="mb-2 flex items-end gap-3">
              <h2 className="display text-lg leading-none">{g.season}</h2>
              <span className="stat-num text-xs leading-none text-ink-faint">
                {g.rows.length} {g.rows.length === 1 ? "match" : "matches"}
              </span>
              <div className="ml-auto w-32 space-y-1">
                <WdlColumns w={w} d={d} l={l} compact />
                <WdlBar w={w} d={d} l={l} size="xs" tooltip={false} />
              </div>
            </div>
            <MatchList matches={g.rows} showAttendance={showAttendance} accentResult={accentResult} />
          </section>
        );
      })}
    </div>
  );
}
