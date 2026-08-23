import type { MatchesCatalog } from "./catalogTypes";

let cached: MatchesCatalog | null = null;
let inflight: Promise<MatchesCatalog> | null = null;

export function loadMatchesCatalog(): Promise<MatchesCatalog> {
  if (cached) return Promise.resolve(cached);
  inflight ??= fetch("/data/matches-catalog.json")
    .then((res) => {
      if (!res.ok) throw new Error(`matches catalog ${res.status}`);
      return res.json() as Promise<MatchesCatalog>;
    })
    .then((data) => {
      cached = data;
      return data;
    });
  return inflight;
}

export function peekMatchesCatalog(): MatchesCatalog | null {
  return cached;
}
