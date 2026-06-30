/**
 * Post-deploy smoke check. Proves a live deployment can actually read the
 * database from its serving functions — the exact failure that took production
 * down on 2026-06-30 (every dynamic page 500'd on a missing /tmp blob copy).
 *
 * Run this against a production or preview URL after promoting a deploy:
 *   node scripts/smoke-check.mjs --site https://unitedstats.vercel.app
 *   node scripts/smoke-check.mjs --site "$UNITEDSTATS_SITE_URL" --bypass "$VERCEL_AUTOMATION_BYPASS_SECRET"
 *
 * Exit 0 = healthy, exit 1 = any checked surface failed.
 */
function arg(name) {
  const i = process.argv.indexOf(name);
  return i !== -1 ? process.argv[i + 1] : undefined;
}

async function main() {
  const site = (arg("--site") ?? process.env.UNITEDSTATS_SITE_URL ?? "").replace(/\/$/, "");
  if (!site) {
    console.error("smoke-check: provide --site or UNITEDSTATS_SITE_URL");
    process.exit(1);
  }
  // Deployment-protection bypass for non-public preview/prod URLs (optional).
  const bypass = arg("--bypass") ?? process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
  const headers = bypass ? { "x-vercel-protection-bypass": bypass } : {};

  let failed = false;

  // 1) The DB liveness probe — the strongest single signal.
  try {
    const res = await fetch(`${site}/api/health`, { cache: "no-store", headers });
    const body = await res.json().catch(() => ({}));
    if (res.ok && body.ok) {
      console.log(`smoke-check: /api/health OK — source=${body.source} matches=${body.matches} blobConfigured=${body.blobConfigured}`);
    } else {
      failed = true;
      console.error(`smoke-check: /api/health FAILED — ${res.status} ${JSON.stringify(body)}`);
    }
  } catch (err) {
    failed = true;
    console.error(`smoke-check: /api/health request failed — ${err instanceof Error ? err.message : err}`);
  }

  // 2) The homepage is force-dynamic and reads the DB on every request — if the
  //    runtime DB path is broken it 500s, so it's a meaningful end-to-end check.
  for (const path of ["/", "/matches"]) {
    try {
      const res = await fetch(`${site}${path}`, { cache: "no-store", headers });
      if (res.ok) {
        console.log(`smoke-check: GET ${path} ${res.status} OK`);
      } else {
        failed = true;
        console.error(`smoke-check: GET ${path} ${res.status} FAILED`);
      }
    } catch (err) {
      failed = true;
      console.error(`smoke-check: GET ${path} request failed — ${err instanceof Error ? err.message : err}`);
    }
  }

  if (failed) {
    console.error("smoke-check: FAILED");
    process.exit(1);
  }
  console.log("smoke-check: all checks passed");
}

main();
