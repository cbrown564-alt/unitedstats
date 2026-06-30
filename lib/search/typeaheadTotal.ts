import type { ShapedAnswer } from "./intent";

export interface TypeaheadEntity {
  kind: string;
}

/** Count for live-search footers — shaped answers plus entity matches. */
export function typeaheadTotal(
  shaped: ShapedAnswer[],
  entities: TypeaheadEntity[],
  entityTotal: number,
): number {
  const listed = shaped.length + entities.length;
  if (listed === 0) return entityTotal;
  if (shaped.length > 0 && entities.length === 0) return shaped.length;
  return shaped.length + Math.max(entityTotal, entities.length);
}
