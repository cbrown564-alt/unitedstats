"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
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
  const minWidth = thread.feeScale != null ? `${Math.max(18, Math.round(thread.feeScale * 100))}%` : "2.5rem";
  const tone =
    thread.direction === "in"
      ? "border-devil-bright/70 bg-devil-bright/15 text-devil-bright"
      : "border-gold/70 bg-gold/10 text-gold";

  return (
    <button
      type="button"
      role="option"
      aria-selected={selected}
      aria-label={threadButtonLabel(thread)}
      tabIndex={tabIndex}
      onClick={onSelect}
      onKeyDown={onKeyDown}
      className={`group/thread relative flex min-h-9 w-full items-center gap-1.5 rounded border px-1.5 py-1 text-left transition-[background-color,box-shadow] motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-devil-bright ${tone} ${
        selected ? "ring-2 ring-ink/30" : "hover:brightness-110"
      }`}
      style={{ maxWidth: minWidth }}
    >
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
      <span className="stat-num shrink-0 text-[10px] leading-none text-ink-faint">{thread.feeDisplay}</span>
    </button>
  );
}

function DesktopTimeline({
  seasons,
  threads,
  managerBands,
  selectedId,
  onSelect,
  onKeyDown,
  focusIndex,
}: {
  seasons: SquadBuildSeasonMarker[];
  threads: SquadBuildThread[];
  managerBands: SquadBuildDataset["managerBands"];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onKeyDown: (event: KeyboardEvent<HTMLButtonElement>, index: number) => void;
  focusIndex: number;
}) {
  const lanes = LANE_ORDER.filter((lane) => laneHasThreads(threads, lane));
  const seasonIndex = new Map(seasons.map((season, index) => [season.season, index]));
  const colTemplate = seasons.length > 0 ? `repeat(${seasons.length}, minmax(4.5rem, 1fr))` : "1fr";

  return (
    <div className="hidden md:block">
      <div className="overflow-x-auto rounded-lg border border-line bg-panel">
        <div className="min-w-[42rem] p-4">
          <div className="relative">
            <div
              className="pointer-events-none absolute inset-x-0 top-8 grid gap-px"
              style={{ gridTemplateColumns: colTemplate, height: "calc(100% - 2rem)" }}
              aria-hidden
            >
              {managerBands.map((band) => {
                const from = seasonIndex.get(band.fromSeason);
                const to = seasonIndex.get(band.toSeason);
                if (from == null || to == null) return null;
                return (
                  <div
                    key={`${band.managerId}-${band.fromSeason}`}
                    className="rounded-sm bg-panel-2/80"
                    style={{ gridColumn: `${from + 1} / ${to + 2}` }}
                  >
                    <span className="block px-1 py-1 text-[10px] font-medium uppercase tracking-wide text-ink-faint">
                      {band.managerName}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="relative grid gap-px border-b border-line/70 pb-2" style={{ gridTemplateColumns: colTemplate }}>
              {seasons.map((season) => (
                <div key={season.season} className="px-1 text-center">
                  <span className="stat-num block text-[11px] font-semibold text-ink">{season.label}</span>
                  <span className="stat-num mt-0.5 block text-[10px] text-ink-faint">{finishLabel(season.leagueFinish)}</span>
                  {season.honourCount > 0 && (
                    <span className="mt-0.5 inline-flex items-center gap-1 text-[10px] text-gold">
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-gold" aria-hidden />
                      {season.honourCount} trophy{season.honourCount === 1 ? "" : "ies"}
                    </span>
                  )}
                </div>
              ))}
            </div>

            <div className="relative space-y-2 pt-3">
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
                            const index = threads.findIndex((entry) => entry.id === thread.id);
                            return (
                              <ThreadMark
                                key={thread.id}
                                thread={thread}
                                selected={selectedId === thread.id}
                                onSelect={() => onSelect(thread.id)}
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
  onKeyDown,
  focusIndex,
}: {
  seasons: SquadBuildSeasonMarker[];
  threads: SquadBuildThread[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onKeyDown: (event: KeyboardEvent<HTMLButtonElement>, index: number) => void;
  focusIndex: number;
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
                {season.honourCount > 0 ? ` · ${season.honourCount} trophy${season.honourCount === 1 ? "" : "ies"}` : ""}
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
                    {rows.map((thread) => {
                      const index = threads.findIndex((entry) => entry.id === thread.id);
                      return (
                        <li key={thread.id}>
                          <button
                            type="button"
                            aria-pressed={selectedId === thread.id}
                            tabIndex={index === focusIndex ? 0 : -1}
                            onClick={() => onSelect(thread.id)}
                            onKeyDown={(event) => onKeyDown(event, index)}
                            className={`flex w-full min-h-11 items-center justify-between gap-3 rounded border px-3 py-2 text-left text-sm transition-colors motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-devil-bright ${
                              selectedId === thread.id ? "border-ink/30 bg-panel-2" : "border-line/70 hover:bg-panel-2"
                            }`}
                          >
                            <span className="min-w-0 truncate font-medium text-ink">{thread.playerName}</span>
                            <span className="stat-num shrink-0 text-xs text-ink-faint">{thread.feeDisplay}</span>
                          </button>
                        </li>
                      );
                    })}
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
  onKeyDown,
  focusIndex,
}: {
  threads: SquadBuildThread[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onKeyDown: (event: KeyboardEvent<HTMLButtonElement>, index: number) => void;
  focusIndex: number;
}) {
  return (
    <div className="rounded-lg border border-line bg-panel">
      <header className="border-b border-line/70 px-4 py-3">
        <h3 className="text-sm font-semibold text-ink">Ordered ledger</h3>
        <p className="mt-1 text-xs leading-5 text-ink-faint">
          The same moves in chronological order — keyboard selection follows this list.
        </p>
      </header>
      <ol className="max-h-80 divide-y divide-line/60 overflow-y-auto">
        {threads.map((thread, index) => (
          <li key={thread.id}>
            <button
              type="button"
              aria-pressed={selectedId === thread.id}
              tabIndex={index === focusIndex ? 0 : -1}
              onClick={() => onSelect(thread.id)}
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
  const [position, setPosition] = useState<PositionFilter>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [focusIndex, setFocusIndex] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    setPosition(dataset.defaultPositionLens ? "MID" : "all");
    setSelectedId(null);
    setFocusIndex(0);
  }, [dataset.era.id, dataset.defaultPositionLens]);

  useEffect(() => {
    setSelectedId(null);
    setFocusIndex(0);
  }, [position]);

  const selectThread = useCallback(
    (id: string) => {
      setSelectedId(id);
      const index = visibleThreads.findIndex((thread) => thread.id === id);
      if (index >= 0) setFocusIndex(index);
    },
    [visibleThreads],
  );

  const handleListKeyDown = useCallback(
    (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
      if (event.key === "ArrowDown" || event.key === "ArrowRight") {
        event.preventDefault();
        const next = Math.min(index + 1, visibleThreads.length - 1);
        setFocusIndex(next);
        setSelectedId(visibleThreads[next]?.id ?? null);
        return;
      }
      if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
        event.preventDefault();
        const prev = Math.max(index - 1, 0);
        setFocusIndex(prev);
        setSelectedId(visibleThreads[prev]?.id ?? null);
        return;
      }
      if (event.key === "Home") {
        event.preventDefault();
        setFocusIndex(0);
        setSelectedId(visibleThreads[0]?.id ?? null);
        return;
      }
      if (event.key === "End") {
        event.preventDefault();
        const last = visibleThreads.length - 1;
        setFocusIndex(last);
        setSelectedId(visibleThreads[last]?.id ?? null);
      }
    },
    [visibleThreads],
  );

  useEffect(() => {
    const node = listRef.current?.querySelector<HTMLButtonElement>(`button[tabindex="0"]`);
    node?.focus();
  }, [focusIndex, eraId, position]);

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
                  onChange={() => setEraId(entry.era.id)}
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
            onChange={(event) => setPosition(event.currentTarget.value as PositionFilter)}
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

      {dataset.defaultPositionLens && position === "all" && (
        <p className="text-xs leading-5 text-ink-faint">
          This era is dense — the timeline defaults to one position lane so the threads stay legible.
        </p>
      )}

      <div ref={listRef} role="listbox" aria-label={`Squad-build moves, ${dataset.era.label}`}>
        <DesktopTimeline
          seasons={dataset.seasons}
          threads={visibleThreads}
          managerBands={dataset.managerBands}
          selectedId={selectedId}
          onSelect={selectThread}
          onKeyDown={handleListKeyDown}
          focusIndex={focusIndex}
        />
        <MobileChapters
          seasons={dataset.seasons}
          threads={visibleThreads}
          selectedId={selectedId}
          onSelect={selectThread}
          onKeyDown={handleListKeyDown}
          focusIndex={focusIndex}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.75fr)]">
        <OrderedLedger
          threads={visibleThreads}
          selectedId={selectedId}
          onSelect={selectThread}
          onKeyDown={handleListKeyDown}
          focusIndex={focusIndex}
        />
        <SquadBuildDealPanel thread={selectedThread} />
      </div>
    </section>
  );
}
