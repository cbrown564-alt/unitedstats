/**
 * Competition identity marks for generated badge tokens.
 *
 * Real competition logos are non-free trademarks we can't host, so — exactly as
 * with club crests (see clubColors.ts) — every competition gets a generated
 * roundel instead: a short abbreviation on a chip in the competition's colour.
 * Curated where we know the competition (authentic-ish jewel tones that hold up
 * on the dark match-night palette), with a tone-derived fallback otherwise so an
 * unknown competition still renders a consistent, on-brand token.
 *
 * `fg` is omitted when white-on-colour reads fine; supply it only where the
 * background is light enough to need dark text.
 */
import { competitionTone } from "@/lib/format";

export interface CompetitionMark {
  abbr: string;
  bg: string;
  fg?: string;
}

// Keyed by competition id (see public/dataset/season_summaries.csv).
const CURATED: Record<string, CompetitionMark> = {
  "premier-league": { abbr: "PL", bg: "#3d2a63" },
  "first-division": { abbr: "D1", bg: "#4a423d", fg: "#ece6df" },
  "second-division": { abbr: "D2", bg: "#3a332e", fg: "#d8d1c9" },
  "champions-league": { abbr: "UCL", bg: "#0b2a6b" },
  "european-cup": { abbr: "EC", bg: "#11357f" },
  "europa-league": { abbr: "UEL", bg: "#c2410c" },
  "uefa-cup": { abbr: "UC", bg: "#b3500f" },
  "cup-winners-cup": { abbr: "CWC", bg: "#1e5aa8" },
  "inter-cities-fairs-cup": { abbr: "ICF", bg: "#2a6093" },
  "fa-cup": { abbr: "FA", bg: "#a51d2d" },
  "league-cup": { abbr: "LC", bg: "#155e75" },
  "charity-shield": { abbr: "CS", bg: "#9a7b2e", fg: "#fdf6e3" },
  "uefa-super-cup": { abbr: "USC", bg: "#1d4e89" },
  "screen-sport-super-cup": { abbr: "SSC", bg: "#5a4636", fg: "#e8ddd0" },
  "fifa-club-world-cup": { abbr: "FCW", bg: "#8a6d1f", fg: "#fdf6e3" },
  "intercontinental-cup": { abbr: "IC", bg: "#6b5a2a", fg: "#f0e8d4" },
  "test-match": { abbr: "TM", bg: "#3a332e", fg: "#d8d1c9" },
};

// Tone → fallback chip colour, drawn from the product's three narrative axes so
// an uncurated competition still reads as league / cup / Europe at a glance.
const TONE_BG: Record<string, string> = {
  league: "#4a423d",
  cup: "#7a5a1f",
  europe: "#11357f",
  muted: "#3a332e",
};

const STOPWORDS = new Set(["and", "the", "of", "cup", "league", "uefa", "fa"]);

/** A 2–3 character abbreviation from a competition name, for the uncurated case. */
function fallbackAbbr(name: string): string {
  const words = name
    .split(/[\s&./()'-]+/)
    .map((w) => w.trim())
    .filter((w) => w && !STOPWORDS.has(w.toLowerCase()));
  if (words.length >= 2) return words.map((w) => w[0]).join("").slice(0, 3).toUpperCase();
  const single = (words[0] ?? name).replace(/[^a-z]/gi, "");
  return single.slice(0, 3).toUpperCase() || "?";
}

/** Resolve a competition's badge mark, curated first, tone-derived fallback otherwise. */
export function competitionMark(
  id: string,
  name: string,
  type: string | null | undefined,
): CompetitionMark {
  return (
    CURATED[id] ?? {
      abbr: fallbackAbbr(name),
      bg: TONE_BG[competitionTone(type)] ?? TONE_BG.muted,
      fg: "#ece6df",
    }
  );
}
