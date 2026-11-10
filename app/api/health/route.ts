import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export const dynamic = "force-static";

/**
 * Build-time snapshot of the bundled database. The live export does not open
 * SQLite; this JSON is generated during `next build`.
 */
export async function GET() {
  try {
    const row = getDb().prepare("SELECT count(*) AS matches FROM matches").get() as {
      matches: number;
    };
    return NextResponse.json({ ok: true, matches: row.matches }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
