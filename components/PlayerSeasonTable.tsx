"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { TrophyIcon } from "@/components/CampaignIcons";
import { Column, DataTable, type SortDirection } from "./DataTable";
import { fmtNum, fmtSeasonShort } from "@/lib/format";
import { seasonDecade, showSeasonDecadeHeaders, type SeasonSplit } from "@/lib/playerSeasonHighlights";

export type { SeasonSplit };

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
  return primary || a.season.localeCompare(b.season);
}

function StatMicroBar({
  value,
  max,
  tone,
  barColor,
}: {
  value: number;
  max: number;
  tone: string;
  barColor: string;
}) {
  if (!value) return <span className="text-ink-faint">—</span>;
  const pct = max > 0 ? Math.max(8, (100 * value) / max) : 0;
  return (
    <div className="player-season-stat-cell ml-auto flex min-w-[3.25rem] max-w-[5rem] flex-col items-end gap-1">
      <span className={tone}>{fmtNum(value)}</span>
      <span
        className="player-season-stat-bar h-1 w-full overflow-hidden rounded-full bg-panel-2 ring-1 ring-inset ring-line/60"
        aria-hidden
      >
        <span className="block h-full rounded-full" style={{ width: `${pct}%`, background: barColor }} />
      </span>
    </div>
  );
}

function PeakBadge({ label, tone }: { label: string; tone: "goals" | "assists" }) {
  return (
    <span
      className={`text-[10px] font-semibold uppercase tracking-wide ${
        tone === "goals" ? "text-devil-bright/90" : "text-gold"
      }`}
    >
      {label}
    </span>
  );
}

function seasonPeakRowClass(season: string, goalPeaks: Set<string>, assistPeaks: Set<string>) {
  const g = goalPeaks.has(season);
  const a = assistPeaks.has(season);
  if (g && a) return "player-season-row--peak-ga";
  if (g) return "player-season-row--peak-g";
  if (a) return "player-season-row--peak-a";
  return undefined;
}

function seasonPeakMobileClass(season: string, goalPeaks: Set<string>, assistPeaks: Set<string>) {
  const g = goalPeaks.has(season);
  const a = assistPeaks.has(season);
  if (g && a) return "bg-devil/[0.04] ring-1 ring-inset ring-gold/25";
  if (g) return "bg-devil/[0.04]";
  if (a) return "bg-gold/[0.08]";
  return "";
}

function SeasonDecadeHeader({ decade }: { decade: number }) {
  return (
    <tr className="player-season-decade-row">
      <td colSpan={6} className="!border-b !border-line/70 !bg-pitch/50 !py-2 !pl-3">
        <span className="display text-sm text-ink-dim">{decade}s</span>
      </td>
    </tr>
  );
}

/**
 * Season-by-season table with client-side sorting. The page is statically
 * prerendered (no `searchParams` on the server); this island owns the column
 * definitions (their `render` functions can't cross the server boundary) and
 * sorts in place. The active sort hydrates from and reflects to the URL
 * (`?sort`/`?dir`) via `history.replaceState`, keeping deep links shareable
 * without a server round-trip.
 */
export function PlayerSeasonTable({
  seasons,
  playerName,
  goalPeakSeasons = [],
  assistPeakSeasons = [],
  medalSeasons = [],
}: {
  seasons: SeasonSplit[];
  playerName: string;
  goalPeakSeasons?: string[];
  assistPeakSeasons?: string[];
  medalSeasons?: string[];
}) {
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
  const goalPeakSet = useMemo(() => new Set(goalPeakSeasons), [goalPeakSeasons]);
  const assistPeakSet = useMemo(() => new Set(assistPeakSeasons), [assistPeakSeasons]);
  const medalSet = useMemo(() => new Set(medalSeasons), [medalSeasons]);
  const maxGoals = useMemo(() => Math.max(0, ...seasons.map((s) => s.goals)), [seasons]);
  const maxAssists = useMemo(() => Math.max(0, ...seasons.map((s) => s.assists)), [seasons]);
  const decadeHeaders =
    showSeasonDecadeHeaders(seasons) && sortKey === "season" && sortDir === "asc";

  const columns: Column<SeasonSplit>[] = [
    {
      label: "Season",
      key: "season",
      sortKey: "season",
      sortDefaultDirection: SEASON_SORT_DEFAULTS.season,
      card: "identity",
      render: (s) => (
        <span className="inline-flex items-center gap-1.5">
          <Link href={`/seasons/${s.season}`} className="font-medium text-ink hover:text-devil-bright" title={s.season}>
            {fmtSeasonShort(s.season)}
          </Link>
          {medalSet.has(s.season) && (
            <span title="Medal season" aria-label="Medal season">
              <TrophyIcon className="h-3 w-3 shrink-0 text-gold" />
            </span>
          )}
          {goalPeakSet.has(s.season) && <PeakBadge label="PEAK (G)" tone="goals" />}
          {assistPeakSet.has(s.season) && <PeakBadge label="PEAK (A)" tone="assists" />}
        </span>
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
      className: "player-season-stat-col",
      render: (s) => (
        <StatMicroBar
          value={s.goals}
          max={maxGoals}
          tone={s.goals > 0 ? "text-devil-bright" : "text-ink-faint"}
          barColor="var(--color-devil)"
        />
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
      className: "player-season-stat-col",
      render: (s) => (
        <StatMicroBar
          value={s.assists}
          max={maxAssists}
          tone={s.assists > 0 ? "text-gold" : "text-ink-faint"}
          barColor="var(--color-gold)"
        />
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

  function decadeBefore(row: SeasonSplit, prev: SeasonSplit | undefined) {
    if (!decadeHeaders) return null;
    const decade = seasonDecade(row.season);
    const prevDecade = prev ? seasonDecade(prev.season) : null;
    if (decade === prevDecade) return null;
    return <SeasonDecadeHeader key={`decade-${decade}`} decade={decade} />;
  }

  function mobileDecadeLabel(row: SeasonSplit, index: number) {
    if (!decadeHeaders) return null;
    if (index > 0 && seasonDecade(rows[index - 1]!.season) === seasonDecade(row.season)) return null;
    return <p className="display mb-2 text-sm text-ink-dim">{seasonDecade(row.season)}s</p>;
  }

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
      rowClassName={(s) => seasonPeakRowClass(s.season, goalPeakSet, assistPeakSet)}
      renderBeforeRow={(row, prev) => decadeBefore(row, prev)}
      renderMobileCard={(row, index) => (
        <div
          className={`px-4 py-3 ${seasonPeakMobileClass(row.season, goalPeakSet, assistPeakSet)} ${
            medalSet.has(row.season) && !goalPeakSet.has(row.season) && !assistPeakSet.has(row.season)
              ? "ring-1 ring-inset ring-gold/20"
              : ""
          }`}
        >
          {mobileDecadeLabel(row, index)}
            <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
              <span className="inline-flex items-center gap-1.5">
                <Link href={`/seasons/${row.season}`} className="font-medium text-ink hover:text-devil-bright">
                  {fmtSeasonShort(row.season)}
                </Link>
                {medalSet.has(row.season) && <TrophyIcon className="h-3 w-3 shrink-0 text-gold" aria-hidden />}
              </span>
              <span className="inline-flex flex-wrap items-center gap-2">
                {goalPeakSet.has(row.season) && <PeakBadge label="PEAK (G)" tone="goals" />}
                {assistPeakSet.has(row.season) && <PeakBadge label="PEAK (A)" tone="assists" />}
              </span>
            </div>
            <dl className="register-card__metrics mt-2.5 grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3">
              {columns
                .filter((c) => c.card === "metric")
                .map((col) => (
                  <div key={col.key ?? col.label} className="min-w-0">
                    <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-faint">
                      {col.cardLabel ?? col.label}
                    </dt>
                    <dd className="stat-num mt-0.5 text-sm tabular-nums leading-tight">
                      {(col.cardRender ?? col.render)(row, index)}
                    </dd>
                  </div>
                ))}
            </dl>
        </div>
      )}
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
