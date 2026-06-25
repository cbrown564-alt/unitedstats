import Link from "next/link";
import { familyName } from "@/lib/names";
import type { PlayerTotals } from "@/lib/queries";
import { PlayerPortrait } from "@/components/PlayerPortrait";

/**
 * The whole playing history as one object: every player a point, placed by how
 * long he stayed (x, appearances) and how much he scored (y, goals). Most cluster
 * against the origin — a cup tie, a cameo, a season — and a few stretch out along
 * two frontiers: the loyal servants running right across the foot (Giggs's 963
 * games, the goalkeepers on nil), and the scorers climbing the side. The rare
 * handful who did both sit out top-right, where the immortals live. Position is
 * the whole story; the outliers wear their face.
 *
 * Pure positioned HTML, not SVG: the dots stay round and the portraits crisp at
 * any width. Portraits are placed greedily from the frontier inward and skip any
 * that would collide, so the names never pile up (no DOM measurement).
 */
export function PlayerGreatnessMap({ players }: { players: PlayerTotals[] }) {
  const rows = players.filter((p) => (p.apps ?? 0) > 0);
  if (rows.length === 0) return null;

  const maxApps = Math.max(...rows.map((p) => p.apps ?? 0));
  const maxGoals = Math.max(...rows.map((p) => p.goals));
  const PAD = 7;
  const xOf = (apps: number) => PAD + (apps / maxApps) * (100 - 2 * PAD);
  const yOf = (goals: number) => PAD + ((maxGoals - goals) / maxGoals) * (100 - 2 * PAD);

  // The frontier: the great scorers and the great servants. Greedily place
  // portraits from this pool, skipping any that would land on an already-placed
  // face, so the labels never pile up where the data clusters.
  const topScorers = [...rows].sort((a, b) => b.goals - a.goals).slice(0, 12);
  const topServants = [...rows].sort((a, b) => (b.apps ?? 0) - (a.apps ?? 0)).slice(0, 8);
  const pool = [...topScorers, ...topServants.filter((p) => !topScorers.includes(p))];

  // Each label is a portrait with a surname underneath, so its footprint is
  // taller than it is wide. A radial test let the high-scorer cluster (Charlton,
  // Law, Best, Van Nistelrooy) pile up on a phone; a bounding-box test with a
  // taller vertical gap skips the overlappers while keeping the immortals (the
  // pool is sorted by goals, so they're placed first). Gaps are % of the box.
  const X_GAP = 11; // ~portrait width
  const Y_GAP = 17; // portrait + surname label
  const named: PlayerTotals[] = [];
  const placed: { x: number; y: number }[] = [];
  for (const p of pool) {
    if (named.length >= 12) break;
    const x = xOf(p.apps ?? 0);
    const y = yOf(p.goals);
    if (placed.some((q) => Math.abs(q.x - x) < X_GAP && Math.abs(q.y - y) < Y_GAP)) continue;
    named.push(p);
    placed.push({ x, y });
  }
  const namedIds = new Set(named.map((p) => p.player_id));

  // Drop ticks that land under the pinned "appearances →" caption at the right
  // edge (position test, so it holds at any width / max-apps value).
  const xTicks = [200, 400, 600, 800].filter((n) => n <= maxApps && xOf(n) < 72);
  const yTicks = [50, 100, 150, 200, 250].filter((n) => n <= maxGoals);

  return (
    <figure className="m-0">
      <div className="relative h-72 w-full sm:h-80">
        {/* light goal gridlines + ticks down the left */}
        {yTicks.map((g) => (
          <div key={g} className="absolute inset-x-0 border-t border-line/20" style={{ top: `${yOf(g)}%` }} aria-hidden>
            <span className="stat-num absolute left-0 -translate-y-1/2 bg-panel/70 pr-1 text-[10px] text-ink-faint">{g}</span>
          </div>
        ))}
        {xTicks.map((n) => (
          <div key={n} className="absolute bottom-0 top-0 w-px bg-line/15" style={{ left: `${xOf(n)}%` }} aria-hidden />
        ))}
        <span className="absolute left-0 top-0 text-[10px] uppercase tracking-wider text-ink-faint">goals ↑</span>

        {/* every player a faint dot, sized and strengthened by appearances */}
        {rows.map((p) => {
          if (namedIds.has(p.player_id)) return null;
          const apps = p.apps ?? 0;
          const size = Math.max(3, Math.min(11, Math.sqrt(apps) * 0.7));
          const op = 0.14 + 0.5 * (apps / maxApps);
          return (
            <span
              key={p.player_id}
              title={`${p.name} · ${apps} apps · ${p.goals} goals`}
              className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full bg-devil-bright"
              style={{ left: `${xOf(apps)}%`, top: `${yOf(p.goals)}%`, width: size, height: size, opacity: op }}
              aria-hidden
            />
          );
        })}

        {/* the frontier: a linked portrait + surname on its point */}
        {named.map((p) => {
          const apps = p.apps ?? 0;
          const surname = familyName(p.name);
          return (
            <Link
              key={p.player_id}
              href={`/player/${p.player_id}`}
              title={`${p.name} · ${apps} apps · ${p.goals} goals`}
              className="group absolute z-10 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center focus-ring"
              style={{ left: `${xOf(apps)}%`, top: `${yOf(p.goals)}%` }}
            >
              <span className="block transition-transform duration-150 group-hover:z-20 group-hover:scale-110">
                <PlayerPortrait name={p.name} src={p.player_thumb_url ?? p.player_image_url} size="xs" />
              </span>
              <span className="mt-0.5 text-[9px] font-semibold leading-none text-ink [text-shadow:0_1px_2px_rgb(0_0_0_/0.8)]">
                {surname}
              </span>
            </Link>
          );
        })}
      </div>

      {/* x axis */}
      <div className="relative mt-1 h-3.5">
        {xTicks.map((n) => (
          <span key={n} className="stat-num absolute -translate-x-1/2 text-[10px] text-ink-faint" style={{ left: `${xOf(n)}%` }}>
            {n}
          </span>
        ))}
        <span className="absolute right-0 text-[10px] text-ink-faint">appearances →</span>
      </div>

      <figcaption className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-line/70 pt-3 text-[11px] text-ink-faint">
        <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-devil-bright" />A player</span>
        <span className="text-ink-dim">
          Right = more appearances · up = more goals · the servants run along the foot, the scorers climb, the
          immortals sit top-right
        </span>
      </figcaption>
    </figure>
  );
}
