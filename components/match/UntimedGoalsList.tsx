import Link from "next/link";
import type { EventRow } from "@/lib/queries";
import { groupUntimedGoals } from "@/lib/untimedGoals";

function GoalEntry({
  g,
  side,
}: {
  g: ReturnType<typeof groupUntimedGoals>[number];
  side: "united" | "opponent";
}) {
  const name = g.player_display_name ?? "Goal";
  const linked = side === "united" && g.player_id;

  return (
    <span className="inline-flex items-baseline gap-1">
      {linked ? (
        <Link href={`/player/${g.player_id}`} className="text-ink hover:text-devil-bright focus-ring">
          {name}
        </Link>
      ) : (
        <span className={side === "united" ? "text-ink" : "text-ink-dim"}>{name}</span>
      )}
      {g.count > 1 && (
        <span className="stat-num text-ink-faint" aria-label={`${g.count} goals`}>
          &times;{g.count}
        </span>
      )}
      {g.type === "pen-goal" && <span className="text-xs text-ink-faint">(pen)</span>}
      {g.type === "own-goal-for" && <span className="text-xs text-ink-faint">(og)</span>}
      {g.type === "own-goal-against" && <span className="text-xs text-ink-faint">(og)</span>}
      {g.assist_display_name && (
        <span className="text-xs text-ink-faint">assist {g.assist_display_name}</span>
      )}
    </span>
  );
}

/** Minimal scorer list for matches with no recorded goal minutes. */
export function UntimedGoalsList({
  goals,
  side,
}: {
  goals: EventRow[];
  side: "united" | "opponent";
}) {
  const grouped = groupUntimedGoals(goals);
  if (grouped.length === 0) return null;

  return (
    <ul className="flex flex-wrap items-baseline gap-y-1 text-sm leading-relaxed">
      {grouped.map((g, i) => (
        <li key={`${g.player_id ?? g.player_display_name}-${g.type}-${g.assist_display_name ?? ""}`} className="inline-flex items-baseline">
          {i > 0 && (
            <span className="mx-2 text-ink-faint/60 select-none" aria-hidden>
              ·
            </span>
          )}
          <GoalEntry g={g} side={side} />
        </li>
      ))}
    </ul>
  );
}
