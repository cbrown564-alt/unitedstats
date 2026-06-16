import Link from "next/link";
import { PlayerPortrait } from "@/components/PlayerPortrait";

export interface CupLeanRow {
  player_id: string;
  name: string;
  total: number;
  cup_goals: number;
  league_goals: number;
  thumb_url?: string | null;
  image_url?: string | null;
}

/**
 * A cup-lean ladder. Every row is plotted on the same 0→100% cup-share axis, so
 * the club's baseline cup rate can be drawn as one vertical line straight down
 * the stack: the gold that spills *past* that line is the story — the goals a
 * player saved for cup nights. The solid gold run is the player's cup goals; the
 * club line is the reference it has to clear, and clearing it is the whole point.
 */
export function CupLeanBar({
  rows,
  baseline,
}: {
  rows: CupLeanRow[];
  baseline: number; // club-wide cup share, 0–1
}) {
  const basePct = baseline * 100;

  return (
    <div>
      {/* Shared axis: the club rate, marked once at the top and tracked down every
          row. Same column template as the rows, so the markers sit over the bars. */}
      <div className="mb-1.5 grid grid-cols-[10.5rem_minmax(0,1fr)_3.75rem] gap-3 sm:grid-cols-[13rem_minmax(0,1fr)_4.25rem]">
        <div />
        <div className="relative h-3.5 text-[10px] text-ink-faint">
          <span className="stat-num absolute left-0 bottom-0">0%</span>
          <span className="stat-num absolute right-0 bottom-0">100%</span>
          <span
            className="absolute bottom-0 -translate-x-1/2 whitespace-nowrap font-medium text-devil-bright"
            style={{ left: `${basePct}%` }}
          >
            club rate {basePct.toFixed(0)}%
          </span>
        </div>
        <div />
      </div>

      <div className="relative">
        <div className="space-y-2">
        {rows.map((p, i) => {
          const share = p.cup_goals / p.total;
          const sharePct = share * 100;
          const mult = share / baseline;
          return (
            <div
              key={p.player_id}
              className="grid grid-cols-[8.5rem_minmax(0,1fr)_3.75rem] items-center gap-3 sm:grid-cols-[11rem_minmax(0,1fr)_4.25rem]"
            >
              <Link
                href={`/player/${p.player_id}`}
                title={p.name}
                className="flex items-center gap-2 truncate text-sm font-medium hover:text-devil-bright"
              >
                <span className="stat-num w-3 shrink-0 text-right text-[11px] text-ink-faint">{i + 1}</span>
                <PlayerPortrait name={p.name} src={p.thumb_url ?? p.image_url} size="xs" />
                <span className="truncate">{p.name}</span>
              </Link>

              <div
                className="relative h-6 w-full overflow-hidden rounded-md bg-panel-2 ring-1 ring-inset ring-line"
                role="img"
                aria-label={`${p.name}: ${p.cup_goals} cup goals, ${p.league_goals} league goals, ${sharePct.toFixed(0)}% in cups — ${mult.toFixed(1)} times the club rate`}
              >
                {/* Cup goals — the gold run that has to clear the club line. */}
                <div
                  className="absolute inset-y-0 left-0 flex items-center bg-gold"
                  style={{ width: `${sharePct}%` }}
                >
                  <span className="stat-num truncate px-1.5 text-[11px] font-semibold leading-none text-pitch">
                    {p.cup_goals}
                  </span>
                </div>
                {/* League goals fill the remainder of the track. */}
                <div
                  className="absolute inset-y-0 right-0 flex items-center justify-end"
                  style={{ width: `${100 - sharePct}%` }}
                >
                  <span className="stat-num truncate px-1.5 text-[11px] leading-none text-ink-dim">
                    {p.league_goals}
                  </span>
                </div>
              </div>

              <div className="text-right leading-none">
                <div className="stat-num text-base font-semibold text-gold">{mult.toFixed(1)}×</div>
                <div className="stat-num mt-0.5 text-[10px] text-ink-faint">{sharePct.toFixed(0)}%</div>
              </div>
            </div>
          );
        })}
        </div>

        {/* One continuous club-rate line laid over the whole stack, aligned to the
            bar column by reusing the row grid so it runs unbroken through the gaps. */}
        <div className="pointer-events-none absolute inset-0 grid grid-cols-[10.5rem_minmax(0,1fr)_3.75rem] gap-3 sm:grid-cols-[13rem_minmax(0,1fr)_4.25rem]">
          <div />
          <div className="relative">
            <div
              className="absolute inset-y-0 w-0.5 -translate-x-1/2 bg-devil-bright"
              style={{ left: `${basePct}%` }}
            />
          </div>
          <div />
        </div>
      </div>
    </div>
  );
}
