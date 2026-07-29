"use client";

import { useCallback, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { SectionHead } from "@/components/SectionHead";
import { SquadBuildDealPanel } from "@/components/transfers/SquadBuildDealPanel";
import { familyName } from "@/lib/names";
import type { PitchBand } from "@/lib/placement";
import { PITCH_BAND_ORDER } from "@/lib/placement";
import type {
  SquadBuildDataset,
  SquadBuildEraId,
  SquadBuildSeasonMarker,
  SquadBuildThread,
} from "@/lib/squadBuild";
import { filterSquadBuildThreads } from "@/lib/squadBuild";

type PositionFilter = "all" | PitchBand | "UNK";

const POSITION_OPTIONS: Array<{ value: PositionFilter; label: string }> = [
  { value: "all", label: "All lanes" },
  { value: "FWD", label: "Forwards" },
  { value: "MID", label: "Midfield" },
  { value: "DEF", label: "Defenders" },
  { value: "GK", label: "Goalkeepers" },
  { value: "UNK", label: "Unplaced" },
];

const LANE_ORDER: Array<PitchBand | "UNK"> = [...PITCH_BAND_ORDER, "UNK"];

function laneHasThreads(threads: SquadBuildThread[], lane: PitchBand | "UNK"): boolean {
  return threads.some((thread) => thread.position === lane);
}

function finishLabel(position: number | null): string {
  if (position == null) return "—";
  if (position === 1) return "1st";
  const suffix =
    position % 10 === 1 && position !== 11
      ? "st"
      : position % 10 === 2 && position !== 12
        ? "nd"
        : position % 10 === 3 && position !== 13
          ? "rd"
          : "th";
  return `${position}${suffix}`;
}

function threadButtonLabel(thread: SquadBuildThread): string {
  const direction = thread.direction === "in" ? "in" : "out";
  return `${thread.playerName}, ${direction}, ${thread.season}, ${thread.feeDisplay}`;
}

function trophyLabel(count: number): string {
  return `${count} ${count === 1 ? "trophy" : "trophies"}`;
}

/**
 * Roving tabindex scoped to a single list. Focus only ever moves in response to
 * a key press, never on mount — the timeline sits far down the transfer hub, so
 * a mount-time focus call would scroll the reader past the answer plate and
 * override any in-page anchor they arrived on.
 */
function useRovingList<T extends HTMLElement>(count: number, onFocusChange: (index: number) => void) {
  const containerRef = useRef<T>(null);
  const [storedIndex, setStoredIndex] = useState(0);
  // Clamp during render so a narrowed era or lane cannot strand the tab stop
  // past the end of the list.
  const focusIndex = count > 0 ? Math.min(storedIndex, count - 1) : 0;

  const moveTo = useCallback(
    (next: number) => {
      setStoredIndex(next);
      onFocusChange(next);
      containerRef.current?.querySelectorAll<HTMLButtonElement>("[data-roving-item]")[next]?.focus();
    },
    [onFocusChange],
  );

  const onKeyDown = useCallback(
    (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
      if (count === 0) return;
      const last = count - 1;
      let next: number | null = null;
      if (event.key === "ArrowDown" || event.key === "ArrowRight") next = Math.min(index + 1, last);
      else if (event.key === "ArrowUp" || event.key === "ArrowLeft") next = Math.max(index - 1, 0);
      else if (event.key === "Home") next = 0;
      else if (event.key === "End") next = last;
      if (next == null) return;
      event.preventDefault();
      moveTo(next);
    },
    [count, moveTo],
  );

  return { containerRef, focusIndex, onKeyDown, setFocusIndex: setStoredIndex };
}

/** Wire a list's roving focus to selection, keeping the tab stop on what was clicked. */
function useThreadList<T extends HTMLElement>(threads: SquadBuildThread[], onSelect: (id: string) => void) {
  const onFocusChange = useCallback(
    (index: number) => {
      const thread = threads[index];
      if (thread) onSelect(thread.id);
    },
    [threads, onSelect],
  );
  const roving = useRovingList<T>(threads.length, onFocusChange);
  const selectAt = useCallback(
    (index: number) => {
      roving.setFocusIndex(index);
      onFocusChange(index);
    },
    [roving, onFocusChange],
  );
  return { ...roving, selectAt };
}

function ThreadMark({
  thread,
  selected,
  onSelect,
  tabIndex,
  onKeyDown,
}: {
  thread: SquadBuildThread;
  selected: boolean;
  onSelect: () => void;
  tabIndex: number;
  onKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => void;
}) {
  const tone =
    thread.direction === "in"
      ? "border-devil-bright/70 bg-devil-bright/15"
      : "border-gold/70 bg-gold/10";
  // Fee is encoded by bar length as a labelled secondary mark rather than by
  // chip width, so the player name stays readable at every fee size.
  const feeWidth = thread.feeScale != null ? `${Math.max(6, Math.round(thread.feeScale * 100))}%` : null;

  return (
    <button
      type="button"
      data-roving-item
      aria-pressed={selected}
      aria-label={threadButtonLabel(thread)}
      tabIndex={tabIndex}
      onClick={onSelect}
      onKeyDown={onKeyDown}
      className={`group/thread relative block w-full rounded border px-1.5 py-1 text-left transition-[background-color,box-shadow] motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-devil-bright ${tone} ${
        selected ? "ring-2 ring-ink/30" : "hover:brightness-110"
      }`}
    >
      <span className="flex items-center gap-1">
        <span
          className={`inline-block h-0 w-0 shrink-0 border-y-[4px] border-y-transparent ${
            thread.direction === "in"
              ? "border-l-[5px] border-l-devil-bright"
              : "order-last border-r-[5px] border-r-gold"
          }`}
          aria-hidden
        />
        <span className="min-w-0 flex-1 truncate text-[11px] font-medium leading-tight text-ink">
          {familyName(thread.playerName)}
        </span>
      </span>
      <span className="mt-1 flex items-center gap-1" aria-hidden>
        <span className="h-1 min-w-px flex-1 overflow-hidden rounded-full bg-ink/10">
          {feeWidth && (
            <span
              className={`block h-full rounded-full ${
                thread.direction === "in" ? "bg-devil-bright" : "bg-gold"
              }`}
              style={{ width: feeWidth }}
            />
          )}
        </span>
        <span className="stat-num shrink-0 text-[9px] leading-none text-ink-faint">{thread.feeDisplay}</span>
      </span>
    </button>
  );
}

function DesktopTimeline({
  seasons,
  threads,
  managerBands,
  eraLabel,
  selectedId,
  onSelect,
}: {
  seasons: SquadBuildSeasonMarker[];
  threads: SquadBuildThread[];
  managerBands: SquadBuildDataset["managerBands"];
  eraLabel: string;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const { containerRef, focusIndex, onKeyDown, selectAt } = useThreadList<HTMLDivElement>(threads, onSelect);
  const lanes = LANE_ORDER.filter((lane) => laneHasThreads(threads, lane));
  const seasonIndex = new Map(seasons.map((season, index) => [season.season, index]));
  const threadIndex = new Map(threads.map((thread, index) => [thread.id, index]));
  const colTemplate = seasons.length > 0 ? `repeat(${seasons.length}, minmax(6rem, 1fr))` : "1fr";

  return (
    <div className="hidden md:block">
      <div className="overflow-x-auto rounded-lg border border-line bg-panel">
        <div className="min-w-[52rem] p-4">
          <div className="grid gap-px border-b border-line/70 pb-2" style={{ gridTemplateColumns: colTemplate }}>
            {seasons.map((season) => (
              <div key={season.season} className="px-1 text-center">
                <span className="stat-num block text-[11px] font-semibold text-ink">{season.label}</span>
                <span className="stat-num mt-0.5 block text-[10px] text-ink-faint">{finishLabel(season.leagueFinish)}</span>
                {season.honourCount > 0 && (
                  <span className="mt-0.5 inline-flex items-center gap-1 text-[10px] text-gold">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-gold" aria-hidden />
                    {trophyLabel(season.honourCount)}
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Era bands sit in their own row rather than as an overlay, so a long
              manager name can never collide with the honour markers above. */}
          <div className="mt-2 grid gap-px" style={{ gridTemplateColumns: colTemplate }}>
            {managerBands.map((band) => {
              const from = seasonIndex.get(band.fromSeason);
              const to = seasonIndex.get(band.toSeason);
              if (from == null || to == null) return null;
              return (
                <div
                  key={`${band.managerId}-${band.fromSeason}`}
                  className="truncate rounded-sm bg-panel-2 px-1.5 py-1 text-[10px] font-medium uppercase tracking-wide text-ink-faint"
                  style={{ gridColumn: `${from + 1} / ${to + 2}` }}
                >
                  {band.managerName}
                </div>
              );
            })}
          </div>

          <div ref={containerRef} role="group" aria-label={`Squad-build moves, ${eraLabel}`} className="space-y-2 pt-3">
            {lanes.map((lane) => (
              <div key={lane} className="grid items-start gap-2" style={{ gridTemplateColumns: "3.5rem 1fr" }}>
                <span className="pt-2 text-[10px] font-semibold uppercase tracking-wide text-ink-faint">{lane}</span>
                <div className="grid gap-2" style={{ gridTemplateColumns: colTemplate }}>
                  {seasons.map((season) => {
                    const cellThreads = threads.filter(
                      (thread) => thread.season === season.season && thread.position === lane,
                    );
                    return (
                      <div key={`${lane}-${season.season}`} className="space-y-1 px-0.5">
                        {cellThreads.map((thread) => {
                          const index = threadIndex.get(thread.id)!;
                          return (
                            <ThreadMark
                              key={thread.id}
                              thread={thread}
                              selected={selectedId === thread.id}
                              onSelect={() => selectAt(index)}
                              tabIndex={index === focusIndex ? 0 : -1}
                              onKeyDown={(event) => onKeyDown(event, index)}
                            />
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <p className="mt-2 text-xs leading-5 text-ink-faint">
        Bar length marks known fees within the era; every move also carries its fee label. Red threads are arrivals,
        gold threads are departures.
      </p>
    </div>
  );
}

function MobileChapters({
  seasons,
  threads,
  selectedId,
  onSelect,
}: {
  seasons: SquadBuildSeasonMarker[];
  threads: SquadBuildThread[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="space-y-3 md:hidden">
      {seasons.map((season) => {
        const seasonThreads = threads.filter((thread) => thread.season === season.season);
        if (seasonThreads.length === 0) return null;
        const arrivals = seasonThreads.filter((thread) => thread.direction === "in");
        const departures = seasonThreads.filter((thread) => thread.direction === "out");

        return (
          <article key={season.season} className="overflow-hidden rounded-lg border border-line bg-panel">
            <header className="border-b border-line/70 px-4 py-3">
              <p className="stat-num text-xs font-semibold text-devil-bright">{season.label}</p>
              <h3 className="display text-lg leading-tight text-ink">{season.managerName}</h3>
              <p className="stat-num mt-1 text-xs text-ink-faint">
                {finishLabel(season.leagueFinish)} · {arrivals.length} in · {departures.length} out
                {season.honourCount > 0 ? ` · ${trophyLabel(season.honourCount)}` : ""}
              </p>
            </header>
            <div className="grid gap-4 px-4 py-4 sm:grid-cols-2">
              {[
                { title: "Arrivals", rows: arrivals, tone: "text-devil-bright" },
                { title: "Departures", rows: departures, tone: "text-gold" },
              ].map(({ title, rows, tone }) => (
                <div key={title}>
                  <h4 className={`text-xs font-semibold uppercase tracking-[0.14em] ${tone}`}>{title}</h4>
                  <ul className="mt-2 space-y-1">
                    {rows.map((thread) => (
                      <li key={thread.id}>
                        <button
                          type="button"
                          aria-pressed={selectedId === thread.id}
                          onClick={() => onSelect(thread.id)}
                          className={`flex w-full min-h-11 items-center justify-between gap-3 rounded border px-3 py-2 text-left text-sm transition-colors motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-devil-bright ${
                            selectedId === thread.id ? "border-ink/30 bg-panel-2" : "border-line/70 hover:bg-panel-2"
                          }`}
                        >
                          <span className="min-w-0 truncate font-medium text-ink">{thread.playerName}</span>
                          <span className="stat-num shrink-0 text-xs text-ink-faint">{thread.feeDisplay}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </article>
        );
      })}
    </div>
  );
}

function OrderedLedger({
  threads,
  selectedId,
  onSelect,
}: {
  threads: SquadBuildThread[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const { containerRef, focusIndex, onKeyDown, selectAt } = useThreadList<HTMLOListElement>(threads, onSelect);

  return (
    <div className="rounded-lg border border-line bg-panel">
      <header className="border-b border-line/70 px-4 py-3">
        <h3 className="text-sm font-semibold text-ink">Ordered ledger</h3>
        <p className="mt-1 text-xs leading-5 text-ink-faint">
          The same moves in chronological order — arrow keys step through them.
        </p>
      </header>
      <ol ref={containerRef} className="max-h-80 divide-y divide-line/60 overflow-y-auto">
        {threads.map((thread, index) => (
          <li key={thread.id}>
            <button
              type="button"
              data-roving-item
              aria-pressed={selectedId === thread.id}
              tabIndex={index === focusIndex ? 0 : -1}
              onClick={() => selectAt(index)}
              onKeyDown={(event) => onKeyDown(event, index)}
              className={`flex w-full min-h-11 items-center gap-3 px-4 py-2 text-left text-sm transition-colors motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-devil-bright ${
                selectedId === thread.id ? "bg-panel-2" : "hover:bg-panel-2/70"
              }`}
            >
              <span className="stat-num w-16 shrink-0 text-xs text-ink-faint">{thread.date ?? thread.season}</span>
              <span
                className={`w-8 shrink-0 text-[10px] font-semibold uppercase tracking-wide ${
                  thread.direction === "in" ? "text-devil-bright" : "text-gold"
                }`}
              >
                {thread.direction}
              </span>
              <span className="min-w-0 flex-1 truncate font-medium text-ink">{thread.playerName}</span>
              <span className="stat-num shrink-0 text-xs text-ink-faint">{thread.feeDisplay}</span>
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}

export function SquadBuildTimeline({ datasets }: { datasets: SquadBuildDataset[] }) {
  const [eraId, setEraId] = useState<SquadBuildEraId>(datasets[0]?.era.id ?? "ferguson-early");
  const [position, setPosition] = useState<PositionFilter>(
    datasets[0]?.defaultPositionLens ? "MID" : "all",
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const dataset = useMemo(
    () => datasets.find((entry) => entry.era.id === eraId) ?? datasets[0]!,
    [datasets, eraId],
  );

  const visibleThreads = useMemo(
    () => filterSquadBuildThreads(dataset.threads, position),
    [dataset.threads, position],
  );

  const selectedThread = useMemo(
    () => visibleThreads.find((thread) => thread.id === selectedId) ?? null,
    [visibleThreads, selectedId],
  );

  // Selection resets belong in the change handlers, not effects — see
  // react-hooks/set-state-in-effect. Both era and position change only via
  // these handlers, so the reset is co-located with the trigger. Each list
  // owns its own roving focus index and clamps it, so nothing resets here.
  const selectEra = useCallback(
    (nextEra: SquadBuildEraId) => {
      setEraId(nextEra);
      // Each era carries its own density, so the default lane follows the era.
      setPosition(datasets.find((entry) => entry.era.id === nextEra)?.defaultPositionLens ? "MID" : "all");
      setSelectedId(null);
    },
    [datasets],
  );

  const selectPosition = useCallback((nextPosition: PositionFilter) => {
    setPosition(nextPosition);
    setSelectedId(null);
  }, []);

  const selectThread = useCallback((id: string) => setSelectedId(id), []);

  if (!dataset || dataset.threads.length === 0) return null;

  return (
    <section id="squad-build" aria-labelledby="squad-build-title" className="scroll-mt-28 space-y-4">
      <SectionHead
        id="squad-build-title"
        title="Squad-build timeline"
        aside="1992–present · prototype eras"
        variant="sentence"
      />
      <p className="max-w-3xl text-sm leading-6 text-ink-dim">{dataset.era.blurb}</p>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <fieldset>
          <legend className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-ink-faint">Era</legend>
          <div className="flex flex-wrap gap-2">
            {datasets.map((entry) => (
              <label
                key={entry.era.id}
                className={`inline-flex min-h-11 cursor-pointer items-center rounded-lg border px-3 py-2 text-sm transition-colors motion-reduce:transition-none has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-devil-bright ${
                  eraId === entry.era.id
                    ? "border-devil-bright bg-devil-bright/10 text-ink"
                    : "border-line bg-panel text-ink-dim hover:bg-panel-2"
                }`}
              >
                <input
                  type="radio"
                  name="squad-build-era"
                  value={entry.era.id}
                  checked={eraId === entry.era.id}
                  onChange={() => selectEra(entry.era.id)}
                  className="sr-only"
                />
                {entry.era.label}
              </label>
            ))}
          </div>
        </fieldset>

        <label className="flex min-h-11 items-center gap-2 rounded-lg border border-line bg-panel px-3 text-sm text-ink-dim has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-devil-bright">
          <span className="font-medium text-ink">Position lane</span>
          <select
            value={position}
            onChange={(event) => selectPosition(event.currentTarget.value as PositionFilter)}
            className="min-h-9 bg-transparent text-sm text-ink outline-none"
            aria-label="Filter by position lane"
          >
            {POSITION_OPTIONS.map((option) => (
              <option key={option.value} value={option.value} className="bg-panel text-ink">
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {dataset.defaultPositionLens && (
        <p className="text-xs leading-5 text-ink-faint">
          {position === "all"
            ? "This era is dense — pick a position lane if the threads become hard to follow."
            : "This era is dense, so the timeline opens on one position lane. Switch to all lanes to see every move."}
        </p>
      )}

      <div>
        <DesktopTimeline
          seasons={dataset.seasons}
          threads={visibleThreads}
          managerBands={dataset.managerBands}
          eraLabel={dataset.era.label}
          selectedId={selectedId}
          onSelect={selectThread}
        />
        <MobileChapters
          seasons={dataset.seasons}
          threads={visibleThreads}
          selectedId={selectedId}
          onSelect={selectThread}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.75fr)]">
        <OrderedLedger threads={visibleThreads} selectedId={selectedId} onSelect={selectThread} />
        <SquadBuildDealPanel thread={selectedThread} />
      </div>
    </section>
  );
}
