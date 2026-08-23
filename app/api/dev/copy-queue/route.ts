import { NextResponse } from "next/server";
import { copyStudioEnabled, loadCopyQueue } from "@/lib/copyCatalog";

export const dynamic = "force-static";

function deny() {
  return NextResponse.json({ error: "not found" }, { status: 404 });
}

/** Read the copy-review queue (dev only). Writes are not available on a static export. */
export async function GET() {
  if (!copyStudioEnabled()) return deny();
  const queue = loadCopyQueue();
  return NextResponse.json(queue);
}
