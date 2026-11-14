/**
 * Post-deploy smoke check for the Cloudflare static export. Confirms the
 * build-time health snapshot, a few core pages, and one Worker redirect.
 *
 *   node scripts/smoke-check.mjs                       # https://utdred.com
 *   node scripts/smoke-check.mjs --site https://unitedstats-migration-preview.<account>.workers.dev
 *
 * Exit 0 = healthy, exit 1 = any checked surface failed.
 */
function arg(name) {
  const i = process.argv.indexOf(name);
  return i !== -1 ? process.argv[i + 1] : undefined;
}

const site = (arg("--site") ?? process.env.UNITEDSTATS_SITE_URL ?? "https://utdred.com").replace(/\/$/, "");
let failed = false;

function fail(message) {
  failed = true;
  console.error(`smoke-check: ${message}`);
}

async function check(path, { expectStatus = 200, redirectTo } = {}) {
  try {
    const res = await fetch(`${site}${path}`, { cache: "no-store", redirect: "manual", signal: AbortSignal.timeout(15000) });
    if (res.status !== expectStatus) return fail(`GET ${path} ${res.status}, expected ${expectStatus}`);
    if (redirectTo) {
      const location = res.headers.get("location") ?? "";
      if (!location.includes(redirectTo)) return fail(`GET ${path} redirected to ${location}, expected ${redirectTo}`);
    }
    console.log(`smoke-check: GET ${path} ${res.status} OK`);
    return res;
  } catch (err) {
    fail(`GET ${path} request failed — ${err instanceof Error ? err.message : err}`);
  }
}

const health = await check("/api/health");
if (health) {
  const body = await health.json().catch(() => ({}));
  if (!body.ok || !(body.matches > 0)) fail(`/api/health body ${JSON.stringify(body)}`);
  else console.log(`smoke-check: health snapshot reports ${body.matches} matches`);
}
for (const path of ["/", "/matches", "/seasons", "/player/wayne-rooney"]) await check(path);
await check("/match/not-a-published-match", { expectStatus: 307, redirectTo: "/record?kind=match" });

if (failed) {
  console.error("smoke-check: FAILED");
  process.exit(1);
}
console.log("smoke-check: all checks passed");
