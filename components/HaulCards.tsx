import Link from "next/link";
import type { MatchRow } from "@/lib/queries";
import { fmtDate, scoreline, venuePrefix } from "@/lib/format";
import { opponentNames } from "@/lib/clubNames";

type Haul = MatchRow & { goals: number; minutes?: string | null };

// Gold for a hat-trick or more, devil-red for a brace — the same scale the goal
// badge uses elsewhere, so the colour reads consistently across the page.
const edge = (goals: number) => (goals >= 3 ? "border-l-gold/70" : "border-l-devil/60");
const tone = (goals: number) => (goals >= 3 ? "text-gold" : "text-devil-bright");
const label = (goals: number) => (goals >= 4 ? `${goals} goals` : goals === 3 ? "Hat-trick" : "Brace");

function minuteList(minutes?: string | null): number[] {
  return (minutes ?? "")
    .split(",")
    .map((s) => Number(s))
    .filter((n) => Number.isFinite(n) && n > 0)
    .sort((a, b) => a - b);
}

/**
 * The big nights as answer-cards heading the scoring record: his haul is the hero
 * (a hat-trick, a brace), with the scoreline, opponent and goal minutes in support.
 * Same card chrome as `NotableMatches`, but player-flavoured — the dominant figure
 * is *his* goals, not the team result. Curation is the caller's: pass the hauls.
 */
export function HaulCards({
  hauls,
  className = "grid gap-3 sm:grid-cols-2 lg:grid-cols-3",
}: {
  hauls: Haul[];
  className?: string;
}) {
  if (hauls.length === 0) return null;
  return (
    <div className={className}>
      {hauls.map((m) => {
        const mins = minuteList(m.minutes);
        const opp = opponentNames(m.opponent_id, m.opponent_name);
        return (
          <Link
            key={m.id}
            href={`/match/${m.id}`}
            className={`group block rounded-xl border border-l-2 border-line bg-panel px-4 py-3 transition-colors hover:border-devil/60 ${edge(m.goals)}`}
          >
            <p className="text-[11px] uppercase tracking-[0.14em] text-ink-faint">{label(m.goals)}</p>
            <div className="mt-1 flex items-baseline gap-2">
              <span className={`stat-num text-2xl font-semibold ${tone(m.goals)}`}>{m.goals}</span>
              <span className="text-sm text-ink-dim">goals</span>
              <span className="min-w-0 text-sm font-medium text-ink-dim group-hover:text-devil-bright sm:truncate" title={m.opponent_name}>
                <span className="text-ink-faint">{venuePrefix(m.venue)}</span>{" "}
                <span className="sm:hidden">{opp.short}</span>
                <span className="hidden sm:inline">{m.opponent_name}</span>
              </span>
            </div>
            <p className="stat-num mt-0.5 text-xs text-ink-faint">
              <span className="text-ink-dim">{scoreline(m.gf, m.ga, m.pen_gf != null ? [m.pen_gf, m.pen_ga] : null, !!m.aet)}</span>
              {" · "}
              {fmtDate(m.date)}
              {mins.length > 0 && <span className="ml-1.5">{mins.map((x) => `${x}'`).join(" ")}</span>}
            </p>
          </Link>
        );
      })}
    </div>
  );
}
