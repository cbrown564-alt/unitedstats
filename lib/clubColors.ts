/**
 * Club identity colours for generated crest-style tokens.
 *
 * Real club crests are non-free copyrighted logos that Wikimedia Commons does
 * not host, so we don't import them. Instead every club gets a monogram chip in
 * its primary colour — curated where we know the club, and a deterministic muted
 * hue derived from the id otherwise, so the same club always renders the same
 * token. `fg` is omitted when white-on-colour reads fine; supply it only where
 * the brand colour is light enough to need dark text.
 */
export interface ClubColor {
  bg: string;
  fg?: string;
}

// Keyed by opponent id (see data/canonical/opponents.json). Primary kit colour.
const CURATED: Record<string, ClubColor> = {
  "arsenal": { bg: "#EF0107" },
  "aston-villa": { bg: "#670E36" },
  "barnsley": { bg: "#D50032" },
  "birmingham-city": { bg: "#0000AB" },
  "blackburn-rovers": { bg: "#009EE0" },
  "blackpool": { bg: "#F68712" },
  "bolton-wanderers": { bg: "#263C7E" },
  "bournemouth": { bg: "#DA291C" },
  "brentford": { bg: "#E30613" },
  "brighton-&-hove-albion": { bg: "#0057B8" },
  "brighton-and-hove-albion": { bg: "#0057B8" },
  "burnley": { bg: "#6C1D45" },
  "cardiff-city": { bg: "#0070B5" },
  "chelsea": { bg: "#034694" },
  "crystal-palace": { bg: "#1B458F" },
  "derby-county": { bg: "#000000", fg: "#ffffff" },
  "everton": { bg: "#003399" },
  "fulham": { bg: "#000000", fg: "#ffffff" },
  "huddersfield-town": { bg: "#0E63AD" },
  "hull-city": { bg: "#F18A01" },
  "ipswich-town": { bg: "#0044A9" },
  "leeds-united": { bg: "#1D428A" },
  "leicester-city": { bg: "#003090" },
  "liverpool": { bg: "#C8102E" },
  "luton-town": { bg: "#F78F1E" },
  "manchester-city": { bg: "#6CABDD", fg: "#0a1a2a" },
  "middlesbrough": { bg: "#E21C38" },
  "newcastle-united": { bg: "#241F20", fg: "#ffffff" },
  "norwich-city": { bg: "#FFF200", fg: "#0a0a0a" },
  "nottingham-forest": { bg: "#DD0000" },
  "nottm-forest": { bg: "#DD0000" },
  "portsmouth": { bg: "#001489" },
  "queens-park-rangers": { bg: "#1D5BA4" },
  "reading": { bg: "#004494" },
  "sheffield-united": { bg: "#EE2737" },
  "sheffield-wednesday": { bg: "#4189DD" },
  "southampton": { bg: "#D71920" },
  "stoke-city": { bg: "#E03A3E" },
  "sunderland": { bg: "#EB172B" },
  "swansea-city": { bg: "#000000", fg: "#ffffff" },
  "tottenham-hotspur": { bg: "#132257", fg: "#ffffff" },
  "watford": { bg: "#FBEE23", fg: "#0a0a0a" },
  "west-bromwich-albion": { bg: "#122F67" },
  "west-ham-united": { bg: "#7A263A" },
  "wigan-athletic": { bg: "#1D59AF" },
  "wolverhampton-wanderers": { bg: "#FDB913", fg: "#231F20" },
  "wolves": { bg: "#FDB913", fg: "#231F20" },
  // A few recurring European opponents.
  "barcelona": { bg: "#A50044" },
  "real-madrid": { bg: "#FEBE10", fg: "#0a1a2a" },
  "bayern-munich": { bg: "#DC052D" },
  "juventus": { bg: "#000000", fg: "#ffffff" },
  "ac-milan": { bg: "#FB090B" },
  "inter-milan": { bg: "#010E80" },
};

const STOPWORDS = new Set(["and", "the", "fc", "afc", "cf", "ac"]);

/** A 2–3 character monogram for a club name (e.g. "Brighton & Hove Albion" → "BHA"). */
export function clubMonogram(name: string): string {
  const words = name
    .split(/[\s&.]+/)
    .map((w) => w.trim())
    .filter((w) => w && !STOPWORDS.has(w.toLowerCase()));
  if (words.length >= 2) {
    return words.map((w) => w[0]).join("").slice(0, 3).toUpperCase();
  }
  const single = (words[0] ?? name).replace(/[^a-z]/gi, "");
  return single.slice(0, 3).toUpperCase() || "?";
}

/** Deterministic muted hue from a string, for clubs without a curated colour. */
function fallbackColor(id: string): ClubColor {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  const hue = Math.abs(hash) % 360;
  // Muted, mid-dark so white text holds up against the dark theme.
  return { bg: `hsl(${hue} 42% 34%)`, fg: "#f5f5f4" };
}

/** Resolve a club's token colour, curated first, deterministic fallback otherwise. */
export function clubColor(id: string, name: string): ClubColor {
  return CURATED[id] ?? fallbackColor(id || name);
}
