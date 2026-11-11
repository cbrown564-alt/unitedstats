import { StoppageKey } from "@/components/glyphs/cord/KeyGlyphs";
import Link from "next/link";
import { playerHref } from "@/lib/publishedHref";
import { familyName } from "@/lib/names";
import type { EventRow } from "@/lib/queries";
import { Pickable } from "@/components/match/MatchCorrection";
import { MatchFlowPlay } from "@/components/MatchFlowPlay";
import { goalClock, matchTimeScale, scoreCordPath } from "@/lib/matchCord";

/**
 * Match flow, drawn as a cord: one red thread that runs level, steps up when
 * United score and down when the opponent does, so its height is the score
 * state at every minute. United scorers sit above the band and opponent
 * scorers below, each tied to the bead where the score changed; the knot at
 * the end is the scoreline at the whistle (never a shootout).
 *
 * Stoppage time after 90' gets a widened slice of the axis so late goals are
 * readable; the axis marks where the scale changes and says so.
 *
 * Server-rendered from timed goal events only. Matches without timed goals fall
 * back to a plain scorer list (handled by the caller). "Play" (a small client
 * control) replays the night: the cord sews at match pace and each scorer
 * lands as the needle reaches them.
 */

/** Clock label that keeps stoppage time as "90+6", regulation as "64". */
function clock(minute: number, added: number | null): string {
  return added ? `${minute}+${added}` : `${minute}`;
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
  const labelOffset = [10, 32, 54][lane] ?? 10;
  const connectorHeight = labelOffset;

  const name = g.playerId ? (
    <Link href={playerHref(g.playerId)} prefetch={false} className={focused ? "font-semibold text-gold hover:text-ink" : "text-ink hover:text-devil-bright"}>
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
        className={`absolute left-1/2 w-px -translate-x-1/2 bg-ink/25 ${side === "united" ? "bottom-0" : "top-0"}`}
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
      className={`tap-target relative z-10 block h-3 w-3 rounded-full sm:h-[11px] sm:w-[11px] ${
        focused ? "ring-2 ring-gold shadow-[0_0_12px_2px_rgba(245,197,24,0.55)]" : "ring-[2.5px] ring-panel"
      } ${focused ? "bg-gold" : side === "united" ? "bg-devil-bright" : "bg-ink-dim"}`}
    />
  );
}

/** Height of the score band, and of each one-goal step within it. */
const BAND = 72;

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
  const { end, stoppage, zoom, endX, pos } = matchTimeScale(
    goals.map((g) => goalClock(g.minute, g.added)),
    aet,
  );
  const markPos = (g: GoalMark) => pos(goalClock(g.minute, g.added));

  // Score state after each goal, United's perspective.
  const after = new Map<string, number>();
  let diff = 0;
  let maxAbs = 1;
  for (const g of sorted) {
    diff += g.delta;
    maxAbs = Math.max(maxAbs, Math.abs(diff));
    after.set(g.key, diff);
  }
  const final = diff;
  const mid = BAND / 2;
  const stepPx = Math.min(20, (mid - 9) / maxAbs);
  const yOf = (d: number) => mid - d * stepPx;

  const { d, plate } = scoreCordPath(
    sorted.map((g) => ({ x: markPos(g), after: after.get(g.key) ?? 0 })),
    yOf,
    endX,
  );

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
    maxLane >= 2 ? "h-[86px] sm:h-[72px]" : maxLane >= 1 ? "h-[62px] sm:h-[50px]" : "h-[38px] sm:h-[28px]";
  const unitedZoneH = unitedMarks.length ? zoneHeight(unitedMaxLane) : "h-3";
  const oppZoneH = oppMarks.length ? zoneHeight(oppMaxLane) : "h-3";

  // Tethers: a pale thread from the band edge down (or up) to each goal's bead.
  const tethers = sorted
    .map((g) => {
      const x = markPos(g).toFixed(2);
      const y = yOf(after.get(g.key) ?? 0);
      return g.side === "united" ? `M${x} 0V${y}` : `M${x} ${BAND}V${y}`;
    })
    .join("");

  const ticks = [45, ...(end >= 90 ? [90] : []), ...(aet ? [105] : [])];
  const axis: { at: number; label: string; key: string }[] = [
    { at: 0, label: "0\u2032", key: "0" },
    { at: pos(45), label: "HT", key: "ht" },
    ...(aet
      ? [{ at: pos(90), label: "90\u2032", key: "90" }, { at: pos(120), label: "AET", key: "ft" }]
      : stoppage
        ? [
            { at: pos(90), label: "90\u2032", key: "90" },
            { at: pos(90 + stoppage), label: `+${stoppage}\u2032`, key: "st" },
          ]
        : [{ at: pos(90), label: "FT", key: "ft" }]),
  ];
  const result = final > 0 ? "w" : final < 0 ? "l" : "d";
  const resultWord = final > 0 ? "United ahead" : final < 0 ? "United behind" : "level";
  // Playback timing: where each goal falls along the cord, 0–1.
  const tOf = (g: GoalMark) => (markPos(g) / 100).toFixed(3);

  return (
    <div className="mf relative z-0 w-full overflow-visible">
      {/* United scorers above the band — positioned at their minute on every viewport. */}
      <div className={`relative overflow-visible ${unitedZoneH}`}>
        {unitedMarks.map((g) => {
          const ln = lane.get(g.key) ?? 0;
          const p = markPos(g);
          const focused = !!g.playerId && focusSet?.has(g.playerId) === true;
          return (
            <div
              key={g.key}
              className={`mf-land absolute bottom-0 ${ln >= 1 ? "z-20" : "z-10"}`}
              style={{ left: `${p}%`, "--t": tOf(g) } as React.CSSProperties}
              title={g.title}
            >
              <GoalLabel g={g} p={p} lane={ln} side="united" focused={focused} />
            </div>
          );
        })}
      </div>

      {/* The score band: level line, half-time tick, the cord and its beads. */}
      <div className="relative" style={{ height: BAND }} role="img" aria-label={`Score state by minute; finished ${resultWord}`}>
        <svg
          className="mf-cord cd cd-lit absolute inset-0 h-full w-full overflow-visible"
          viewBox={`0 0 100 ${BAND}`}
          preserveAspectRatio="none"
          aria-hidden
        >
          {zoom > 0 && (
            <rect className="mf-stoppage" x={pos(90)} y={0} width={endX - pos(90)} height={BAND} />
          )}
          <path className="cd-strand mf-ns mf-level" d={`M0 ${mid}H${endX}`} />
          <path
            className="cd-strand mf-ns"
            d={ticks.map((m) => `M${pos(m).toFixed(2)} ${mid - 5}V${mid + 5}`).join("")}
          />
          {/* The live layer: revealed left to right at match pace on replay. */}
          <g className="mf-live">
            <path className="cd-plate mf-plate" d={plate} />
            <path className="cd-strand mf-ns mf-tether" d={tethers} />
            <path className="cd-cord mf-ns" d={d} />
          </g>
        </svg>
        <span aria-hidden className="mf-playhead" style={{ "--end": `${endX}%` } as React.CSSProperties} />
        {sorted.map((g) => {
          const focused = !!g.playerId && focusSet?.has(g.playerId) === true;
          return (
            <span
              key={g.key}
              className="mf-land absolute z-10 -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${markPos(g)}%`, top: yOf(after.get(g.key) ?? 0), "--t": tOf(g) } as React.CSSProperties}
              title={g.title}
            >
              <GoalDot side={g.side} focused={focused} />
            </span>
          );
        })}
        <span
          aria-hidden
          className={`mf-land mf-knot mf-knot--${result} absolute -translate-x-1/2 -translate-y-1/2`}
          style={{ left: `${endX}%`, top: yOf(final), "--t": 1 } as React.CSSProperties}
        />
      </div>

      {/* Opponent scorers below the band. */}
      <div className={`relative overflow-visible ${oppZoneH}`}>
        {oppMarks.map((g) => {
          const ln = lane.get(g.key) ?? 0;
          const p = markPos(g);
          const focused = !!g.playerId && focusSet?.has(g.playerId) === true;
          return (
            <div
              key={g.key}
              className={`mf-land absolute top-0 ${ln >= 1 ? "z-20" : "z-10"}`}
              style={{ left: `${p}%`, "--t": tOf(g) } as React.CSSProperties}
              title={g.title}
            >
              <GoalLabel g={g} p={p} lane={ln} side="opponent" focused={focused} />
            </div>
          );
        })}
      </div>

      {/* Minute axis */}
      <div className="relative mt-1 h-4">
        {axis.map((a) => (
          <span
            key={a.key}
            className={`stat-num absolute text-[10px] ${a.key === "st" ? "text-ink-dim" : "text-ink-faint"}`}
            style={{ left: `${a.at}%`, transform: a.at === 0 ? "none" : a.key === "st" || a.key === "ft" ? "translateX(-70%)" : "translateX(-50%)" }}
          >
            {a.label}
          </span>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
        <MatchFlowPlay />
        {zoom > 0 && (
          <StoppageKey />
        )}
      </div>

      {/* Screen-reader ordered list — visual labels are spatial, this preserves sequence. */}
      <details className="mt-4 rounded-lg border border-line p-3"><summary className="cursor-pointer text-sm font-medium text-ink-dim">Read goals in chronological order</summary>
      <ol className="mt-3 space-y-2 text-sm text-ink">
        {sorted.map((g) => (
          <li key={g.key}>{g.title}</li>
        ))}
      </ol></details>
    </div>
  );
}
