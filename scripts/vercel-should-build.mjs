/**
 * Vercel Ignored Build Step.
 *
 * Exit 0 → skip the build (data-only ingest handled by blob upload + revalidate).
 * Exit 1 → proceed (code / mixed changes, or blob revalidation not configured).
 */
import { execSync } from "node:child_process";

const DATA_PREFIXES = ["data/canonical/", "data/history-digests/", "public/dataset/"];

function changedFiles() {
  const prev = process.env.VERCEL_GIT_PREVIOUS_SHA;
  const curr = process.env.VERCEL_GIT_COMMIT_SHA;
  if (!prev || !curr) return [];
  try {
    const out = execSync(`git diff --name-only ${prev} ${curr}`, { encoding: "utf8" });
    return out.split("\n").map((s) => s.trim()).filter(Boolean);
  } catch {
    return [];
  }
}

function isDataOnly(files) {
  if (files.length === 0) return false;
  return files.every((file) => DATA_PREFIXES.some((p) => file.startsWith(p)));
}

const files = changedFiles();
const blobConfigured = Boolean(process.env.UNITEDSTATS_DB_BLOB_URL && process.env.REVALIDATE_SECRET);

if (isDataOnly(files) && blobConfigured) {
  console.log(`skip build: data-only commit (${files.length} files) with blob revalidation configured`);
  process.exit(0);
}

console.log(`proceed with build: ${files.length ? files.join(", ") : "no diff or non-data change"}`);
process.exit(1);
