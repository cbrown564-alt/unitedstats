import Link from "next/link";
import { familyName } from "@/lib/names";
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
 *
 * On narrow viewports the floating labels collapse to a compact event list below
 * the bar — same spatial read via the coloured lead bar, without label collision.
 */

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

function GoalLabel({
  g,
  p,
  lane,
  side,
}: {
  g: GoalMark;
  p: number;
  lane: number;
  side: "united" | "opponent";
}) {
  const anchorTx = p > 84 ? "translateX(-100%)" : p < 16 ? "translateX(0)" : "translateX(-50%)";
  const colHeight = lane === 0 ? ANNOT_H - 26 : ANNOT_H;
  const minuteClass = side === "united" ? "text-devil-bright" : "text-ink-dim";

  return (
    <>
      <span
        aria-hidden
        className={`absolute left-1/2 w-px -translate-x-1/2 bg-line ${side === "united" ? "bottom-2" : "top-2"}`}
        style={{ height: colHeight - 14 }}
      />
      <span
        className={`absolute flex items-center gap-1 whitespace-nowrap text-[11px] leading-none ${side === "united" ? "" : ""}`}
        style={
          side === "united"
            ? { bottom: colHeight - 6, left: "50%", transform: anchorTx }
            : { top: colHeight - 6, left: "50%", transform: anchorTx }
        }
      >
        <span className={`stat-num font-semibold ${minuteClass}`}>{clock(g.minute, g.added)}&prime;</span>
        {g.playerId ? (
          <Link href={`/player/${g.playerId}`} className="text-ink hover:text-devil-bright">
            {g.scorer}
          </Link>
        ) : (
          <span className="text-ink">{g.scorer}</span>
        )}
        {g.tag && <span className="text-ink-faint">{g.tag === "P" ? "(P)" : "(OG)"}</span>}
      </span>
    </>
  );
}

function CompactGoalList({ goals }: { goals: GoalMark[] }) {
  return (
    <ol className="mt-3 space-y-1.5 border-t border-line/70 pt-3 sm:hidden" aria-label="Goals by minute">
      {goals.map((g) => (
        <li key={g.key} className="flex items-baseline gap-2 text-sm leading-snug">
          <span className={`stat-num w-10 shrink-0 text-xs font-semibold ${g.side === "united" ? "text-devil-bright" : "text-ink-dim"}`}>
            {clock(g.minute, g.added)}&prime;
          </span>
          <span className="min-w-0 flex-1">
            <span className={g.side === "united" ? "text-ink" : "text-ink-dim"}>
              {g.side === "united" ? "" : "· "}
              {g.playerId ? (
                <Link href={`/player/${g.playerId}`} className="font-medium hover:text-devil-bright">
                  {g.scorer}
                </Link>
              ) : (
                <span className="font-medium">{g.scorer}</span>
              )}
              {g.tag && <span className="text-ink-faint"> {g.tag === "P" ? "(P)" : "(OG)"}</span>}
            </span>
          </span>
        </li>
      ))}
    </ol>
  );
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
      scorer: familyName(e.player_display_name ?? ""),
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
      scorer: familyName(e.player_display_name ?? ""),
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

  // Lane-stagger labels per side when goals on the same side sit close in time.
  const unitedMarks = sorted.filter((g) => g.side === "united");
  const oppMarks = sorted.filter((g) => g.side === "opponent");
  const lane = new Map<string, number>();
  const LABEL_GAP = 13;
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

  const PAD = 1.4;
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
      {/* United scorers — labels hidden on narrow viewports (compact list below). */}
      <div className="relative z-10 hidden h-[60px] sm:block">
        {unitedMarks.map((g) => {
          const ln = lane.get(g.key) ?? 0;
          const p = pos(g.minute);
          return (
            <div
              key={g.key}
              className="absolute bottom-0"
              style={{ left: `${p}%`, transform: "translateX(-50%)" }}
              title={g.title}
            >
              <GoalLabel g={g} p={p} lane={ln} side="united" />
              <span className="tap-target -mb-1 block h-2.5 w-2.5 rounded-full bg-devil-bright ring-2 ring-pitch" />
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
        {/* Mobile-only dots on the bar — tap targets without floating labels. */}
        {sorted.map((g) => (
          <span
            key={`dot-${g.key}`}
            className={`tap-target absolute top-1/2 z-10 block h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-pitch sm:hidden ${
              g.side === "united" ? "bg-devil-bright" : "bg-ink"
            }`}
            style={{ left: `${pos(g.minute)}%` }}
            title={g.title}
            aria-hidden
          />
        ))}
      </div>

      {/* Opponent scorers — labels hidden on narrow viewports. */}
      <div className="relative hidden h-[60px] sm:block">
        {oppMarks.map((g) => {
          const ln = lane.get(g.key) ?? 0;
          const p = pos(g.minute);
          return (
            <div
              key={g.key}
              className="absolute top-0"
              style={{ left: `${p}%`, transform: "translateX(-50%)" }}
              title={g.title}
            >
              <span className="tap-target relative z-10 -mt-1 block h-2.5 w-2.5 rounded-full bg-ink ring-2 ring-pitch" />
              <GoalLabel g={g} p={p} lane={ln} side="opponent" />
            </div>
          );
        })}
      </div>

      <CompactGoalList goals={sorted} />

      {/* minute axis */}
      <div className="relative mt-2 h-4 sm:mt-0">
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
