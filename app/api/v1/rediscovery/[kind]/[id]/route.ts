import { apiError, apiJson } from "@/lib/api";
import { rediscoveryForEntity } from "@/lib/rediscovery";
import { allSeasons, opponentsIndex, playersIndex } from "@/lib/queries";
import { sampleStaticIds } from "@/lib/static-build";

export const dynamic = "force-static";

const KINDS = new Set(["season", "opponent", "player"]);

export const dynamicParams = false;

export function generateStaticParams() {
  return [
    ...sampleStaticIds(playersIndex().map((player) => player.player_id)).map((id) => ({ kind: "player", id })),
    ...sampleStaticIds(opponentsIndex().map((opponent) => opponent.id)).map((id) => ({ kind: "opponent", id })),
    ...allSeasons().map((id) => ({ kind: "season", id })),
  ];
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ kind: string; id: string }> },
) {
  const { kind, id } = await params;
  if (!KINDS.has(kind)) return apiError(400, `invalid entity kind "${kind}"`);
  const prompt = rediscoveryForEntity(kind as "season" | "opponent" | "player", id);
  return apiJson({ prompt });
}
