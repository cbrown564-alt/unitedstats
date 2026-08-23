import { apiError, apiJson } from "@/lib/api";
import { allSeasons, seasonMatches, seasonsIndex } from "@/lib/queries";

export const dynamic = "force-static";

export const dynamicParams = false;

export function generateStaticParams() {
  return allSeasons().map((season) => ({ season }));
}

export async function GET(_request: Request, { params }: { params: Promise<{ season: string }> }) {
  const { season } = await params;
  const matches = seasonMatches(season);
  if (matches.length === 0) return apiError(404, `no matches in season "${season}" (expected e.g. 1998-99)`);
  return apiJson({
    season,
    summaries: seasonsIndex().filter((s) => s.season === season),
    matches,
  });
}
