import { clubName } from "./format";

/**
 * Presentational short names for clubs, in two tiers below the full name:
 *
 *   full  — the era-accurate display name carried on the match record
 *            (e.g. "Nottingham Forest", or the historical "Small Heath").
 *   short — British results-grid / broadcast convention ("Nott'm Forest",
 *            "Man Utd", "Sheff Wed"). Hand-curated; there is no clean public
 *            dataset for this style.
 *   code  — three-letter abbreviation ("NFO", "MUN"), as used by the Premier
 *            League ladder, ESPN and FotMob.
 *
 * These two tiers are display-only — they never enter the canonical record or
 * the database, so they live here rather than in opponents.json. The hero on
 * the match page swaps between tiers responsively so a long name like
 * "Nottingham Forest" can't force a horizontal scroll on a narrow viewport.
 *
 * Keyed by canonical opponent id (data/canonical/opponents.json). Anything not
 * listed falls back to a suffix-stripped short and a derived code, which is
 * fine for the long tail of obscure historical opponents.
 */
type NameTier = { short: string; code: string };

const OPPONENT_NAMES: Record<string, NameTier> = {
  // England — modern top flight + common league opponents
  arsenal: { short: "Arsenal", code: "ARS" },
  everton: { short: "Everton", code: "EVE" },
  "tottenham-hotspur": { short: "Spurs", code: "TOT" },
  liverpool: { short: "Liverpool", code: "LIV" },
  "aston-villa": { short: "Aston Villa", code: "AVL" },
  "manchester-city": { short: "Man City", code: "MCI" },
  chelsea: { short: "Chelsea", code: "CHE" },
  "newcastle-united": { short: "Newcastle", code: "NEW" },
  "west-ham-united": { short: "West Ham", code: "WHU" },
  sunderland: { short: "Sunderland", code: "SUN" },
  burnley: { short: "Burnley", code: "BUR" },
  "leicester-city": { short: "Leicester", code: "LEI" },
  "west-bromwich-albion": { short: "West Brom", code: "WBA" },
  southampton: { short: "Southampton", code: "SOU" },
  "sheffield-wednesday": { short: "Sheff Wed", code: "SHW" },
  "wolverhampton-wanderers": { short: "Wolves", code: "WOL" },
  middlesbrough: { short: "Middlesbrough", code: "MID" },
  "bolton-wanderers": { short: "Bolton", code: "BOL" },
  "nottingham-forest": { short: "Nott'm Forest", code: "NFO" },
  "blackburn-rovers": { short: "Blackburn", code: "BLB" },
  "leeds-united": { short: "Leeds", code: "LEE" },
  "derby-county": { short: "Derby", code: "DER" },
  "stoke-city": { short: "Stoke", code: "STK" },
  "sheffield-united": { short: "Sheff Utd", code: "SHU" },
  "birmingham-city": { short: "Birmingham", code: "BIR" },
  fulham: { short: "Fulham", code: "FUL" },
  blackpool: { short: "Blackpool", code: "BLP" },
  "coventry-city": { short: "Coventry", code: "COV" },
  "preston-north-end": { short: "Preston", code: "PNE" },
  "norwich-city": { short: "Norwich", code: "NOR" },
  portsmouth: { short: "Portsmouth", code: "POR" },
  "ipswich-town": { short: "Ipswich", code: "IPS" },
  "crystal-palace": { short: "C Palace", code: "CRY" },
  "charlton-athletic": { short: "Charlton", code: "CHA" },
  "bradford-city": { short: "Bradford", code: "BRA" },
  "notts-county": { short: "Notts County", code: "NOT" },
  "port-vale": { short: "Port Vale", code: "VAL" },
  "huddersfield-town": { short: "Huddersfield", code: "HUD" },
  "queens-park-rangers": { short: "QPR", code: "QPR" },
  "luton-town": { short: "Luton", code: "LUT" },
  "grimsby-town": { short: "Grimsby", code: "GRI" },
  bury: { short: "Bury", code: "BUR" },
  barnsley: { short: "Barnsley", code: "BAR" },
  "oldham-athletic": { short: "Oldham", code: "OLD" },
  watford: { short: "Watford", code: "WAT" },
  "bristol-city": { short: "Bristol City", code: "BRC" },
  wimbledon: { short: "Wimbledon", code: "WIM" },
  "swansea-city": { short: "Swansea", code: "SWA" },
  "hull-city": { short: "Hull", code: "HUL" },
  "brighton-and-hove-albion": { short: "Brighton", code: "BHA" },
  "cardiff-city": { short: "Cardiff", code: "CAR" },
  "lincoln-city": { short: "Lincoln", code: "LIN" },
  bournemouth: { short: "Bournemouth", code: "BOU" },
  brentford: { short: "Brentford", code: "BRE" },
  "bradford-park-avenue": { short: "Bradford PA", code: "BPA" },
  reading: { short: "Reading", code: "REA" },
  "gainsborough-trinity": { short: "Gainsborough", code: "GAI" },
  chesterfield: { short: "Chesterfield", code: "CHF" },
  "wigan-athletic": { short: "Wigan", code: "WIG" },
  "stockport-county": { short: "Stockport", code: "STO" },
  "plymouth-argyle": { short: "Plymouth", code: "PLY" },
  "oxford-united": { short: "Oxford", code: "OXF" },
  walsall: { short: "Walsall", code: "WAL" },
  millwall: { short: "Millwall", code: "MIL" },
  glossop: { short: "Glossop", code: "GLO" },
  "burton-swifts": { short: "Burton Swifts", code: "BUR" },
  "burton-united": { short: "Burton United", code: "BUR" },
  "burton-wanderers": { short: "Burton Wanderers", code: "BUR" },
  "burton-albion": { short: "Burton Albion", code: "BUR" },
  "leyton-orient": { short: "Leyton Orient", code: "LEY" },
  darwen: { short: "Darwen", code: "DAR" },
  loughborough: { short: "Loughborough", code: "LOU" },
  "northampton-town": { short: "Northampton", code: "NTH" },
  "doncaster-rovers": { short: "Doncaster", code: "DON" },
  "crewe-alexandra": { short: "Crewe", code: "CRE" },
  "bristol-rovers": { short: "Bristol Rovers", code: "BRR" },
  "south-shields": { short: "South Shields", code: "SSH" },
  "new-brighton-tower": { short: "New Brighton", code: "NBT" },
  "exeter-city": { short: "Exeter", code: "EXE" },
  "york-city": { short: "York", code: "YOR" },
  yeovil: { short: "Yeovil", code: "YEO" },
  wrexham: { short: "Wrexham", code: "WRE" },
  "swindon-town": { short: "Swindon", code: "SWI" },
  "rotherham-united": { short: "Rotherham", code: "ROT" },
  "rotherham-town": { short: "Rotherham Town", code: "ROT" },
  "rotherham-county": { short: "Rotherham County", code: "ROT" },
  "hereford-united": { short: "Hereford", code: "HER" },
  "colchester-united": { short: "Colchester", code: "COL" },
  "cambridge-united": { short: "Cambridge", code: "CAM" },
  "tranmere-rovers": { short: "Tranmere", code: "TRA" },
  "southend-united": { short: "Southend", code: "SOU" },
  "shrewsbury-town": { short: "Shrewsbury", code: "SHR" },
  workington: { short: "Workington", code: "WOR" },
  "walthamstow-avenue": { short: "Walthamstow", code: "WAL" },
  nelson: { short: "Nelson", code: "NEL" },
  "newport-county": { short: "Newport", code: "NEW" },
  "milton-keynes-dons": { short: "MK Dons", code: "MKD" },
  "leeds-city": { short: "Leeds City", code: "LDC" },
  "halifax-town": { short: "Halifax", code: "HAL" },
  "fleetwood-rangers": { short: "Fleetwood", code: "FLE" },
  "carlisle-united": { short: "Carlisle", code: "CAR" },
  aldershot: { short: "Aldershot", code: "ALD" },
  "aldershot-town": { short: "Aldershot Town", code: "ALD" },
  "accrington-stanley": { short: "Accrington", code: "ACC" },
  "accrington-f-c": { short: "Accrington", code: "ACC" },

  // Scotland / Ireland
  celtic: { short: "Celtic", code: "CEL" },
  rangers: { short: "Rangers", code: "RAN" },
  "dundee-united": { short: "Dundee Utd", code: "DUN" },
  "shamrock-rovers": { short: "Shamrock R", code: "SHA" },
  "waterford-united": { short: "Waterford", code: "WAT" },

  // Europe
  juventus: { short: "Juventus", code: "JUV" },
  "ac-milan": { short: "Milan", code: "MIL" },
  "inter-milan": { short: "Inter", code: "INT" },
  roma: { short: "Roma", code: "ROM" },
  "acf-fiorentina": { short: "Fiorentina", code: "FIO" },
  atalanta: { short: "Atalanta", code: "ATA" },
  "bayern-munich": { short: "Bayern", code: "BAY" },
  "borussia-dortmund": { short: "Dortmund", code: "DOR" },
  "bayer-04-leverkusen": { short: "Leverkusen", code: "LEV" },
  "vfl-wolfsburg": { short: "Wolfsburg", code: "WOB" },
  "vfb-stuttgart": { short: "Stuttgart", code: "STU" },
  "rb-leipzig": { short: "Leipzig", code: "RBL" },
  "viktoria-frankfurt": { short: "Viktoria FFM", code: "VFR" },
  barcelona: { short: "Barcelona", code: "BAR" },
  "real-madrid": { short: "Real Madrid", code: "RMA" },
  "atletico-madrid": { short: "Atlético", code: "ATM" },
  "valencia-cf": { short: "Valencia", code: "VAL" },
  "villarreal-cf": { short: "Villarreal", code: "VIL" },
  "real-sociedad": { short: "Real Sociedad", code: "RSO" },
  "athletic-bilbao": { short: "Athletic", code: "ATH" },
  sevilla: { short: "Sevilla", code: "SEV" },
  "real-betis": { short: "Betis", code: "BET" },
  "deportivo-de-la-coruna": { short: "Deportivo", code: "DEP" },
  "celta-de-vigo": { short: "Celta", code: "CEL" },
  "granada-cf": { short: "Granada", code: "GRA" },
  porto: { short: "Porto", code: "POR" },
  benfica: { short: "Benfica", code: "BEN" },
  "sporting-cp": { short: "Sporting", code: "SCP" },
  braga: { short: "Braga", code: "BRA" },
  boavista: { short: "Boavista", code: "BOA" },
  "paris-saint-germain": { short: "PSG", code: "PSG" },
  "olympique-lyonnais": { short: "Lyon", code: "LYO" },
  "olympique-de-marseille": { short: "Marseille", code: "MAR" },
  "as-saint-etienne": { short: "Saint-Étienne", code: "STE" },
  "as-monaco": { short: "Monaco", code: "MON" },
  "lille-osc": { short: "Lille", code: "LIL" },
  "rc-strasbourg": { short: "Strasbourg", code: "STR" },
  nantes: { short: "Nantes", code: "NAN" },
  "montpellier-hsc": { short: "Montpellier", code: "MTP" },
  bordeaux: { short: "Bordeaux", code: "BOR" },
  "psv-eindhoven": { short: "PSV", code: "PSV" },
  "afc-ajax": { short: "Ajax", code: "AJA" },
  feyenoord: { short: "Feyenoord", code: "FEY" },
  "az-alkmaar": { short: "AZ", code: "AZ" },
  "willem-ii": { short: "Willem II", code: "WIL" },
  anderlecht: { short: "Anderlecht", code: "AND" },
  "club-brugge-kv": { short: "Club Brugge", code: "BRU" },
  fenerbahce: { short: "Fenerbahçe", code: "FEN" },
  galatasaray: { short: "Galatasaray", code: "GAL" },
  besiktas: { short: "Beşiktaş", code: "BES" },
  "istanbul-basaksehir": { short: "Başakşehir", code: "IBS" },
  "pfc-cska-moscow": { short: "CSKA Moscow", code: "CSK" },
  "torpedo-moscow": { short: "Torpedo", code: "TOR" },
  "rotor-volgograd": { short: "Rotor", code: "ROT" },
  rostov: { short: "Rostov", code: "ROS" },
  "dynamo-kyiv": { short: "Dynamo Kyiv", code: "DYN" },
  "shakhtar-donetsk": { short: "Shakhtar", code: "SHK" },
  "zorya-luhansk": { short: "Zorya", code: "ZOR" },
  olympiacos: { short: "Olympiacos", code: "OLY" },
  panathinaikos: { short: "Panathinaikos", code: "PAN" },
  athinaikos: { short: "Athinaikos", code: "ATH" },
  "ferencvarosi-tc": { short: "Ferencváros", code: "FER" },
  "budapest-honved": { short: "Honvéd", code: "HON" },
  "gyori-eto": { short: "Győri ETO", code: "GYO" },
  "pecsi-mecsek": { short: "Pécsi", code: "PEC" },
  "zalaegerszegi-te": { short: "Zalaegerszegi", code: "ZTE" },
  "debreceni-vsc": { short: "Debrecen", code: "DVS" },
  fehervar: { short: "Fehérvár", code: "FEH" },
  "legia-warsaw": { short: "Legia", code: "LEG" },
  "widzew-odz": { short: "Widzew Łódź", code: "WID" },
  "ks-odz": { short: "ŁKS Łódź", code: "LKS" },
  "gornik-zabrze": { short: "Górnik", code: "GOR" },
  "dukla-prague": { short: "Dukla", code: "DUK" },
  "ac-sparta-prague": { short: "Sparta", code: "SPA" },
  "viktoria-plzen": { short: "Plzeň", code: "PLZ" },
  "mfk-kosice": { short: "Košice", code: "KOS" },
  fcsb: { short: "FCSB", code: "FSB" },
  "dinamo-bucuresti": { short: "Dinamo", code: "DIN" },
  "otelul-galati": { short: "Oțelul", code: "OTE" },
  "cfr-cluj": { short: "CFR Cluj", code: "CFR" },
  "pfc-spartak-1918": { short: "Spartak", code: "SPK" },
  "red-star-belgrade": { short: "Red Star", code: "RSB" },
  "fk-partizan": { short: "Partizan", code: "PAR" },
  "fk-sarajevo": { short: "Sarajevo", code: "SAR" },
  "gnk-dinamo-zagreb": { short: "Dinamo Zagreb", code: "DZG" },
  basel: { short: "Basel", code: "BAS" },
  "bsc-young-boys": { short: "Young Boys", code: "YB" },
  "sk-sturm-graz": { short: "Sturm Graz", code: "STG" },
  "sk-rapid-wien": { short: "Rapid Wien", code: "RAP" },
  lask: { short: "LASK", code: "LSK" },
  "fc-copenhagen": { short: "Copenhagen", code: "FCK" },
  "br-ndby-if": { short: "Brøndby", code: "BRO" },
  midtjylland: { short: "Midtjylland", code: "FCM" },
  "aab-fodbold": { short: "AaB", code: "AAB" },
  "ifk-goteborg": { short: "Göteborg", code: "IFK" },
  "djurgardens-if-fotboll": { short: "Djurgården", code: "DIF" },
  "hjk-helsinki": { short: "HJK", code: "HJK" },
  hibernians: { short: "Hibernians", code: "HIB" },
  "ac-omonia": { short: "Omonia", code: "OMO" },
  "maccabi-haifa": { short: "Maccabi Haifa", code: "MHA" },
  "sheriff-tiraspol": { short: "Sheriff", code: "SHE" },
  astana: { short: "Astana", code: "AST" },
  "estudiantes-de-la-plata": { short: "Estudiantes", code: "EST" },
};

export type ClubNames = { full: string; short: string; code: string };

// Trailing club-type qualifiers stripped by the fallback ("Liverpool FC" → "Liverpool").
const CLUB_TYPE_SUFFIX = /\s+(?:F\.?C\.?|A\.?F\.?C\.?|C\.?F\.?|S\.?C\.?|F\.?K\.?|J\.?K\.?|S\.?K\.?)$/i;

function fallbackShort(full: string): string {
  return full.replace(CLUB_TYPE_SUFFIX, "").trim() || full;
}

function fallbackCode(full: string): string {
  const words = fallbackShort(full)
    .replace(/[^\p{L}\s]/gu, "")
    .split(/\s+/)
    .filter(Boolean);
  if (words.length === 0) return full.slice(0, 3).toUpperCase();
  if (words.length === 1) return words[0].slice(0, 3).toUpperCase();
  return words.map((w) => w[0]).join("").slice(0, 3).toUpperCase();
}

/** Three display tiers for an opponent, by canonical id, falling back from the full name. */
export function opponentNames(id: string, full: string): ClubNames {
  const curated = OPPONENT_NAMES[id];
  return {
    full,
    short: curated?.short ?? fallbackShort(full),
    code: curated?.code ?? fallbackCode(full),
  };
}

/** Three display tiers for the club (Manchester United / Newton Heath) by match date. */
export function clubNames(date: string): ClubNames {
  const full = clubName(date);
  return full === "Newton Heath"
    ? { full, short: "Newton Heath", code: "NH" }
    : { full, short: "Man Utd", code: "MUN" };
}
