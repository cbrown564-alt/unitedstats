import { fmtDate, venuePrefix } from "@/lib/format";
import type { MatchRow } from "@/lib/queries";

type GoalMatch = MatchRow & { goals: number };

/**
 * The shape of a scoring career: every match he scored in as a bar in date order,
 * height the goals that day, so braces and hat-tricks rise as spikes and the gold
 * caps the multi-goal nights. A one-sided cousin of `ResultSpine` — a player has
 * no "down", so this never diverges; it reads as the cadence of his hauls. Shows
 * scoring games only, not blanks, so droughts aren't drawn (coverage is partial).
 *
 * Server-rendered SVG that stretches to its container; the x-axis is non-uniformly
 * scaled, so the hat-trick pips ride an HTML overlay to stay circular.
 */
const PAD_T = 12; // headroom for the pips
const PAD_B = 16; // room for the year axis

export function ContributionSpine({
  matches,
  markers = [],
  height = 84,
  subject = "He",
}: {
  /** Scoring matches, oldest first. */
  matches: GoalMatch[];
  /** Matches to flag above the spine (e.g. the hat-tricks), with a hover label. */
  markers?: { id: string; label?: string }[];
  height?: number;
  subject?: string;
}) {
  const n = matches.length;
  if (n === 0) return null;

  const W = n;
  const plotH = height - PAD_T - PAD_B;
  const baseY = PAD_T + plotH;
  const maxGoals = Math.max(1, ...matches.map((m) => m.goals));
  const scale = plotH / maxGoals; // goals are small ints — a plain linear scale
  const barW = n > 150 ? 1 : 0.82;
  const xOff = (1 - barW) / 2;

  // Gold caps the multi-goal nights; single goals are the same red, just dimmer.
  const fill = (g: number) => (g >= 3 ? "var(--color-gold)" : "var(--color-devil)");
  const op = (g: number) => (g >= 3 ? 1 : g === 2 ? 0.92 : 0.55);

  const labelById = new Map(markers.map((mk) => [mk.id, mk.label]));
  const pips = matches
    .map((m, i) => ({ m, i }))
    .filter(({ m }) => labelById.has(m.id))
    .map(({ m, i }) => ({ id: m.id, left: ((i + 0.5) / n) * 100, label: labelById.get(m.id) }));

  const totalGoals = matches.reduce((a, m) => a + m.goals, 0);
  const anchorCount = Math.min(6, n);
  const anchors = Array.from({ length: anchorCount }, (_, k) => {
    const i = Math.round((k / Math.max(1, anchorCount - 1)) * (n - 1));
    return { i, year: matches[i].date.slice(0, 4), first: k === 0, last: k === anchorCount - 1 };
  });

  return (
    <div>
      <div className="relative" style={{ height }}>
        <svg
          viewBox={`0 0 ${W} ${height}`}
          preserveAspectRatio="none"
          className="block w-full"
          style={{ height }}
          role="img"
          aria-label={`${subject} scored in ${n} matches over time — ${totalGoals} goals; bar height is goals that match, multi-goal games in gold`}
        >
          {matches.map((m, i) => {
            const h = Math.max(1.5, m.goals * scale);
            return (
              <rect key={m.id} x={i + xOff} y={baseY - h} width={barW} height={h} fill={fill(m.goals)} opacity={op(m.goals)}>
                <title>{`${fmtDate(m.date)} ${venuePrefix(m.venue)} ${m.opponent_name}: ${m.goals} goal${m.goals === 1 ? "" : "s"} (${m.gf}–${m.ga})`}</title>
              </rect>
            );
          })}
          <line x1={0} x2={W} y1={baseY} y2={baseY} stroke="var(--color-line)" strokeWidth={1} vectorEffect="non-scaling-stroke" />
        </svg>

        {pips.map((p) => (
          <div key={p.id} className="pointer-events-none absolute inset-y-0" style={{ left: `${p.left}%` }} title={p.label}>
            <div className="absolute inset-y-0 w-px -translate-x-1/2 bg-gold/35" />
            <div className="absolute top-0 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-gold" />
          </div>
        ))}
      </div>

      <div className="relative mt-1.5 h-3">
        {anchors.map((a) => (
          <span
            key={a.i}
            className={`stat-num absolute text-[10px] text-ink-faint ${a.first ? "left-0" : a.last ? "right-0" : "-translate-x-1/2"}`}
            style={a.first || a.last ? undefined : { left: `${((a.i + 0.5) / n) * 100}%` }}
          >
            {a.year}
          </span>
        ))}
      </div>
    </div>
  );
}
