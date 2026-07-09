/**
 * Deterministic copy-smell patterns from docs/COPY-RUBRIC.md.
 * Used by `npm run copy:lint` — flags for human review, not auto-rejects.
 */

export type CopySmellId =
  | "carried-the"
  | "journey"
  | "legacy"
  | "tapestry"
  | "storied"
  | "iconic"
  | "delve"
  | "dive-into"
  | "unpack"
  | "explore-the-rich"
  | "in-a-world-where"
  | "when-it-comes-to"
  | "worth-noting"
  | "needless-to-say"
  | "end-of-the-day"
  | "testament"
  | "etched-into"
  | "forever-remembered"
  | "beautiful-game"
  | "proves"
  | "official-affiliation"
  | "every-fan-knows"
  | "grew-up-hearing"
  | "you-still-hear"
  | "stats-database";

export interface CopySmellRule {
  id: CopySmellId;
  /** Human label for CLI output. */
  label: string;
  /** Case-insensitive match against catalog text. */
  pattern: RegExp;
}

/**
 * Ordered smell list. Prefer specific patterns over bare words that collide
 * with honest product vocabulary (e.g. "official match" is fine; club
 * "official" affiliation is not).
 */
export const COPY_SMELL_RULES: CopySmellRule[] = [
  {
    id: "carried-the",
    label: "carried the season/night",
    pattern: /\bcarried the (season|night)\b/i,
  },
  { id: "journey", label: "journey", pattern: /\bjourney\b/i },
  { id: "legacy", label: "legacy", pattern: /\blegacy\b/i },
  { id: "tapestry", label: "tapestry", pattern: /\btapestry\b/i },
  { id: "storied", label: "storied", pattern: /\bstoried\b/i },
  { id: "iconic", label: "iconic", pattern: /\biconic\b/i },
  { id: "delve", label: "delve", pattern: /\bdelve\b/i },
  { id: "dive-into", label: "dive into", pattern: /\bdive into\b/i },
  { id: "unpack", label: "unpack", pattern: /\bunpack\b/i },
  {
    id: "explore-the-rich",
    label: "explore the rich",
    pattern: /\bexplore the rich\b/i,
  },
  {
    id: "in-a-world-where",
    label: "in a world where",
    pattern: /\bin a world where\b/i,
  },
  {
    id: "when-it-comes-to",
    label: "when it comes to",
    pattern: /\bwhen it comes to\b/i,
  },
  {
    id: "worth-noting",
    label: "it's worth noting",
    pattern: /\bit['’]?s worth noting\b/i,
  },
  {
    id: "needless-to-say",
    label: "needless to say",
    pattern: /\bneedless to say\b/i,
  },
  {
    id: "end-of-the-day",
    label: "at the end of the day",
    pattern: /\bat the end of the day\b/i,
  },
  {
    id: "testament",
    label: "stands as a testament",
    pattern: /\bstands as a testament\b/i,
  },
  { id: "etched-into", label: "etched into", pattern: /\betched into\b/i },
  {
    id: "forever-remembered",
    label: "forever remembered",
    pattern: /\bforever remembered\b/i,
  },
  {
    id: "beautiful-game",
    label: "the beautiful game",
    pattern: /\bthe beautiful game\b/i,
  },
  { id: "proves", label: "proves", pattern: /\bproves\b/i },
  {
    id: "official-affiliation",
    label: "official (affiliation sense)",
    pattern: /\bofficial (club|partner|site|source|account|app)\b/i,
  },
  {
    id: "every-fan-knows",
    label: "every fan knows",
    pattern: /\bevery fan knows\b/i,
  },
  {
    id: "grew-up-hearing",
    label: "you grew up hearing",
    pattern: /\byou grew up hearing\b/i,
  },
  {
    id: "you-still-hear",
    label: "you still hear",
    pattern: /\byou still hear\b/i,
  },
  {
    id: "stats-database",
    label: "stats database framing",
    pattern: /\bstats database\b/i,
  },
];

export interface CopySmellHit {
  /** Stable key for baseline: `${id}::${smellId}` */
  key: string;
  itemId: string;
  smellId: CopySmellId;
  label: string;
  tier: string;
  file: string;
  excerpt: string;
}

export function smellHitKey(itemId: string, smellId: CopySmellId): string {
  return `${itemId}::${smellId}`;
}

/** Find all smell hits in a piece of text for one catalog item. */
export function findSmellsInText(
  item: { id: string; text: string; tier: string; file: string },
  rules: CopySmellRule[] = COPY_SMELL_RULES,
): CopySmellHit[] {
  const hits: CopySmellHit[] = [];
  for (const rule of rules) {
    rule.pattern.lastIndex = 0;
    if (!rule.pattern.test(item.text)) continue;
    rule.pattern.lastIndex = 0;
    const match = rule.pattern.exec(item.text);
    rule.pattern.lastIndex = 0;
    const at = match?.index ?? 0;
    const start = Math.max(0, at - 24);
    const end = Math.min(item.text.length, at + (match?.[0].length ?? 0) + 40);
    const excerpt = item.text.slice(start, end).replace(/\s+/g, " ").trim();
    hits.push({
      key: smellHitKey(item.id, rule.id),
      itemId: item.id,
      smellId: rule.id,
      label: rule.label,
      tier: item.tier,
      file: item.file,
      excerpt,
    });
  }
  return hits;
}

export interface CopyLintBaseline {
  generatedAt: string;
  /** Smell hit keys (`itemId::smellId`) accepted as known debt. */
  keys: string[];
}

export function lintCopyItems(
  items: { id: string; text: string; tier: string; file: string }[],
  baselineKeys: Iterable<string> = [],
): {
  hits: CopySmellHit[];
  tierA: CopySmellHit[];
  newTierA: CopySmellHit[];
  baselinedTierA: CopySmellHit[];
} {
  const known = new Set(baselineKeys);
  const hits = items.flatMap((item) => findSmellsInText(item));
  const tierA = hits.filter((h) => h.tier === "A");
  const newTierA = tierA.filter((h) => !known.has(h.key));
  const baselinedTierA = tierA.filter((h) => known.has(h.key));
  return { hits, tierA, newTierA, baselinedTierA };
}
