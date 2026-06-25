import type { ManagerRecord } from "./queries";

/**
 * Manager eras, bounded by the two longest tenures in the club's history —
 * Sir Matt Busby (1,141 matches) and Sir Alex Ferguson (1,497), the only two
 * managers past a thousand games. The boundaries are factual appointment years;
 * a manager is placed by the year of his first match in charge. Everything
 * before Busby is the secretary-manager age (the side was picked by the club
 * secretary, the role the data still records); the stretch between the two
 * reigns and the years since each carry a factual frame rather than an invented
 * name. The eras are a *reading aid over a chronological list*, not a claim —
 * the explanatory note on the page states how they are drawn.
 */
interface ManagerEra {
  key: string;
  label: string;
  /** Lower bound on a manager's first-match year, inclusive. */
  from: number;
  /** Upper bound on a manager's first-match year, exclusive (Infinity = current). */
  to: number;
}

const ERAS: ManagerEra[] = [
  { key: "secretaries", label: "The secretary-managers", from: 0, to: 1945 },
  { key: "busby", label: "The Busby era", from: 1945, to: 1969 },
  { key: "between", label: "Between Busby and Ferguson", from: 1969, to: 1986 },
  { key: "ferguson", label: "The Ferguson era", from: 1986, to: 2013 },
  { key: "after", label: "After Ferguson", from: 2013, to: Infinity },
];

/** Era for a manager's first-match year (or a season's opening year). */
export function eraForFirstMatchYear(year: number): ManagerEra {
  return ERAS.find((e) => year >= e.from && year < e.to) ?? ERAS[0]!;
}

/** Subtle left-edge accent for season ledger rows keyed by era. */
export function eraSeasonRowClass(eraKey: string): string {
  switch (eraKey) {
    case "busby":
    case "ferguson":
      return "border-l-2 border-gold/35";
    case "between":
      return "border-l-2 border-line/70";
    default:
      return "border-l border-line/40";
  }
}

export interface ManagerEraGroup {
  era: ManagerEra;
  managers: ManagerRecord[];
  p: number;
  w: number;
  d: number;
  l: number;
  /** Earliest first-match / latest last-match date across the era's managers. */
  from: string | null;
  to: string | null;
}

function firstYear(m: ManagerRecord): number {
  return m.first ? Number(m.first.slice(0, 4)) : 0;
}

/**
 * Group chronologically-sorted managers into eras, dropping any era with no
 * managers and aggregating each era's combined record and date span.
 */
export function groupManagersByEra(managers: ManagerRecord[]): ManagerEraGroup[] {
  return ERAS.map((era) => {
    const members = managers.filter((m) => {
      const y = firstYear(m);
      return y >= era.from && y < era.to;
    });
    const agg = members.reduce(
      (a, m) => ({ p: a.p + m.p, w: a.w + m.w, d: a.d + m.d, l: a.l + m.l }),
      { p: 0, w: 0, d: 0, l: 0 },
    );
    const dates = members.flatMap((m) => [m.first, m.last]).filter((x): x is string => Boolean(x));
    return {
      era,
      managers: members,
      ...agg,
      from: dates.length ? dates.reduce((a, b) => (a < b ? a : b)) : null,
      to: dates.length ? dates.reduce((a, b) => (a > b ? a : b)) : null,
    };
  }).filter((g) => g.managers.length > 0);
}
