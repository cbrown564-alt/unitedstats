"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { FacetCombobox } from "@/components/FacetCombobox";
import { FacetIcon } from "@/components/FacetIcon";
import { SeasonRangeSlider } from "@/components/matches/SeasonRangeSlider";
import { decadeMarkers, seasonsAscending } from "@/lib/seasonBounds";
import { FACET_BY_KEY, type FacetCounts, type FacetGroup, type FacetOptions } from "@/lib/matchFacets";

type PlayerRole = "player" | "scorer" | "assister";
type TimeMode = "season" | "decade" | "dates";

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
  // Bare 4-digit years → decade mode (written by decade picker or InteractiveSliceSpine)
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
}: {
  icon?: string;
  iconGroup: FacetGroup;
  placeholder: string;
  label?: string;
  isOpen: boolean;
  onToggle: () => void;
  onClear: () => void;
}) {
  const set = Boolean(label);
  return (
    <div
      className={`flex items-stretch overflow-hidden rounded-lg border text-sm transition-colors ${
        set ? "border-line bg-panel-2" : "border-dashed border-line/40 bg-transparent"
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className={`flex flex-1 items-center gap-2 px-3 py-2 transition-colors focus-ring ${
          set ? "text-ink hover:bg-white/[0.02]" : "text-ink-faint/50 hover:text-ink-faint"
        }`}
      >
        <FacetIcon
          name={icon}
          className={`h-3.5 w-3.5 shrink-0 ${set ? GROUP_TONE[iconGroup] : "text-ink-faint/25"}`}
        />
        <span className={set ? "font-medium" : "text-[13px]"}>{label ?? placeholder}</span>
        <span aria-hidden className="ml-auto text-[11px] text-ink-faint/40">
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
            className="flex items-center px-2.5 text-ink-faint/50 transition-colors hover:bg-devil/10 hover:text-devil-bright focus-ring"
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
  navigate,
}: {
  params: Record<string, string | undefined>;
  options: FacetOptions;
  counts: FacetCounts;
  seasons: string[];
  navigate: (next: Record<string, string | undefined>) => void;
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

  return (
    <div ref={rootRef}>
      {/* ── People + Competition ── */}
      <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
        {/* People */}
        <section>
          <h3 className="mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-faint">
            People
          </h3>
          <div className="space-y-2">
            {/* Opponent */}
            <div className="relative">
              <FilterSlot
                icon="shield"
                iconGroup="who"
                placeholder="Any opponent"
                label={opponentLabel}
                isOpen={open === "opponent"}
                onToggle={() => toggleOpen("opponent")}
                onClear={() => apply("opponent", undefined)}
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

            {/* Manager */}
            <div className="relative">
              <FilterSlot
                icon="suit"
                iconGroup="who"
                placeholder="Any manager"
                label={managerLabel}
                isOpen={open === "manager"}
                onToggle={() => toggleOpen("manager")}
                onClear={() => apply("manager", undefined)}
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

            {/* Player — single slot with role switcher above */}
            <div>
              <div
                className="mb-1.5 flex items-center gap-0.5"
                role="tablist"
                aria-label="Player role"
              >
                {PLAYER_ROLES.map((r) => (
                  <button
                    key={r.key}
                    type="button"
                    role="tab"
                    aria-selected={playerRole === r.key}
                    onClick={() => switchPlayerRole(r.key)}
                    className={`rounded px-2.5 py-0.5 text-[11px] transition-colors focus-ring ${
                      playerRole === r.key
                        ? "bg-panel-2 font-semibold text-ink"
                        : "text-ink-faint/50 hover:text-ink-dim"
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
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
            </div>
          </div>
        </section>

        {/* Competition */}
        <section>
          <h3 className="mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-faint">
            Competition
          </h3>
          <div className="relative">
            <FilterSlot
              icon="trophy"
              iconGroup="what"
              placeholder="Any competition"
              label={competitionLabel}
              isOpen={open === "competition"}
              onToggle={() => toggleOpen("competition")}
              onClear={() => apply("competition", undefined)}
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
        </section>
      </div>

      {/* ── Time zone — cross-cutting, distinct treatment ── */}
      <div className="mt-5 border-t border-line/40 pt-4">
        <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-2">
          <div className="border-l-2 border-devil/50 py-0.5 pl-2.5">
            <h3 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-devil-bright/80">
              Time
            </h3>
          </div>
          <div className="flex items-center gap-0.5" role="tablist" aria-label="Time filter mode">
            {TIME_MODES.map((m) => (
              <button
                key={m.key}
                type="button"
                role="tab"
                aria-selected={timeMode === m.key}
                onClick={() => switchTimeMode(m.key)}
                className={`rounded px-2.5 py-0.5 text-[11px] transition-colors focus-ring ${
                  timeMode === m.key
                    ? "bg-devil/15 font-semibold text-devil-bright"
                    : "text-ink-faint/50 hover:text-ink-dim"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

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
          <div className="flex flex-wrap gap-1.5">
            {decades.map(({ decade }) => (
              <button
                key={decade}
                type="button"
                onClick={() =>
                  activeDec === decade
                    ? navigate({ ...params, from: undefined, to: undefined })
                    : navigate({
                        ...params,
                        season: undefined,
                        from: String(decade),
                        to: String(decade + 9),
                      })
                }
                className={`rounded-md border px-2.5 py-1 text-xs font-medium transition-colors focus-ring ${
                  activeDec === decade
                    ? "border-devil/60 bg-devil/15 text-devil-bright"
                    : "border-line/60 bg-panel/40 text-ink-dim hover:border-devil/30 hover:bg-panel/60 hover:text-ink"
                }`}
              >
                {decade}s
              </button>
            ))}
          </div>
        )}

        {timeMode === "dates" && (
          <SeasonRangeSlider
            key={`${params.from ?? ""}-${params.to ?? ""}`}
            seasons={seasons}
            fromParam={params.from}
            toParam={params.to}
            onApply={applyDates}
            compact
          />
        )}
      </div>
    </div>
  );
}
