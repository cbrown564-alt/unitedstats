import Link from "next/link";
import type { OpponentRecord } from "@/lib/queries";
import { ClubBadge } from "@/components/ClubBadge";

/**
 * The whole fixture landscape as one object: every opponent a point, placed by
 * how *often* we've played them (x) and how *well* we fare (y, win rate). A
 * dashed line marks break-even — the one baseline that means anything for a
 * head-to-head (do we win more than we lose?) — drawn through the geometry so
 * "above it / below it" is literal, not asserted. Dots tint by which side of the
 * line they fall and fade with rarity, so the giants read as the solid marks; the
 * most-played rivalries carry their crest.
 *
 * The story is the right-hand side: almost every club we've played hundreds of
 * times sits near the line (football is hard), but two stand apart — the rival we
 * dominate (upper right) and the one we play most yet beat least (lower right, the
 * nemesis). Pure positioned HTML, not SVG: circles stay round and crisp at any
 * width, where a non-uniformly-scaled SVG would squash them into ellipses.
 */
export function OpponentRivalryMap({
  opponents,
  featured,
}: {
  opponents: OpponentRecord[];
  /** Opponent ids to always crest and emphasise; the rest fade back to context. */
  featured?: string[];
}) {
  const rows = opponents.filter((o) => o.p > 0);
  if (rows.length === 0) return null;
  const featuredSet = new Set(featured ?? []);

  const maxP = Math.max(...rows.map((o) => o.p));
  // Inset the scales so edge points (and their crests) never clip.
  const PAD_X = 3;
  const PAD_Y = 8;
  const xOf = (p: number) => PAD_X + (p / maxP) * (100 - 2 * PAD_X);
  const yOf = (winRate: number) => PAD_Y + ((100 - winRate) / 100) * (100 - 2 * PAD_Y);

  // Crest the most-played rivalries, but greedily skip any that would land on top
  // of an already-placed crest — so the labels never pile up where the data
  // clusters (Chelsea ≈ City, Everton ≈ Spurs). Data-driven, no DOM measurement.
  const MIN_DIST = 6; // plot-% between two crests
  const named = new Set<string>();
  const placed: { x: number; y: number }[] = [];
  // Featured rivals are the subject: always crested, collision rules waived.
  if (featuredSet.size > 0) {
    for (const o of rows) {
      if (!featuredSet.has(o.id)) continue;
      named.add(o.id);
      placed.push({ x: xOf(o.p), y: yOf((100 * o.w) / o.p) });
    }
  } else {
    // Otherwise crest the most-played, greedily skipping any that would collide.
    for (const o of [...rows].sort((a, b) => b.p - a.p)) {
      if (named.size >= 10) break;
      const x = xOf(o.p);
      const y = yOf((100 * o.w) / o.p);
      if (placed.some((q) => Math.hypot(q.x - x, q.y - y) < MIN_DIST)) continue;
      named.add(o.id);
      placed.push({ x, y });
    }
  }

  const xTicks = [50, 100, 150, 200].filter((n) => n <= maxP);

  return (
    <figure className="m-0">
      <div className="relative h-64 w-full sm:h-80">
        {/* break-even baseline — the only honest reference for a head-to-head */}
        <div className="absolute inset-x-0 border-t border-dashed border-ink-faint/60" style={{ top: `${yOf(50)}%` }} aria-hidden />
        <span className="absolute right-1 -translate-y-full pb-0.5 text-[10px] text-ink-faint" style={{ top: `${yOf(50)}%` }}>
          break even
        </span>
        {/* corner orientation labels — win up, lose down */}
        <span className="absolute left-0 top-0 text-[10px] uppercase tracking-wider text-win/70">Win more</span>
        <span className="absolute bottom-4 left-0 text-[10px] uppercase tracking-wider text-loss/70">Lose more</span>
        {/* x guides */}
        {xTicks.map((n) => (
          <div key={n} className="absolute bottom-0 top-0 w-px bg-line/25" style={{ left: `${xOf(n)}%` }} aria-hidden />
        ))}

        {/* every opponent as a dot; tint by side of break-even, fade by rarity */}
        {rows.map((o) => {
          if (named.has(o.id)) return null; // crest drawn below
          const winRate = (100 * o.w) / o.p;
          const size = Math.max(4, Math.min(14, Math.sqrt(o.p) * 1.1));
          // With a featured subject, push the rest of the landscape back to context.
          const op = (0.16 + 0.6 * (o.p / maxP)) * (featuredSet.size > 0 ? 0.45 : 1);
          const ahead = o.w >= o.l;
          return (
            <span
              key={o.id}
              title={`${o.name} · ${o.p} played · ${Math.round(winRate)}% win`}
              className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full ${ahead ? "bg-win" : "bg-loss"}`}
              style={{ left: `${xOf(o.p)}%`, top: `${yOf(winRate)}%`, width: size, height: size, opacity: op }}
              aria-hidden
            />
          );
        })}

        {/* the named rivalries: a linked crest sitting on its point */}
        {rows
          .filter((o) => named.has(o.id))
          .map((o) => {
            const winRate = (100 * o.w) / o.p;
            return (
              <Link
                key={o.id}
                href={`/opponent/${o.id}`}
                title={`${o.name} · ${o.p} played · ${Math.round(winRate)}% win`}
                className="group absolute z-10 -translate-x-1/2 -translate-y-1/2 focus-ring"
                style={{ left: `${xOf(o.p)}%`, top: `${yOf(winRate)}%` }}
              >
                <span className="block transition-transform duration-150 group-hover:z-20 group-hover:scale-110">
                  <ClubBadge id={o.id} name={o.name} size="sm" />
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
        <span className="absolute right-0 text-[10px] text-ink-faint">times played →</span>
      </div>

      <figcaption className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-line/70 pt-3 text-[11px] text-ink-faint">
        <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-win" />Winning record</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-loss" />Losing record</span>
        <span className="text-ink-dim">Right = played more often · up = higher win rate · dot size and strength track meetings</span>
      </figcaption>
    </figure>
  );
}
