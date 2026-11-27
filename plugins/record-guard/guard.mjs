/**
 * The record guard's rules, kept apart from EmDash so tests can run them. An
 * editorial entry may reference the record only by an ID that exists, and a
 * slug only where code renders it (answer modules, story pages). Facts are
 * never typed into the admin; a story's night blocks read them through tokens
 * (lib/threadOfNights.ts). The guard checks a token's form and any match ID it
 * names; whether a scorer is in the match is checked against the full record
 * by the build and the publish workflow's `npm test`, as this index holds IDs only.
 *
 * `index` is plugins/record-guard/record-index.json (scripts/emdash/write-record-index.ts).
 */

/** @typedef {{ matches: string[]; players: string[]; managers: string[]; transfers: string[]; eras: string[]; questions: string[]; stories: string[] }} RecordIndex */

const THREAD_STORY = "a-thread-of-nights";
const TOKEN = /\{([a-z]+)(?::([^{}]*))?\}/g;
const NAMED = new Set(["goal", "name", "minute"]);
const SIDED = new Set(["goals", "count"]);
const MOTIFS = new Set(["single", "comeback", "torrent", "cut", "paired", "late", "shock", "reversal", "memory", "flare"]);

/** @param {unknown} value */
function blocksOf(value) {
  if (typeof value === "string") {
    try {
      value = JSON.parse(value);
    } catch {
      return null;
    }
  }
  return Array.isArray(value) ? value : value == null ? [] : null;
}

/** @param {RecordIndex} index */
export function createGuard(index) {
  const sets = Object.fromEntries(Object.entries(index).map(([k, v]) => [k, new Set(v)]));
  const subjectSet = { players: "players", managers: "managers", eras: "eras" };
  const has = (set, value) => typeof value === "string" && sets[set].has(value);

  /**
   * Problems with one entry about to be saved, as editor-facing sentences.
   * @param {string} collection
   * @param {Record<string, unknown>} content
   * @returns {string[]}
   */
  return function check(collection, content) {
    const problems = [];
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
      case "stories": {
        if (slug && !sets.stories.has(slug)) problems.push(`No story page renders "${slug}". A new story needs its page in code first.`);
        const body = blocksOf(content.body);
        if (body === null) problems.push("The body is not a list of blocks.");
        else if (body.length > 0 && slug !== THREAD_STORY) problems.push(`Only A thread of nights reads a block body; "${slug}" lays out its story in code.`);
        else body.forEach((block, i) => problems.push(...checkNight(block, i + 1)));
        break;
      }
    }
    return problems;
  };

  /**
   * @param {any} block
   * @param {number} n
   * @returns {string[]}
   */
  function checkNight(block, n) {
    const at = `Night ${n}`;
    if (!block || block._type !== "night") return [`${at} is not a night block.`];
    const problems = [];
    if (!has("matches", block.match_id)) problems.push(`${at}: unknown match ID "${block.match_id}".`);
    if (typeof block.key !== "string" || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(block.key)) problems.push(`${at}: the key must be lowercase words joined by hyphens, e.g. first-cup.`);
    if (block.side !== "left" && block.side !== "right") problems.push(`${at}: side must be left or right.`);
    if (!MOTIFS.has(block.motif)) problems.push(`${at}: unknown motif "${block.motif}".`);
    if (block.memory_src && !/^\/media\/[\w./-]+$/.test(block.memory_src)) problems.push(`${at}: the photo path must start with /media/.`);
    for (const r of Array.isArray(block.earlier) ? block.earlier : []) {
      if (!has("matches", r?.match_id)) problems.push(`${at}: unknown match ID "${r?.match_id}" in an earlier receipt.`);
    }
    for (const field of ["title", "title_anchor", "detail"]) {
      const copy = typeof block[field] === "string" ? block[field] : "";
      for (const [token, kind, arg] of copy.matchAll(TOKEN)) {
        if (NAMED.has(kind)) {
          if (!arg) problems.push(`${at}: ${token} needs a scorer's name, e.g. {${kind}:Turnbull}.`);
        } else if (SIDED.has(kind)) {
          if (arg !== "united" && arg !== "opponent") problems.push(`${at}: ${token} takes united or opponent.`);
        } else if (kind === "score") {
          if (arg !== undefined && !has("matches", arg)) problems.push(`${at}: ${token} names an unknown match ID.`);
        } else problems.push(`${at}: unknown token ${token}.`);
      }
      if (/[{}]/.test(copy.replace(TOKEN, ""))) problems.push(`${at}: a brace in the ${field.replace("_", " ")} is not a complete token.`);
    }
    return problems;
  }
}
