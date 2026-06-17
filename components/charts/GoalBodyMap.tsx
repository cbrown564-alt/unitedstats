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
  head: { x: 104, y: 50 },
  chest: { x: 116, y: 116 },
  knee: { x: 180, y: 184 },
  rightFoot: { x: 200, y: 238 },
  leftFoot: { x: 114, y: 268 },
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
        {/* a footballer on the follow-through of a strike, facing the ball */}
        <g fill="var(--color-panel-2)" stroke="var(--color-line)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round">
          {/* head */}
          <circle cx="104" cy="50" r="17" />
          {/* leaning torso */}
          <path d="M92 66 Q120 58 126 78 L150 150 Q150 166 132 168 L110 168 Q96 150 90 110 Z" />
          {/* trailing arm, flung up-back for balance */}
          <path d="M96 80 Q70 70 52 44 Q48 40 53 35 Q60 33 64 40 Q80 64 102 72 Z" />
          {/* leading arm, reaching down-forward */}
          <path d="M132 90 Q156 104 168 128 Q170 134 164 137 Q158 138 154 132 Q142 114 122 104 Z" />
          {/* planted leg + boot */}
          <path d="M112 160 L132 160 L126 262 L108 262 Z" />
          <path d="M104 258 L128 258 L132 274 L98 274 Z" />
          {/* kicking leg, extended forward to the ball, with boot */}
          <path d="M122 158 Q150 156 172 176 Q180 184 196 214 L214 244 Q218 250 210 254 L200 250 L182 220 Q166 196 150 190 L128 188 Z" />
          <path d="M198 244 L216 240 L230 252 L218 262 L200 256 Z" />
        </g>
        {/* the ball being struck */}
        <circle cx="244" cy="262" r="12" fill="var(--color-panel)" stroke="var(--color-ink-faint)" strokeWidth="2" />

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
