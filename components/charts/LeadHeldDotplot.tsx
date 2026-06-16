/**
 * The fortress rule, drawn as a wall. One dot per Old Trafford home league game
 * United led at half-time, oldest top-left, read in rows like text. Wins are solid
 * green bricks; draws are hollow gold — the games where the lead slipped but the
 * record held; a defeat would be a devil-red breach, and the point of the picture
 * is that there isn't one. A handful of "closest call" games carry a numbered halo
 * that ties them to the list below.
 *
 * Server-rendered SVG: no client JS, scales to its container via viewBox.
 */
export type LeadDot = {
  result: "W" | "D" | "L";
  /** The lead was surrendered at some point (drew, or fell behind and recovered). */
  surrendered: boolean;
  /** 1-based index into the "closest calls" pullout list, if featured. */
  rank?: number;
  title: string;
};

const CELL = 22; // grid pitch in viewBox units
const PAD_X = 10;
const PAD_T = 12;
const PAD_B = 22; // room for the corner year labels

export function LeadHeldDotplot({
  dots,
  fromLabel,
  toLabel,
}: {
  dots: LeadDot[];
  fromLabel: string;
  toLabel: string;
}) {
  if (dots.length === 0) return null;

  // Wide rectangle (~3.2:1) so the field reads as an unbroken wall rather than a column.
  const cols = Math.ceil(Math.sqrt(dots.length * 3.2));
  const rows = Math.ceil(dots.length / cols);
  const width = cols * CELL + PAD_X * 2;
  const height = rows * CELL + PAD_T + PAD_B;

  const cx = (i: number) => PAD_X + (i % cols) * CELL + CELL / 2;
  const cy = (i: number) => PAD_T + Math.floor(i / cols) * CELL + CELL / 2;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-auto w-full"
      role="img"
      aria-label={`${dots.length} home league games leading at half-time, ${fromLabel} to ${toLabel}; every one unbeaten, ${dots.filter((d) => d.result === "D").length} drawn`}
    >
      {dots.map((d, i) => {
        const x = cx(i);
        const y = cy(i);
        const won = d.result === "W";
        const lost = d.result === "L";
        const fill = lost
          ? "var(--color-loss)"
          : won
            ? "var(--color-win)"
            : "var(--color-pitch)";
        return (
          <g key={i}>
            {/* featured halo, drawn under the dot so the dot reads clean on top */}
            {d.rank != null && (
              <circle cx={x} cy={y} r={9} fill="none" stroke="var(--color-ink-dim)" strokeWidth="1" opacity="0.55" />
            )}
            <circle
              cx={x}
              cy={y}
              r={d.surrendered ? 5.5 : 6}
              fill={fill}
              fillOpacity={won ? 0.9 : 1}
              stroke={d.surrendered && !lost ? "var(--color-gold)" : "none"}
              strokeWidth={d.surrendered && !lost ? 1.6 : 0}
            >
              <title>{d.title}</title>
            </circle>
            {d.rank != null && (
              <text
                x={x}
                y={y - 11}
                textAnchor="middle"
                fontSize="9"
                fontWeight="700"
                fill="var(--color-ink-dim)"
                className="stat-num"
              >
                {d.rank}
              </text>
            )}
          </g>
        );
      })}

      {/* time orientation: the run starts top-left and ends bottom-right */}
      <text x={PAD_X} y={height - 6} fontSize="10" fill="var(--color-ink-faint)" className="stat-num">
        {fromLabel}
      </text>
      <text x={width - PAD_X} y={height - 6} textAnchor="end" fontSize="10" fill="var(--color-ink-faint)" className="stat-num">
        {toLabel} →
      </text>
    </svg>
  );
}
