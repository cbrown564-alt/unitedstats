import type { FilmEdition } from "../core/types";
import { EUROPEAN_MASTER_90 } from "./european-master-90";
import { EUROPEAN_POST_PUNK_EDITORIAL_90, EUROPEAN_POST_PUNK_SONG_90 } from "./european-post-punk-90";
import { MATCH_TIMELINE_24 } from "./match-timeline-24";

export const FILM_EDITIONS = [EUROPEAN_MASTER_90, EUROPEAN_POST_PUNK_EDITORIAL_90, EUROPEAN_POST_PUNK_SONG_90, MATCH_TIMELINE_24] as const satisfies readonly FilmEdition[];

export function getFilmEdition(id: string = EUROPEAN_MASTER_90.id): FilmEdition {
  const edition = FILM_EDITIONS.find((candidate) => candidate.id === id);
  if (!edition) throw new Error(`Unknown film edition: ${id}`);
  return edition;
}

export { EUROPEAN_MASTER_90, EUROPEAN_POST_PUNK_EDITORIAL_90, EUROPEAN_POST_PUNK_SONG_90, MATCH_TIMELINE_24 };
