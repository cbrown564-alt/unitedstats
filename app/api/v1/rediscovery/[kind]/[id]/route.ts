import { apiError, apiJson } from "@/lib/api";
import { parseSinceYear, rediscoveryForEntity } from "@/lib/rediscovery";

export const dynamic = "force-dynamic";

const KINDS = new Set(["season", "opponent", "player"]);

export async function GET(
  request: Request,
  { params }: { params: Promise<{ kind: string; id: string }> },
) {
  const { kind, id } = await params;
  if (!KINDS.has(kind)) return apiError(400, `invalid entity kind "${kind}"`);
  const sinceYear = parseSinceYear(new URL(request.url).searchParams.get("since"));
  const prompt = rediscoveryForEntity(kind as "season" | "opponent" | "player", id, { sinceYear });
  return apiJson({ prompt });
}
