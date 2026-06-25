import Link from "next/link";
import { fmtDate, scoreline, venuePrefix } from "@/lib/format";
import { opponentNames } from "@/lib/clubNames";
import type { NotableMatch } from "@/lib/trails";

// Result-coloured left edge, matching the MatchList accent idiom so colour is a
// supplementary cue, never the only one. Tone follows the *match* result, so a
// winless-run ender (United finally winning) reads red (a win) even though the run was bad.
const EDGE: Record<string, string> = {
  W: "border-l-win/60",
  L: "border-l-loss/60",
  D: "border-l-draw/60",
};
const SCORE_TONE: Record<string, string> = {
  W: "text-win",
  L: "text-loss",
  D: "text-ink",
};

/**
 * The standout matches of a tenure or head-to-head as a row of answer-cards:
 * each leads with *why* it's here (biggest win, the run-ender), then the
 * scoreline writ large, then the fixture. The card is the answer; the archive
 * below is the evidence. Curation comes from {@link notableMatches} — the
 * component renders whatever real cards it is handed and nothing when handed none.
 */
export function NotableMatches({
  matches,
  className = "grid gap-3 sm:grid-cols-2 lg:grid-cols-3",
}: {
  matches: NotableMatch[];
  className?: string;
}) {
  if (matches.length === 0) return null;
  return (
    <div className={className}>
      {matches.map((m) => {
        const opp = opponentNames("", m.opponent_name);
        return (
        <Link
          key={m.id}
          href={`/match/${m.id}`}
          className={`group block rounded-xl border border-l-2 border-line bg-panel px-4 py-3 transition-colors hover:border-devil/60 ${EDGE[m.result] ?? EDGE.D}`}
        >
          <p className="text-[11px] uppercase tracking-[0.14em] text-ink-faint">{m.reason}</p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className={`stat-num text-2xl font-semibold ${SCORE_TONE[m.result] ?? "text-ink"}`}>
              {scoreline(m.gf, m.ga, m.pen_gf != null ? [m.pen_gf, m.pen_ga] : null, !!m.aet)}
            </span>
            <span className="min-w-0 text-sm font-medium text-ink-dim group-hover:text-devil-bright sm:truncate" title={m.opponent_name}>
              <span className="text-ink-faint">{venuePrefix(m.venue)}</span>{" "}
              <span className="sm:hidden">{opp.short}</span>
              <span className="hidden sm:inline">{m.opponent_name}</span>
            </span>
          </div>
          <p className="stat-num mt-0.5 break-words line-clamp-2 text-xs text-ink-faint sm:line-clamp-1 sm:truncate">
            {fmtDate(m.date)} · {m.competition_name}
          </p>
        </Link>
        );
      })}
    </div>
  );
}
