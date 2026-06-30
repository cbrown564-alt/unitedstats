"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Column, DataTable, type SortDirection } from "./DataTable";
import { fmtNum } from "@/lib/format";

export type SeasonSplit = {
  season: string;
  apps: number;
  starts: number;
  goals: number;
  assists: number;
};

type SeasonSortKey = "season" | "apps" | "starts" | "goals" | "assists" | "ga";

const SEASON_SORT_DEFAULTS: Record<SeasonSortKey, SortDirection> = {
  season: "asc",
  apps: "desc",
  starts: "desc",
  goals: "desc",
  assists: "desc",
  ga: "desc",
};

const SEASON_SORT_LABELS: Record<SeasonSortKey, string> = {
  season: "Season",
  apps: "Apps",
  starts: "Starts",
  goals: "Goals",
  assists: "Assists",
  ga: "goals + assists",
};

function compareSeasons(a: SeasonSplit, b: SeasonSplit, key: SeasonSortKey, dir: SortDirection): number {
  const n = (x: number, y: number) => (dir === "asc" ? x - y : y - x);
  const ga = (s: SeasonSplit) => s.goals + s.assists;
  const primary =
    key === "season" ? (dir === "asc" ? a.season.localeCompare(b.season) : b.season.localeCompare(a.season))
    : key === "apps" ? n(a.apps, b.apps)
    : key === "starts" ? n(a.starts, b.starts)
    : key === "goals" ? n(a.goals, b.goals)
    : key === "assists" ? n(a.assists, b.assists)
    : n(ga(a), ga(b));
  // Stable, readable tiebreak: oldest season first.
  return primary || a.season.localeCompare(b.season);
}

/**
 * Season-by-season table with client-side sorting. The page is statically
 * prerendered (no `searchParams` on the server); this island owns the column
 * definitions (their `render` functions can't cross the server boundary) and
 * sorts in place. The active sort hydrates from and reflects to the URL
 * (`?sort`/`?dir`) via `history.replaceState`, keeping deep links shareable
 * without a server round-trip.
 */
export function PlayerSeasonTable({ seasons, playerName }: { seasons: SeasonSplit[]; playerName: string }) {
  const [sortKey, setSortKey] = useState<SeasonSortKey>("season");
  const [sortDir, setSortDir] = useState<SortDirection>("asc");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const k = params.get("sort");
    if (k && Object.hasOwn(SEASON_SORT_DEFAULTS, k)) {
      const key = k as SeasonSortKey;
      const d = params.get("dir");
      const dir = d === "asc" || d === "desc" ? d : SEASON_SORT_DEFAULTS[key];
      const frame = window.requestAnimationFrame(() => {
        setSortKey(key);
        setSortDir(dir);
      });
      return () => window.cancelAnimationFrame(frame);
    }
  }, []);

  function onSort(key: string, dir: SortDirection) {
    setSortKey(key as SeasonSortKey);
    setSortDir(dir);
    const url = new URL(window.location.href);
    url.searchParams.set("sort", key);
    url.searchParams.set("dir", dir);
    url.hash = "seasons";
    window.history.replaceState(null, "", url);
  }

  const rows = [...seasons].sort((a, b) => compareSeasons(a, b, sortKey, sortDir));

  const columns: Column<SeasonSplit>[] = [
    {
      label: "Season",
      key: "season",
      sortKey: "season",
      sortDefaultDirection: SEASON_SORT_DEFAULTS.season,
      card: "identity",
      render: (s) => (
        <Link href={`/seasons/${s.season}`} className="font-medium text-ink hover:text-devil-bright">
          {s.season}
        </Link>
      ),
    },
    {
      label: "Apps",
      key: "apps",
      numeric: true,
      sortKey: "apps",
      sortDefaultDirection: SEASON_SORT_DEFAULTS.apps,
      card: "metric",
      render: (s) => (s.apps ? fmtNum(s.apps) : "—"),
    },
    {
      label: "Starts",
      key: "starts",
      numeric: true,
      hideBelow: "hidden sm:table-cell",
      sortKey: "starts",
      sortDefaultDirection: SEASON_SORT_DEFAULTS.starts,
      card: "metric",
      cardLabel: "Starts",
      render: (s) => (s.starts ? fmtNum(s.starts) : "—"),
    },
    {
      label: "Goals",
      key: "goals",
      numeric: true,
      sortKey: "goals",
      sortDefaultDirection: SEASON_SORT_DEFAULTS.goals,
      card: "metric",
      render: (s) => (
        <span className={s.goals > 0 ? "text-devil-bright" : "text-ink-faint"}>{s.goals || "—"}</span>
      ),
    },
    {
      label: "Assists",
      key: "assists",
      numeric: true,
      hideBelow: "hidden sm:table-cell",
      sortKey: "assists",
      sortDefaultDirection: SEASON_SORT_DEFAULTS.assists,
      card: "metric",
      render: (s) => (
        <span className={s.assists > 0 ? "text-gold" : "text-ink-faint"}>{s.assists || "—"}</span>
      ),
    },
    {
      label: "G+A",
      key: "ga",
      numeric: true,
      sortKey: "ga",
      sortDefaultDirection: SEASON_SORT_DEFAULTS.ga,
      sortLabel: "goals plus assists",
      card: "metric",
      render: (s) => (s.goals + s.assists > 0 ? fmtNum(s.goals + s.assists) : "—"),
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={rows}
      rowKey={(s) => s.season}
      density="compact"
      registerCards
      registerLayout="metrics"
      caption={`${playerName} season-by-season apps, goals, and assists`}
      sort={{ key: sortKey, direction: sortDir, onSort }}
      summary={
        <>
          <span>{fmtNum(seasons.length)} recorded seasons</span>
          <span>
            Sorted by{" "}
            <span className="font-semibold text-ink">{SEASON_SORT_LABELS[sortKey]}</span>,{" "}
            {sortDir === "asc" ? "ascending" : "descending"}
          </span>
        </>
      }
    />
  );
}
