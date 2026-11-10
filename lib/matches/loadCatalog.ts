import type { MatchesCatalog } from "./catalogTypes";
import { decodeMatchesCatalog, type MatchesCatalogWire } from "./catalogWire";

let cached: MatchesCatalog | null = null;
let inflight: Promise<MatchesCatalog> | null = null;

export function loadMatchesCatalog(): Promise<MatchesCatalog> {
  if (cached) return Promise.resolve(cached);
  inflight ??= fetch("/data/matches-catalog.v2.json")
    .then((res) => {
      if (!res.ok) throw new Error(`matches catalog ${res.status}`);
      return res.json() as Promise<MatchesCatalogWire>;
    })
    .then(async (data) => {
      cached = await decodeMatchesCatalog(data);
      return cached;
    }).catch((error) => {
      inflight = null;
      throw error;
    });
  return inflight;
}

export function peekMatchesCatalog(): MatchesCatalog | null {
  return cached;
}
