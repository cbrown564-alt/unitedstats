"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { FacetCombobox } from "@/components/FacetCombobox";
import { FacetIcon } from "@/components/FacetIcon";
import { SeasonRangeSlider } from "@/components/matches/SeasonRangeSlider";
import { fmtNum } from "@/lib/format";
import { decadeMarkers, seasonsAscending } from "@/lib/seasonBounds";
import { FACET_BY_KEY, type FacetCounts, type FacetGroup, type FacetOptions } from "@/lib/matchFacets";

type PlayerRole = "player" | "scorer" | "assister";
type TimeMode = "season" | "decade" | "dates";

export type DecadeBucket = { decade: string; from: number; to: number; n: number };

const TIME_PANEL =
  "rounded-lg border border-line/40 bg-panel-2/15 px-3 py-3 sm:px-3.5 sm:py-3.5";

const PLAYER_ROLES: { key: PlayerRole; label: string }[] = [
  { key: "player", label: "Appeared" },
  { key: "scorer", label: "Scored" },
  { key: "assister", label: "Assisted" },
];

const TIME_MODES: { key: TimeMode; label: string }[] = [
  { key: "season", label: "Season" },
  { key: "decade", label: "Decade" },
  { key: "dates", label: "Date range" },
];

const GROUP_TONE: Record<FacetGroup, string> = {
  who: "text-europe/70",
  what: "text-gold/70",
  where: "text-silver/70",
  when: "text-devil-bright/70",
};

function detectPlayerRole(params: Record<string, string | undefined>): PlayerRole | null {
  if (params.scorer) return "scorer";
  if (params.assister) return "assister";
  if (params.player) return "player";
  return null;
}

function detectTimeMode(params: Record<string, string | undefined>): TimeMode | null {
  if (params.season) return "season";
  // Bare 4-digit years → decade mode (written by decade picker)
  if (params.from && /^\d{4}$/.test(params.from) && (!params.to || /^\d{4}$/.test(params.to)))
    return "decade";
  if (params.from || params.to) return "dates";
  return null;
}

/** Returns the active decade start year if both params are bare years spanning exactly 9 years. */
function activeDecadeFromParams(params: Record<string, string | undefined>): number | null {
  if (!params.from || !params.to) return null;
  if (!/^\d{4}$/.test(params.from) || !/^\d{4}$/.test(params.to)) return null;
  const from = parseInt(params.from, 10);
  const to = parseInt(params.to, 10);
  return to - from === 9 ? from : null;
}

function SegmentedTabs<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
}: {
  options: { key: T; label: string }[];
  value: T;
  onChange: (key: T) => void;
  ariaLabel: string;
}) {
  return (
    <div className="filter-zones-segmented" role="tablist" aria-label={ariaLabel}>
      {options.map((option) => (
        <button
          key={option.key}
          type="button"
          role="tab"
          aria-selected={value === option.key}
          onClick={() => onChange(option.key)}
          className="filter-zones-segmented-btn focus-ring"
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// FilterSlot — inline filter control; placeholder when empty, value + × when set
// ─────────────────────────────────────────────────────────
function FilterSlot({
  icon,
  iconGroup,
  placeholder,
  label,
  isOpen,
  onToggle,
  onClear,
  layout = "default",
}: {
  icon?: string;
  iconGroup: FacetGroup;
  placeholder: string;
  label?: string;
  isOpen: boolean;
  onToggle: () => void;
  onClear: () => void;
  layout?: "default" | "sheet";
}) {
  const set = Boolean(label);
  const isSheet = layout === "sheet";
  return (
    <div
      className={[
        "filter-slot flex items-stretch overflow-hidden border text-sm transition-colors",
        isSheet ? "rounded-xl" : "rounded-lg",
        set ? "border-line bg-panel-2" : "border-dashed border-line/40 bg-transparent",
      ].join(" ")}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className={[
          "filter-slot-btn flex flex-1 items-center gap-2.5 transition-colors focus-ring",
          isSheet ? "px-4 py-3 text-[15px]" : "px-3 py-2",
          set ? "text-ink hover:bg-white/[0.02]" : "text-ink-dim hover:text-ink-faint",
        ].join(" ")}
      >
        <FacetIcon
          name={icon}
          className={[
            "filter-slot-icon shrink-0",
            isSheet ? "h-4 w-4" : "h-3.5 w-3.5",
            set ? GROUP_TONE[iconGroup] : "text-ink-faint/70",
          ].join(" ")}
        />
        <span className={set ? "font-medium" : isSheet ? "" : "text-[13px]"}>{label ?? placeholder}</span>
        <span aria-hidden className="ml-auto text-[11px] text-ink-faint/75">
          ▾
        </span>
      </button>
      {set && (
        <>
          <span aria-hidden className="my-1.5 w-px shrink-0 bg-line/40" />
          <button
            type="button"
            onClick={onClear}
            aria-label={`Clear ${placeholder}`}
            className="flex items-center px-2.5 text-ink-dim transition-colors hover:bg-devil/10 hover:text-devil-bright focus-ring"
          >
            ×
          </button>
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// FilterZones — the always-visible, zoned filter panel
// ─────────────────────────────────────────────────────────
export function FilterZones({
  params,
  options,
  counts,
  seasons,
  decadeBuckets,
  navigate,
  layout = "default",
}: {
  params: Record<string, string | undefined>;
  options: FacetOptions;
  counts: FacetCounts;
  seasons: string[];
  /** Match counts per decade within the current slice (excludes active decade range). */
  decadeBuckets?: DecadeBucket[];
  navigate: (next: Record<string, string | undefined>) => void;
  /** Roomier single-column layout for the mobile filter sheet. */
  layout?: "default" | "sheet";
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState<string | null>(null);

  // Player role: derived from URL when a player param is active, else local default
  const urlPlayerRole = detectPlayerRole(params);
  const [localPlayerRole, setLocalPlayerRole] = useState<PlayerRole>("player");
  const playerRole = urlPlayerRole ?? localPlayerRole;

  // Time mode: derived from URL when a time param is active, else local default
  const urlTimeMode = detectTimeMode(params);
  const [localTimeMode, setLocalTimeMode] = useState<TimeMode>("season");
  const timeMode = urlTimeMode ?? localTimeMode;

  // Dismiss open picker on outside click or Escape
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const apply = (key: string, value: string | undefined) => {
    setOpen(null);
    navigate({ ...params, [key]: value || undefined });
  };

  const toggleOpen = (key: string) => setOpen((p) => (p === key ? null : key));

  // Switching player role migrates the current player value to the new param key
  const switchPlayerRole = (newRole: PlayerRole) => {
    const currentValue = params[playerRole];
    const next: Record<string, string | undefined> = {
      ...params,
      player: undefined,
      scorer: undefined,
      assister: undefined,
    };
    if (currentValue) next[newRole] = currentValue;
    setLocalPlayerRole(newRole);
    setOpen(null);
    navigate(next);
  };

  // Switching time mode clears all active time params
  const switchTimeMode = (newMode: TimeMode) => {
    if (timeMode === newMode) return;
    setLocalTimeMode(newMode);
    setOpen(null);
    if (params.season || params.from || params.to) {
      navigate({ ...params, season: undefined, from: undefined, to: undefined });
    }
  };

  const applyDates = (from: string | undefined, to: string | undefined) => {
    navigate({ ...params, season: undefined, from, to });
  };

  // Decade picker data
  const asc = useMemo(() => seasonsAscending(seasons), [seasons]);
  const decades = useMemo(() => decadeMarkers(asc), [asc]);
  const pickerDecades = useMemo(
    () =>
      decadeBuckets?.length
        ? decadeBuckets.map((d) => ({ year: d.from, n: d.n }))
        : decades.map((d) => ({ year: d.decade, n: undefined as number | undefined })),
    [decadeBuckets, decades],
  );
  const activeDec = activeDecadeFromParams(params);

  // Resolved display labels for slot values (looked up from full options list)
  const opponentLabel = params.opponent
    ? (options["opponent"] ?? []).find((o) => o.value === params.opponent)?.label
    : undefined;
  const managerLabel = params.manager
    ? (options["manager"] ?? []).find((o) => o.value === params.manager)?.label
    : undefined;
  const playerLabel = params[playerRole]
    ? (options["player"] ?? []).find((o) => o.value === params[playerRole])?.label
    : undefined;
  const competitionLabel = params.competition
    ? (options["competition"] ?? []).find((o) => o.value === params.competition)?.label
    : undefined;

  const playerFacet = FACET_BY_KEY[playerRole];
  const isSheet = layout === "sheet";

  const peopleFields = (
    <>
      <div className="min-w-0">
        <div className="relative">
          <FilterSlot
            icon={playerFacet.icon}
            iconGroup="who"
            placeholder="Any player"
            label={playerLabel}
            isOpen={open === playerRole}
            onToggle={() => toggleOpen(playerRole)}
            onClear={() => {
              setOpen(null);
              navigate({ ...params, player: undefined, scorer: undefined, assister: undefined });
            }}
            layout={layout}
          />
          {open === playerRole && (
            <FacetCombobox
              label={playerFacet.label}
              options={options["player"] ?? []}
              current={params[playerRole] ?? ""}
              counts={counts[playerRole]}
              onApply={(v) => apply(playerRole, v)}
            />
          )}
        </div>
        {isSheet ? (
          <div className="mt-2.5">
            <SegmentedTabs
              options={PLAYER_ROLES}
              value={playerRole}
              onChange={switchPlayerRole}
              ariaLabel="Player role"
            />
          </div>
        ) : (
          <div className="mt-1.5 flex items-center gap-0.5" role="tablist" aria-label="Player role">
            {PLAYER_ROLES.map((r) => (
              <button
                key={r.key}
                type="button"
                role="tab"
                aria-selected={playerRole === r.key}
                onClick={() => switchPlayerRole(r.key)}
                className={`border-b px-2 py-px text-[13px] transition-colors focus-ring ${
                  playerRole === r.key
                    ? "border-devil/45 pb-px text-ink-dim"
                    : "border-transparent text-ink-dim/80 hover:text-ink-dim"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="relative min-w-0">
        <FilterSlot
          icon="suit"
          iconGroup="who"
          placeholder="Any manager"
          label={managerLabel}
          isOpen={open === "manager"}
          onToggle={() => toggleOpen("manager")}
          onClear={() => apply("manager", undefined)}
          layout={layout}
        />
        {open === "manager" && (
          <FacetCombobox
            label="Manager"
            options={options["manager"] ?? []}
            current={params.manager ?? ""}
            counts={counts["manager"]}
            onApply={(v) => apply("manager", v)}
          />
        )}
      </div>

      <div className="relative min-w-0">
        <FilterSlot
          icon="shield"
          iconGroup="who"
          placeholder="Any opponent"
          label={opponentLabel}
          isOpen={open === "opponent"}
          onToggle={() => toggleOpen("opponent")}
          onClear={() => apply("opponent", undefined)}
          layout={layout}
        />
        {open === "opponent" && (
          <FacetCombobox
            label="Opponent"
            options={options["opponent"] ?? []}
            current={params.opponent ?? ""}
            counts={counts["opponent"]}
            onApply={(v) => apply("opponent", v)}
          />
        )}
      </div>

      <div className="relative min-w-0">
        <FilterSlot
          icon="trophy"
          iconGroup="what"
          placeholder="Any competition"
          label={competitionLabel}
          isOpen={open === "competition"}
          onToggle={() => toggleOpen("competition")}
          onClear={() => apply("competition", undefined)}
          layout={layout}
        />
        {open === "competition" && (
          <FacetCombobox
            label="Competition"
            options={options["competition"] ?? []}
            current={params.competition ?? ""}
            counts={counts["competition"]}
            onApply={(v) => apply("competition", v)}
          />
        )}
      </div>
    </>
  );

  const timeModeTabs = isSheet ? (
    <SegmentedTabs
      options={TIME_MODES}
      value={timeMode}
      onChange={switchTimeMode}
      ariaLabel="Time filter mode"
    />
  ) : (
    <div className="flex items-center gap-0.5" role="tablist" aria-label="Time filter mode">
      {TIME_MODES.map((m) => (
        <button
          key={m.key}
          type="button"
          role="tab"
          aria-selected={timeMode === m.key}
          onClick={() => switchTimeMode(m.key)}
          className={`border-b px-2 py-px text-[13px] transition-colors focus-ring ${
            timeMode === m.key
              ? "border-devil/45 pb-px text-ink-dim"
              : "border-transparent text-ink-dim/80 hover:text-ink-dim"
          }`}
        >
          {m.label}
        </button>
      ))}
    </div>
  );

  const timeModeContent = (
    <>
      {timeMode === "season" && (
        <div className="relative">
          <FilterSlot
            icon="calendar"
            iconGroup="when"
            placeholder="Any season"
            label={params.season ?? undefined}
            isOpen={open === "season"}
            onToggle={() => toggleOpen("season")}
            onClear={() => {
              setOpen(null);
              navigate({ ...params, season: undefined });
            }}
            layout={layout}
          />
          {open === "season" && (
            <FacetCombobox
              label="Season"
              options={options["season"] ?? []}
              current={params.season ?? ""}
              counts={counts["season"]}
              onApply={(v) => {
                setOpen(null);
                navigate({ ...params, season: v || undefined, from: undefined, to: undefined });
              }}
            />
          )}
        </div>
      )}

      {timeMode === "decade" && (
        <div className={TIME_PANEL}>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(3.25rem,1fr))] gap-1">
            {pickerDecades.map(({ year, n }) => {
              const active = activeDec === year;
              return (
                <button
                  key={year}
                  type="button"
                  onClick={() =>
                    active
                      ? navigate({ ...params, from: undefined, to: undefined })
                      : navigate({
                          ...params,
                          season: undefined,
                          from: String(year),
                          to: String(year + 9),
                        })
                  }
                  aria-pressed={active}
                  title={typeof n === "number" ? `${year}s · ${fmtNum(n)} matches` : `${year}s`}
                  className={`group relative flex flex-col items-center rounded-md px-1.5 py-1.5 transition-colors focus-ring ${
                    active
                      ? "bg-devil/10 text-ink"
                      : "text-ink-dim hover:bg-white/[0.03] hover:text-ink-faint"
                  }`}
                >
                  <span className="stat-num text-[11px] font-medium leading-tight">{year}s</span>
                  {typeof n === "number" && (
                    <span className="stat-num text-[9px] leading-tight text-ink-faint/80 group-hover:text-ink-faint">
                      {fmtNum(n)}
                    </span>
                  )}
                  {active && (
                    <span
                      aria-hidden
                      className="absolute inset-x-2 bottom-0.5 h-px bg-devil/55"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {timeMode === "dates" && (
        <div className={TIME_PANEL}>
          <SeasonRangeSlider
            key={`${params.from ?? ""}-${params.to ?? ""}`}
            seasons={seasons}
            fromParam={params.from}
            toParam={params.to}
            onApply={applyDates}
            compact
          />
        </div>
      )}
    </>
  );

  if (isSheet) {
    return (
      <div ref={rootRef} className="filter-zones filter-zones--sheet">
        <section className="filter-zones-section">
          <h3 className="filter-zones-section-label">People &amp; competition</h3>
          <div className="filter-zones-fields">{peopleFields}</div>
        </section>

        <section className="filter-zones-section">
          <h3 className="filter-zones-section-label">Time</h3>
          <div className="filter-zones-fields">
            {timeModeTabs}
            {timeModeContent}
          </div>
        </section>
      </div>
    );
  }

  return (
    <div ref={rootRef}>
      {/* ── Player, Manager, Opponent, Competition ── */}
      <div className="grid items-start gap-x-4 gap-y-5 sm:grid-cols-2 xl:grid-cols-4">
        {peopleFields}
      </div>

      {/* ── Time zone ── */}
      <div className="mt-5 border-t border-line/40 pt-4">
        <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-2">
          <h3 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-dim">
            Time
          </h3>
          {timeModeTabs}
        </div>
        {timeModeContent}
      </div>
    </div>
  );
}
