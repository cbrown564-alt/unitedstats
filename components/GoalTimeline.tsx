import Link from "next/link";
import type { EventRow, LineupRow } from "@/lib/queries";

/**
 * Shared match timeline: both teams' goals on one 0–FT axis, so the *flow* of a
 * match (clusters, comebacks, late winners) reads pre-attentively before any text.
 * Goals are the hero marks; cards and substitutions are quiet baseline ticks.
 *
 * Server-rendered. Built only from data the archive owns: goal/card minutes and
 * substitution-on minutes. Matches with no timed events fall back to a list.
 */

function surname(name: string | null | undefined): string {
  if (!name) return "";
  const parts = name.trim().split(/\s+/);
  return parts[parts.length - 1] || name;
}

type GoalMark = {
  key: string;
  minute: number;
  side: "united" | "opponent";
  scorer: string;
  playerId: string | null;
  tag: "P" | "OG" | null;
  title: string;
};

const TOP_H = 66; // px, United zone (above baseline)
const BOT_H = 66; // px, opponent zone (below baseline)

export function GoalTimeline({
  unitedGoals,
  opponentGoals,
  cards,
  subs,
  club,
  opponentName,
  aet,
}: {
  unitedGoals: EventRow[];
  opponentGoals: EventRow[];
  cards: EventRow[];
  subs: LineupRow[];
  club: string;
  opponentName: string;
  aet: boolean;
}) {
  const timed = (e: EventRow) => e.minute != null;

  const goals: GoalMark[] = [
    ...unitedGoals.filter(timed).map((e) => ({
      key: `u${e.seq}`,
      minute: e.minute as number,
      side: "united" as const,
      scorer: surname(e.player_display_name),
      playerId: e.player_id,
      tag: e.type === "pen-goal" ? ("P" as const) : e.type === "own-goal-for" ? ("OG" as const) : null,
      title:
        `${e.minute}' ${e.player_display_name ?? "Goal"}` +
        (e.type === "pen-goal" ? " (penalty)" : e.type === "own-goal-for" ? " (own goal)" : "") +
        (e.assist_display_name ? `, assist ${e.assist_display_name}` : ""),
    })),
    ...opponentGoals.filter(timed).map((e) => ({
      key: `o${e.seq}`,
      minute: e.minute as number,
      side: "opponent" as const,
      scorer: surname(e.player_display_name),
      playerId: null,
      tag: e.type === "own-goal-against" ? ("OG" as const) : null,
      title:
        `${e.minute}' ${e.player_display_name ?? "Goal"}` +
        (e.type === "own-goal-against" ? " (own goal)" : ""),
    })),
  ];

  const cardMarks = cards
    .filter(timed)
    .map((e) => ({
      key: `c${e.seq}`,
      minute: e.minute as number,
      side: e.player_side,
      red: e.type === "card-red",
      title: `${e.minute}' ${e.type === "card-red" ? "Red" : "Yellow"} card · ${e.player_display_name ?? "Player"}`,
    }));

  const subMarks = subs
    .filter((s) => s.sub_on != null)
    .map((s) => ({
      key: `s${s.player_id ?? s.provider_id ?? s.player_display_name}`,
      minute: s.sub_on as number,
      title: `${s.sub_on}' On · ${s.player_display_name}`,
    }));

  // Nothing has a minute → caller should render the list fallback instead.
  if (goals.length === 0) return null;

  const allMin = [
    ...goals.map((g) => g.minute),
    ...cardMarks.map((c) => c.minute),
    ...subMarks.map((s) => s.minute),
  ];
  const maxMin = Math.max(90, ...allMin, aet ? 120 : 0);
  const end = aet ? 120 : maxMin > 90 ? Math.min(120, Math.ceil(maxMin / 5) * 5) : 90;
  const pos = (m: number) => Math.max(0, Math.min(100, (m / end) * 100));

  const gridlines = [
    { m: 45, label: "HT", dashed: true },
    { m: 90, label: end > 90 ? "90" : "FT", dashed: end > 90 },
    ...(end > 90 ? [{ m: end, label: "FT", dashed: false }] : []),
  ];

  // Stagger labels into two lanes so clustered goals (e.g. 44', 48') don't collide.
  const laneFor = (marks: GoalMark[]) => {
    const sorted = [...marks].sort((a, b) => a.minute - b.minute);
    const lane = new Map<string, number>();
    sorted.forEach((g, i) => lane.set(g.key, i % 2));
    return lane;
  };
  const unitedLane = laneFor(goals.filter((g) => g.side === "united"));
  const oppLane = laneFor(goals.filter((g) => g.side === "opponent"));

  function GoalColumn({ g, lane }: { g: GoalMark; lane: number }) {
    const up = g.side === "united";
    const color = up ? "text-devil-bright" : "text-loss";
    const dot = up ? "bg-devil-bright" : "bg-loss";
    const height = lane === 0 ? 34 : TOP_H - 6;
    const label = (
      <span className="flex items-center gap-1 whitespace-nowrap text-[11px] leading-none">
        <span className={`stat-num font-semibold ${color}`}>{g.minute}&prime;</span>
        {g.playerId ? (
          <Link href={`/player/${g.playerId}`} className="text-ink hover:text-devil-bright">
            {g.scorer}
          </Link>
        ) : (
          <span className="text-ink">{g.scorer}</span>
        )}
        {g.tag && <span className="text-ink-faint">{g.tag === "P" ? "(P)" : "(OG)"}</span>}
      </span>
    );
    return (
      <div
        className="absolute flex flex-col items-center"
        style={{
          left: `${pos(g.minute)}%`,
          transform: "translateX(-50%)",
          height,
          [up ? "bottom" : "top"]: `${BOT_H}px`,
        }}
        title={g.title}
      >
        {up ? (
          <>
            {label}
            <span className="w-px flex-1 bg-line" />
            <span className={`h-2.5 w-2.5 rounded-full ${dot} ring-2 ring-pitch`} />
          </>
        ) : (
          <>
            <span className={`h-2.5 w-2.5 rounded-full ${dot} ring-2 ring-pitch`} />
            <span className="w-px flex-1 bg-line" />
            {label}
          </>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-3xl overflow-hidden rounded-lg border border-line bg-panel">
      <div className="flex items-baseline justify-between gap-3 border-b border-line px-4 py-2 text-[11px] uppercase tracking-wider text-ink-faint">
        <span className="text-devil-bright">{club}</span>
        <span>{opponentName}</span>
      </div>
      <div className="relative px-5 pb-7 pt-4">
        <div className="relative" style={{ height: TOP_H + BOT_H }}>
          {/* gridlines + baseline */}
          {gridlines.map((gl) => (
            <div
              key={gl.m}
              className="absolute top-0 bottom-0 flex flex-col items-center"
              style={{ left: `${pos(gl.m)}%`, transform: "translateX(-50%)" }}
            >
              <div
                className={`h-full w-px ${gl.dashed ? "border-l border-dashed border-line" : "bg-line"}`}
              />
            </div>
          ))}
          <div
            className="absolute left-0 right-0 h-px bg-line"
            style={{ top: `${TOP_H}px` }}
            aria-hidden
          />

          {/* substitution + card ticks, hugging the baseline */}
          {subMarks.map((s) => (
            <span
              key={s.key}
              className="absolute h-1.5 w-1.5 rotate-45 border border-ink-faint"
              style={{ left: `${pos(s.minute)}%`, top: `${TOP_H + 5}px`, transform: "translateX(-50%) rotate(45deg)" }}
              title={s.title}
            />
          ))}
          {cardMarks.map((c) => (
            <span
              key={c.key}
              className={`absolute h-2.5 w-[6px] rounded-[1px] ${c.red ? "bg-loss" : "bg-gold"}`}
              style={{
                left: `${pos(c.minute)}%`,
                top: c.side === "united" ? `${TOP_H - 13}px` : `${TOP_H + 3}px`,
                transform: "translateX(-50%)",
              }}
              title={c.title}
            />
          ))}

          {/* goals */}
          {goals.map((g) => (
            <GoalColumn
              key={g.key}
              g={g}
              lane={(g.side === "united" ? unitedLane : oppLane).get(g.key) ?? 0}
            />
          ))}
        </div>

        {/* minute axis */}
        {gridlines.map((gl) => (
          <span
            key={gl.m}
            className="stat-num absolute bottom-2 text-[10px] text-ink-faint"
            style={{ left: `${pos(gl.m)}%`, transform: "translateX(-50%)" }}
          >
            {gl.label}
          </span>
        ))}
        <span className="stat-num absolute bottom-2 left-5 text-[10px] text-ink-faint">0&prime;</span>
      </div>
    </div>
  );
}
