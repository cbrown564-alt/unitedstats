/** Hand-trimmed canonical nights — shared by the spark and rediscovery engine. */
export interface CuratedSpec {
  id: string;
  stakes: string;
}

export const CURATED_NIGHTS: CuratedSpec[] = [
  // — European nights —
  { id: "1968-05-29-benfica-n", stakes: "Ten years after Munich, the first English club to win the European Cup." },
  { id: "1999-05-26-bayern-munich-n", stakes: "Lost in the 90th minute, won in stoppage time. Unbelievable." },
  { id: "2008-05-21-chelsea-n", stakes: "Settled on penalties in the Moscow rain, a second European Cup." },
  { id: "1991-05-15-barcelona-n", stakes: "Two from Mark Hughes against his old club — Europe, back at last." },
  { id: "2017-05-24-afc-ajax-n", stakes: "The one trophy still missing from the cabinet, finally claimed." },

  // — Finals and silverware —
  { id: "1948-04-24-blackpool-n", stakes: "Matt Busby's first trophy, in one of Wembley's great finals." },
  { id: "1963-05-25-leicester-city-n", stakes: "Silverware again, five years on from Munich." },
  { id: "1977-05-21-liverpool-n", stakes: "The afternoon that denied Liverpool the Treble." },
  { id: "1990-05-17-crystal-palace-n", stakes: "Alex Ferguson's first trophy — the one that saved all the rest." },
  { id: "1994-05-14-chelsea-n", stakes: "The club's first League and FA Cup Double." },
  { id: "1996-05-11-liverpool-n", stakes: "Cantona, late and alone — a second Double in three seasons." },
  { id: "1999-05-22-newcastle-united-n", stakes: "Five days after the league, the second leg of the Treble." },
  { id: "2024-05-25-manchester-city-n", stakes: "A derby final, and the season's one bright day." },

  // — League and cup drama —
  { id: "1993-04-10-sheffield-wednesday-h", stakes: "Two Steve Bruce headers in the closing minutes — a first title in twenty-six years drew near." },
  { id: "1999-04-14-arsenal-n", stakes: "Giggs, from inside his own half, to keep the Treble alive." },
  { id: "1999-05-16-tottenham-hotspur-h", stakes: "Come from behind on the final day to take the title — the Treble's first leg." },
  { id: "2001-09-29-tottenham-hotspur-a", stakes: "Three down at half-time at White Hart Lane, five scored after it." },

  // — Modern nights —
  { id: "2011-08-28-arsenal-h", stakes: "Arsenal on the wrong end of one of Old Trafford's great routs." },
  { id: "2009-09-20-manchester-city-h", stakes: "Michael Owen, deep into stoppage time, to settle a seven-goal derby." },
  { id: "2019-03-06-paris-saint-germain-a", stakes: "Two down from the first leg, through on a penalty in the last minute in Paris." },
  { id: "2013-04-22-aston-villa-h", stakes: "Van Persie's volley, and a twentieth league title — Ferguson's last." },
];

/** Nights everyone already knows — excluded from the faded rediscovery pool. */
export const CANONICAL_FAME = new Set(CURATED_NIGHTS.map((c) => c.id));
