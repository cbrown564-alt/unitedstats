import Link from "next/link";
import type { EventRow } from "@/lib/queries";

/**
 * Match flow: a single time bar coloured by who led and by how much. Red when
 * United are ahead, neutral grey at level, near-black when behind, deepening with
 * the margin. Goals ride above it as dots with scorer and minute. Cards and subs
 * live on the teamsheet; this is purely the shape of the result.
 *
 * Server-rendered from timed goal events only. Matches without timed goals fall
 * back to a plain scorer list (handled by the caller).
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
  delta: 1 | -1;
  scorer: string;
  playerId: string | null;
  tag: "P" | "OG" | null;
  title: string;
};

const ANNOT_H = 72; // px label/connector zone above the bar

/** United-perspective lead → tinted bar colour. Red ahead, grey level, near-black behind. */
function leadColor(margin: number): string {
  if (margin === 0) return "oklch(48% 0.006 40)";
  const t = Math.min(1, (Math.abs(margin) - 1) / 2); // 1-goal lead → 0, 3+ → 1
  if (margin > 0) return `oklch(${54 - t * 14}% ${0.15 + t * 0.05} 28)`;
  return `oklch(${24 - t * 12}% ${0.012 - t * 0.006} 40)`;
}

function Swatch({ margin }: { margin: number }) {
  return (
    <span
      className="inline-block h-2.5 w-2.5 rounded-[2px] align-middle"
      style={{ background: leadColor(margin) }}
      aria-hidden
    />
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
      side: "united" as const,
      delta: 1 as const,
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
      delta: -1 as const,
      scorer: surname(e.player_display_name),
      playerId: null,
      tag: e.type === "own-goal-against" ? ("OG" as const) : null,
      title:
        `${e.minute}' ${e.player_display_name ?? "Goal"}` +
        (e.type === "own-goal-against" ? " (own goal)" : ""),
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

  // Lane-stagger goal labels so clustered goals don't collide.
  const lane = new Map<string, number>();
  sorted.forEach((g, i) => lane.set(g.key, i % 2));

  const gridlines = [
    { m: 45, label: "HT" },
    { m: 90, label: end > 90 ? "90" : "FT" },
    ...(end > 90 ? [{ m: end, label: "FT" }] : []),
  ];

  return (
    <div className="rounded-lg border border-line bg-panel px-5 pt-3 pb-3">
      <div className="mb-3 flex items-baseline justify-between gap-3 text-[11px]">
        <span className="uppercase tracking-wider text-ink-faint">Match flow</span>
        <span className="flex items-center gap-3 text-ink-faint">
          <span className="flex items-center gap-1"><Swatch margin={1} /> ahead</span>
          <span className="flex items-center gap-1"><Swatch margin={0} /> level</span>
          <span className="flex items-center gap-1"><Swatch margin={-1} /> behind</span>
        </span>
      </div>

      {/* goal labels + connectors + dots */}
      <div className="relative" style={{ height: ANNOT_H }}>
        {sorted.map((g) => {
          const ln = lane.get(g.key) ?? 0;
          const isUnited = g.side === "united";
          const minuteColor = isUnited ? "text-devil-bright" : "text-ink-dim";
          const dot = isUnited ? "bg-devil-bright" : "bg-ink";
          const colHeight = ln === 0 ? 34 : ANNOT_H - 4;
          return (
            <div
              key={g.key}
              className="absolute bottom-0 flex flex-col items-center"
              style={{ left: `${pos(g.minute)}%`, transform: "translateX(-50%)", height: colHeight }}
              title={g.title}
            >
              <span className="flex items-center gap-1 whitespace-nowrap text-[11px] leading-none">
                <span className={`stat-num font-semibold ${minuteColor}`}>{g.minute}&prime;</span>
                {g.playerId ? (
                  <Link href={`/player/${g.playerId}`} className="text-ink hover:text-devil-bright">
                    {g.scorer}
                  </Link>
                ) : (
                  <span className="text-ink">{g.scorer}</span>
                )}
                {g.tag && <span className="text-ink-faint">{g.tag === "P" ? "(P)" : "(OG)"}</span>}
              </span>
              <span className="w-px flex-1 bg-line" />
              <span className={`h-2.5 w-2.5 rounded-full ${dot} ring-2 ring-panel`} />
            </div>
          );
        })}
      </div>

      {/* the lead bar */}
      <div
        className="relative flex h-3.5 w-full overflow-hidden rounded-full"
        role="img"
        aria-label="Lead by minute"
      >
        {segs.map((s, i) => (
          <div key={i} style={{ width: `${pos(s.to) - pos(s.from)}%`, background: leadColor(s.margin) }} />
        ))}
        {end >= 45 && (
          <span
            className="absolute top-0 bottom-0 w-px"
            style={{ left: `${pos(45)}%`, background: "color-mix(in oklab, var(--color-ink) 35%, transparent)" }}
            aria-hidden
          />
        )}
      </div>

      {/* minute axis */}
      <div className="relative mt-1.5 h-4">
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
