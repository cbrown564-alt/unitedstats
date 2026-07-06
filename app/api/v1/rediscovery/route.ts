import { apiError, apiJson } from "@/lib/api";
import { parseSinceYear, rediscoveryForEntity } from "@/lib/rediscovery";

export const dynamic = "force-dynamic";

const SCOPES = new Set(["player", "opponent", "season"]);

/** Entity-scoped rediscovery prompt, optionally biased by ?since= on the caller page. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const scope = url.searchParams.get("scope");
  const id = url.searchParams.get("id");
  if (!scope || !id || !SCOPES.has(scope)) {
    return apiError(400, 'scope must be "player", "opponent", or "season"; id is required');
  }
  const sinceYear = parseSinceYear(url.searchParams.get("since"));
  const prompt = rediscoveryForEntity(scope as "player" | "opponent" | "season", id, { sinceYear });
  return apiJson({ prompt });
}
