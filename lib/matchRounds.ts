/** Canonical knockout-round filters for the matches browser (search-created only). */

export type RoundFilterKey =
  | "final"
  | "semi-final"
  | "quarter-final"
  | "round-of-16"
  | "round-of-32"
  | "group-stage"
  | "play-off";

const ROUND_FILTER_KEYS: readonly RoundFilterKey[] = [
  "final",
  "semi-final",
  "quarter-final",
  "round-of-16",
  "round-of-32",
  "group-stage",
  "play-off",
];

const ROUND_FILTER_LABELS: Record<RoundFilterKey, string> = {
  final: "Final",
  "semi-final": "Semi-final",
  "quarter-final": "Quarter-final",
  "round-of-16": "Round of 16",
  "round-of-32": "Round of 32",
  "group-stage": "Group stage",
  "play-off": "Play-off",
};

export function isRoundFilterKey(v: string | undefined): v is RoundFilterKey {
  return v !== undefined && (ROUND_FILTER_KEYS as readonly string[]).includes(v);
}

export function roundFilterLabel(key: RoundFilterKey): string {
  return ROUND_FILTER_LABELS[key];
}

/** JS counterpart of {@link roundFilterPredicate} for the static match catalog. */
export function roundMatchesFilter(round: string | null, key: RoundFilterKey): boolean {
  const value = (round ?? "").toLowerCase();
  switch (key) {
    case "final":
      return value.includes("final") && !value.includes("semi") && !value.includes("quarter");
    case "semi-final":
      return value.includes("semi") && value.includes("final");
    case "quarter-final":
      return value.includes("quarter") && value.includes("final");
    case "round-of-16":
      return value.includes("round of 16") || value.includes("first knockout round");
    case "round-of-32":
      return value.includes("round of 32");
    case "group-stage":
      return value.includes("group") || value.includes("league phase");
    case "play-off":
      return value.includes("play") && value.includes("off");
    default: {
      const _exhaustive: never = key;
      return _exhaustive;
    }
  }
}

/** SQL predicate on `matches m` for a canonical round filter. */
export function roundFilterPredicate(key: RoundFilterKey, m = "m"): string {
  switch (key) {
    case "final":
      return `(${m}.round LIKE '%final%' AND ${m}.round NOT LIKE '%semi%' AND ${m}.round NOT LIKE '%quarter%')`;
    case "semi-final":
      return `${m}.round LIKE '%semi%final%'`;
    case "quarter-final":
      return `${m}.round LIKE '%quarter%final%'`;
    case "round-of-16":
      return `(${m}.round LIKE '%round of 16%' OR ${m}.round LIKE '%first knockout round%')`;
    case "round-of-32":
      return `${m}.round LIKE '%round of 32%'`;
    case "group-stage":
      return `(${m}.round LIKE '%group%' OR ${m}.round LIKE '%league phase%')`;
    case "play-off":
      return `${m}.round LIKE '%play%off%'`;
    default: {
      const _exhaustive: never = key;
      return _exhaustive;
    }
  }
}

/** Longest phrase first so "semi-final" wins over "final". */
const ROUND_PHRASES: [RegExp, RoundFilterKey][] = [
  [/\bsemi[- ]?finals?\b/, "semi-final"],
  [/\bquarter[- ]?finals?\b/, "quarter-final"],
  [/\bround of 32\b|\blast 32\b/, "round-of-32"],
  [/\bround of 16\b|\blast 16\b|\bfirst knockout rounds?\b/, "round-of-16"],
  [/\bgroup stages?\b|\bleague phase\b/, "group-stage"],
  [/\bplay[- ]?offs?\b/, "play-off"],
  [/\bfinals?\b/, "final"],
];

/**
 * Pull a canonical round filter out of free text. Returns the key and the text
 * with the round phrase removed.
 */
export function parseRoundPhrase(text: string): { key: RoundFilterKey; rest: string } | null {
  for (const [re, key] of ROUND_PHRASES) {
    const m = re.exec(text);
    if (!m) continue;
    const rest = `${text.slice(0, m.index)} ${text.slice(m.index + m[0].length)}`.replace(/\s+/g, " ").trim();
    return { key, rest };
  }
  return null;
}
