"use client";

import Link from "next/link";
import { useState } from "react";
import { familyName } from "@/lib/names";
import type { PlayerTotals } from "@/lib/queries";
import { CareerSpanBar } from "@/components/charts/CareerSpanBar";
import { PlayerPortrait } from "@/components/PlayerPortrait";
import { fmtNum, fmtYearRange } from "@/lib/format";

function firstYearForPlayer(p: PlayerTotals): number {
  return p.first_year ?? (p.first_date ? Number(p.first_date.slice(0, 4)) : 1886);
}

function lastYearForPlayer(p: PlayerTotals): number {
  return p.last_year ?? (p.last_date ? Number(p.last_date.slice(0, 4)) : firstYearForPlayer(p));
}

/**
 * The whole playing history as one object: every player a point, placed by how
 * long he stayed (x, appearances) and how much he scored (y, goals). Hover
 * career-span card and click-through to each player page.
 */
export function PlayerGreatnessMap({ players }: { players: PlayerTotals[] }) {
  const [hovered, setHovered] = useState<PlayerTotals | null>(null);
  const rows = players.filter((p) => (p.apps ?? 0) > 0);
  if (rows.length === 0) return null;

  const maxApps = Math.max(...rows.map((p) => p.apps ?? 0));
  const maxGoals = Math.max(...rows.map((p) => p.goals));
  const axisStart = Math.min(...rows.map(firstYearForPlayer));
  const axisEnd = Math.max(...rows.map(lastYearForPlayer));
  const PAD = 7;
  const xOf = (apps: number) => PAD + (apps / maxApps) * (100 - 2 * PAD);
  const yOf = (goals: number) => PAD + ((maxGoals - goals) / maxGoals) * (100 - 2 * PAD);

  const topScorers = [...rows].sort((a, b) => b.goals - a.goals).slice(0, 12);
  const topServants = [...rows].sort((a, b) => (b.apps ?? 0) - (a.apps ?? 0)).slice(0, 8);
  const pool = [...topScorers, ...topServants.filter((p) => !topScorers.includes(p))];

  const X_GAP = 11;
  const Y_GAP = 17;
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

  const xTicks = [200, 400, 600, 800].filter((n) => n <= maxApps && xOf(n) < 72);
  const yTicks = [50, 100, 150, 200, 250].filter((n) => n <= maxGoals);

  const hoverPoint = hovered
    ? { x: xOf(hovered.apps ?? 0), y: yOf(hovered.goals) }
    : null;

  return (
    <figure className="m-0">
      <div className="relative h-72 w-full sm:h-80">
        {yTicks.map((g) => (
          <div key={g} className="absolute inset-x-0 border-t border-line/20" style={{ top: `${yOf(g)}%` }} aria-hidden>
            <span className="stat-num absolute left-0 -translate-y-1/2 bg-panel/70 pr-1 text-[10px] text-ink-faint">{g}</span>
          </div>
        ))}
        {xTicks.map((n) => (
          <div key={n} className="absolute bottom-0 top-0 w-px bg-line/15" style={{ left: `${xOf(n)}%` }} aria-hidden />
        ))}
        <span className="absolute left-0 top-0 text-[10px] uppercase tracking-wider text-ink-faint">goals ↑</span>

        {rows.map((p) => {
          if (namedIds.has(p.player_id)) return null;
          const apps = p.apps ?? 0;
          const size = Math.max(3, Math.min(11, Math.sqrt(apps) * 0.7));
          return (
            <Link
              key={p.player_id}
              href={`/player/${p.player_id}`}
              title={`${p.name} · ${apps} apps · ${p.goals} goals`}
              className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full bg-devil-bright/55 focus-ring"
              style={{
                left: `${xOf(apps)}%`,
                top: `${yOf(p.goals)}%`,
                width: size,
                height: size,
              }}
              onMouseEnter={() => setHovered(p)}
              onMouseLeave={() => setHovered((h) => (h?.player_id === p.player_id ? null : h))}
              onFocus={() => setHovered(p)}
              onBlur={() => setHovered((h) => (h?.player_id === p.player_id ? null : h))}
            />
          );
        })}

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
              onMouseEnter={() => setHovered(p)}
              onMouseLeave={() => setHovered((h) => (h?.player_id === p.player_id ? null : h))}
              onFocus={() => setHovered(p)}
              onBlur={() => setHovered((h) => (h?.player_id === p.player_id ? null : h))}
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

        {hovered && hoverPoint && (
          <div
            className="pointer-events-none absolute z-20 w-44 rounded-lg border border-line bg-panel p-2.5 shadow-[0_12px_28px_rgb(0_0_0_/0.35)]"
            style={{
              left: `${Math.min(Math.max(hoverPoint.x, 18), 82)}%`,
              top: `${Math.max(hoverPoint.y - 14, 8)}%`,
              transform: "translate(-50%, -100%)",
            }}
          >
            <div className="flex items-center gap-2">
              <PlayerPortrait name={hovered.name} src={hovered.player_thumb_url ?? hovered.player_image_url} size="xs" />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium leading-tight">{hovered.name}</p>
                <p className="stat-num text-[11px] text-ink-faint">
                  {fmtNum(hovered.apps || 0)} apps · {fmtNum(hovered.goals)} goals
                </p>
              </div>
            </div>
            <div className="mt-2">
              <CareerSpanBar
                first={firstYearForPlayer(hovered)}
                last={lastYearForPlayer(hovered)}
                axisStart={axisStart}
                axisEnd={axisEnd}
                label={`Career ${fmtYearRange(firstYearForPlayer(hovered), lastYearForPlayer(hovered))}`}
                caption={fmtYearRange(firstYearForPlayer(hovered), lastYearForPlayer(hovered))}
              />
            </div>
          </div>
        )}
      </div>

      <div className="relative mt-1 h-3.5">
        {xTicks.map((n) => (
          <span key={n} className="stat-num absolute -translate-x-1/2 text-[10px] text-ink-faint" style={{ left: `${xOf(n)}%` }}>
            {n}
          </span>
        ))}
        <span className="absolute right-0 text-[10px] text-ink-faint">appearances →</span>
      </div>

      <figcaption className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-line/70 pt-3 text-[11px] text-ink-faint">
        <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-devil-bright/55" />A player</span>
        <span className="text-ink-dim">
          Right = more appearances · up = more goals · hover for career span · click through to the player
        </span>
      </figcaption>
    </figure>
  );
}
