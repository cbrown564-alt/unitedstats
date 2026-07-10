/**
 * Build the large, route-specific stadium stills used by /journey/treble beat 0.
 *
 * Same pattern as cache-journey-portraits.ts: Commons originals recorded in
 * data/canonical/journey-place-media.json → 1024px WebP under public/media/journey/.
 * Treated as place monuments (grayscale + red wash in the stage), not match photography.
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
};

const ROOT = process.cwd();
const MANIFEST = path.join(ROOT, "data/canonical/journey-place-media.json");
const OUTPUT_DIR = path.join(ROOT, "public/media/journey");
const SIZE = 1024;

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

async function main() {
  const source = JSON.parse(await fs.readFile(MANIFEST, "utf8")) as { records: PlaceMedia[] };
  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  for (const record of source.records) {
    if (record.sourceId !== "wikimedia-commons") {
      throw new Error(`Expected a Commons source for ${record.placeId}`);
    }

    const output = path.join(OUTPUT_DIR, `${record.placeId}.webp`);
    try {
      const existing = await sharp(output).metadata();
      if (existing.width === SIZE && existing.height === SIZE) {
        console.log(`${record.placeId}: already cached → ${path.relative(ROOT, output)}`);
        continue;
      }
    } catch {
      // missing or unreadable — fetch below
    }

    const original = await fetchOriginal(record.imageUrl);
    // Landscape stadium stills → square cover crop centred on the bowl / towers.
    await sharp(original, { failOn: "none" })
      .rotate()
      .resize(SIZE, SIZE, { fit: "cover", position: "attention" })
      .webp({ quality: 86 })
      .toFile(output);

    const meta = await sharp(output).metadata();
    if (meta.width !== SIZE || meta.height !== SIZE) {
      throw new Error(`Unexpected output size for ${record.placeId}`);
    }
    console.log(`${record.placeId}: ${meta.width}×${meta.height} → ${path.relative(ROOT, output)}`);
    await sleep(1200);
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
