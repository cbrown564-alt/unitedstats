/**
 * Lint authored copy against docs/COPY-RUBRIC.md smell patterns.
 *
 * Usage:
 *   npm run copy:lint
 *   npm run copy:lint -- --all
 *   npm run copy:lint -- --update-baseline
 *   npm run copy:lint -- --strict
 *
 * Requires content/copy-catalog.json (npm run copy:extract).
 */
import fs from "node:fs";
import path from "node:path";

import { COPY_CATALOG_PATH, loadCopyCatalog } from "../lib/copyCatalog";
import {
  lintCopyItems,
  type CopyLintBaseline,
  type CopySmellHit,
} from "../lib/copySmells";

const ROOT = process.cwd();
export const COPY_LINT_BASELINE_PATH = path.join(ROOT, "content", "copy-lint-baseline.json");

function parseArgs(argv: string[]) {
  return {
    updateBaseline: argv.includes("--update-baseline"),
    strict: argv.includes("--strict"),
    all: argv.includes("--all"),
  };
}

function loadBaseline(filePath = COPY_LINT_BASELINE_PATH): CopyLintBaseline {
  if (!fs.existsSync(filePath)) {
    return { generatedAt: new Date(0).toISOString(), keys: [] };
  }
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as CopyLintBaseline;
}

function saveBaseline(keys: string[], filePath = COPY_LINT_BASELINE_PATH): void {
  const unique = [...new Set(keys)].sort();
  const body: CopyLintBaseline = {
    generatedAt: new Date().toISOString(),
    keys: unique,
  };
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(body, null, 2)}\n`);
}

function formatHit(hit: CopySmellHit): string {
  return `  [${hit.tier}] ${hit.itemId} · ${hit.label}\n    ${hit.file}\n    “${hit.excerpt}”`;
}

function main(): void {
  const args = parseArgs(process.argv.slice(2));

  if (!fs.existsSync(COPY_CATALOG_PATH)) {
    console.error(`copy:lint: missing ${COPY_CATALOG_PATH} — run npm run copy:extract`);
    process.exit(2);
  }

  const catalog = loadCopyCatalog();
  const baseline = loadBaseline();
  const { hits, tierA, newTierA, baselinedTierA } = lintCopyItems(catalog.items, baseline.keys);

  if (args.updateBaseline) {
    saveBaseline(tierA.map((h) => h.key));
    console.log(
      `copy:lint: wrote baseline with ${tierA.length} Tier A hit(s) → ${path.relative(ROOT, COPY_LINT_BASELINE_PATH)}`,
    );
    for (const hit of tierA) console.log(formatHit(hit));
    process.exit(0);
  }

  const other = hits.filter((h) => h.tier !== "A");
  console.log(
    `copy:lint: ${hits.length} hit(s) — Tier A ${tierA.length} (${newTierA.length} new, ${baselinedTierA.length} baselined), other ${other.length}`,
  );

  if (args.all && other.length) {
    console.log("\nTier B/C (informational):");
    for (const hit of other) console.log(formatHit(hit));
  }

  if (baselinedTierA.length && !args.strict) {
    console.log("\nTier A baselined (known debt):");
    for (const hit of baselinedTierA) console.log(formatHit(hit));
  }

  const failing = args.strict ? tierA : newTierA;
  if (failing.length) {
    console.log(args.strict ? "\nTier A failures (--strict):" : "\nNew Tier A failures:");
    for (const hit of failing) console.log(formatHit(hit));
    console.log(
      `\nFix the copy, or accept debt with: npm run copy:lint -- --update-baseline`,
    );
    process.exit(1);
  }

  console.log(args.strict ? "copy:lint: clean (strict)" : "copy:lint: no new Tier A smells");
}

main();
