import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

export const ROOT = resolve("output/media-sprint");
export const MANIFEST_PATH = resolve(ROOT, "manifest.json");

export function ensureDir(path) {
  mkdirSync(path, { recursive: true });
}

export function loadEnv(path) {
  if (!existsSync(path)) return;
  for (const raw of readFileSync(path, "utf8").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const split = line.indexOf("=");
    if (split < 1) continue;
    const key = line.slice(0, split).trim();
    const value = line.slice(split + 1).trim().replace(/^['"]|['"]$/g, "");
    if (!(key in process.env)) process.env[key] = value;
  }
}

export function sha256(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

export function readManifest() {
  if (existsSync(MANIFEST_PATH)) return JSON.parse(readFileSync(MANIFEST_PATH, "utf8"));
  return {
    sprint: "red-thread-expiring-generation-window-2026-08",
    purpose: "Reusable, historically honest media kit; sources and review material only, never shipped directly.",
    policy: {
      documentaryStatus: "synthetic-abstract",
      allowed: ["abstract textures", "atmosphere", "music", "sound design", "non-representational motion"],
      prohibited: ["fictional historic people", "fictional matches", "kits", "stadiums", "crowds", "documentary-looking scenes"],
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    assets: [],
  };
}

export function upsertAssets(incoming) {
  ensureDir(dirname(MANIFEST_PATH));
  const manifest = readManifest();
  const byId = new Map(manifest.assets.map((asset) => [asset.id, asset]));
  for (const asset of incoming) byId.set(asset.id, { ...byId.get(asset.id), ...asset });
  manifest.assets = [...byId.values()].sort((a, b) => a.id.localeCompare(b.id));
  manifest.updatedAt = new Date().toISOString();
  writeFileSync(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`);
  return manifest;
}
