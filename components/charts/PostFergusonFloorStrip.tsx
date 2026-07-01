import Link from "next/link";
import type {
  PostFergusonInterimMarker,
  PostFergusonManagerBand,
  PostFergusonSeasonBar,
} from "@/lib/trails";

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0]);
}

/**
 * The post-Ferguson table, season by season — one bar per campaign, grouped into
 * manager bands with interim handovers marked at the breaks. Height is league
 * finish (taller is better); gold is a title. Built like {@link HistorySkyline}:
 * pure flex, server-rendered, every bar opens that season.
 */
export function PostFergusonFloorStrip({
  seasons,
  bands,
  interims,
}: {
  seasons: PostFergusonSeasonBar[];
  bands: PostFergusonManagerBand[];
  interims: PostFergusonInterimMarker[];
}) {
  if (seasons.length === 0) return null;

  const n = seasons.length;
  const maxPos = Math.max(20, ...seasons.map((s) => s.leagueSize));
  const topFourY = ((4 - 1) / (maxPos - 1)) * 100;
  const barHeight = (position: number) => ((maxPos - position + 1) / maxPos) * 100;

  const bandStyle = (fromIndex: number, count: number) => ({
    left: `${(fromIndex / n) * 100}%`,
    width: `${(count / n) * 100}%`,
  });

  const interimLeft = (afterIndex: number) => `${((afterIndex + 0.5) / n) * 100}%`;

  return (
    <figure className="m-0">
      <div className="relative mb-1 h-8">
        {bands.map((b) => (
          <Link
            key={`${b.managerId}-${b.fromIndex}`}
            href={`/manager/${b.managerId}`}
            className="absolute top-0 flex h-full items-end border-l border-line/50 px-1 pb-0.5 text-[10px] font-medium text-ink-dim transition-colors hover:text-devil-bright first:border-l-0"
            style={bandStyle(b.fromIndex, b.count)}
          >
            <span className="truncate">{b.label}</span>
          </Link>
        ))}
      </div>

      <div className="relative h-44 w-full sm:h-48">
        <div className="absolute inset-x-0 bottom-0 border-t border-line/70" aria-hidden />
        <div
          className="absolute inset-x-0 border-t border-dashed border-win/25"
          style={{ bottom: `${topFourY}%` }}
          aria-hidden
        />
        <span
          className="absolute right-0 text-[10px] uppercase tracking-[0.12em] text-win/60"
          style={{ bottom: `${topFourY}%`, transform: "translateY(-120%)" }}
        >
          Top four
        </span>

        {interims.map((g) => (
          <div
            key={`${g.managerId}-${g.afterIndex}`}
            className="pointer-events-none absolute bottom-0 top-0 z-20 flex -translate-x-1/2 flex-col items-center"
            style={{ left: interimLeft(g.afterIndex) }}
          >
            <div className="h-full w-px border-l border-dashed border-ink-faint/80" aria-hidden />
            <span className="mt-1 max-w-[3.5rem] truncate text-center text-[9px] uppercase tracking-wide text-ink-faint">
              {g.label}
            </span>
          </div>
        ))}

        <div className="absolute inset-0 flex items-stretch">
          {seasons.map((s) => {
            const h = barHeight(s.position);
            const fill = s.champion
              ? "bg-gold"
              : s.position <= 4
                ? "bg-europe/85"
                : s.position >= 8
                  ? "bg-loss/80"
                  : "bg-ink-dim/75";
            const title = `${s.season} · ${s.champion ? "Champions" : ordinal(s.position)} · ${s.managerName}`;
            return (
              <Link
                key={s.season}
                href={`/matches?season=${s.season}&sort=oldest`}
                title={title}
                aria-label={title}
                className="group relative min-w-0 flex-1 focus-ring"
              >
                <div
                  className={`absolute inset-x-0 bottom-0 rounded-t-[2px] transition-[filter] duration-150 group-hover:brightness-125 ${fill}`}
                  style={{ height: `${h}%` }}
                />
                <span className="stat-num pointer-events-none absolute bottom-full left-1/2 mb-1 hidden -translate-x-1/2 text-[9px] text-ink-faint group-hover:block sm:block">
                  &apos;{s.season.slice(5)}
                </span>
              </Link>
            );
          })}
        </div>

        <Link
          href="/matches?from=2013-05-20&sort=date-asc"
          aria-label="Browse every match since Ferguson"
          className="absolute inset-0 z-10 focus-ring sm:hidden"
        />
      </div>

      <figcaption className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-line/70 pt-3 text-[11px] text-ink-faint">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-gold" />
          Title
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-europe/85" />
          Top four
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-loss/80" />
          8th or worse
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-px border-l border-dashed border-ink-faint" />
          Interim handover
        </span>
        <span className="text-ink-dim">
          <span className="sm:hidden">Tap to open matches since Ferguson</span>
          <span className="hidden sm:inline">Every bar opens that season · dashed marks are caretaker spells between tenures</span>
        </span>
      </figcaption>
    </figure>
  );
}
