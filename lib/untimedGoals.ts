import type { EventRow } from "./queries";

/** One row in the untimed-goals fallback — identical events collapsed by scorer. */
export interface GroupedUntimedGoal {
  player_id: string | null;
  player_display_name: string | null;
  type: string;
  assist_display_name: string | null;
  count: number;
}

function groupKey(e: EventRow): string {
  return [e.player_id ?? e.player_display_name ?? "", e.type, e.assist_display_name ?? ""].join("\0");
}

/** Collapse duplicate untimed goal events (same scorer, type, and assist). */
export function groupUntimedGoals(goals: EventRow[]): GroupedUntimedGoal[] {
  const order: string[] = [];
  const map = new Map<string, GroupedUntimedGoal>();

  for (const e of goals) {
    const key = groupKey(e);
    const existing = map.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      order.push(key);
      map.set(key, {
        player_id: e.player_id,
        player_display_name: e.player_display_name,
        type: e.type,
        assist_display_name: e.assist_display_name,
        count: 1,
      });
    }
  }

  return order.map((key) => map.get(key)!);
}
