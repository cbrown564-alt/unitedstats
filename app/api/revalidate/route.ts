import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { resetDb } from "@/lib/db";
import { revalidationPathsForMatches, type RevalidationMatch } from "@/lib/revalidation";

export const runtime = "nodejs";

function authorized(request: Request): boolean {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret) return false;
  const header = request.headers.get("authorization");
  return header === `Bearer ${secret}`;
}

interface RevalidateBody {
  matches?: RevalidationMatch[];
  paths?: string[];
  playerIds?: string[];
  managerId?: string | null;
  refreshDb?: boolean;
}

export async function POST(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: RevalidateBody;
  try {
    body = (await request.json()) as RevalidateBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const paths = body.paths?.length
    ? body.paths
    : body.matches?.length
      ? revalidationPathsForMatches(body.matches, {
          playerIds: body.playerIds,
          managerId: body.managerId,
        })
      : [];

  if (paths.length === 0) {
    return NextResponse.json({ error: "Provide matches or paths" }, { status: 400 });
  }

  // Best-effort: resetDb() returns false (and keeps serving the bundled copy) if
  // the blob refresh fails, so report what actually happened rather than intent.
  const dbRefreshed = body.refreshDb !== false ? await resetDb() : false;

  for (const path of paths) {
    revalidatePath(path);
  }

  return NextResponse.json({
    revalidated: paths.length,
    paths,
    dbRefreshed,
  });
}
