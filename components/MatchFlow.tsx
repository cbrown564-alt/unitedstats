import Link from "next/link";
import { familyName } from "@/lib/names";
import type { EventRow } from "@/lib/queries";
import { Pickable } from "@/components/match/MatchCorrection";

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
 * On narrow viewports labels stack minute over surname at their timeline position
 * (same spatial read as desktop, tighter lanes). The lead bar stays the primary
 * shape; dots carry a high-contrast ring so they read on any segment colour.
 */

/** Clock label that keeps stoppage time as "90+6", regulation as "64". */
function clock(minute: number, added: number | null): string {
  return added ? `${minute}+${added}` : `${minute}`;
}

/**
 * Absolute minute on the match axis. Stoppage is 90+added; older sources sometimes
 * write 93 directly instead of 90+3 — same contract as late-goal plotting.
 */
function goalClock(minute: number, added: number | null): number {
  if (minute === 90 && added != null && added > 0) return 90 + added;
  return minute;
}

type GoalMark = {
  key: string;
  seq: number;
  minute: number;
  added: number | null;
  side: "united" | "opponent";
  delta: 1 | -1;
  scorer: string;
  playerId: string | null;
  tag: "P" | "OG" | null;
  title: string;
  scorerPath?: string;
  minutePath?: string;
};

/** United-perspective lead → tinted bar colour. Red ahead, grey level, near-black behind. */
function leadColor(margin: number): string {
  if (margin === 0) return "oklch(47% 0.008 50)";
  const t = Math.min(1, (Math.abs(margin) - 1) / 2); // 1-goal lead → 0, 3+ → 1
  if (margin > 0) return `oklch(${53 - t * 9}% ${0.17 + t * 0.04} 28)`;
  return `oklch(${30 - t * 9}% ${0.018 - t * 0.008} 45)`;
}

function anchorTransform(p: number): string {
  return p > 84 ? "translateX(-100%)" : p < 16 ? "translateX(0)" : "translateX(-50%)";
}

function GoalLabel({
  g,
  p,
  lane,
  side,
  focused,
}: {
  g: GoalMark;
  p: number;
  lane: number;
  side: "united" | "opponent";
  /** Story surfaces can bring one scorer forward without muting the match. */
  focused: boolean;
}) {
  const anchorTx = anchorTransform(p);
  const minuteClass = focused ? "text-gold" : side === "united" ? "text-devil-bright" : "text-ink-dim";
  const labelOffset = [18, 42, 66][lane] ?? 18;
  const connectorHeight = [10, 34, 58][lane] ?? 10;

  const name = g.playerId ? (
    <Link href={`/player/${g.playerId}`} className={focused ? "font-semibold text-gold hover:text-ink" : "text-ink hover:text-devil-bright"}>
      {g.scorer}
    </Link>
  ) : (
    <span className={focused ? "font-semibold text-gold" : "text-ink"}>{g.scorer}</span>
  );

  const minuteLabel = (
    <span className={`stat-num shrink-0 text-[10px] font-semibold sm:text-[11px] ${minuteClass}`}>
      {clock(g.minute, g.added)}&prime;
    </span>
  );

  const nameInner = (
    <>
      {name}
      {g.tag && <span className="text-ink-faint"> {g.tag === "P" ? "(P)" : "(OG)"}</span>}
    </>
  );

  return (
    <>
      <span
        aria-hidden
        className={`absolute left-1/2 w-px -translate-x-1/2 bg-line/80 ${side === "united" ? "bottom-2" : "top-2"}`}
        style={{ height: connectorHeight }}
      />
      <span
        className="absolute flex max-w-[4.25rem] flex-col items-center text-center leading-tight sm:max-w-none sm:flex-row sm:items-center sm:gap-1 sm:whitespace-nowrap sm:text-[11px]"
        style={{ left: "50%", transform: anchorTx, [side === "united" ? "bottom" : "top"]: labelOffset }}
      >
        {g.minutePath ? (
          <Pickable fieldPath={g.minutePath} className="shrink-0">
            {minuteLabel}
          </Pickable>
        ) : (
          minuteLabel
        )}
        <span className="min-w-0 truncate text-[10px] sm:text-[11px]">
          {g.scorerPath ? (
            <Pickable fieldPath={g.scorerPath} className="inline text-left">
              {nameInner}
            </Pickable>
          ) : (
            nameInner
          )}
        </span>
      </span>
    </>
  );
}

function GoalDot({ side, focused }: { side: "united" | "opponent"; focused: boolean }) {
  return (
    <span
      className={`tap-target relative z-10 block h-3 w-3 rounded-full shadow-[0_0_0_1px_rgba(0,0,0,0.35)] sm:h-2.5 sm:w-2.5 ${
        focused ? "ring-2 ring-gold shadow-[0_0_12px_2px_rgba(245,197,24,0.55)]" : "ring-2 ring-pitch"
      } ${
        side === "united" ? "bg-devil-bright" : "bg-white/90"
      }`}
    />
  );
}

export function MatchFlow({
  unitedGoals,
  opponentGoals,
  aet,
  eventPaths,
  focusPlayerIds,
}: {
  unitedGoals: EventRow[];
  opponentGoals: EventRow[];
  aet: boolean;
  /** Maps a goal event seq to correction field paths for point-and-pick mode. */
  eventPaths?: (seq: number) => { scorer?: string; minute?: string } | null;
  /** A named scorer gets a gold label and knot on story surfaces. */
  focusPlayerIds?: readonly string[];
}) {
  const timed = (e: EventRow) => e.minute != null;
  const pathsFor = (seq: number) => eventPaths?.(seq) ?? null;
  const focusSet = focusPlayerIds?.length ? new Set(focusPlayerIds) : undefined;

  const goals: GoalMark[] = [
    ...unitedGoals.filter(timed).map((e) => {
      const paths = pathsFor(e.seq);
      return {
      key: `u${e.seq}`,
      seq: e.seq,
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
      scorerPath: paths?.scorer,
      minutePath: paths?.minute,
    };
    }),
    ...opponentGoals.filter(timed).map((e) => {
      const paths = pathsFor(e.seq);
      return {
      key: `o${e.seq}`,
      seq: e.seq,
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
      scorerPath: paths?.scorer,
      minutePath: paths?.minute,
    };
    }),
  ];

  // Nothing has a minute → caller renders the list fallback instead.
  if (goals.length === 0) return null;

  const sorted = [...goals].sort(
    (a, b) => goalClock(a.minute, a.added) - goalClock(b.minute, b.added) || a.seq - b.seq,
  );
  const clocks = goals.map((g) => goalClock(g.minute, g.added));
  const maxClock = Math.max(90, ...clocks, aet ? 120 : 0);
  // Pad past the last stoppage goal so the final knot isn't pinned to the clipped edge.
  const end = aet
    ? 120
    : maxClock > 90
      ? Math.min(120, Math.ceil((maxClock + 1) / 5) * 5)
      : 90;
  const pos = (m: number) => Math.max(0, Math.min(100, (m / end) * 100));
  const markPos = (g: GoalMark) => pos(goalClock(g.minute, g.added));

  // Running-lead segments: hold each margin until the next goal, then jump.
  const segs: { from: number; to: number; margin: number }[] = [];
  let cur = 0;
  let prev = 0;
  for (const g of sorted) {
    const at = goalClock(g.minute, g.added);
    segs.push({ from: prev, to: at, margin: cur });
    cur += g.delta;
    prev = at;
  }
  segs.push({ from: prev, to: end, margin: cur });

  // Greedily stagger dense goal clusters across three lanes. Two lanes were not
  // enough for high-scoring nights such as Chelsea 5–6 and caused name collisions.
  const unitedMarks = sorted.filter((g) => g.side === "united");
  const oppMarks = sorted.filter((g) => g.side === "opponent");
  const lane = new Map<string, number>();
  const LABEL_GAP = 14;
  const assignLanes = (marks: GoalMark[]) => {
    const lastAt = [-Infinity, -Infinity, -Infinity];
    for (const g of marks) {
      const p = markPos(g);
      const available = lastAt.findIndex((last) => p - last >= LABEL_GAP);
      const ln = available >= 0
        ? available
        : lastAt.indexOf(Math.min(...lastAt));
      lane.set(g.key, ln);
      lastAt[ln] = p;
    }
  };
  assignLanes(unitedMarks);
  assignLanes(oppMarks);

  const unitedMaxLane = unitedMarks.reduce((max, g) => Math.max(max, lane.get(g.key) ?? 0), 0);
  const oppMaxLane = oppMarks.reduce((max, g) => Math.max(max, lane.get(g.key) ?? 0), 0);
  const zoneHeight = (maxLane: number) =>
    maxLane >= 2 ? "h-[86px]" : maxLane >= 1 ? "h-[64px]" : "h-[46px] sm:h-[60px]";
  const unitedZoneH = zoneHeight(unitedMaxLane);
  const oppZoneH = zoneHeight(oppMaxLane);

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
    <div className="relative z-0 w-full overflow-visible">
      {/* United scorers above the bar — positioned at their minute on every viewport. */}
      <div className={`relative overflow-visible ${unitedZoneH}`}>
        {unitedMarks.map((g) => {
          const ln = lane.get(g.key) ?? 0;
          const p = markPos(g);
          const focused = !!g.playerId && focusSet?.has(g.playerId) === true;
          return (
            <div
              key={g.key}
              className={`absolute bottom-0 ${ln >= 1 ? "z-20" : "z-10"}`}
              style={{ left: `${p}%`, transform: "translateX(-50%)" }}
              title={g.title}
            >
              <GoalLabel g={g} p={p} lane={ln} side="united" focused={focused} />
              <span className="-mb-1 block">
                <GoalDot side="united" focused={focused} />
              </span>
            </div>
          );
        })}
      </div>

      {/* Lead bar */}
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

      {/* Opponent scorers below the bar. */}
      <div className={`relative overflow-visible ${oppZoneH}`}>
        {oppMarks.map((g) => {
          const ln = lane.get(g.key) ?? 0;
          const p = markPos(g);
          const focused = !!g.playerId && focusSet?.has(g.playerId) === true;
          return (
            <div
              key={g.key}
              className={`absolute top-0 ${ln >= 1 ? "z-20" : "z-10"}`}
              style={{ left: `${p}%`, transform: "translateX(-50%)" }}
              title={g.title}
            >
              <span className="-mt-1 block">
                <GoalDot side="opponent" focused={focused} />
              </span>
              <GoalLabel g={g} p={p} lane={ln} side="opponent" focused={focused} />
            </div>
          );
        })}
      </div>

      {/* Minute axis */}
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

      {/* Screen-reader ordered list — visual labels are spatial, this preserves sequence. */}
      <ol className="sr-only">
        {sorted.map((g) => (
          <li key={g.key}>{g.title}</li>
        ))}
      </ol>
    </div>
  );
}
