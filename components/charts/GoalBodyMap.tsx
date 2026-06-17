import { fmtNum, pct } from "@/lib/format";

type Zone = "head" | "chest" | "knee" | "leftFoot" | "rightFoot";

/** Which silhouette zone a curated goal-type maps onto. Types with no
 *  unambiguous anatomical home (Backheel, and anything new) stay off the figure
 *  but still appear in the breakdown list, so nothing is dropped. */
const ZONE_OF: Record<string, Zone> = {
  Head: "head",
  Torso: "chest",
  Shoulder: "chest",
  Knee: "knee",
  "Left Foot": "leftFoot",
  "Right Foot": "rightFoot",
};

// Badge anchor points over the silhouette (viewBox 200 x 380). Left/right read
// from the viewer's side so the labels in the breakdown match what they see.
// Anchors over the striker silhouette (viewBox 260 x 300). The kicking boot is
// the Right Foot — the dominant badge lands there, beside the ball.
const POS: Record<Zone, { x: number; y: number }> = {
  head: { x: 92, y: 40 },
  chest: { x: 104, y: 114 },
  knee: { x: 168, y: 188 },
  rightFoot: { x: 224, y: 236 },
  leftFoot: { x: 111, y: 261 },
};

/**
 * Where a player's goals came off the body. Goal counts sit directly on the head,
 * chest, knee, and each foot of a footballer silhouette — position is the label,
 * the dominant part glows gold — beside a ranked breakdown carrying every
 * technique with its exact figure.
 */
export function GoalBodyMap({
  types,
  totalGoals,
}: {
  types: { goal_type: string; goals: number }[];
  totalGoals: number;
}) {
  if (types.length === 0) return null;

  const zoneCounts = {} as Record<Zone, number>;
  for (const t of types) {
    const zone = ZONE_OF[t.goal_type];
    if (zone) zoneCounts[zone] = (zoneCounts[zone] ?? 0) + t.goals;
  }
  const zones = (Object.keys(zoneCounts) as Zone[]).filter((z) => zoneCounts[z] > 0);
  const maxZone = Math.max(1, ...zones.map((z) => zoneCounts[z]));
  const topZone = zones.reduce<Zone | null>((best, z) => (best && zoneCounts[best] >= zoneCounts[z] ? best : z), null);

  const maxType = Math.max(1, ...types.map((t) => t.goals));

  return (
    <div className="grid items-center gap-6 sm:grid-cols-[minmax(0,200px)_minmax(0,1fr)]">
      {/* The figure: counts land on the body part that scored them. */}
      <svg
        viewBox="0 0 260 300"
        className="mx-auto h-auto w-48 max-w-full sm:w-full"
        role="img"
        aria-label={`Goals by body part: ${zones.map((z) => `${z} ${zoneCounts[z]}`).join(", ")}`}
      >
        {/* A striker pictogram on the follow-through, built from round-capped
            strokes so the joints read clean: trailing arm up for balance,
            leading arm forward, planted leg down, kicking leg swung to the ball. */}
        <defs>
          <linearGradient id="bodymap-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#4a413b" />
            <stop offset="1" stopColor="#241e1c" />
          </linearGradient>
        </defs>
        <circle cx="92" cy="40" r="16" fill="url(#bodymap-fill)" />
        <g fill="none" stroke="url(#bodymap-fill)" strokeLinecap="round" strokeLinejoin="round">
          <path d="M96 66 Q104 116 112 166" strokeWidth="19" />
          <path d="M96 70 L72 58 L50 40" strokeWidth="13" />
          <path d="M98 72 L126 92 L152 118" strokeWidth="13" />
          <path d="M108 164 L103 214 L100 258" strokeWidth="18" />
          <path d="M100 258 L122 264" strokeWidth="18" />
          <path d="M118 164 L170 190 L210 230" strokeWidth="18" />
          <path d="M210 230 L234 240" strokeWidth="18" />
        </g>
        {/* the ball being struck */}
        <circle cx="236" cy="256" r="13" fill="var(--color-panel)" stroke="var(--color-ink-faint)" strokeWidth="2" />

        {zones.map((z) => {
          const n = zoneCounts[z];
          const r = 11 + 10 * (n / maxZone);
          const top = z === topZone;
          const { x, y } = POS[z];
          return (
            <g key={z}>
              <circle
                cx={x}
                cy={y}
                r={r}
                fill={top ? "var(--color-gold)" : "var(--color-devil)"}
                fillOpacity={top ? 1 : 0.9}
                stroke="var(--color-pitch)"
                strokeWidth="2"
              />
              <text
                x={x}
                y={y}
                dy="0.34em"
                textAnchor="middle"
                fontSize="13"
                fontWeight="700"
                fill={top ? "var(--color-pitch)" : "var(--color-ink)"}
                style={{ fontFamily: "var(--font-mono)" }}
              >
                {fmtNum(n)}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Ranked breakdown — every technique, exact figures, top in gold. */}
      <ul className="space-y-2.5">
        {types.map((t, i) => {
          const top = i === 0;
          return (
            <li key={t.goal_type}>
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className={top ? "font-medium text-ink" : "text-ink-dim"}>{t.goal_type}</span>
                <span className="stat-num shrink-0 text-ink-faint">
                  <span className={top ? "text-gold" : "text-ink"}>{fmtNum(t.goals)}</span>
                  <span className="ml-1.5">{pct(t.goals, totalGoals)}</span>
                </span>
              </div>
              <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-panel-2">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${(100 * t.goals) / maxType}%`,
                    background: top ? "var(--color-gold)" : "var(--color-devil)",
                    opacity: top ? 1 : 0.7,
                  }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
