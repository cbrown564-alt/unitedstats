import fs from "node:fs";
import path from "node:path";
import type { CpiIndex, InflationIndices, PlFootballIndex } from "./inflation";

const CANONICAL = path.join(process.cwd(), "data", "canonical");

let cache: InflationIndices | null = null;

/** Load CPI and PL football inflation indices from canonical JSON — server only. */
export function loadInflationIndices(): InflationIndices {
  if (cache) return cache;
  const cpi = JSON.parse(fs.readFileSync(path.join(CANONICAL, "uk-cpi.json"), "utf8")) as CpiIndex;
  const football = JSON.parse(
    fs.readFileSync(path.join(CANONICAL, "pl-football-inflation.json"), "utf8"),
  ) as PlFootballIndex;
  cache = { cpi, football };
  return cache;
}

/** Clear module cache — tests only. */
export function resetInflationCache(): void {
  cache = null;
}
