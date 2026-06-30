import { NextResponse } from "next/server";
import { getDb, dbSource } from "@/lib/db";
import { usesRuntimeDbBlob } from "@/lib/runtime-db-path";

export const runtime = "nodejs";
// Always reflect live runtime state — never a cached/prerendered snapshot.
export const dynamic = "force-dynamic";

/**
 * Liveness probe for the runtime database. Proves the serving function can open
 * united.db and run a query, and reports which copy it's reading (the fresh
 * blob-backed `/tmp` copy or the bundled deploy copy). Use it as the post-deploy
 * smoke gate — see scripts/smoke-check.mjs — so the prod-only DB path can never
 * silently regress the way it did on 2026-06-30 (see docs/INCIDENT-2026-06-30-runtime-db.md).
 */
export async function GET() {
  try {
    const row = getDb().prepare("SELECT count(*) AS matches FROM matches").get() as {
      matches: number;
    };
    return NextResponse.json(
      {
        ok: true,
        source: dbSource(),
        blobConfigured: usesRuntimeDbBlob(),
        matches: row.matches,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        source: dbSource(),
        blobConfigured: usesRuntimeDbBlob(),
        error: err instanceof Error ? err.message : String(err),
      },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
