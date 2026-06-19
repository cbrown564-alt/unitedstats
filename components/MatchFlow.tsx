import Link from "next/link";
import type { EventRow } from "@/lib/queries";

/**
 * Match flow: a single time bar coloured by who led and by how much. Red when
 * United are ahead, neutral grey at level, near-black when behind, deepening with
 * the margin. United scorers ride above the bar, opponent scorers below — each a
 * lollipop dot on the timeline. Cards and subs live on the teamsheet; this is
 * purely the shape of the result.
 *
 * Server-rendered from timed goal events only. Matches without timed goals fall
 * back to a plain scorer list (handled by the caller).
 */

function surname(name: string | null | undefined): string {
  if (!name) return "";
  const parts = name.trim().split(/\s+/);
  return parts[parts.length - 1] || name;
}

/** Clock label that keeps stoppage time as "90+6", regulation as "64". */
function clock(minute: number, added: number | null): string {
  return added ? `${minute}+${added}` : `${minute}`;
}

type GoalMark = {
  key: string;
  minute: number;
  added: number | null;
  side: "united" | "opponent";
  delta: 1 | -1;
  scorer: string;
  playerId: string | null;
  tag: "P" | "OG" | null;
  title: string;
};

const ANNOT_H = 60; // px label/connector zone on each side of the bar

/** United-perspective lead → tinted bar colour. Red ahead, grey level, near-black behind. */
function leadColor(margin: number): string {
  if (margin === 0) return "oklch(47% 0.008 50)";
  const t = Math.min(1, (Math.abs(margin) - 1) / 2); // 1-goal lead → 0, 3+ → 1
  if (margin > 0) return `oklch(${53 - t * 9}% ${0.17 + t * 0.04} 28)`;
  return `oklch(${30 - t * 9}% ${0.018 - t * 0.008} 45)`;
}

export function MatchFlow({
  unitedGoals,
  opponentGoals,
  aet,
}: {
  unitedGoals: EventRow[];
  opponentGoals: EventRow[];
  aet: boolean;
}) {
  const timed = (e: EventRow) => e.minute != null;

  const goals: GoalMark[] = [
    ...unitedGoals.filter(timed).map((e) => ({
      key: `u${e.seq}`,
      minute: e.minute as number,
      added: e.added_time,
      side: "united" as const,
      delta: 1 as const,
      scorer: surname(e.player_display_name),
      playerId: e.player_id,
      tag: e.type === "pen-goal" ? ("P" as const) : e.type === "own-goal-for" ? ("OG" as const) : null,
      title:
        `${clock(e.minute as number, e.added_time)}' ${e.player_display_name ?? "Goal"}` +
        (e.type === "pen-goal" ? " (penalty)" : e.type === "own-goal-for" ? " (own goal)" : "") +
        (e.assist_display_name ? `, assist ${e.assist_display_name}` : ""),
    })),
    ...opponentGoals.filter(timed).map((e) => ({
      key: `o${e.seq}`,
      minute: e.minute as number,
      added: e.added_time,
      side: "opponent" as const,
      delta: -1 as const,
      scorer: surname(e.player_display_name),
      playerId: null,
      tag: e.type === "own-goal-against" ? ("OG" as const) : e.detail === "pen" ? ("P" as const) : null,
      title:
        `${clock(e.minute as number, e.added_time)}' ${e.player_display_name ?? "Goal"}` +
        (e.type === "own-goal-against" ? " (own goal)" : e.detail === "pen" ? " (penalty)" : ""),
    })),
  ];

  // Nothing has a minute → caller renders the list fallback instead.
  if (goals.length === 0) return null;

  const sorted = [...goals].sort((a, b) => a.minute - b.minute);
  const maxMin = Math.max(90, ...goals.map((g) => g.minute), aet ? 120 : 0);
  const end = aet ? 120 : maxMin > 90 ? Math.min(120, Math.ceil(maxMin / 5) * 5) : 90;
  const pos = (m: number) => Math.max(0, Math.min(100, (m / end) * 100));

  // Running-lead segments: hold each margin until the next goal, then jump.
  const segs: { from: number; to: number; margin: number }[] = [];
  let cur = 0;
  let prev = 0;
  for (const g of sorted) {
    segs.push({ from: prev, to: g.minute, margin: cur });
    cur += g.delta;
    prev = g.minute;
  }
  segs.push({ from: prev, to: end, margin: cur });

  // Lane-stagger labels per side, but only raise a goal when another goal on the
  // SAME side sits close enough in time for the labels to collide. Opposite-side
  // goals live across the bar and never interfere.
  const unitedMarks = sorted.filter((g) => g.side === "united");
  const oppMarks = sorted.filter((g) => g.side === "opponent");
  const lane = new Map<string, number>();
  const LABEL_GAP = 9; // % of timeline width two labels need to clear each other
  const assignLanes = (marks: GoalMark[]) => {
    let prevPos = -Infinity;
    let prevLane = 1;
    for (const g of marks) {
      const p = pos(g.minute);
      const ln = p - prevPos < LABEL_GAP ? (prevLane === 0 ? 1 : 0) : 0;
      lane.set(g.key, ln);
      prevPos = p;
      prevLane = ln;
    }
  };
  assignLanes(unitedMarks);
  assignLanes(oppMarks);

  // Lead bar as one layered fill: a vertical satin highlight→shadow for depth,
  // over a horizontal lead-colour gradient whose transitions blend across a small
  // pad zone rather than snapping at a hard edge.
  const PAD = 1.4; // % half-width of each transition blend
  const barStops = segs
    .map((s, i) => {
      const c = leadColor(s.margin);
      const left = i === 0 ? pos(s.from) : pos(s.from) + PAD;
      const right = i === segs.length - 1 ? pos(s.to) : pos(s.to) - PAD;
      return `${c} ${left.toFixed(2)}%, ${c} ${right.toFixed(2)}%`;
    })
    .join(", ");
  const barBg =
    `linear-gradient(to bottom, rgba(255,255,255,0.14), rgba(255,255,255,0) 45%, rgba(0,0,0,0.28)), ` +
    `linear-gradient(to right, ${barStops})`;

  const gridlines = [
    { m: 45, label: "HT" },
    { m: 90, label: end > 90 ? "90" : "FT" },
    ...(end > 90 ? [{ m: end, label: "FT" }] : []),
  ];

  return (
    <div className="w-full">
      {/* United scorers — above the bar (z-10 so dots paint over the bar, which
          sits later in the DOM; the per-column transform traps dot-level z-index) */}
      <div className="relative z-10" style={{ height: unitedMarks.length ? ANNOT_H : 8 }}>
        {unitedMarks.map((g) => {
          const ln = lane.get(g.key) ?? 0;
          const colHeight = ln === 0 ? ANNOT_H - 26 : ANNOT_H;
          return (
            <div
              key={g.key}
              className="absolute bottom-0 flex flex-col items-center"
              style={{ left: `${pos(g.minute)}%`, transform: "translateX(-50%)", height: colHeight }}
              title={g.title}
            >
              <span className="flex items-center gap-1 whitespace-nowrap text-[11px] leading-none">
                <span className="stat-num font-semibold text-devil-bright">{clock(g.minute, g.added)}&prime;</span>
                {g.playerId ? (
                  <Link href={`/player/${g.playerId}`} className="text-ink hover:text-devil-bright">
                    {g.scorer}
                  </Link>
                ) : (
                  <span className="text-ink">{g.scorer}</span>
                )}
                {g.tag && <span className="text-ink-faint">{g.tag === "P" ? "(P)" : "(OG)"}</span>}
              </span>
              <span className="mt-1 w-px flex-1 bg-line" />
              <span className="relative z-10 -mb-1 h-2.5 w-2.5 rounded-full bg-devil-bright ring-2 ring-pitch" />
            </div>
          );
        })}
      </div>

      {/* the lead bar */}
      <div
        className="relative h-3.5 w-full overflow-hidden rounded-full ring-1 ring-inset ring-line shadow-[0_2px_8px_rgba(0,0,0,0.45)]"
        style={{ background: barBg }}
        role="img"
        aria-label="Lead by minute"
      >
        {end >= 45 && (
          <span
            className="absolute top-0 bottom-0 w-px"
            style={{ left: `${pos(45)}%`, background: "color-mix(in oklab, var(--color-ink) 22%, transparent)" }}
            aria-hidden
          />
        )}
      </div>

      {/* Opponent scorers — below the bar */}
      <div className="relative" style={{ height: oppMarks.length ? ANNOT_H : 8 }}>
        {oppMarks.map((g) => {
          const ln = lane.get(g.key) ?? 0;
          const colHeight = ln === 0 ? ANNOT_H - 26 : ANNOT_H;
          return (
            <div
              key={g.key}
              className="absolute top-0 flex flex-col items-center"
              style={{ left: `${pos(g.minute)}%`, transform: "translateX(-50%)", height: colHeight }}
              title={g.title}
            >
              <span className="relative z-10 -mt-1 h-2.5 w-2.5 rounded-full bg-ink ring-2 ring-pitch" />
              <span className="mb-1 w-px flex-1 bg-line" />
              <span className="flex items-center gap-1 whitespace-nowrap text-[11px] leading-none">
                <span className="stat-num font-semibold text-ink-dim">{clock(g.minute, g.added)}&prime;</span>
                <span className="text-ink">{g.scorer}</span>
                {g.tag && <span className="text-ink-faint">{g.tag === "P" ? "(P)" : "(OG)"}</span>}
              </span>
            </div>
          );
        })}
      </div>

      {/* minute axis */}
      <div className="relative h-4">
        <span className="stat-num absolute left-0 text-[10px] text-ink-faint">0&prime;</span>
        {gridlines.map((gl) => (
          <span
            key={gl.m}
            className="stat-num absolute text-[10px] text-ink-faint"
            style={{ left: `${pos(gl.m)}%`, transform: "translateX(-50%)" }}
          >
            {gl.label}
          </span>
        ))}
      </div>
    </div>
  );
}
