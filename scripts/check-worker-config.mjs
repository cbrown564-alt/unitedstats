/**
 * Checks a Worker build before it ships, and the site after it ships.
 *
 *   node scripts/check-worker-config.mjs <preview|production> [--deployable]
 *   node scripts/check-worker-config.mjs <preview|production> --smoke <origin>
 *
 * The first form reads dist/server/wrangler.json and out/ and fails when the
 * build targets the wrong Worker, domains or indexing, or is missing the legacy
 * redirects. --deployable also requires every D1 and KV binding to carry its
 * ID: without one, `wrangler deploy` creates a new, empty resource and binds
 * it. CI leaves it off while the production resources do not exist yet.
 *
 * --smoke requests a deployed origin: the home page must render live, and must
 * be indexable only on production, and the legacy redirects must answer 308.
 * --allow-setup accepts the unseeded twin only while EmDash reports pending
 * setup with seed content available and the wizard refuses unauthenticated access.
 * scripts/smoke-check.mjs covers the health snapshot and core pages.
 */
import { existsSync, readFileSync } from "node:fs";

const TARGETS = {
  preview: { name: "unitedstats-migration-preview", indexable: false, domains: [] },
  production: { name: "unitedstats", indexable: true, domains: ["utdred.com", "www.utdred.com"] },
};

const [envName, ...rest] = process.argv.slice(2);
const target = TARGETS[envName];
if (!target) {
  console.error(`usage: check-worker-config.mjs <${Object.keys(TARGETS).join("|")}> [--deployable | --smoke <origin>]`);
  process.exit(2);
}
const smoke = rest.includes("--smoke") ? rest[rest.indexOf("--smoke") + 1] : null;
const failures = [];
const redirects = JSON.parse(readFileSync("vercel.json", "utf8")).redirects;

if (smoke) await checkDeployed(new URL(smoke));
else checkBuild(rest.includes("--deployable"));

if (failures.length) {
  for (const f of failures) console.error(`check-worker-config (${envName}): ${f}`);
  process.exit(1);
}
console.log(`check-worker-config (${envName}): ${smoke ? `${smoke} answers as built` : "build matches its target"}`);

function checkBuild(deployable) {
  const configFile = "dist/server/wrangler.json";
  if (!existsSync(configFile)) {
    failures.push(`${configFile} is missing; run the build with CLOUDFLARE_ENV set for this target`);
    return;
  }
  const config = JSON.parse(readFileSync(configFile, "utf8"));
  if (config.name !== target.name) failures.push(`Worker is "${config.name}", expected "${target.name}" (CLOUDFLARE_ENV at build time?)`);

  const indexable = config.vars?.SITE_INDEXABLE === "true";
  if (indexable !== target.indexable) failures.push(`SITE_INDEXABLE is ${config.vars?.SITE_INDEXABLE ?? "unset"}`);

  const domains = (config.routes ?? []).filter((r) => r.custom_domain).map((r) => r.pattern).sort();
  if (domains.join() !== [...target.domains].sort().join()) failures.push(`custom domains are [${domains}], expected [${target.domains}]`);

  for (const binding of ["DB", "MEDIA", "SESSION"]) {
    const bound = [...(config.d1_databases ?? []), ...(config.r2_buckets ?? []), ...(config.kv_namespaces ?? [])].some((b) => b.binding === binding);
    if (!bound) failures.push(`no ${binding} binding`);
  }
  if (deployable) {
    for (const db of config.d1_databases ?? []) if (!db.database_id) failures.push(`D1 ${db.binding} (${db.database_name}) has no database_id`);
    for (const kv of config.kv_namespaces ?? []) if (!kv.id) failures.push(`KV ${kv.binding} has no id`);
  }

  // package-assets.mjs keys off the same CLOUDFLARE_ENV; a mismatch means out/ came from another build.
  const headers = existsSync("out/_headers") ? readFileSync("out/_headers", "utf8") : "";
  const noindexAll = /^\/\*\n\s+X-Robots-Tag: noindex/m.test(headers);
  if (noindexAll === target.indexable) failures.push(`out/_headers ${noindexAll ? "sends" : "does not send"} noindex on every path`);
  const written = existsSync("out/_redirects") ? readFileSync("out/_redirects", "utf8").trim().split("\n").length : 0;
  if (written !== redirects.length) failures.push(`out/_redirects has ${written} rules, vercel.json has ${redirects.length}`);
}

async function checkDeployed(origin) {
  const get = (path) => fetch(new URL(path, origin), { redirect: "manual", headers: { "user-agent": "redthread-deploy-check" } });

  const home = await get("/");
  const live = home.headers.get("x-redthread-live") ?? "";
  if (home.status !== 200) failures.push(`/ answered ${home.status}`);
  if (live !== "live") {
    let pendingSetup = false;
    if (rest.includes("--allow-setup") && live === "snapshot; unseeded") {
      const status = await get("/_emdash/api/setup/status");
      const body = await status.json().catch(() => null);
      const wizard = await get("/_emdash/admin/setup");
      pendingSetup = status.status === 200 && body?.success === true &&
        body.data?.needsSetup === true && body.data?.seedInfo?.hasContent === true && wizard.status === 404;
      if (pendingSetup) console.log("check-worker-config: serving the unseeded twin; protected admin setup is pending");
    }
    if (!pendingSetup) failures.push(`/ was not rendered live (x-redthread-live: ${live || "absent"})`);
  }
  const noindex = /noindex/.test(home.headers.get("x-robots-tag") ?? "");
  if (noindex === target.indexable) failures.push(`/ ${noindex ? "sends" : "does not send"} noindex`);

  for (const { source, destination } of redirects) {
    const res = await get(source);
    const location = res.headers.get("location") ?? "";
    if (res.status !== 308 || new URL(location, origin).pathname !== destination) {
      failures.push(`${source} answered ${res.status} ${location}, expected 308 ${destination}`);
    }
  }
}
