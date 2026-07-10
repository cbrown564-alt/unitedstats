/**
 * Build the large, route-specific portraits used by the Two No. 7s story.
 *
 * The shared player portrait cache intentionally uses small 320px cards. The
 * immersive journey enlarges two faces to half-viewport scale, so it needs its
 * own 1024px derivatives from the same licensed Wikimedia originals recorded in
 * data/canonical/player-media.json.
 *
 * Usage: npx tsx scripts/cache-journey-portraits.ts
 */
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

type PlayerMedia = {
  playerId: string;
  imageUrl: string;
  sourceId: string;
};

const ROOT = process.cwd();
const MANIFEST = path.join(ROOT, "data/canonical/player-media.json");
const OUTPUT_DIR = path.join(ROOT, "public/media/journey");
const SIZE = 1024;
const PLAYER_IDS = ["george-best", "cristiano-ronaldo"] as const;

async function fetchOriginal(url: string): Promise<Buffer> {
  const response = await fetch(url, {
    headers: { "user-agent": "unitedstats/1.0 journey-portrait-cache" },
  });
  if (!response.ok) throw new Error(`Image download failed (${response.status}): ${url}`);
  return Buffer.from(await response.arrayBuffer());
}

async function main() {
  const source = JSON.parse(await fs.readFile(MANIFEST, "utf8")) as { records: PlayerMedia[] };
  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  for (const playerId of PLAYER_IDS) {
    const record = source.records.find((candidate) => candidate.playerId === playerId);
    if (!record) throw new Error(`No player-media record for ${playerId}`);
    if (record.sourceId !== "wikidata-commons") throw new Error(`Expected a Commons source for ${playerId}`);

    const output = path.join(OUTPUT_DIR, `${playerId}.webp`);
    const original = await fetchOriginal(record.imageUrl);
    await sharp(original, { failOn: "none" })
      .rotate()
      .resize(SIZE, SIZE, { fit: "cover", position: "attention" })
      .webp({ quality: 88 })
      .toFile(output);

    const meta = await sharp(output).metadata();
    if (meta.width !== SIZE || meta.height !== SIZE) throw new Error(`Unexpected output size for ${playerId}`);
    console.log(`${playerId}: ${meta.width}×${meta.height} → ${path.relative(ROOT, output)}`);
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
