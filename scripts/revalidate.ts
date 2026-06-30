/**
 * POST computed revalidation paths to the live site's /api/revalidate handler.
 *
 * Usage:
 *   tsx scripts/revalidate.ts --site https://redthread.example --payload revalidate.json
 *   tsx scripts/revalidate.ts --site https://redthread.example --ids 2026-04-12-liverpool-h
 *
 * Requires REVALIDATE_SECRET in the environment.
 */
import fs from "node:fs";
import { spawnSync } from "node:child_process";

function parseArgs(argv: string[]) {
  const siteIdx = argv.indexOf("--site");
  const payloadIdx = argv.indexOf("--payload");
  const idsIdx = argv.indexOf("--ids");
  const site = siteIdx !== -1 ? argv[siteIdx + 1] : process.env.UNITEDSTATS_SITE_URL;
  if (!site) throw new Error("Provide --site or UNITEDSTATS_SITE_URL");
  return { site: site.replace(/\/$/, ""), payloadPath: payloadIdx !== -1 ? argv[payloadIdx + 1] : null, ids: idsIdx !== -1 ? argv[idsIdx + 1] : null };
}

async function main() {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret) throw new Error("REVALIDATE_SECRET is required");

  const { site, payloadPath, ids } = parseArgs(process.argv.slice(2));
  let body: Record<string, unknown>;

  if (payloadPath) {
    body = JSON.parse(fs.readFileSync(payloadPath, "utf8")) as Record<string, unknown>;
    if (!body.matches && !body.paths) throw new Error("Payload must include matches or paths");
  } else if (ids) {
    const result = spawnSync("npx", ["tsx", "scripts/compute-revalidate-paths.ts", "--ids", ids], {
      encoding: "utf8",
    });
    if (result.status !== 0) throw new Error(result.stderr || result.stdout || "compute-revalidate-paths failed");
    const computed = JSON.parse(result.stdout) as { matches: unknown[]; playerIds: string[]; managerId: string | null };
    body = { matches: computed.matches, playerIds: computed.playerIds, managerId: computed.managerId };
  } else {
    throw new Error("Provide --payload or --ids");
  }

  const res = await fetch(`${site}/api/revalidate`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${secret}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  if (!res.ok) throw new Error(`${res.status} ${text}`);
  process.stdout.write(text + "\n");
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
