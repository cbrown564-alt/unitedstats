import type { Metadata } from "next";
import { clubNames, opponentNames } from "./clubNames";
import { isMarketTransfer } from "./transferTaxonomy";
import {
  clubName,
  fmtDate,
  fmtDateLong,
  fmtNum,
  fmtRound,
  playerCareerSpan,
  scoreline,
  stadiumLabel,
  homeAwayLabel,
  pct,
} from "./format";
import type { MatchRow, ManagerRecord, OpponentRecord, PlayerTotals } from "./queries";
import type { OnThisDayEntry } from "./onThisDay";

const TREBLE_SEASON = "1998-99";

/** Page title + description with matching Open Graph fields. */
export function seoMetadata(title: string, description: string, extra?: Metadata): Metadata {
  const { openGraph: ogExtra, ...rest } = extra ?? {};
  return {
    title,
    description,
    ...rest,
    openGraph: {
      title: `${title} · Red Thread`,
      description,
      ...ogExtra,
    },
  };
}

function matchScore(m: MatchRow): string {
  const pens = m.pen_gf != null ? ([m.pen_gf, m.pen_ga] as [number, number]) : null;
  return scoreline(m.gf, m.ga, pens, !!m.aet);
}

function competitionPhrase(m: MatchRow): string {
  const round = fmtRound(m.round);
  const isFinal = round && /final/i.test(round) && !/(semi|quarter)/i.test(round);
  if (isFinal) return `${m.competition_name} final`;
  if (round) return `${m.competition_name}, ${round}`;
  return m.competition_name;
}

export function matchSeoTitle(m: MatchRow): string {
  const club = clubNames(m.date).full;
  const opp = opponentNames(m.opponent_id, m.opponent_name).full;
  return `${club} ${matchScore(m)} ${opp} (${fmtDate(m.date)})`;
}

export function matchSeoDescription(m: MatchRow): string {
  const club = clubNames(m.date).full;
  const opp = opponentNames(m.opponent_id, m.opponent_name).full;
  const result = m.outcome === "W" ? "won" : m.outcome === "L" ? "lost" : "drew";
  const ground = stadiumLabel(m.stadium_name, homeAwayLabel(m.venue));
  return `${fmtDateLong(m.date)} — ${club} ${result} ${matchScore(m)} against ${opp} in the ${competitionPhrase(m)} at ${ground}.`;
}

export function playerSeoTitle(p: PlayerTotals): string {
  return `${p.name} — Manchester United stats & career record`;
}

export type PlayerSeoExtras = {
  defensive?: boolean;
  cleanSheets?: number;
};

export function playerSeoDescription(p: PlayerTotals, extras?: PlayerSeoExtras): string {
  const span = playerCareerSpan(p);
  const spanClause = span ? ` (${span})` : "";
  if (extras?.defensive) {
    return `${p.name} — Manchester United stats${spanClause}. ${fmtNum(p.apps)} appearances and ${fmtNum(extras.cleanSheets ?? 0)} clean sheets in matches started.`;
  }
  return `${p.name} — Manchester United stats${spanClause}. ${fmtNum(p.apps)} appearances, ${fmtNum(p.goals)} goals, and ${fmtNum(p.assists)} assists.`;
}

export function seasonSeoTitle(season: string): string {
  if (season === TREBLE_SEASON) {
    return `Manchester United ${season} treble season results`;
  }
  return `Manchester United ${season} season results`;
}

export function seasonSeoDescription(season: string): string {
  if (season === TREBLE_SEASON) {
    return `Manchester United's treble-winning ${season} season — Premier League, FA Cup and Champions League results, table, and every match.`;
  }
  return `Manchester United ${season} season results — matches, league table, cup runs, goals, and managers.`;
}

export function managerSeoTitle(m: ManagerRecord): string {
  return `${m.name} — Manchester United managerial record`;
}

export function managerSeoDescription(m: ManagerRecord): string {
  return `${m.name} — Manchester United managerial record. ${fmtNum(m.p)} matches managed with a ${pct(m.w, m.p)} win rate.`;
}

export function clubTransferSeoTitle(clubName: string): string {
  return `Manchester United and ${clubName} — transfer relationship`;
}

export function clubTransferSeoDescription(
  clubName: string,
  transfers: import("./queries").TransferRow[],
  clubId: string,
): string {
  // Same market predicate the route gate uses, so the description can never
  // describe a different set of deals than the page generated from.
  const rows = transfers.filter((t) => t.club_id === clubId && isMarketTransfer(t));
  const arrivals = rows.filter((t) => t.direction === "in").length;
  const departures = rows.filter((t) => t.direction === "out").length;
  return `Every recorded market transfer between Manchester United and ${clubName}: ${fmtNum(arrivals)} arrivals, ${fmtNum(departures)} departures, and known fees where published.`;
}

export function opponentSeoTitle(o: OpponentRecord): string {
  return `Manchester United vs ${o.name} — head to head record`;
}

export function opponentSeoDescription(o: OpponentRecord): string {
  const since = o.first?.slice(0, 4) ?? "";
  return `Manchester United vs ${o.name} head to head. ${fmtNum(o.p)} meetings${since ? ` since ${since}` : ""}: ${pct(o.w, o.p)} wins, ${fmtNum(o.gf)} goals scored and ${fmtNum(o.ga)} conceded.`;
}

export function onThisDaySeoTitle(entry: OnThisDayEntry): string {
  return `Manchester United on this day — ${entry.label}`;
}

export function onThisDaySeoDescription(entry: OnThisDayEntry): string {
  if (entry.lead) {
    const club = clubName(entry.lead.date);
    const highlight = `${entry.lead.year} — ${club} ${entry.lead.gf}–${entry.lead.ga} ${entry.lead.opponent}`;
    return `Manchester United on ${entry.label}: ${highlight}. ${entry.rhythm?.played ?? 0} matches on this date across the years.`;
  }
  if (entry.moment.kind === "transfer") {
    return `Manchester United on ${entry.label}: ${entry.moment.playerName} ${entry.moment.direction === "in" ? "joined" : "left"} the club in ${entry.moment.year}.`;
  }
  if (entry.moment.kind === "debut") {
    return `Manchester United on ${entry.label}: ${entry.moment.playerName} made a first recorded appearance in ${entry.moment.year}.`;
  }
  return `Manchester United on ${entry.label}: no exact canonical moment is recorded; the page shows the nearby ${entry.moment.match.year} match against ${entry.moment.match.opponent}.`;
}

/** Fan-search titles and descriptions for list and discovery pages. */
export const listSeo = {
  explore: {
    title: "Discover Manchester United history",
    description:
      "Authored questions and curated player and manager comparisons, each backed by Manchester United's match record since 1886.",
  },
  matches: {
    title: "Manchester United match results & fixture record",
    description:
      "Browse and filter every Manchester United match since 1886 — results, scores, opponents, competitions, and managers.",
  },
  players: {
    title: "Manchester United players — stats, appearances & goals",
    description:
      "Every player to appear for Manchester United since 1886 — searchable by appearances, goals, assists, and career span.",
  },
  managers: {
    title: "Manchester United managers — records & win rates",
    description:
      "Every Manchester United manager since 1892 — match records, win rates, trophies, and the longest title-winning reigns.",
  },
  seasons: {
    title: "Manchester United seasons — results, tables & honours",
    description:
      "Every Manchester United season since 1892 — league finishes, cup campaigns, treble seasons, and honours decade by decade.",
  },
  compare: {
    title: "Compare Manchester United players & managers",
    description:
      "Curated Manchester United player and manager debates on role-appropriate measures, with coverage limits and match evidence.",
  },
  transfers: {
    title: "Manchester United Transfer History — Every Signing and Sale",
    description:
      "Manchester United transfer history from 1883 to 2026 — every recorded signing and sale, with published fees separated from free, undisclosed, and unknown deals.",
  },
  surprise: {
    title: "Surprise Manchester United facts",
    description:
      "Rediscover one charged Manchester United match-night, with the reason it matters and a link to the full record.",
  },
} as const;
