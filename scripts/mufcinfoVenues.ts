/**
 * MUFCInfo venue label parsing and stadium-id resolution.
 * Shared by scripts/ingest/mufcinfo-stadiums.ts and its unit tests.
 */
import { slugify } from "./lib";
import { htmlDecode } from "./player-resolver";

/** Labels that are countries (not cities) when they appear after a comma. */
const COUNTRY_LABELS = new Set([
  "turkey", "england", "scotland", "wales", "ireland", "northern ireland",
  "spain", "italy", "germany", "france", "portugal", "netherlands", "belgium",
  "russia", "ukraine", "sweden", "norway", "denmark", "finland", "greece",
  "austria", "switzerland", "hungary", "romania", "bulgaria", "serbia",
  "croatia", "poland", "czech republic", "slovakia", "japan", "china",
  "usa", "united states", "brazil", "argentina", "mexico", "qatar",
  "kazakhstan", "moldova", "north macedonia", "cyprus",
]);

/**
 * Explicit MUFCInfo venue label → stadium id. Keys are {@link normalizeVenueKey}
 * forms. Covers existing stadiums.json entries, spelling variants, and grounds
 * that changed commercial names (same physical stadium → one id).
 */
export const VENUE_ALIASES: Record<string, string> = {
  // Existing curated stadiums
  "old trafford": "old-trafford",
  "bank street": "bank-street",
  "maine road": "maine-road",
  "north road monsall": "north-road",
  "north road": "north-road",
  "wembley": "wembley",
  "wembley stadium": "wembley",
  "millennium stadium": "millennium-stadium",
  "nou camp": "camp-nou",
  "camp nou": "camp-nou",
  "luzhniki": "luzhniki",
  "luzhniki stadium": "luzhniki",
  "de kuip": "rotterdam-kuip",
  "feyenoord stadion": "rotterdam-kuip",
  "friends arena": "friends-arena",

  // Commercial renames / alternate labels → one id
  "eastlands stadium": "etihad-stadium",
  "etihad stadium": "etihad-stadium",
  "city of manchester stadium": "etihad-stadium",
  "reebok stadium": "toughsheet-community-stadium",
  "macron stadium": "toughsheet-community-stadium",
  "university of bolton stadium": "toughsheet-community-stadium",
  "toughsheet community stadium": "toughsheet-community-stadium",
  "jjb stadium": "dw-stadium",
  "dw stadium": "dw-stadium",
  "britannia stadium stoke": "bet365-stadium",
  "britannia stadium": "bet365-stadium",
  "bet365 stadium": "bet365-stadium",
  "kc stadium hull": "mkm-stadium",
  "kc stadium": "mkm-stadium",
  "kcom stadium": "mkm-stadium",
  "mkm stadium": "mkm-stadium",
  "walkers stadium": "king-power-stadium",
  "king power stadium": "king-power-stadium",
  "madejski stadium": "select-car-leasing-stadium",
  "select car leasing stadium": "select-car-leasing-stadium",
  "liberty stadium": "swansea-com-stadium",
  "swansea com stadium": "swansea-com-stadium",
  "dean court": "vitality-stadium",
  "vitality stadium": "vitality-stadium",
  "st marys stadium": "st-marys-stadium",
  "st mary s stadium": "st-marys-stadium",
  "brentford community stadium": "gtech-community-stadium",
  "gtech community stadium": "gtech-community-stadium",
  "john smiths stadium": "john-smiths-stadium",
  "john smith s stadium": "john-smiths-stadium",
  "st james park newcastle": "st-james-park",
  "st james park": "st-james-park",
  "st james park exeter": "st-james-park-exeter",
  "city ground nottingham": "city-ground",
  "city ground": "city-ground",
  "stadium of light sunderland": "stadium-of-light",
  "stadium of light": "stadium-of-light",
  "north road glossop": "north-road-glossop",
  "crystal palace": "crystal-palace-fa-cup",
  "le parc des princes": "parc-des-princes",
  "parc des princes": "parc-des-princes",
  "bernabeu stadium": "santiago-bernabeu",
  "santiago bernabeu": "santiago-bernabeu",
  "vincente calderon": "vicente-calderon",
  "vicente calderon": "vicente-calderon",
  "estadio da luz": "estadio-da-luz",
  "estadio do dragao": "estadio-do-dragao",
  "allianz stadium turin": "allianz-stadium-turin",
  "stadio delle alpi": "stadio-delle-alpi",
  "bjk inonu stadium turkey": "bjk-inonu-stadium",
  "bjk inonu stadium": "bjk-inonu-stadium",
  "amsterdam arena": "johan-cruijff-arena",
  "johan cruijff arena": "johan-cruijff-arena",
  "olympic stadium amsterdam": "olympic-stadium-amsterdam",
  "olympic stadium munich": "olympic-stadium-munich",
  "olympic stadium athens": "olympic-stadium-athens",
  "olympic stadium kiev": "olympic-stadium-kyiv",
  "olympic stadium kyiv": "olympic-stadium-kyiv",
  "olympic stadium tokyo": "olympic-stadium-tokyo",
  "olympic stadium helsinki": "olympic-stadium-helsinki",
  "county ground swindon": "county-ground-swindon",
  "county ground northampton": "county-ground-northampton",
  "stadio san siro": "san-siro",
  "san siro": "san-siro",
};

/** Preferred display metadata when auto-creating (or aliasing to) a stadium id. */
export const STADIUM_META: Record<string, { name: string; city?: string | null; country?: string | null; note?: string | null }> = {
  "old-trafford": { name: "Old Trafford", city: "Manchester", country: "England" },
  "bank-street": { name: "Bank Street", city: "Manchester (Clayton)", country: "England" },
  "maine-road": { name: "Maine Road", city: "Manchester", country: "England" },
  "north-road": { name: "North Road", city: "Manchester", country: "England", note: "Newton Heath LYR, Monsall" },
  "north-road-glossop": { name: "North Road", city: "Glossop", country: "England" },
  "wembley": { name: "Wembley Stadium", city: "London", country: "England" },
  "millennium-stadium": { name: "Millennium Stadium", city: "Cardiff", country: "Wales" },
  "camp-nou": { name: "Camp Nou", city: "Barcelona", country: "Spain" },
  "luzhniki": { name: "Luzhniki Stadium", city: "Moscow", country: "Russia" },
  "rotterdam-kuip": { name: "De Kuip", city: "Rotterdam", country: "Netherlands" },
  "friends-arena": { name: "Friends Arena", city: "Stockholm", country: "Sweden" },
  "etihad-stadium": { name: "Etihad Stadium", city: "Manchester", country: "England", note: "Also known as Eastlands / City of Manchester Stadium" },
  "toughsheet-community-stadium": { name: "Toughsheet Community Stadium", city: "Bolton", country: "England", note: "Formerly Reebok / Macron Stadium" },
  "dw-stadium": { name: "DW Stadium", city: "Wigan", country: "England", note: "Formerly JJB Stadium" },
  "bet365-stadium": { name: "bet365 Stadium", city: "Stoke-on-Trent", country: "England", note: "Formerly Britannia Stadium" },
  "mkm-stadium": { name: "MKM Stadium", city: "Hull", country: "England", note: "Formerly KC / KCOM Stadium" },
  "king-power-stadium": { name: "King Power Stadium", city: "Leicester", country: "England", note: "Formerly Walkers Stadium" },
  "select-car-leasing-stadium": { name: "Select Car Leasing Stadium", city: "Reading", country: "England", note: "Formerly Madejski Stadium" },
  "swansea-com-stadium": { name: "Swansea.com Stadium", city: "Swansea", country: "Wales", note: "Formerly Liberty Stadium" },
  "vitality-stadium": { name: "Vitality Stadium", city: "Bournemouth", country: "England", note: "Formerly Dean Court" },
  "st-marys-stadium": { name: "St Mary's Stadium", city: "Southampton", country: "England" },
  "gtech-community-stadium": { name: "Gtech Community Stadium", city: "Brentford", country: "England" },
  "john-smiths-stadium": { name: "John Smith's Stadium", city: "Huddersfield", country: "England" },
  "st-james-park": { name: "St James' Park", city: "Newcastle", country: "England" },
  "st-james-park-exeter": { name: "St James Park", city: "Exeter", country: "England" },
  "city-ground": { name: "City Ground", city: "Nottingham", country: "England" },
  "stadium-of-light": { name: "Stadium of Light", city: "Sunderland", country: "England" },
  "crystal-palace-fa-cup": { name: "Crystal Palace", city: "London", country: "England", note: "Historic FA Cup final venue (not Selhurst Park)" },
  "parc-des-princes": { name: "Parc des Princes", city: "Paris", country: "France" },
  "santiago-bernabeu": { name: "Santiago Bernabéu", city: "Madrid", country: "Spain" },
  "vicente-calderon": { name: "Vicente Calderón", city: "Madrid", country: "Spain" },
  "san-siro": { name: "San Siro", city: "Milan", country: "Italy" },
  "anfield": { name: "Anfield", city: "Liverpool", country: "England" },
  "goodison-park": { name: "Goodison Park", city: "Liverpool", country: "England" },
  "villa-park": { name: "Villa Park", city: "Birmingham", country: "England" },
  "stamford-bridge": { name: "Stamford Bridge", city: "London", country: "England" },
  "highbury": { name: "Highbury", city: "London", country: "England" },
  "emirates-stadium": { name: "Emirates Stadium", city: "London", country: "England" },
  "white-hart-lane": { name: "White Hart Lane", city: "London", country: "England" },
  "tottenham-hotspur-stadium": { name: "Tottenham Hotspur Stadium", city: "London", country: "England" },
  "elland-road": { name: "Elland Road", city: "Leeds", country: "England" },
  "hillsborough": { name: "Hillsborough", city: "Sheffield", country: "England" },
  "bramall-lane": { name: "Bramall Lane", city: "Sheffield", country: "England" },
  "ewood-park": { name: "Ewood Park", city: "Blackburn", country: "England" },
  "turf-moor": { name: "Turf Moor", city: "Burnley", country: "England" },
  "the-hawthorns": { name: "The Hawthorns", city: "West Bromwich", country: "England" },
  "boleyn-ground": { name: "Boleyn Ground", city: "London", country: "England" },
  "molineux": { name: "Molineux", city: "Wolverhampton", country: "England" },
  "filbert-street": { name: "Filbert Street", city: "Leicester", country: "England" },
  "roker-park": { name: "Roker Park", city: "Sunderland", country: "England" },
  "burnden-park": { name: "Burnden Park", city: "Bolton", country: "England" },
  "the-dell": { name: "The Dell", city: "Southampton", country: "England" },
  "craven-cottage": { name: "Craven Cottage", city: "London", country: "England" },
  "baseball-ground": { name: "Baseball Ground", city: "Derby", country: "England" },
  "st-andrews": { name: "St Andrew's", city: "Birmingham", country: "England" },
  "highfield-road": { name: "Highfield Road", city: "Coventry", country: "England" },
  "selhurst-park": { name: "Selhurst Park", city: "London", country: "England" },
  "victoria-ground": { name: "Victoria Ground", city: "Stoke-on-Trent", country: "England" },
  "bloomfield-road": { name: "Bloomfield Road", city: "Blackpool", country: "England" },
  "ayresome-park": { name: "Ayresome Park", city: "Middlesbrough", country: "England" },
  "carrow-road": { name: "Carrow Road", city: "Norwich", country: "England" },
  "deepdale": { name: "Deepdale", city: "Preston", country: "England" },
  "fratton-park": { name: "Fratton Park", city: "Portsmouth", country: "England" },
  "portman-road": { name: "Portman Road", city: "Ipswich", country: "England" },
  "loftus-road": { name: "Loftus Road", city: "London", country: "England" },
  "valley-parade": { name: "Valley Parade", city: "Bradford", country: "England" },
  "the-valley": { name: "The Valley", city: "London", country: "England" },
  "london-stadium": { name: "London Stadium", city: "London", country: "England" },
};

export interface StadiumEntry {
  id: string;
  name: string;
  city: string | null;
  country: string | null;
  lat: number | null;
  lng: number | null;
  home: { from: string; to: string | null }[];
  note?: string | null;
}

export interface ParsedVenue {
  /** Raw ground label with H/A/N stripped. */
  label: string;
  ha: "H" | "A" | "N" | null;
}

export interface SplitVenue {
  name: string;
  city: string | null;
  country: string | null;
  note: string | null;
}

interface MatchJob {
  season: string;
  match: Match;
}

interface ImportStats {
  checked: number;
  noPage: number;
  noVenue: number;
  alreadySet: number;
  conflict: number;
  wouldWrite: number;
  written: number;
  stadiumsAdded: number;
  failed: number;
}

function numberArg(flag: string, fallback: number): number {
  const index = process.argv.indexOf(flag);
  if (index < 0) return fallback;
  const value = Number(process.argv[index + 1]);
  return Number.isFinite(value) && value >= 0 ? value : fallback;
}

function stringArg(flag: string): string | null {
  const index = process.argv.indexOf(flag);
  if (index < 0) return null;
  const value = process.argv[index + 1];
  return value && !value.startsWith("--") ? value : null;
}

function usage(): never {
  console.error(
    "usage: tsx scripts/ingest/mufcinfo-stadiums.ts <season> [<endSeason>] | current | all " +
      "[--date YYYY-MM-DD] [--inspect YYYY-MM-DD] [--write] [--refresh]",
  );
  process.exit(1);
}

function seasonsFromArgs(): string[] {
  if (DATE || INSPECT) return [seasonOfDate((DATE ?? INSPECT)!)];
  return parseSeasonArgs(process.argv.slice(2), { allowAll: true }) ?? usage();
}

/** Fold a venue label to the alias-map key form. */
export function normalizeVenueKey(raw: string): string {
  return htmlDecode(raw)
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Split "Ground, City" / "Ground, (Note)" / "Ground, Country". */
export function splitVenueLabel(label: string): SplitVenue {
  const cleaned = htmlDecode(label).replace(/\s+/g, " ").trim();
  const paren = /^(.+?),\s*\((.+)\)\s*$/.exec(cleaned);
  if (paren) {
    return { name: paren[1].trim(), city: null, country: null, note: paren[2].trim() };
  }
  const comma = /^(.+?),\s*(.+)\s*$/.exec(cleaned);
  if (comma) {
    const right = comma[2].trim();
    if (COUNTRY_LABELS.has(right.toLowerCase())) {
      return { name: comma[1].trim(), city: null, country: right, note: null };
    }
    return { name: comma[1].trim(), city: right, country: null, note: null };
  }
  return { name: cleaned, city: null, country: null, note: null };
}

const VENUE_LINE = /Venue:\s*([^<\n]+)/i;
const LD_LOCATION = /"location"\s*:\s*\{[^}]*"name"\s*:\s*"([^"]+)"/;

/** Parse the ground name from a MUFCInfo match page. */
export function parseVenueFromHtml(html: string): ParsedVenue | null {
  const line = VENUE_LINE.exec(html);
  if (line) {
    const raw = htmlDecode(line[1]).replace(/\s+/g, " ").trim();
    const haMatch = /\(([HAN])\)\s*$/.exec(raw);
    const label = haMatch ? raw.slice(0, haMatch.index).trim() : raw;
    if (label) {
      return { label, ha: haMatch ? (haMatch[1] as "H" | "A" | "N") : null };
    }
  }
  const ld = LD_LOCATION.exec(html);
  if (ld) {
    const label = htmlDecode(ld[1]).replace(/\s+/g, " ").trim();
    if (label) return { label, ha: null };
  }
  return null;
}

export function resolveVenueId(label: string): string {
  const key = normalizeVenueKey(label);
  if (VENUE_ALIASES[key]) return VENUE_ALIASES[key];

  // Try without a trailing parenthetical note already folded into the key
  const split = splitVenueLabel(label);
  const nameKey = normalizeVenueKey(split.name);
  if (VENUE_ALIASES[nameKey]) return VENUE_ALIASES[nameKey];

  if (split.city) {
    const withCity = normalizeVenueKey(`${split.name} ${split.city}`);
    if (VENUE_ALIASES[withCity]) return VENUE_ALIASES[withCity];
    return slugify(`${split.name} ${split.city}`);
  }
  if (split.country) {
    const withCountry = normalizeVenueKey(`${split.name} ${split.country}`);
    if (VENUE_ALIASES[withCountry]) return VENUE_ALIASES[withCountry];
    return slugify(`${split.name} ${split.country}`);
  }
  return slugify(split.name);
}

export function stadiumFromLabel(id: string, label: string): StadiumEntry {
  const meta = STADIUM_META[id];
  const split = splitVenueLabel(label);
  return {
    id,
    name: meta?.name ?? split.name,
    city: meta?.city ?? split.city,
    country: meta?.country ?? split.country,
    lat: null,
    lng: null,
    home: [],
    note: meta?.note ?? split.note,
  };
}

