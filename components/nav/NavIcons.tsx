import { CordGlyph } from "@/components/glyphs/cord/CordGlyph";

export type NavIconId =
  | "journey"
  | "discover"
  | "matches"
  | "seasons"
  | "players"
  | "managers"
  | "opponents"
  | "analytics"
  | "transfers"
  | "data"
  | "more";

/** Section glyphs, drawn in the Cord grammar (docs/GLYPHS.md). */
export function NavIcon({ id, className }: { id: NavIconId; className?: string }) {
  return <CordGlyph id={id} size={20} className={className} />;
}
