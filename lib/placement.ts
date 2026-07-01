/** Pitch band — shared by match teamsheets and career appearance maps. */
export type PitchBand = "GK" | "DEF" | "MID" | "FWD";

export const PITCH_BAND_ORDER: PitchBand[] = ["FWD", "MID", "DEF", "GK"];

const BANDS: PitchBand[] = ["GK", "DEF", "MID", "FWD"];

export type PitchPlacement = { band: PitchBand; lat: number; via: "role" | "shirt" | "career" };

export type PitchPlacementInput = {
  role: string | null;
  shirt: number | null;
  career_band?: string | null;
};

/** Map a positional label to one of four bands; null if it cannot be placed. */
function roleBand(role: string | null | undefined): PitchBand | null {
  if (!role) return null;
  const r = role.trim().toLowerCase();
  if (/goalkeep|^gk$/.test(r)) return "GK";
  if (/back|defender|^[crl]b$|^df$|^ch$/.test(r)) return "DEF";
  if (/forward|wing|strik|second|^cf$|^ss$|^fw$|^[rl]w$|^[rl]f$|^or$|^ol$|^ir$|^il$/.test(r)) return "FWD";
  if (/midfield|half|^[crl]m$|^mf$|^am$|^dm$|^[rl]h$/.test(r)) return "MID";
  return null;
}

/** Lateral hint so a band reads left → right: lower = further left. */
function lateral(role: string | null | undefined): number {
  const r = (role ?? "").toLowerCase();
  if (/left|^l[bmwfh]$|^ol$|^il$/.test(r)) return 0;
  if (/right|^r[bmwfh]$|^or$|^ir$/.test(r)) return 2;
  return 1;
}

function careerBand(bucket: string | null | undefined): PitchBand | null {
  if (!bucket) return null;
  const b = bucket.trim().toUpperCase();
  return (BANDS as string[]).includes(b) ? (b as PitchBand) : null;
}

function shirtPlacement(shirt: number, year: number): { band: PitchBand; lat: number } | null {
  const FRONT: Record<number, { band: PitchBand; lat: number }> = {
    11: { band: "FWD", lat: 0 },
    10: { band: "FWD", lat: 1 },
    9: { band: "FWD", lat: 2 },
    8: { band: "FWD", lat: 3 },
    7: { band: "FWD", lat: 4 },
  };
  if (year < 1925) {
    const map: Record<number, { band: PitchBand; lat: number }> = {
      1: { band: "GK", lat: 1 },
      3: { band: "DEF", lat: 0 }, 2: { band: "DEF", lat: 2 },
      6: { band: "MID", lat: 0 }, 5: { band: "MID", lat: 1 }, 4: { band: "MID", lat: 2 },
      ...FRONT,
    };
    return map[shirt] ?? null;
  }
  if (year < 1958) {
    const map: Record<number, { band: PitchBand; lat: number }> = {
      1: { band: "GK", lat: 1 },
      3: { band: "DEF", lat: 0 }, 5: { band: "DEF", lat: 1 }, 2: { band: "DEF", lat: 2 },
      6: { band: "MID", lat: 0 }, 4: { band: "MID", lat: 2 },
      ...FRONT,
    };
    return map[shirt] ?? null;
  }
  const map: Record<number, { band: PitchBand; lat: number }> = {
    1: { band: "GK", lat: 1 },
    3: { band: "DEF", lat: 0 }, 6: { band: "DEF", lat: 1 }, 5: { band: "DEF", lat: 2 }, 2: { band: "DEF", lat: 3 },
    11: { band: "MID", lat: 0 }, 8: { band: "MID", lat: 1 }, 4: { band: "MID", lat: 2 }, 7: { band: "MID", lat: 3 },
    10: { band: "FWD", lat: 0 }, 9: { band: "FWD", lat: 1 },
  };
  return map[shirt] ?? null;
}

/**
 * Resolve pitch placement through role → shirt (pre-1993) → career band.
 * Same evidence ladder as {@link FormationPitch}.
 */
export function pitchPlacement(p: PitchPlacementInput, year: number | null): PitchPlacement | null {
  const rb = roleBand(p.role);
  if (rb) return { band: rb, lat: lateral(p.role), via: "role" };
  if (year != null && year < 1993 && p.shirt != null) {
    const sp = shirtPlacement(p.shirt, year);
    if (sp) return { ...sp, via: "shirt" };
  }
  const cb = careerBand(p.career_band);
  if (cb) return { band: cb, lat: 1, via: "career" };
  return null;
}

/** Band-only placement for gates that do not need lateral detail. */
export function placeBand(p: PitchPlacementInput, year: number | null): PitchBand | null {
  return pitchPlacement(p, year)?.band ?? null;
}

export type CareerAppearanceInput = PitchPlacementInput & { date: string };

export type CareerAppearanceSummary = {
  total: number;
  placed: number;
  unplaced: number;
  byVia: { role: number; shirt: number; career: number };
  bandTotals: Record<PitchBand, number>;
  slots: { band: PitchBand; lat: number; count: number }[];
  topRoles: { role: string; count: number }[];
  maxSlotCount: number;
};

/** Aggregate lineup appearances onto the shared pitch grid. */
export function summarizeCareerAppearances(appearances: CareerAppearanceInput[]): CareerAppearanceSummary {
  const slotMap = new Map<string, number>();
  const bandTotals: Record<PitchBand, number> = { GK: 0, DEF: 0, MID: 0, FWD: 0 };
  const byVia = { role: 0, shirt: 0, career: 0 };
  const byRole = new Map<string, number>();
  let unplaced = 0;

  for (const a of appearances) {
    const year = Number(a.date.slice(0, 4));
    const at = pitchPlacement(a, Number.isFinite(year) ? year : null);
    if (!at) {
      unplaced++;
      continue;
    }
    bandTotals[at.band]++;
    byVia[at.via]++;
    const key = `${at.band}:${at.lat}`;
    slotMap.set(key, (slotMap.get(key) ?? 0) + 1);
    const role = a.role?.trim();
    if (role) byRole.set(role, (byRole.get(role) ?? 0) + 1);
  }

  const slots = [...slotMap.entries()]
    .map(([key, count]) => {
      const [band, lat] = key.split(":");
      return { band: band as PitchBand, lat: Number(lat), count };
    })
    .sort((a, b) => PITCH_BAND_ORDER.indexOf(a.band) - PITCH_BAND_ORDER.indexOf(b.band) || a.lat - b.lat);

  const topRoles = [...byRole.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([role, count]) => ({ role, count }));

  const maxSlotCount = slots.reduce((m, s) => Math.max(m, s.count), 0);

  return {
    total: appearances.length,
    placed: appearances.length - unplaced,
    unplaced,
    byVia,
    bandTotals,
    slots,
    topRoles,
    maxSlotCount,
  };
}
