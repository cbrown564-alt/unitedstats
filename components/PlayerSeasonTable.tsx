"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { TrophyIcon } from "@/components/CampaignIcons";
import { Column, DataTable, type SortDirection } from "./DataTable";
import { fmtNum, fmtSeasonShort } from "@/lib/format";
import {
  cleanSheetPct,
  seasonDecade,
  showSeasonDecadeHeaders,
  type DefensiveSeasonSplit,
  type SeasonSplit,
} from "@/lib/playerSeasonHighlights";

export type { SeasonSplit, DefensiveSeasonSplit };

type AttackingSortKey = "season" | "apps" | "starts" | "goals" | "assists" | "ga";
type DefensiveSortKey = "season" | "apps" | "starts" | "cleanSheets" | "goalsConceded" | "csPct";
type SeasonSortKey = AttackingSortKey | DefensiveSortKey;

const ATTACKING_SORT_DEFAULTS: Record<AttackingSortKey, SortDirection> = {
  season: "asc",
  apps: "desc",
  starts: "desc",
  goals: "desc",
  assists: "desc",
  ga: "desc",
};

const DEFENSIVE_SORT_DEFAULTS: Record<DefensiveSortKey, SortDirection> = {
  season: "asc",
  apps: "desc",
  starts: "desc",
  cleanSheets: "desc",
  goalsConceded: "asc",
  csPct: "desc",
};

const ATTACKING_SORT_LABELS: Record<AttackingSortKey, string> = {
  season: "Season",
  apps: "Apps",
  starts: "Starts",
  goals: "Goals",
  assists: "Assists",
  ga: "goals + assists",
};

const DEFENSIVE_SORT_LABELS: Record<DefensiveSortKey, string> = {
  season: "Season",
  apps: "Apps",
  starts: "Starts",
  cleanSheets: "Clean sheets",
  goalsConceded: "Goals conceded",
  csPct: "clean sheet %",
};

const ATTACKING_MOBILE_SORT: { key: AttackingSortKey; dir: SortDirection; label: string }[] = [
  { key: "season", dir: "asc", label: "Season (oldest first)" },
  { key: "season", dir: "desc", label: "Season (newest first)" },
  { key: "goals", dir: "desc", label: "Goals (most first)" },
  { key: "ga", dir: "desc", label: "G+A (most first)" },
  { key: "apps", dir: "desc", label: "Apps (most first)" },
  { key: "assists", dir: "desc", label: "Assists (most first)" },
];

const DEFENSIVE_MOBILE_SORT: { key: DefensiveSortKey; dir: SortDirection; label: string }[] = [
  { key: "season", dir: "asc", label: "Season (oldest first)" },
  { key: "season", dir: "desc", label: "Season (newest first)" },
  { key: "cleanSheets", dir: "desc", label: "Clean sheets (most first)" },
  { key: "csPct", dir: "desc", label: "Clean sheet % (highest first)" },
  { key: "goalsConceded", dir: "asc", label: "Conceded (fewest first)" },
  { key: "apps", dir: "desc", label: "Apps (most first)" },
];

function attackingSubline(s: SeasonSplit, sortKey: AttackingSortKey): string {
  const parts: string[] = [];
  if (sortKey !== "apps" && s.apps) parts.push(`${fmtNum(s.apps)} apps`);
  if (sortKey !== "goals" && s.goals) parts.push(`${fmtNum(s.goals)} gls`);
  if (sortKey !== "assists" && s.assists) parts.push(`${fmtNum(s.assists)} ast`);
  const ga = s.goals + s.assists;
  if (sortKey !== "ga" && ga) parts.push(`${fmtNum(ga)} G+A`);
  return parts.length > 0 ? parts.join(" · ") : "—";
}

function defensiveSubline(s: DefensiveSeasonSplit, sortKey: DefensiveSortKey): string {
  const parts: string[] = [];
  if (sortKey !== "apps" && s.apps) parts.push(`${fmtNum(s.apps)} apps`);
  if (sortKey !== "cleanSheets" && s.cleanSheets) parts.push(`${fmtNum(s.cleanSheets)} CS`);
  if (sortKey !== "goalsConceded" && s.goalsConceded) parts.push(`${fmtNum(s.goalsConceded)} conc`);
  const pct = cleanSheetPct(s.cleanSheets, s.starts);
  if (sortKey !== "csPct" && pct != null && s.starts > 0) parts.push(`${pct.toFixed(0)}% CS`);
  return parts.length > 0 ? parts.join(" · ") : "—";
}

function seasonFigureTone(sortKey: string, defensive: boolean): string {
  if (defensive) {
    if (sortKey === "cleanSheets" || sortKey === "csPct") return "text-devil-bright";
    if (sortKey === "goalsConceded") return "text-gold";
    return "text-ink";
  }
  if (sortKey === "goals" || sortKey === "ga") return "text-devil-bright";
  if (sortKey === "assists") return "text-gold";
  return "text-ink";
}

function fmtFigure(value: number): string {
  return value > 0 ? fmtNum(value) : "—";
}

function SeasonMobileSort({
  sortKey,
  sortDir,
  onSort,
  defensive,
}: {
  sortKey: SeasonSortKey;
  sortDir: SortDirection;
  onSort: (key: string, dir: SortDirection) => void;
  defensive: boolean;
}) {
  const options = defensive ? DEFENSIVE_MOBILE_SORT : ATTACKING_MOBILE_SORT;
  const value = `${sortKey}:${sortDir}`;
  const matched = options.some((o) => `${o.key}:${o.dir}` === value);
  const selectValue = matched ? value : "season:asc";

  return (
    <label className="flex min-w-0 flex-1 items-center gap-2 sm:hidden">
      <span className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-faint">
        Sort
      </span>
      <select
        value={selectValue}
        onChange={(e) => {
          const [key, dir] = e.target.value.split(":") as [SeasonSortKey, SortDirection];
          onSort(key, dir);
        }}
        className="min-w-0 flex-1 truncate rounded-md border border-line bg-panel px-2 py-1.5 text-xs text-ink focus-ring"
        aria-label="Sort seasons"
      >
        {options.map((o) => (
          <option key={`${o.key}:${o.dir}`} value={`${o.key}:${o.dir}`}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function compareAttacking(a: SeasonSplit, b: SeasonSplit, key: AttackingSortKey, dir: SortDirection): number {
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

function compareDefensive(a: DefensiveSeasonSplit, b: DefensiveSeasonSplit, key: DefensiveSortKey, dir: SortDirection): number {
  const n = (x: number, y: number) => (dir === "asc" ? x - y : y - x);
  const pct = (s: DefensiveSeasonSplit) => cleanSheetPct(s.cleanSheets, s.starts) ?? -1;
  const primary =
    key === "season" ? (dir === "asc" ? a.season.localeCompare(b.season) : b.season.localeCompare(a.season))
    : key === "apps" ? n(a.apps, b.apps)
    : key === "starts" ? n(a.starts, b.starts)
    : key === "cleanSheets" ? n(a.cleanSheets, b.cleanSheets)
    : key === "goalsConceded" ? n(a.goalsConceded, b.goalsConceded)
    : n(pct(a), pct(b));
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

function PeakBadge({ label, tone }: { label: string; tone: "goals" | "assists" | "cleanSheets" | "conceded" }) {
  const toneClass =
    tone === "goals" || tone === "cleanSheets" ? "text-devil-bright/90" : "text-gold";
  return (
    <span className={`text-[10px] font-semibold uppercase tracking-wide ${toneClass}`}>
      {label}
    </span>
  );
}

function attackingPeakRowClass(season: string, goalPeaks: Set<string>, assistPeaks: Set<string>) {
  const g = goalPeaks.has(season);
  const a = assistPeaks.has(season);
  if (g && a) return "player-season-row--peak-ga";
  if (g) return "player-season-row--peak-g";
  if (a) return "player-season-row--peak-a";
  return undefined;
}

function defensivePeakRowClass(season: string, csPeaks: Set<string>, concededPeaks: Set<string>) {
  const cs = csPeaks.has(season);
  const gc = concededPeaks.has(season);
  if (cs && gc) return "player-season-row--peak-ga";
  if (cs) return "player-season-row--peak-g";
  if (gc) return "player-season-row--peak-a";
  return undefined;
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

type PlayerSeasonTableProps =
  | {
      statProfile?: "attacking";
      seasons: SeasonSplit[];
      playerName: string;
      goalPeakSeasons?: string[];
      assistPeakSeasons?: string[];
      cleanSheetPeakSeasons?: never;
      fewestConcededSeasons?: never;
      medalSeasons?: string[];
    }
  | {
      statProfile: "defensive";
      seasons: DefensiveSeasonSplit[];
      playerName: string;
      cleanSheetPeakSeasons?: string[];
      fewestConcededSeasons?: string[];
      goalPeakSeasons?: never;
      assistPeakSeasons?: never;
      medalSeasons?: string[];
    };

/**
 * Season-by-season table with client-side sorting. The page is statically
 * prerendered (no `searchParams` on the server); this island owns the column
 * definitions (their `render` functions can't cross the server boundary) and
 * sorts in place. The active sort hydrates from and reflects to the URL
 * (`?sort`/`?dir`) via `history.replaceState`, keeping deep links shareable
 * without a server round-trip.
 */
export function PlayerSeasonTable(props: PlayerSeasonTableProps) {
  const {
    seasons,
    playerName,
    medalSeasons = [],
    statProfile = "attacking",
  } = props;
  const defensive = statProfile === "defensive";

  const [sortKey, setSortKey] = useState<SeasonSortKey>("season");
  const [sortDir, setSortDir] = useState<SortDirection>("asc");

  const sortDefaults = defensive ? DEFENSIVE_SORT_DEFAULTS : ATTACKING_SORT_DEFAULTS;

  const medalSet = useMemo(() => new Set(medalSeasons), [medalSeasons]);
  const goalPeakSet = useMemo(
    () => new Set(!defensive ? (props.goalPeakSeasons ?? []) : []),
    [defensive, props],
  );
  const assistPeakSet = useMemo(
    () => new Set(!defensive ? (props.assistPeakSeasons ?? []) : []),
    [defensive, props],
  );
  const csPeakSet = useMemo(
    () => new Set(defensive ? (props.cleanSheetPeakSeasons ?? []) : []),
    [defensive, props],
  );
  const concededPeakSet = useMemo(
    () => new Set(defensive ? (props.fewestConcededSeasons ?? []) : []),
    [defensive, props],
  );
  const maxGoals = useMemo(
    () => Math.max(0, ...seasons.map((s) => s.goals)),
    [seasons],
  );
  const maxAssists = useMemo(
    () => Math.max(0, ...seasons.map((s) => s.assists)),
    [seasons],
  );
  const maxCleanSheets = useMemo(
    () => Math.max(0, ...seasons.map((s) => ("cleanSheets" in s ? s.cleanSheets : 0))),
    [seasons],
  );
  const maxConceded = useMemo(
    () => Math.max(0, ...seasons.map((s) => ("goalsConceded" in s ? s.goalsConceded : 0))),
    [seasons],
  );
  const decadeHeaders =
    showSeasonDecadeHeaders(seasons) && sortKey === "season" && sortDir === "asc";

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const k = params.get("sort");
    if (k && Object.hasOwn(sortDefaults, k)) {
      const key = k as SeasonSortKey;
      const d = params.get("dir");
      const dir = d === "asc" || d === "desc" ? d : sortDefaults[key as keyof typeof sortDefaults];
      const frame = window.requestAnimationFrame(() => {
        setSortKey(key);
        setSortDir(dir);
      });
      return () => window.cancelAnimationFrame(frame);
    }
  }, [sortDefaults]);

  function onSort(key: string, dir: SortDirection) {
    setSortKey(key as SeasonSortKey);
    setSortDir(dir);
    const url = new URL(window.location.href);
    url.searchParams.set("sort", key);
    url.searchParams.set("dir", dir);
    url.hash = "seasons";
    window.history.replaceState(null, "", url);
  }

  if (defensive) {
    const defSeasons = seasons as DefensiveSeasonSplit[];
    const rows = [...defSeasons].sort((a, b) =>
      compareDefensive(a, b, sortKey as DefensiveSortKey, sortDir),
    );

    const columns: Column<DefensiveSeasonSplit>[] = [
      {
        label: "Season",
        key: "season",
        sortKey: "season",
        sortDefaultDirection: DEFENSIVE_SORT_DEFAULTS.season,
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
            {csPeakSet.has(s.season) && <PeakBadge label="PEAK (CS)" tone="cleanSheets" />}
            {concededPeakSet.has(s.season) && <PeakBadge label="BEST (GC)" tone="conceded" />}
          </span>
        ),
        cardRender: (s) => (
          <span className="inline-flex min-w-0 items-center gap-1.5">
            <span className="display text-sm font-medium leading-none">{fmtSeasonShort(s.season)}</span>
            {medalSet.has(s.season) && (
              <span title="Medal season" aria-label="Medal season">
                <TrophyIcon className="h-3 w-3 shrink-0 text-gold" />
              </span>
            )}
            {csPeakSet.has(s.season) && <PeakBadge label="PEAK (CS)" tone="cleanSheets" />}
            {concededPeakSet.has(s.season) && <PeakBadge label="BEST (GC)" tone="conceded" />}
          </span>
        ),
      },
      {
        label: "Apps",
        key: "apps",
        numeric: true,
        sortKey: "apps",
        sortDefaultDirection: DEFENSIVE_SORT_DEFAULTS.apps,
        render: (s) => (s.apps ? fmtNum(s.apps) : "—"),
        cardRender: (s) => fmtFigure(s.apps),
      },
      {
        label: "Starts",
        key: "starts",
        numeric: true,
        sortKey: "starts",
        sortDefaultDirection: DEFENSIVE_SORT_DEFAULTS.starts,
        hideBelow: "hidden md:table-cell",
        render: (s) => (s.starts ? fmtNum(s.starts) : "—"),
        cardRender: (s) => fmtFigure(s.starts),
      },
      {
        label: "Clean sheets",
        key: "cleanSheets",
        numeric: true,
        sortKey: "cleanSheets",
        sortDefaultDirection: DEFENSIVE_SORT_DEFAULTS.cleanSheets,
        className: "player-season-stat-col",
        card: "figure",
        render: (s) => (
          <StatMicroBar
            value={s.cleanSheets}
            max={maxCleanSheets}
            tone={s.cleanSheets > 0 ? "text-devil-bright" : "text-ink-faint"}
            barColor="var(--color-devil)"
          />
        ),
        cardRender: (s) => fmtFigure(s.cleanSheets),
      },
      {
        label: "Conceded",
        key: "goalsConceded",
        numeric: true,
        sortKey: "goalsConceded",
        sortDefaultDirection: DEFENSIVE_SORT_DEFAULTS.goalsConceded,
        className: "player-season-stat-col",
        render: (s) => (
          <StatMicroBar
            value={s.goalsConceded}
            max={maxConceded}
            tone={s.goalsConceded > 0 ? "text-gold" : "text-ink-faint"}
            barColor="var(--color-gold)"
          />
        ),
        cardRender: (s) => fmtFigure(s.goalsConceded),
      },
      {
        label: "CS%",
        key: "csPct",
        numeric: true,
        sortKey: "csPct",
        sortDefaultDirection: DEFENSIVE_SORT_DEFAULTS.csPct,
        sortLabel: "clean sheet percentage",
        render: (s) => {
          const pct = cleanSheetPct(s.cleanSheets, s.starts);
          return pct != null && s.starts > 0 ? `${pct.toFixed(0)}%` : "—";
        },
        cardRender: (s) => {
          const pct = cleanSheetPct(s.cleanSheets, s.starts);
          return pct != null && s.starts > 0 ? `${pct.toFixed(0)}%` : "—";
        },
      },
    ];

    function decadeBefore(row: DefensiveSeasonSplit, prev: DefensiveSeasonSplit | undefined) {
      if (!decadeHeaders) return null;
      const decade = seasonDecade(row.season);
      const prevDecade = prev ? seasonDecade(prev.season) : null;
      if (decade === prevDecade) return null;
      return <SeasonDecadeHeader key={`decade-${decade}`} decade={decade} />;
    }

    return (
      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(s) => s.season}
        density="compact"
        registerCards
        registerLayout="leaderboard"
        registerHref={(s) => `/seasons/${s.season}`}
        registerSubline={(s, _index, key) => defensiveSubline(s, key as DefensiveSortKey)}
        registerFigureTone={(key) => seasonFigureTone(key, true)}
        registerShowRank={sortKey !== "season"}
        caption={`${playerName} season-by-season apps, clean sheets, and goals conceded`}
        sort={{ key: sortKey, direction: sortDir, onSort }}
        rowClassName={(s) => defensivePeakRowClass(s.season, csPeakSet, concededPeakSet)}
        renderBeforeRow={(row, prev) => decadeBefore(row, prev)}
        summary={
          <>
            <span className="hidden sm:inline">{fmtNum(seasons.length)} recorded seasons</span>
            <SeasonMobileSort sortKey={sortKey} sortDir={sortDir} onSort={onSort} defensive />
            <span className="hidden sm:inline">
              Sorted by{" "}
              <span className="font-semibold text-ink">{DEFENSIVE_SORT_LABELS[sortKey as DefensiveSortKey]}</span>,{" "}
              {sortDir === "asc" ? "ascending" : "descending"}
            </span>
          </>
        }
      />
    );
  }

  const atkSeasons = seasons as SeasonSplit[];
  const rows = [...atkSeasons].sort((a, b) =>
    compareAttacking(a, b, sortKey as AttackingSortKey, sortDir),
  );

  const columns: Column<SeasonSplit>[] = [
    {
      label: "Season",
      key: "season",
      sortKey: "season",
      sortDefaultDirection: ATTACKING_SORT_DEFAULTS.season,
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
      cardRender: (s) => (
        <span className="inline-flex min-w-0 items-center gap-1.5">
          <span className="display text-sm font-medium leading-none">{fmtSeasonShort(s.season)}</span>
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
      sortDefaultDirection: ATTACKING_SORT_DEFAULTS.apps,
      render: (s) => (s.apps ? fmtNum(s.apps) : "—"),
      cardRender: (s) => fmtFigure(s.apps),
    },
    {
      label: "Starts",
      key: "starts",
      numeric: true,
      sortKey: "starts",
      sortDefaultDirection: ATTACKING_SORT_DEFAULTS.starts,
      hideBelow: "hidden md:table-cell",
      render: (s) => (s.starts ? fmtNum(s.starts) : "—"),
      cardRender: (s) => fmtFigure(s.starts),
    },
    {
      label: "Goals",
      key: "goals",
      numeric: true,
      sortKey: "goals",
      sortDefaultDirection: ATTACKING_SORT_DEFAULTS.goals,
      className: "player-season-stat-col",
      card: "figure",
      render: (s) => (
        <StatMicroBar
          value={s.goals}
          max={maxGoals}
          tone={s.goals > 0 ? "text-devil-bright" : "text-ink-faint"}
          barColor="var(--color-devil)"
        />
      ),
      cardRender: (s) => fmtFigure(s.goals),
    },
    {
      label: "Assists",
      key: "assists",
      numeric: true,
      sortKey: "assists",
      sortDefaultDirection: ATTACKING_SORT_DEFAULTS.assists,
      className: "player-season-stat-col",
      render: (s) => (
        <StatMicroBar
          value={s.assists}
          max={maxAssists}
          tone={s.assists > 0 ? "text-gold" : "text-ink-faint"}
          barColor="var(--color-gold)"
        />
      ),
      cardRender: (s) => fmtFigure(s.assists),
    },
    {
      label: "G+A",
      key: "ga",
      numeric: true,
      sortKey: "ga",
      sortDefaultDirection: ATTACKING_SORT_DEFAULTS.ga,
      sortLabel: "goals plus assists",
      render: (s) => (s.goals + s.assists > 0 ? fmtNum(s.goals + s.assists) : "—"),
      cardRender: (s) => fmtFigure(s.goals + s.assists),
    },
  ];

  function decadeBefore(row: SeasonSplit, prev: SeasonSplit | undefined) {
    if (!decadeHeaders) return null;
    const decade = seasonDecade(row.season);
    const prevDecade = prev ? seasonDecade(prev.season) : null;
    if (decade === prevDecade) return null;
    return <SeasonDecadeHeader key={`decade-${decade}`} decade={decade} />;
  }

  return (
    <DataTable
      columns={columns}
      rows={rows}
      rowKey={(s) => s.season}
      density="compact"
      registerCards
      registerLayout="leaderboard"
      registerHref={(s) => `/seasons/${s.season}`}
      registerSubline={(s, _index, key) => attackingSubline(s, key as AttackingSortKey)}
      registerFigureTone={(key) => seasonFigureTone(key, false)}
      registerShowRank={sortKey !== "season"}
      caption={`${playerName} season-by-season apps, goals, and assists`}
      sort={{ key: sortKey, direction: sortDir, onSort }}
      rowClassName={(s) => attackingPeakRowClass(s.season, goalPeakSet, assistPeakSet)}
      renderBeforeRow={(row, prev) => decadeBefore(row, prev)}
      summary={
        <>
          <span className="hidden sm:inline">{fmtNum(seasons.length)} recorded seasons</span>
          <SeasonMobileSort sortKey={sortKey} sortDir={sortDir} onSort={onSort} defensive={false} />
          <span className="hidden sm:inline">
            Sorted by{" "}
            <span className="font-semibold text-ink">{ATTACKING_SORT_LABELS[sortKey as AttackingSortKey]}</span>,{" "}
            {sortDir === "asc" ? "ascending" : "descending"}
          </span>
        </>
      }
    />
  );
}
