import type { FilmEdition } from "../core/types";
import { EUROPEAN_MASTER_90 } from "./european-master-90";

export const EUROPEAN_POST_PUNK_EDITORIAL_90 = {
  ...EUROPEAN_MASTER_90,
  id: "european-post-punk-editorial-90",
  title: "European master · post-punk editorial",
  audioPlanId: "post-punk-editorial",
} as const satisfies FilmEdition;

export const EUROPEAN_POST_PUNK_SONG_90 = {
  ...EUROPEAN_MASTER_90,
  id: "european-post-punk-song-90",
  title: "European master · post-punk song",
  audioPlanId: "post-punk-song",
} as const satisfies FilmEdition;
