import { normalizedSlug, htmlDecode, type PlayersFile, type PlayerRecord } from "./player-resolver";

export function profileUrl(key: string): string {
  if (!/^[a-z0-9_]+$/.test(key)) throw new Error(`Invalid MUFCInfo player key: ${key}`);
  return `https://www.mufcinfo.com/manupag/a-z_player_archive/a-z_player_archive_pages/${key}.html`;
}

/** Require the profile to identify this person and list this match as an appearance. */
export function discoverPlayer(
  name: string, key: string, date: string, html: string,
  players: PlayersFile, records: PlayerRecord[],
): PlayersFile["players"][number] {
  const url = profileUrl(key);
  const graphs: Record<string, unknown>[] = [];
  for (const script of html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const data = JSON.parse(script[1]);
      graphs.push(...(Array.isArray(data["@graph"]) ? data["@graph"] : [data]));
    } catch { /* A malformed block cannot establish identity. */ }
  }
  const person = graphs.find((node) => node["@type"] === "Person" && node.url === url);
  const member = person?.memberOf as { "@id"?: string } | undefined;
  const heading = html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1];
  const matchLinked = [...html.matchAll(/href=["']([^"']+)["']/gi)].some((match) => {
    try {
      const link = new URL(htmlDecode(match[1]), url);
      return link.origin === "https://www.mufcinfo.com" &&
        link.pathname === "/manupag/match_data/match_sql.php" &&
        link.searchParams.get("my_match_date") === date;
    } catch { return false; }
  });
  if (!person || typeof person.name !== "string" || normalizedSlug(person.name) !== normalizedSlug(name) ||
      !heading || normalizedSlug(htmlDecode(heading)) !== normalizedSlug(name) ||
      member?.["@id"] !== "https://www.mufcinfo.com/#mufc" || !matchLinked) {
    throw new Error(`Profile does not verify ${name}'s United appearance on ${date}: ${url}`);
  }
  const mapped = players.players.filter((p) => p.mufcinfo?.key === key);
  if (mapped.length === 1 && normalizedSlug(mapped[0].name) === normalizedSlug(name)) return mapped[0];
  const id = normalizedSlug(name);
  if (!id || mapped.length || players.players.some((p) => p.id === id || normalizedSlug(p.name) === id) ||
      records.some((p) => p.playerId === id || normalizedSlug(p.name) === id)) {
    throw new Error(`Ambiguous player identity for ${name} (${key}); review ${url}`);
  }
  return { id, name: person.name, mufcinfo: { key, profileUrl: url, matchDate: date } };
}
