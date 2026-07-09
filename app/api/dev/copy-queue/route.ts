import { NextResponse } from "next/server";
import {
  copyStudioEnabled,
  isCopyQueueStatus,
  loadCopyQueue,
  saveCopyQueue,
  updateQueueEntry,
  type CopyQueueStatus,
} from "@/lib/copyCatalog";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function deny() {
  return NextResponse.json({ error: "not found" }, { status: 404 });
}

/** Read the copy-review queue (dev only). */
export async function GET() {
  if (!copyStudioEnabled()) return deny();
  const queue = loadCopyQueue();
  return NextResponse.json(queue, { headers: { "Cache-Control": "no-store" } });
}

/**
 * Update one queue entry's status and/or notes.
 * Body: { id: string, status?: CopyQueueStatus, notes?: string | null }
 */
export async function POST(request: Request) {
  if (!copyStudioEnabled()) return deny();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  const raw = body as Record<string, unknown>;
  const id = raw.id;
  const status = raw.status;
  const notes = raw.notes;

  if (typeof id !== "string" || id.length === 0) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }
  if (status !== undefined && (typeof status !== "string" || !isCopyQueueStatus(status))) {
    return NextResponse.json({ error: "invalid status" }, { status: 400 });
  }
  if (notes !== undefined && notes !== null && typeof notes !== "string") {
    return NextResponse.json({ error: "invalid notes" }, { status: 400 });
  }
  if (status === undefined && notes === undefined) {
    return NextResponse.json({ error: "status or notes required" }, { status: 400 });
  }

  const patch: { status?: CopyQueueStatus; notes?: string | null } = {};
  if (typeof status === "string") patch.status = status;
  if (notes !== undefined) patch.notes = notes as string | null;

  try {
    const prev = loadCopyQueue();
    const next = updateQueueEntry(prev, id, patch);
    saveCopyQueue(next);
    return NextResponse.json(next.entries[id], { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const statusCode = message.startsWith("unknown copy queue id") ? 404 : 500;
    return NextResponse.json({ error: message }, { status: statusCode });
  }
}
