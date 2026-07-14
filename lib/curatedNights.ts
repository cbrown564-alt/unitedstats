/** Hand-trimmed canonical nights — shared by the spark and rediscovery engine. */
export interface CuratedSpec {
  id: string;
  stakes: string;
}

export const CURATED_NIGHTS: CuratedSpec[] = [
  // — European nights —
  { id: "1968-05-29-benfica-n", stakes: "Ten years after Munich, United became the first English club to win the European Cup." },
  { id: "1999-05-26-bayern-munich-n", stakes: "Bayern led from the sixth minute. Two stoppage-time goals completed the Treble." },
  { id: "2008-05-21-chelsea-n", stakes: "United won their third European Cup on penalties in Moscow." },
  { id: "1991-05-15-barcelona-n", stakes: "Mark Hughes scored twice against his former club as United won the Cup Winners’ Cup." },
  { id: "2017-05-24-afc-ajax-n", stakes: "Winning the Europa League completed United’s set of major European trophies." },

  // — Finals and silverware —
  { id: "1948-04-24-blackpool-n", stakes: "The FA Cup at Wembley gave Matt Busby his first trophy as United manager." },
  { id: "1963-05-25-leicester-city-n", stakes: "United won the FA Cup five years after Munich." },
  { id: "1977-05-21-liverpool-n", stakes: "United won the FA Cup and stopped Liverpool completing the Treble." },
  { id: "1990-05-17-crystal-palace-n", stakes: "The FA Cup replay gave Alex Ferguson his first trophy as United manager." },
  { id: "1994-05-14-chelsea-n", stakes: "United completed their first League and FA Cup Double." },
  { id: "1996-05-11-liverpool-n", stakes: "Eric Cantona’s late goal completed United’s second Double in three seasons." },
  { id: "1999-05-22-newcastle-united-n", stakes: "Five days after winning the league, United kept the Treble alive with the FA Cup." },
  { id: "2024-05-25-manchester-city-n", stakes: "United beat Manchester City to win the FA Cup and secure the season’s silverware." },

  // — League and cup drama —
  { id: "1993-04-10-sheffield-wednesday-h", stakes: "Two late Steve Bruce headers put a first league title in twenty-six years within reach." },
  { id: "1999-04-14-arsenal-n", stakes: "Ryan Giggs scored from his own half to win the FA Cup semi-final and keep the Treble alive." },
  { id: "1999-05-16-tottenham-hotspur-h", stakes: "United came from behind on the final day to win the league, the Treble’s first part." },
  { id: "2001-09-29-tottenham-hotspur-a", stakes: "Three down at half-time at White Hart Lane, United scored five after the break." },

  // — Modern nights —
  { id: "2011-08-28-arsenal-h", stakes: "United scored eight against Arsenal at Old Trafford." },
  { id: "2009-09-20-manchester-city-h", stakes: "Michael Owen’s stoppage-time goal settled a 4–3 Manchester derby." },
  { id: "2019-03-06-paris-saint-germain-a", stakes: "Two goals down from the first leg, United went through on a stoppage-time penalty in Paris." },
  { id: "2013-04-22-aston-villa-h", stakes: "Robin van Persie’s volley helped secure United’s twentieth league title, Alex Ferguson’s last." },
];

/** Nights everyone already knows — excluded from the faded rediscovery pool. */
export const CANONICAL_FAME = new Set(CURATED_NIGHTS.map((c) => c.id));
