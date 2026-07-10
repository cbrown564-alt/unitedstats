import {
  canonicalStringify,
  entityRef,
  matchRef,
  matchSourceProvenance,
  questionRef,
  seasonRef,
  type ClaimProvenance,
} from "./citations";
import { clubName, fmtDateLong, fmtNum, pct, playerCareerSpan, stadiumLabel, homeAwayLabel } from "./format";
import { playerUsesDefensiveProfile } from "./playerProfile";
import type { QuestionMeta } from "./questions";
import { SITE_URL } from "./site";
import type {
  ManagerRecord,
  MatchRow,
  MatchSourceRecord,
  OpponentRecord,
  PlayerTotals,
} from "./queries";
import { playerDefensiveTotals } from "./queries";

export type JsonLd = Record<string, unknown>;

export function jsonLdHtml(data: JsonLd): string {
  return canonicalStringify(data).replace(/</g, "\\u003c");
}

function sourceWork(p: ClaimProvenance): JsonLd {
  return {
    "@type": "CreativeWork",
    identifier: p.sourceId,
    name: p.sourceName,
    url: p.sourceUrl,
    about: p.facet,
    description: p.note,
  };
}

function team(name: string): JsonLd {
  return { "@type": "SportsTeam", name };
}

const MANCHESTER_UNITED = team("Manchester United");

/** Google requires Place + PostalAddress; fall back when the ground is unknown. */
function matchLocation(match: MatchRow): JsonLd {
  if (match.stadium_name) {
    const address: JsonLd = { "@type": "PostalAddress" };
    if (match.stadium_city) address.addressLocality = match.stadium_city;
    if (match.stadium_country) address.addressCountry = match.stadium_country;
    if (!match.stadium_city && !match.stadium_country) address.name = match.stadium_name;
    return { "@type": "Place", name: match.stadium_name, address };
  }

  const name =
    match.venue === "A"
      ? `${match.opponent_name} (away)`
      : match.venue === "H"
        ? "Home ground"
        : "Neutral venue";
  return {
    "@type": "Place",
    name,
    address: { "@type": "PostalAddress", name },
  };
}

function matchPerformers(match: MatchRow): JsonLd[] {
  return [team(clubName(match.date)), team(match.opponent_name)];
}

export interface SeasonCampaignSummary {
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  leaguePosition?: number | null;
}

function matchTeams(match: MatchRow): Partial<Pick<JsonLd, "homeTeam" | "awayTeam" | "competitor">> {
  const united = team(clubName(match.date));
  const opponent = team(match.opponent_name);
  if (match.venue === "H") return { homeTeam: united, awayTeam: opponent };
  if (match.venue === "A") return { homeTeam: opponent, awayTeam: united };
  return { competitor: [united, opponent] };
}

export function playerJsonLd(player: PlayerTotals): JsonLd {
  const ref = entityRef("player", player.player_id);
  const span = playerCareerSpan(player);
  const defensiveProfile = playerUsesDefensiveProfile(player.position_bucket);
  const description = defensiveProfile
    ? `${player.name} — Manchester United playing record${span ? ` from ${span}` : ""}. ${fmtNum(player.apps)} appearances and ${fmtNum(playerDefensiveTotals(player.player_id).cleanSheets)} clean sheets in matches started.`
    : `${player.name} — Manchester United playing record${span ? ` from ${span}` : ""}. ${fmtNum(player.apps)} appearances, ${fmtNum(player.goals)} goals, and ${fmtNum(player.assists)} assists.`;
  return {
    "@context": "https://schema.org",
    "@id": ref.url,
    "@type": "Person",
    identifier: ref.id,
    url: ref.url,
    name: player.name,
    description,
    memberOf: MANCHESTER_UNITED,
    ...(player.position_label ? { jobTitle: player.position_label } : {}),
  };
}

export function seasonJsonLd(season: string, summary?: SeasonCampaignSummary): JsonLd {
  const ref = seasonRef(season);
  const description = summary
    ? `Manchester United ${season} season — ${fmtNum(summary.played)} matches (${fmtNum(summary.wins)} wins, ${fmtNum(summary.draws)} draws, ${fmtNum(summary.losses)} losses), ${fmtNum(summary.goalsFor)} goals scored and ${fmtNum(summary.goalsAgainst)} conceded${summary.leaguePosition != null ? `, finished ${summary.leaguePosition} in the league` : ""}.`
    : `Manchester United campaign record for the ${season} season — matches, league table, cup runs, and managers.`;
  return {
    "@context": "https://schema.org",
    "@id": ref.url,
    "@type": "SportsSeason",
    identifier: ref.id,
    url: ref.url,
    name: `Manchester United ${season} season`,
    description,
    sport: "Association football",
    competitor: MANCHESTER_UNITED,
  };
}

export function managerJsonLd(manager: ManagerRecord): JsonLd {
  const ref = entityRef("manager", manager.id);
  const tenure = manager.first
    ? `${manager.first.slice(0, 4)}–${manager.last?.slice(0, 4) ?? "present"}`
    : null;
  return {
    "@context": "https://schema.org",
    "@id": ref.url,
    "@type": "Person",
    identifier: ref.id,
    url: ref.url,
    name: manager.name,
    jobTitle: manager.role ?? "Manager",
    description: `${manager.name} — Manchester United managerial record${tenure ? ` (${tenure})` : ""}. ${fmtNum(manager.p)} matches managed: ${pct(manager.w, manager.p)} win rate.`,
    memberOf: MANCHESTER_UNITED,
  };
}

export function opponentJsonLd(opponent: OpponentRecord): JsonLd {
  const ref = entityRef("opponent", opponent.id);
  const span = opponent.first ? ` since ${opponent.first.slice(0, 4)}` : "";
  return {
    "@context": "https://schema.org",
    "@id": ref.url,
    "@type": "SportsTeam",
    identifier: ref.id,
    url: ref.url,
    name: opponent.name,
    description: `Head-to-head record against Manchester United: ${fmtNum(opponent.p)} meetings${span}, ${pct(opponent.w, opponent.p)} United wins (${fmtNum(opponent.w)}W-${fmtNum(opponent.d)}D-${fmtNum(opponent.l)}L).`,
    competitor: MANCHESTER_UNITED,
  };
}

export function questionJsonLd(question: QuestionMeta): JsonLd {
  const ref = questionRef(question.slug);
  return {
    "@context": "https://schema.org",
    "@id": ref.url,
    "@type": "FAQPage",
    identifier: ref.id,
    url: ref.url,
    name: question.question,
    mainEntity: [
      {
        "@type": "Question",
        name: question.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: question.summary,
        },
      },
    ],
  };
}

export function websiteJsonLd(): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    name: "Red Thread",
    url: SITE_URL,
    description: "Evidence-backed Manchester United history: every match, every competition, every goal.",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function matchJsonLd(match: MatchRow, sources: MatchSourceRecord[]): JsonLd {
  const ref = matchRef(match.id);
  const provenance = sources.map((source) => matchSourceProvenance(source, match.id));
  const venue = stadiumLabel(match.stadium_name, homeAwayLabel(match.venue));
  return {
    "@context": "https://schema.org",
    "@id": ref.url,
    "@type": "SportsEvent",
    identifier: ref.id,
    url: ref.url,
    name: `${clubName(match.date)} ${match.gf}-${match.ga} ${match.opponent_name}`,
    description: `${clubName(match.date)} ${match.gf}-${match.ga} ${match.opponent_name}, ${fmtDateLong(match.date)} (${venue}).`,
    startDate: match.date,
    endDate: match.date,
    sport: "Association football",
    eventStatus: "https://schema.org/EventCompleted",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: matchLocation(match),
    image: [`${ref.url}/opengraph-image`],
    organizer: {
      "@type": "SportsOrganization",
      name: match.competition_name,
      url: SITE_URL,
    },
    performer: matchPerformers(match),
    ...matchTeams(match),
    isBasedOn: provenance.map(sourceWork),
  };
}
