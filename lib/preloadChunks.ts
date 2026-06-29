type SearchCommandModule = typeof import("@/components/SearchCommand");
type CommandPaletteModule = typeof import("@/components/CommandPalette");

let searchCommandPromise: Promise<SearchCommandModule> | null = null;
let commandPalettePromise: Promise<CommandPaletteModule> | null = null;

/** Warm the SearchCommand JS chunk without mounting it. */
export function preloadSearchCommand(): Promise<SearchCommandModule> {
  if (!searchCommandPromise) {
    searchCommandPromise = import("@/components/SearchCommand");
  }
  return searchCommandPromise;
}

/** Warm the CommandPalette JS chunk without mounting it. */
export function preloadCommandPalette(): Promise<CommandPaletteModule> {
  if (!commandPalettePromise) {
    commandPalettePromise = import("@/components/CommandPalette");
  }
  return commandPalettePromise;
}
