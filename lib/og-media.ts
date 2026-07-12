type OgMediaTreatment = "full" | "panel" | "texture";

export type CuratedOgMedia = {
  src: string;
  source: string;
  licence: string;
  position: string;
  treatment: OgMediaTreatment;
  era?: { from: number; to: number };
};

/** Authored media allowed in social cards. Route files reference keys, never ad-hoc paths. */
export const OG_MEDIA = {
  campNou1999: { src: "/media/journey/camp-nou.webp", source: "Red Thread place archive", licence: "Editorial site asset", position: "54% 45%", treatment: "full", era: { from: 1999, to: 1999 } },
  trebleParade1999: { src: "/media/journey/treble-parade.webp", source: "Red Thread journey archive", licence: "Editorial site asset", position: "58% 38%", treatment: "full", era: { from: 1999, to: 1999 } },
  oldTrafford: { src: "/media/journey/old-trafford.webp", source: "Red Thread place archive", licence: "Editorial site asset", position: "55% 45%", treatment: "panel" },
  barcelona: { src: "/media/journey/barcelona-climax.webp", source: "Red Thread journey archive", licence: "Editorial site asset", position: "50% 35%", treatment: "panel" },
  brunoFernandes: { src: "/media/journey/bruno-fernandes.webp", source: "Wikimedia Commons", licence: "CC BY-SA 4.0", position: "60% 25%", treatment: "panel", era: { from: 2020, to: 2026 } },
  georgeBest: { src: "/media/journey/george-best.webp", source: "Wikimedia Commons / Nationaal Archief", licence: "CC0", position: "62% 25%", treatment: "full", era: { from: 1963, to: 1974 } },
  cristianoRonaldo2008: { src: "/media/journey/cristiano-ronaldo.webp", source: "Wikimedia Commons", licence: "CC BY 2.0", position: "62% 22%", treatment: "full", era: { from: 2003, to: 2009 } },
  wembley: { src: "/media/journey/wembley.webp", source: "Red Thread place archive", licence: "Editorial site asset", position: "58% 42%", treatment: "full" },
} as const satisfies Record<string, CuratedOgMedia>;
