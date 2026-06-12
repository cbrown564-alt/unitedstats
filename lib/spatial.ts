import { getDb } from "./db";
import type { Record_ } from "./queries";

/**
 * Travel-distance layer. Opponent coordinates are curated at city level in
 * data/canonical/opponents.json — each club's traditional home town, not a
 * stadium fix — so distances are honest about being approximate. All journeys
 * are measured one-way from Manchester; United's grounds have all been within
 * a couple of miles of each other, so a single origin keeps eras comparable.
 */

export const MANCHESTER = { lat: 53.463, lng: -2.291 };

const EARTH_RADIUS_KM = 6371;

export function haversineKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const rad = Math.PI / 180;
  const dLat = (bLat - aLat) * rad;
  const dLng = (bLng - aLng) * rad;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(aLat * rad) * Math.cos(bLat * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

export interface AwayVenue extends Record_ {
  id: string;
  name: string;
  country: string | null;
  lat: number;
  lng: number;
  km: number;
  first: string;
  last: string;
  european: number;
}

/** Every official away ground with curated coordinates, with the record there. */
export function awayFootprint(): AwayVenue[] {
  return getDb()
    .prepare(
      `SELECT o.id, o.name, o.country, o.lat, o.lng,
              COUNT(*) p, SUM(m.result='W') w, SUM(m.result='D') d, SUM(m.result='L') l,
              SUM(m.gf) gf, SUM(m.ga) ga, MIN(m.date) first, MAX(m.date) last,
              SUM(c.type='european') european
       FROM matches m JOIN opponents o ON o.id = m.opponent_id
       JOIN competitions c ON c.id = m.competition_id
       WHERE m.venue = 'A' AND c.type != 'unofficial' AND o.lat IS NOT NULL
       GROUP BY o.id ORDER BY p DESC`,
    )
    .all()
    .map((r) => {
      const row = r as Omit<AwayVenue, "km">;
      return { ...row, km: haversineKm(MANCHESTER.lat, MANCHESTER.lng, row.lat, row.lng) };
    });
}

export interface SeasonTravel {
  season: string;
  trips: number;
  totalKm: number;
  avgKm: number;
  maxKm: number;
}

/** One-way away-trip distance per season, official competitions. */
export function travelBySeason(): SeasonTravel[] {
  const rows = getDb()
    .prepare(
      `SELECT m.season, o.lat, o.lng
       FROM matches m JOIN opponents o ON o.id = m.opponent_id
       JOIN competitions c ON c.id = m.competition_id
       WHERE m.venue = 'A' AND c.type != 'unofficial' AND o.lat IS NOT NULL
       ORDER BY m.season`,
    )
    .all() as { season: string; lat: number; lng: number }[];
  const bySeason = new Map<string, number[]>();
  for (const r of rows) {
    const km = haversineKm(MANCHESTER.lat, MANCHESTER.lng, r.lat, r.lng);
    const list = bySeason.get(r.season) ?? [];
    list.push(km);
    bySeason.set(r.season, list);
  }
  return [...bySeason.entries()].map(([season, kms]) => ({
    season,
    trips: kms.length,
    totalKm: kms.reduce((a, b) => a + b, 0),
    avgKm: kms.reduce((a, b) => a + b, 0) / kms.length,
    maxKm: Math.max(...kms),
  }));
}

/** Coverage for the travel slice: away matches with vs without coordinates. */
export function travelCoverage(): { covered: number; total: number } {
  return getDb()
    .prepare(
      `SELECT SUM(o.lat IS NOT NULL) covered, COUNT(*) total
       FROM matches m JOIN opponents o ON o.id = m.opponent_id
       JOIN competitions c ON c.id = m.competition_id
       WHERE m.venue = 'A' AND c.type != 'unofficial'`,
    )
    .get() as { covered: number; total: number };
}
