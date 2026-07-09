/** Hand-trimmed canonical nights — shared by the spark and rediscovery engine. */
export interface CuratedSpec {
  id: string;
  stakes: string;
}

export const CURATED_NIGHTS: CuratedSpec[] = [
  // — European nights —
  { id: "1968-05-29-benfica-n", stakes: "Ten years after Munich, the first English club to win the European Cup." },
  { id: "1999-05-26-bayern-munich-n", stakes: "Bayern lead in the 90th; two stoppage-time goals win the European Cup." },
  { id: "2008-05-21-chelsea-n", stakes: "Penalties in Moscow rain — a second European Cup." },
  { id: "1991-05-15-barcelona-n", stakes: "Two from Mark Hughes against his old club — Cup Winners' Cup." },
  { id: "2017-05-24-afc-ajax-n", stakes: "Europa League final — the one major trophy still missing, claimed." },

  // — Finals and silverware —
  { id: "1948-04-24-blackpool-n", stakes: "Matt Busby's first trophy — FA Cup final at Wembley." },
  { id: "1963-05-25-leicester-city-n", stakes: "FA Cup, five years after Munich." },
  { id: "1977-05-21-liverpool-n", stakes: "FA Cup final — Liverpool denied the Treble." },
  { id: "1990-05-17-crystal-palace-n", stakes: "Ferguson's first trophy — FA Cup replay." },
  { id: "1994-05-14-chelsea-n", stakes: "First League and FA Cup Double." },
  { id: "1996-05-11-liverpool-n", stakes: "Cantona, late — a second Double in three seasons." },
  { id: "1999-05-22-newcastle-united-n", stakes: "Five days after the league: FA Cup, Treble still alive." },
  { id: "2024-05-25-manchester-city-n", stakes: "FA Cup final against City — the season's silverware." },

  // — League and cup drama —
  { id: "1993-04-10-sheffield-wednesday-h", stakes: "Two Steve Bruce headers late — title within reach after twenty-six years." },
  { id: "1999-04-14-arsenal-n", stakes: "Giggs from his own half — FA Cup semi, Treble still on." },
  { id: "1999-05-16-tottenham-hotspur-h", stakes: "Come from behind on the final day — league title, Treble's first leg." },
  { id: "2001-09-29-tottenham-hotspur-a", stakes: "Three down at half-time at White Hart Lane; five scored after." },

  // — Modern nights —
  { id: "2011-08-28-arsenal-h", stakes: "8–2 at Old Trafford — Arsenal routed." },
  { id: "2009-09-20-manchester-city-h", stakes: "Michael Owen in stoppage time — 4–3 derby." },
  { id: "2019-03-06-paris-saint-germain-a", stakes: "Two down from the first leg; last-minute penalty in Paris." },
  { id: "2013-04-22-aston-villa-h", stakes: "Van Persie's volley — twentieth league title, Ferguson's last." },
];

/** Nights everyone already knows — excluded from the faded rediscovery pool. */
export const CANONICAL_FAME = new Set(CURATED_NIGHTS.map((c) => c.id));
