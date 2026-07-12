export type BallonRanking = { rank: number; name: string; points: number };

/**
 * Top 20 vote-getters in the two award years. The historical voting pools were
 * different sizes, so each half uses its own points scale; the graphic compares
 * each winner with his contemporaries, not 61 points directly with 446.
 *
 * Sources:
 * - 1968: https://www.rsssf.org/miscellaneous/europa-poy68.html
 * - 2008: https://www.rsssf.org/miscellaneous/europa-poy08.html
 */
export const BALLON_1968: BallonRanking[] = [
  { rank: 1, name: "George Best", points: 61 },
  { rank: 2, name: "Bobby Charlton", points: 53 },
  { rank: 3, name: "Dragan Džajić", points: 46 },
  { rank: 4, name: "Franz Beckenbauer", points: 36 },
  { rank: 5, name: "Giacinto Facchetti", points: 30 },
  { rank: 6, name: "Gigi Riva", points: 22 },
  { rank: 7, name: "Amancio", points: 21 },
  { rank: 8, name: "Eusébio", points: 15 },
  { rank: 9, name: "Gianni Rivera", points: 13 },
  { rank: 10, name: "Jimmy Greaves", points: 8 },
  { rank: 10, name: "Pirri", points: 8 },
  { rank: 12, name: "Antal Dunai", points: 7 },
  { rank: 12, name: "Willi Schulz", points: 7 },
  { rank: 14, name: "Georgi Asparuhov", points: 6 },
  { rank: 14, name: "Albert Shesternyov", points: 6 },
  { rank: 16, name: "Ove Kindvall", points: 5 },
  { rank: 17, name: "Flórián Albert", points: 4 },
  { rank: 17, name: "Sandro Mazzola", points: 4 },
  { rank: 17, name: "Lajos Szűcs", points: 4 },
  { rank: 20, name: "Johan Cruyff", points: 3 },
];

export const BALLON_2008: BallonRanking[] = [
  { rank: 1, name: "Cristiano Ronaldo", points: 446 },
  { rank: 2, name: "Lionel Messi", points: 281 },
  { rank: 3, name: "Fernando Torres", points: 179 },
  { rank: 4, name: "Iker Casillas", points: 133 },
  { rank: 5, name: "Xavi", points: 97 },
  { rank: 6, name: "Andrey Arshavin", points: 64 },
  { rank: 7, name: "David Villa", points: 55 },
  { rank: 8, name: "Kaká", points: 31 },
  { rank: 9, name: "Zlatan Ibrahimović", points: 30 },
  { rank: 10, name: "Steven Gerrard", points: 28 },
  { rank: 11, name: "Marcos Senna", points: 16 },
  { rank: 12, name: "Emmanuel Adebayor", points: 12 },
  { rank: 13, name: "Wayne Rooney", points: 11 },
  { rank: 14, name: "Sergio Agüero", points: 10 },
  { rank: 15, name: "Frank Lampard", points: 8 },
  { rank: 16, name: "Franck Ribéry", points: 7 },
  { rank: 17, name: "Samuel Eto'o", points: 6 },
  { rank: 18, name: "Gianluigi Buffon", points: 5 },
  { rank: 19, name: "Michael Ballack", points: 4 },
  { rank: 19, name: "Cesc Fàbregas", points: 4 },
];
