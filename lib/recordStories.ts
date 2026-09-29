/** Authored connections, independent of database code so shared records can use them. */
export type RecordStory = { href: string; title: string; reason: string };
const nights = new Set([
  "1909-04-24-bristol-city-n", "1948-04-24-blackpool-n", "1954-10-16-chelsea-a",
  "1976-05-01-southampton-n", "1983-05-26-brighton-and-hove-albion-n", "1985-05-18-everton-n",
  "1995-09-20-york-city-h", "2001-09-29-tottenham-hotspur-a", "2016-05-21-crystal-palace-n", "2024-03-17-liverpool-h",
]);
export function recordStories(kind: "match" | "player" | "opponent", id: string, season?: string): RecordStory[] {
  if (kind === "player" && ["george-best", "cristiano-ronaldo"].includes(id)) return [{ href: "/stories/two-no-7s", title: "Two No. 7s", reason: "Best and Ronaldo: their highest-scoring United seasons, forty years apart." }];
  if (kind === "match" && nights.has(id)) return [{ href: "/stories/a-thread-of-nights", title: "A thread of nights", reason: "This match is one of ten nights in the story. See what made it matter." }];
  if (season === "1998-99" || (kind === "player" && ["ole-gunnar-solskjaer", "teddy-sheringham", "andy-cole", "david-beckham", "ryan-giggs", "paul-scholes"].includes(id))) return [{ href: "/stories/eleven-days-in-may", title: "Eleven days in May", reason: "How three must-win matches completed the Treble." }];
  if (kind === "player" && id === "wayne-rooney") return [{ href: "/compare?mode=players&a=wayne-rooney&b=bobby-charlton", title: "Rooney and Charlton", reason: "Two record scorers. Compare the goals, appearances and eras behind their totals." }];
  return [{ href: "/explore", title: "Find your next story", reason: "Choose a story, a question or a comparison from United’s history." }];
}
