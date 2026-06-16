/**
 * Shared player-name resolution for the MUFCInfo ingest lanes
 * (scripts/ingest/mufcinfo-events.ts and mufcinfo-lineups.ts).
 *
 * Both lanes resolve a source label (a "Surname, First" string and/or an
 * archive href slug) to a canonical United player id, using players.json plus
 * player-records.json with slug / wiki-title / nickname / career-window
 * matching. This module owns that toolkit so the two lanes can't drift.
 */
import { slugify } from "./lib";

export interface PlayerRecord {
  playerId: string;
  name: string;
  wikiTitle?: string | null;
  firstYear?: number | null;
  lastYear?: number | null;
}

export interface PlayersFile {
  players: { id: string; name: string; positions?: string[] | null; nationality?: string | null; born?: string | null }[];
}

export interface ResolvedPlayer {
  playerId: string;
  name: string;
  inPlayers: boolean;
}

const NICKNAMES: Record<string, string[]> = {
  alex: ["alexander", "sandy"],
  alf: ["alfred"],
  andy: ["andrew"],
  bert: ["albert", "herbert", "robert", "thomas"],
  bill: ["billy", "will", "william", "willie"],
  billy: ["bill", "will", "william", "willie"],
  bob: ["robert"],
  bobby: ["bob", "robert"],
  charlie: ["charles"],
  dick: ["ernest", "richard"],
  fred: ["frederick"],
  freddie: ["frederick"],
  harry: ["henry"],
  jack: ["john"],
  jackie: ["jack", "john"],
  jim: ["james", "jimmy"],
  jimmy: ["james", "jim"],
  joe: ["joseph"],
  johnny: ["john"],
  matthew: ["matt"],
  pat: ["patrick", "paddy"],
  paddy: ["pat", "patrick"],
  ray: ["raymond"],
  ronnie: ["ron", "ronald"],
  sandy: ["alex", "alexander"],
  teddy: ["edward", "ted"],
  tom: ["thomas", "tommy"],
  tommy: ["thomas", "tom"],
  will: ["bill", "billy", "william", "willie"],
  william: ["bill", "billy", "will", "willie"],
  willie: ["bill", "billy", "will", "william"],
};

export function htmlDecode(value: string): string {
  return value
    .replace(/&quot;/g, "\"")
    .replace(/&#039;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function cleanPersonName(name: string): string {
  return name
    .replace(/"/g, "")
    .replace(/\bJnr\b\.?/i, "Jr")
    .replace(/\bSnr\b\.?/i, "Sr")
    .replace(/\s+/g, " ")
    .trim();
}

/** Turn a "Surname, First" label into "First Surname" display form. */
export function displayName(lastFirst: string): string {
  const cleaned = cleanPersonName(htmlDecode(lastFirst));
  const parts = cleaned.split(",").map((part) => part.trim()).filter(Boolean);
  return parts.length >= 2 ? `${parts.slice(1).join(" ")} ${parts[0]}` : cleaned;
}

/** Slug that folds the Nordic/Icelandic letters slugify would otherwise drop. */
export function normalizedSlug(name: string): string {
  return slugify(
    cleanPersonName(name)
      .replace(/æ/g, "ae").replace(/Æ/g, "Ae")
      .replace(/ø/g, "o").replace(/Ø/g, "O")
      .replace(/ð/g, "d").replace(/Ð/g, "D")
      .replace(/þ/g, "th").replace(/Þ/g, "Th"),
  );
}

/** Split a name into its first/last slug tokens, or null if it has fewer than two. */
export function nameParts(name: string): { first: string; last: string } | null {
  const parts = normalizedSlug(name).split("-").filter(Boolean);
  if (parts.length < 2) return null;
  return { first: parts[0], last: parts[parts.length - 1] };
}

/** True when two first-name slugs match directly or via the nickname table. */
export function compatibleFirstNames(a: string, b: string): boolean {
  if (a === b) return true;
  return (NICKNAMES[a] ?? []).includes(b) || (NICKNAMES[b] ?? []).includes(a);
}

/** True when `year` falls within a record's career window (±1 season slack). */
export function careerContains(record: PlayerRecord, year: number): boolean {
  const first = record.firstYear ?? 0;
  const last = record.lastYear ?? 9999;
  return year >= first - 1 && year <= last + 1;
}

/** Reorder an archive href slug ("smith_john_42" -> "john smith") to a name slug. */
function hrefSlug(hrefKey: string | null): string | null {
  if (!hrefKey) return null;
  const parts = hrefKey.split("_").filter(Boolean);
  if (parts.length < 2) return null;
  const suffix = /^\d+$/.test(parts[parts.length - 1]) ? parts.slice(1, -1) : parts.slice(1);
  return normalizedSlug([...suffix, parts[0]].join(" "));
}

export interface PlayerResolver {
  /** Resolve a known id, name-slug, or wiki-title-slug directly to a person. */
  directFor: (id: string | null | undefined) => ResolvedPlayer | null;
  /**
   * Resolve a free-text name (and optional href slug) within a season `year`:
   * tries direct slug/href hits, then a unique surname + compatible-first-name
   * match constrained to the player's career window.
   */
  resolve: (name: string, hrefKey: string | null, year: number) => ResolvedPlayer | null;
}

export function createPlayerResolver(playersFile: PlayersFile, records: PlayerRecord[]): PlayerResolver {
  const inPlayers = new Set(playersFile.players.map((p) => p.id));
  const people = new Map<string, ResolvedPlayer>();
  for (const player of playersFile.players) {
    const resolved = { playerId: player.id, name: player.name, inPlayers: true };
    people.set(player.id, resolved);
    people.set(normalizedSlug(player.name), resolved);
  }
  for (const record of records) {
    const resolved = { playerId: record.playerId, name: record.name, inPlayers: inPlayers.has(record.playerId) };
    people.set(record.playerId, resolved);
    people.set(normalizedSlug(record.name), resolved);
    if (record.wikiTitle) people.set(normalizedSlug(record.wikiTitle.replace(/\(.+\)$/, "")), resolved);
  }

  const directFor = (id: string | null | undefined): ResolvedPlayer | null =>
    id ? people.get(id) ?? people.get(normalizedSlug(id)) ?? null : null;

  const resolve = (name: string, hrefKey: string | null, year: number): ResolvedPlayer | null => {
    const direct = directFor(normalizedSlug(name)) ?? directFor(hrefSlug(hrefKey));
    if (direct) return direct;

    const parsed = nameParts(name);
    if (!parsed) return null;
    const candidates = records.filter((record) => {
      if (!careerContains(record, year)) return false;
      const recordParts = nameParts(record.name);
      if (!recordParts) return false;
      return parsed.last === recordParts.last && compatibleFirstNames(parsed.first, recordParts.first);
    });
    return candidates.length === 1 ? directFor(candidates[0].playerId) : null;
  };

  return { directFor, resolve };
}
