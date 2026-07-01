"use client";

import Link from "next/link";
import { useState } from "react";
import { DataTable, type SortDirection } from "@/components/DataTable";
import { CareerSpanBar } from "@/components/charts/CareerSpanBar";
import { PlayerPortrait } from "@/components/PlayerPortrait";
import { PositionTag } from "@/components/PositionTag";
import { ShirtBadge } from "@/components/ShirtBadge";
import { fmtNum, fmtYearRange } from "@/lib/format";
import type { PlayerTotals } from "@/lib/queries";

type PlayerSortKey = "name" | "shirt" | "apps" | "starts" | "goals" | "assists" | "span";

const ASSIST_COVERAGE_FROM_YEAR = 1987;

const PLAYER_SORT_DEFAULTS: Record<PlayerSortKey, SortDirection> = {
  name: "asc",
  shirt: "asc",
  apps: "desc",
  starts: "desc",
  goals: "desc",
  assists: "desc",
  span: "asc",
};

const PLAYER_SORT_LABELS: Record<PlayerSortKey, string> = {
  name: "Player",
  shirt: "No.",
  apps: "Apps",
  starts: "Starts",
  goals: "Goals",
  assists: "Assists",
  span: "Career Span",
};

function lastYearForPlayer(p: PlayerTotals): number | null {
  return p.last_year ?? (p.last_date ? Number(p.last_date.slice(0, 4)) : null);
}

function spanForPlayer(p: PlayerTotals): string {
  const first = p.first_year ?? (p.first_date ? Number(p.first_date.slice(0, 4)) : null);
  const last = lastYearForPlayer(p);
  return fmtYearRange(first, last);
}

export function PlayersRegisterTable({
  visiblePlayers,
  playersCount,
  allPlayersCount,
  activeFilters,
  sortKey,
  sortDirection,
  rawQuery,
  spanByPlayer,
  sparkAxisStart,
  sparkAxisEnd,
}: {
  visiblePlayers: PlayerTotals[];
  playersCount: number;
  allPlayersCount: number;
  activeFilters: boolean;
  sortKey: PlayerSortKey;
  sortDirection: SortDirection;
  rawQuery: string;
  spanByPlayer: Record<string, { first: number; last: number }>;
  sparkAxisStart: number;
  sparkAxisEnd: number;
}) {
  const [showAssists, setShowAssists] = useState(false);

  function sortHref(nextSortKey: string, nextDirection: SortDirection) {
    const params = new URLSearchParams();
    if (rawQuery) params.set("q", rawQuery);
    params.set("sort", nextSortKey);
    params.set("dir", nextDirection);
    return `/players?${params.toString()}`;
  }

  const assistColumn = {
    label: "Assists",
    key: "assists",
    numeric: true,
    hideBelow: showAssists ? undefined : "hidden",
    sortKey: "assists",
    sortDefaultDirection: PLAYER_SORT_DEFAULTS.assists,
    sortLabel: "assists",
    render: (p: PlayerTotals) => {
      const last = lastYearForPlayer(p);
      if (last != null && last < ASSIST_COVERAGE_FROM_YEAR) {
        return <span className="text-ink-faint" title="Assists not recorded before 1987-88">–</span>;
      }
      return <span className="text-ink-dim">{p.assists || "0"}</span>;
    },
    cardRender: (p: PlayerTotals) => {
      const last = lastYearForPlayer(p);
      if (last != null && last < ASSIST_COVERAGE_FROM_YEAR) {
        return <span className="text-ink-faint" title="Assists not recorded before 1987-88">–</span>;
      }
      return fmtNum(p.assists || 0);
    },
  };

  return (
    <>
      <div className="-mt-1 mb-1.5 flex justify-end">
        <AssistsSwitch checked={showAssists} onChange={setShowAssists} />
      </div>

      <DataTable
        className="data-table-fit"
        registerCards
        registerLayout="leaderboard"
        registerHref={(p) => `/player/${p.player_id}`}
        registerSubline={(p) => `${fmtNum(p.apps || 0)} apps · ${spanForPlayer(p)}`}
        registerFigureTone={(key) =>
          key === "goals" ? "text-devil-bright" : key === "assists" ? "text-gold" : "text-ink"
        }
        rows={visiblePlayers}
        rowKey={(p) => p.player_id}
        caption="Manchester United player totals"
        summary={
          <>
            <span>
              <span className="stat-num text-ink">{fmtNum(visiblePlayers.length)}</span> shown{" "}
              {activeFilters
                ? `of ${fmtNum(playersCount)} matching`
                : `of ${fmtNum(allPlayersCount)} players`}
            </span>
            <span>
              Sorted by <span className="font-semibold text-ink">{PLAYER_SORT_LABELS[sortKey]}</span>,{" "}
              {sortDirection === "asc" ? "ascending" : "descending"}
            </span>
          </>
        }
        emptyState={
          activeFilters ? (
            <span>No players match your search.</span>
          ) : (
            "No players are available."
          )
        }
        sort={{
          key: sortKey,
          direction: sortDirection,
          hrefFor: sortHref,
        }}
        columns={[
          {
            label: "#",
            key: "rank",
            numeric: true,
            card: "skip",
            className: "w-8 px-0 text-center",
            headerClassName: "w-8 px-0 text-center",
            render: (_p, index) => <span className="text-ink-faint">{index + 1}</span>,
          },
          {
            label: "No.",
            key: "shirt",
            numeric: true,
            hideBelow: "hidden sm:table-cell",
            sortKey: "shirt",
            sortDefaultDirection: PLAYER_SORT_DEFAULTS.shirt,
            sortLabel: "primary shirt number",
            card: "skip",
            render: (p) => (
              <ShirtBadge
                number={p.primary_shirt}
                decade={p.primary_shirt_decade}
                apps={p.primary_shirt_apps}
                compact
              />
            ),
            cardRender: (p) => (p.primary_shirt != null ? String(p.primary_shirt) : "—"),
          },
          {
            label: "Player",
            key: "name",
            sortKey: "name",
            sortDefaultDirection: PLAYER_SORT_DEFAULTS.name,
            card: "identity",
            render: (p) => (
              <div className="flex items-center gap-2.5">
                <PositionTag bucket={p.position_bucket} title={p.position_label} />
                <Link href={`/player/${p.player_id}`} className="flex min-w-0 items-center gap-3 font-medium hover:text-devil-bright">
                  <PlayerPortrait name={p.name} src={p.player_thumb_url ?? p.player_image_url} />
                  <span className="min-w-0 break-words leading-snug line-clamp-2 sm:line-clamp-none">{p.name}</span>
                </Link>
              </div>
            ),
            cardRender: (p) => (
              <span className="flex min-w-0 items-center gap-2.5">
                <PlayerPortrait name={p.name} src={p.player_thumb_url ?? p.player_image_url} size="xs" />
                <span className="flex min-w-0 items-center gap-1.5">
                  <PositionTag bucket={p.position_bucket} title={p.position_label} />
                  <span className="truncate text-sm font-medium leading-tight">{p.name}</span>
                </span>
              </span>
            ),
          },
          {
            label: "Goals",
            key: "goals",
            numeric: true,
            sortKey: "goals",
            sortDefaultDirection: PLAYER_SORT_DEFAULTS.goals,
            card: "figure",
            render: (p) => (
              <div className="flex flex-col items-end leading-tight">
                <span className="text-sm font-semibold text-devil-bright">{p.goals}</span>
                {p.goals > 0 && (p.apps || 0) > 0 && (
                  <span className="text-[10px] font-normal text-ink-faint">{(p.goals / p.apps).toFixed(2)}/g</span>
                )}
              </div>
            ),
            cardRender: (p) => fmtNum(p.goals),
          },
          {
            label: "Apps",
            key: "apps",
            numeric: true,
            hideBelow: "hidden sm:table-cell",
            sortKey: "apps",
            sortDefaultDirection: PLAYER_SORT_DEFAULTS.apps,
            render: (p) => (
              <div className="flex flex-col items-end leading-tight">
                <span className="text-sm">{p.apps || "0"}</span>
                {(p.apps || 0) > 0 && (
                  <span className="text-[10px] text-ink-faint">{Math.round((p.starts / p.apps) * 100)}% st</span>
                )}
              </div>
            ),
            cardRender: (p) => fmtNum(p.apps || 0),
          },
          assistColumn,
          {
            label: "Career Span",
            key: "span",
            hideBelow: "hidden lg:table-cell",
            headerClassName: "text-right",
            className: "text-right",
            sortKey: "span",
            sortDefaultDirection: PLAYER_SORT_DEFAULTS.span,
            sortLabel: "career span",
            cardRender: (p) => spanForPlayer(p),
            render: (p) => {
              const s = spanByPlayer[p.player_id];
              if (!s) {
                return (
                  <div className="flex justify-end">
                    <span className="text-ink-dim">{spanForPlayer(p)}</span>
                  </div>
                );
              }
              return (
                <div className="flex justify-end">
                  <div className="w-[140px] max-w-full">
                    <CareerSpanBar
                      first={s.first}
                      last={s.last}
                      axisStart={sparkAxisStart}
                      axisEnd={sparkAxisEnd}
                      label={`Career ${fmtYearRange(s.first, s.last)}`}
                      caption={fmtYearRange(s.first, s.last)}
                    />
                  </div>
                </div>
              );
            },
          },
        ]}
      />
    </>
  );
}

function AssistsSwitch({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label="Assists column"
      onClick={() => onChange(!checked)}
      className="inline-flex items-center gap-1 rounded-sm py-px focus-ring"
    >
      <span
        className={`text-[8px] uppercase tracking-[0.16em] transition-colors ${
          checked ? "text-ink-dim" : "text-ink-faint"
        }`}
      >
        Assists
      </span>
      <span
        className={`relative h-2.5 w-[1.125rem] shrink-0 rounded-full transition-colors duration-200 ${
          checked ? "bg-devil/45" : "bg-line"
        }`}
        aria-hidden
      >
        <span
          className={`absolute top-0.5 left-0.5 h-1.5 w-1.5 rounded-full bg-ink-faint shadow-[0_0_0_0.5px_rgb(0_0_0_/0.25)] transition-transform duration-200 ${
            checked ? "translate-x-[0.375rem] bg-ink" : ""
          }`}
        />
      </span>
    </button>
  );
}
