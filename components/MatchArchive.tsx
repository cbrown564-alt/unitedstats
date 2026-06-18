import type { MatchRow } from "@/lib/queries";
import { tallyWdl, pct } from "@/lib/format";
import { ArchiveJumpRail } from "./ArchiveJumpRail";
import { MatchGroups } from "./MatchGroups";
import { MatchList } from "./MatchList";
import { WdlBar, WdlRecord } from "./WdlBar";

/**
 * Above this many matches the full season-by-season stream becomes a wall you
 * scroll past rather than read (Busby, Ferguson, the oldest rivalries). Past it
 * we collapse to one expandable row per season; below it the whole archive stays
 * open inline, where it belongs.
 */
const STREAM_MAX = 150;

/**
 * The archive at the foot of a manager / opponent page: a pinned {@link ArchiveJumpRail}
 * over the season record. Volume-adaptive — a modest history renders as the full
 * {@link MatchGroups} stream; a vast one collapses to season summaries that open on
 * demand, with the same `season-…` anchors so the rail (and its scrollspy) work
 * identically either way. The complete match-by-match data always lives one click
 * away in the match browser.
 */
export function MatchArchive({
  matches,
  accentResult = false,
  idPrefix = "season",
}: {
  matches: MatchRow[];
  accentResult?: boolean;
  idPrefix?: string;
}) {
  const collapsed = matches.length > STREAM_MAX;
  return (
    <div>
      <ArchiveJumpRail matches={matches} idPrefix={idPrefix} sticky />
      <div className="mt-4">
        {collapsed ? (
          <SeasonSummaries matches={matches} idPrefix={idPrefix} accentResult={accentResult} />
        ) : (
          <MatchGroups matches={matches} accentResult={accentResult} />
        )}
      </div>
    </div>
  );
}

const chevron =
  "h-3.5 w-3.5 shrink-0 text-ink-faint transition-transform duration-200 group-open:rotate-90";

function SeasonSummaries({
  matches,
  idPrefix,
  accentResult,
}: {
  matches: MatchRow[];
  idPrefix: string;
  accentResult: boolean;
}) {
  // Rows arrive date-ordered, so seasons group consecutively.
  const groups: { season: string; rows: MatchRow[] }[] = [];
  for (const m of matches) {
    const last = groups[groups.length - 1];
    if (last && last.season === m.season) last.rows.push(m);
    else groups.push({ season: m.season, rows: [m] });
  }

  return (
    <div className="space-y-2">
      {groups.map((g) => {
        const { w, d, l } = tallyWdl(g.rows);
        return (
          <details
            key={`${g.season}-${g.rows[0].id}`}
            id={`${idPrefix}-${g.season}`}
            className="group scroll-mt-28 overflow-hidden rounded-lg border border-line bg-panel"
          >
            <summary className="flex cursor-pointer list-none items-center gap-3 px-3 py-2.5 transition-colors hover:bg-panel-2 focus-visible:outline-2 focus-visible:outline-devil-bright sm:px-4 [&::-webkit-details-marker]:hidden">
              <svg className={chevron} viewBox="0 0 16 16" fill="none" aria-hidden>
                <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <h3 className="display w-[5.25rem] shrink-0 text-base leading-none">{g.season}</h3>
              <span className="stat-num hidden w-24 shrink-0 text-xs text-ink-faint sm:inline">
                {g.rows.length} {g.rows.length === 1 ? "match" : "matches"}
              </span>
              <span className="stat-num text-xs">
                <WdlRecord w={w} d={d} l={l} /> <span className="text-ink-faint">· {pct(w, g.rows.length)} W</span>
              </span>
              <WdlBar w={w} d={d} l={l} size="xs" tooltip={false} className="ml-auto max-w-[7rem] sm:max-w-[10rem]" />
            </summary>
            <div className="border-t border-line p-2 sm:p-3">
              <MatchList matches={g.rows} accentResult={accentResult} />
            </div>
          </details>
        );
      })}
    </div>
  );
}
