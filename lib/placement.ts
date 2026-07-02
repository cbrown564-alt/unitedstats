/** Pitch band — shared by match teamsheets and career appearance maps. */
export type PitchBand = "GK" | "DEF" | "MID" | "FWD";

export const PITCH_BAND_ORDER: PitchBand[] = ["FWD", "MID", "DEF", "GK"];

const BANDS: PitchBand[] = ["GK", "DEF", "MID", "FWD"];

export type PitchPlacement = { band: PitchBand; lat: number; via: "role" | "shirt" | "career" };

export type PitchPlacementInput = {
  role: string | null;
  shirt: number | null;
  career_band?: string | null;
  career_label?: string | null;
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

type LabelPlacement = { band: PitchBand; lat: number | null };

/** Career position label → band and optional lateral (null = infer from shirt). */
function labelPlacement(label: string): LabelPlacement | null {
  const r = label.trim().toLowerCase();
  if (/goalkeep/.test(r)) return { band: "GK", lat: 1 };
  if (/centre.?back|center.?back/.test(r)) return { band: "DEF", lat: 1 };
  if (/full.?back/.test(r)) return { band: "DEF", lat: null };
  if (/left.?back|^lb$/.test(r)) return { band: "DEF", lat: 0 };
  if (/right.?back|^rb$/.test(r)) return { band: "DEF", lat: 2 };
  if (/left.?wing/.test(r)) return { band: "FWD", lat: 0 };
  if (/right.?wing/.test(r)) return { band: "FWD", lat: 2 };
  if (/winger/.test(r)) return { band: "FWD", lat: null };
  if (/wing.?half/.test(r)) return { band: "MID", lat: null };
  if (/attacking.?mid/.test(r)) return { band: "MID", lat: null };
  if (/strik|forward/.test(r)) {
    const lat = /left/.test(r) ? 0 : /right/.test(r) ? 2 : 1;
    return { band: "FWD", lat };
  }
  if (/midfield|midfielder/.test(r)) return { band: "MID", lat: null };
  if (/defender/.test(r)) return { band: "DEF", lat: 1 };
  return null;
}

/** Classic shirt-number lateral bias when side is unknown — approximate only. */
function shirtLateralHint(shirt: number | null, band: PitchBand): number {
  if (shirt == null) return 1;
  const hints: Record<PitchBand, Record<number, number>> = {
    GK: { 1: 1 },
    DEF: { 2: 2, 3: 0, 4: 0, 5: 2, 6: 1, 12: 1, 15: 1, 23: 0, 29: 2 },
    MID: { 4: 1, 6: 1, 7: 2, 8: 1, 11: 0, 16: 1, 17: 1, 18: 1 },
    FWD: { 7: 2, 9: 1, 10: 0, 11: 0, 19: 2, 20: 1 },
  };
  return hints[band][shirt] ?? 1;
}

function resolveLat(lat: number | null, shirt: number | null, band: PitchBand): number {
  return lat ?? shirtLateralHint(shirt, band);
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

function careerPlacement(
  p: PitchPlacementInput,
  shirt: number | null,
): PitchPlacement | null {
  const label = p.career_label ? labelPlacement(p.career_label) : null;
  if (label) {
    return {
      band: label.band,
      lat: resolveLat(label.lat, shirt, label.band),
      via: "career",
    };
  }
  const cb = careerBand(p.career_band);
  if (cb) {
    return { band: cb, lat: shirtLateralHint(shirt, cb), via: "career" };
  }
  return null;
}

/**
 * Resolve pitch placement through role → shirt (pre-1993) → career label/band.
 * Same evidence ladder as {@link FormationPitch}.
 */
export function pitchPlacement(p: PitchPlacementInput, year: number | null): PitchPlacement | null {
  const rb = roleBand(p.role);
  if (rb) {
    let lat = lateral(p.role);
    if (lat === 1 && p.career_label) {
      const label = labelPlacement(p.career_label);
      if (label) lat = resolveLat(label.lat, p.shirt, rb);
    }
    return { band: rb, lat, via: "role" };
  }
  if (year != null && year < 1993 && p.shirt != null) {
    const sp = shirtPlacement(p.shirt, year);
    if (sp) return { ...sp, via: "shirt" };
  }
  return careerPlacement(p, p.shirt);
}

/** Band-only placement for gates that do not need lateral detail. */
export function placeBand(p: PitchPlacementInput, year: number | null): PitchBand | null {
  return pitchPlacement(p, year)?.band ?? null;
}
