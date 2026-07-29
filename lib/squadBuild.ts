import type { PitchBand } from "./placement";

/** Bounded squad-build eras — prototype datasets before a universal renderer. */
export type SquadBuildEraId = "ferguson-early" | "ferguson-late" | "post-ferguson";

export interface SquadBuildEra {
  id: SquadBuildEraId;
  label: string;
  blurb: string;
  /** Inclusive first season start year (e.g. 1992 → 1992–93). */
  seasonFrom: number;
  /** Inclusive last season start year (e.g. 2002 → 2002–03). */
  seasonTo: number;
  /** When thread count exceeds this, default the position lens on desktop. */
  denseThreshold: number;
}

export const SQUAD_BUILD_ERAS: SquadBuildEra[] = [
  {
    id: "ferguson-early",
    label: "Ferguson 1992–2002",
    blurb: "Premier League foundation — Cantona's lift through the Treble core.",
    seasonFrom: 1992,
    seasonTo: 2002,
    denseThreshold: 80,
  },
  {
    id: "ferguson-late",
    label: "Ferguson 2003–2013",
    blurb: "The Ronaldo years, three more titles, and the last Ferguson squad.",
    seasonFrom: 2003,
    seasonTo: 2012,
    denseThreshold: 80,
  },
  {
    id: "post-ferguson",
    label: "Post-Ferguson",
    blurb: "Rebuilds, record fees, and the market since May 2013.",
    seasonFrom: 2013,
    seasonTo: 2026,
    denseThreshold: 60,
  },
];

export interface SquadBuildThread {
  id: string;
  playerId: string | null;
  playerName: string;
  direction: "in" | "out";
  season: string;
  seasonStart: number;
  date: string | null;
  position: PitchBand | "UNK";
  positionLabel: string | null;
  feeGbp: number | null;
  feeKind: string;
  feeDisplay: string;
  club: string | null;
  type: string;
  managerId: string | null;
  managerName: string | null;
  thumbUrl: string | null;
  /** Normalised bar length within the era for known fees; null when not comparable. */
  feeScale: number | null;
}

export interface SquadBuildSeasonMarker {
  season: string;
  startYear: number;
  label: string;
  managerId: string | null;
  managerName: string;
  leagueFinish: number | null;
  honourCount: number;
  arrivals: number;
  departures: number;
}

export interface SquadBuildManagerBand {
  managerId: string;
  managerName: string;
  fromSeason: string;
  toSeason: string;
  fromYear: number;
  toYear: number;
}

export interface SquadBuildDataset {
  era: SquadBuildEra;
  seasons: SquadBuildSeasonMarker[];
  threads: SquadBuildThread[];
  managerBands: SquadBuildManagerBand[];
  maxKnownFee: number;
  /** True when the full-squad desktop view would be unreadably dense. */
  defaultPositionLens: boolean;
}

export function seasonStartYear(season: string | null | undefined): number | null {
  if (!season) return null;
  const year = Number.parseInt(season.slice(0, 4), 10);
  return Number.isFinite(year) ? year : null;
}

/** Short season label for the axis — e.g. 1998-99 → 98–99. */
export function squadBuildSeasonLabel(season: string): string {
  const end = season.includes("-") ? season.split("-")[1] : season.slice(5, 7);
  return `${season.slice(2, 4)}–${end}`;
}

export function compareSquadBuildThreads(a: SquadBuildThread, b: SquadBuildThread): number {
  const dateA = a.date ?? "";
  const dateB = b.date ?? "";
  if (dateA !== dateB) return dateA.localeCompare(dateB);
  if (a.direction !== b.direction) return a.direction === "in" ? -1 : 1;
  return a.playerName.localeCompare(b.playerName);
}

export function filterSquadBuildThreads(
  threads: SquadBuildThread[],
  position: PitchBand | "UNK" | "all",
): SquadBuildThread[] {
  if (position === "all") return threads;
  return threads.filter((thread) => thread.position === position);
}
