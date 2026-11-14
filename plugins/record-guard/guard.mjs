/**
 * The record guard's rules, kept apart from EmDash so tests can run them. An
 * editorial entry may reference the record only by an ID that exists, and a
 * slug only where code renders it (answer modules, story bodies). Facts are
 * never typed into the admin, so there is nothing else to check here.
 *
 * `index` is plugins/record-guard/record-index.json (scripts/emdash/write-record-index.ts).
 */

/** @typedef {{ matches: string[]; players: string[]; managers: string[]; transfers: string[]; eras: string[]; questions: string[]; stories: string[] }} RecordIndex */

/** @param {RecordIndex} index */
export function createGuard(index) {
  const sets = Object.fromEntries(Object.entries(index).map(([k, v]) => [k, new Set(v)]));
  const subjectSet = { players: "players", managers: "managers", eras: "eras" };

  /**
   * Problems with one entry about to be saved, as editor-facing sentences.
   * @param {string} collection
   * @param {Record<string, unknown>} content
   * @returns {string[]}
   */
  return function check(collection, content) {
    const problems = [];
    const has = (set, value) => typeof value === "string" && sets[set].has(value);
    const slug = typeof content.slug === "string" && content.slug ? content.slug : null;
    switch (collection) {
      case "nights":
        if (!has("matches", content.match_id)) problems.push(`Unknown match ID "${content.match_id}". Use an ID from the record, e.g. 1999-05-26-bayern-munich-n.`);
        break;
      case "transfer_notes":
        if (!has("transfers", content.transfer_id)) problems.push(`Unknown transfer ID "${content.transfer_id}". Use an ID from the transfers record.`);
        break;
      case "debates": {
        const set = subjectSet[/** @type {string} */ (content.mode)];
        if (!set) {
          problems.push(`Unknown mode "${content.mode}".`);
          break;
        }
        for (const side of ["a", "b"]) {
          if (!has(set, content[side])) problems.push(`Subject ${side.toUpperCase()} "${content[side]}" is not a known ${set.slice(0, -1)} ID.`);
        }
        if (content.a && content.a === content.b) problems.push("Subjects A and B are the same.");
        break;
      }
      case "questions":
        if (slug && !sets.questions.has(slug)) problems.push(`No answer module renders "${slug}". A question's slug must match one in components/QuestionModules.tsx.`);
        break;
      case "stories":
        if (slug && !sets.stories.has(slug)) problems.push(`No story body renders "${slug}". Story bodies stay in code until Phase 4.`);
        break;
    }
    return problems;
  };
}
