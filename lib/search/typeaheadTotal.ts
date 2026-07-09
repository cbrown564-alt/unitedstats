import type { ShapedAnswer } from "./intent";

export interface TypeaheadEntity {
  kind: string;
}

/** Count for live-search footers — shaped answers, myth pages, and entity matches. */
export function typeaheadTotal(
  shaped: ShapedAnswer[],
  questions: TypeaheadEntity[],
  entities: TypeaheadEntity[],
  entityTotal: number,
): number {
  const listed = shaped.length + questions.length + entities.length;
  if (listed === 0) return entityTotal;
  if (shaped.length + questions.length > 0 && entities.length === 0) {
    return shaped.length + questions.length;
  }
  return shaped.length + questions.length + Math.max(entityTotal, entities.length);
}
