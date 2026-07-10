/**
 * Build the large, route-specific stills used by the Eleven days in May story.
 *
 * Same pattern as cache-journey-portraits.ts: Commons originals recorded in
 * data/canonical/journey-place-media.json → WebP under public/media/journey/.
 * Place monuments are 1024²; the climax atmosphere is a 1920×1080 landscape.
 *
 * Usage: npx tsx scripts/cache-journey-places.ts
 */
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

type PlaceMedia = {
  placeId: string;
  imageUrl: string;
  sourceId: string;
  fit?: "square" | "landscape";
  /** Optional named crop for monument framing (e.g. Keane on the FA Cup podium). */
  crop?: string;
};

type Manifest = {
  records: PlaceMedia[];
  climaxAtmosphere?: PlaceMedia;
};

const ROOT = process.cwd();
const MANIFEST = path.join(ROOT, "data/canonical/journey-place-media.json");
const OUTPUT_DIR = path.join(ROOT, "public/media/journey");
const SQUARE = 1024;
const LANDSCAPE = { w: 1920, h: 1080 } as const;

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchOriginal(url: string): Promise<Buffer> {
  let lastError: Error | null = null;
  for (let attempt = 0; attempt < 4; attempt++) {
    if (attempt > 0) await sleep(1500 * attempt);
    const response = await fetch(url, {
      headers: { "user-agent": "unitedstats/1.0 journey-place-cache" },
    });
    if (response.ok) return Buffer.from(await response.arrayBuffer());
    lastError = new Error(`Image download failed (${response.status}): ${url}`);
    if (response.status !== 429 && response.status !== 503) break;
  }
  throw lastError ?? new Error(`Image download failed: ${url}`);
}

async function cacheRecord(record: PlaceMedia) {
  if (record.sourceId !== "wikimedia-commons") {
    throw new Error(`Expected a Commons source for ${record.placeId}`);
  }

  const landscape = record.fit === "landscape";
  const output = path.join(OUTPUT_DIR, `${record.placeId}.webp`);
  const wantW = landscape ? LANDSCAPE.w : SQUARE;
  const wantH = landscape ? LANDSCAPE.h : SQUARE;

  try {
    const existing = await sharp(output).metadata();
    if (existing.width === wantW && existing.height === wantH) {
      console.log(`${record.placeId}: already cached → ${path.relative(ROOT, output)}`);
      return;
    }
  } catch {
    // missing or unreadable — fetch below
  }

  const original = await fetchOriginal(record.imageUrl);
  let pipeline = sharp(original, { failOn: "none" }).rotate();

  // FA Cup presentation is a wide crowd shot — extract the Keane podium region
  // so the monument matches the Commons cropped framing at 1024² scale.
  if (record.crop === "keane-podium") {
    const meta = await sharp(original, { failOn: "none" }).metadata();
    const w = meta.width ?? wantW;
    const h = meta.height ?? wantH;
    // Podium sits left-of-centre in the full frame; take a tall-ish square around it.
    const side = Math.round(Math.min(w, h) * 0.55);
    const left = Math.round(w * 0.18);
    const top = Math.round(h * 0.28);
    pipeline = pipeline.extract({
      left: Math.max(0, Math.min(left, w - side)),
      top: Math.max(0, Math.min(top, h - side)),
      width: Math.min(side, w),
      height: Math.min(side, h),
    });
  }

  await pipeline
    .resize(wantW, wantH, { fit: "cover", position: landscape ? "centre" : "attention" })
    .webp({ quality: 86 })
    .toFile(output);

  const meta = await sharp(output).metadata();
  if (meta.width !== wantW || meta.height !== wantH) {
    throw new Error(`Unexpected output size for ${record.placeId}`);
  }
  console.log(`${record.placeId}: ${meta.width}×${meta.height} → ${path.relative(ROOT, output)}`);
  await sleep(1200);
}

async function main() {
  const source = JSON.parse(await fs.readFile(MANIFEST, "utf8")) as Manifest;
  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  for (const record of source.records) {
    await cacheRecord(record);
  }
  if (source.climaxAtmosphere) {
    await cacheRecord({ ...source.climaxAtmosphere, fit: "landscape" });
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
