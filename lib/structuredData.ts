import { canonicalStringify, matchRef, matchSourceProvenance, type ClaimProvenance } from "./citations";
import { clubName, fmtDateLong, venueLabel } from "./format";
import { digestSummary, digestTitle, type HistoryDigest } from "./historyDigests";
import type { MatchRow, MatchSourceRecord } from "./queries";

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

function matchTeams(match: MatchRow): Partial<Pick<JsonLd, "homeTeam" | "awayTeam" | "competitor">> {
  const united = team(clubName(match.date));
  const opponent = team(match.opponent_name);
  if (match.venue === "H") return { homeTeam: united, awayTeam: opponent };
  if (match.venue === "A") return { homeTeam: opponent, awayTeam: united };
  return { competitor: [united, opponent] };
}

export function matchJsonLd(match: MatchRow, sources: MatchSourceRecord[]): JsonLd {
  const ref = matchRef(match.id);
  const provenance = sources.map((source) => matchSourceProvenance(source, match.id));
  const venue = venueLabel(match.venue);
  return {
    "@context": "https://schema.org",
    "@id": ref.url,
    "@type": "SportsEvent",
    identifier: ref.id,
    url: ref.url,
    name: `${clubName(match.date)} ${match.gf}-${match.ga} ${match.opponent_name}`,
    description: `${clubName(match.date)} ${match.gf}-${match.ga} ${match.opponent_name}, ${fmtDateLong(match.date)} (${venue}).`,
    startDate: match.date,
    sport: "Association football",
    eventStatus: "https://schema.org/EventCompleted",
    location: match.stadium_name ? { "@type": "Place", name: match.stadium_name } : undefined,
    ...matchTeams(match),
    isBasedOn: provenance.map(sourceWork),
  };
}

export function historyDigestJsonLd(digest: HistoryDigest): JsonLd {
  return {
    "@context": "https://schema.org",
    "@id": digest.ref.url,
    "@type": "CreativeWork",
    identifier: digest.ref.id,
    url: digest.ref.url,
    name: digestTitle(digest),
    description: digestSummary(digest),
    version: digest.claimVersion,
    about: {
      "@id": matchRef(digest.matchId).url,
      "@type": "SportsEvent",
      identifier: matchRef(digest.matchId).id,
      name: `${digest.match.score} ${digest.match.opponent}`,
    },
    citation: digest.evidenceLinks.map((link) => link.url),
    isBasedOn: digest.provenance.map(sourceWork),
  };
}
