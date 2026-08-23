import { apiJson } from "@/lib/api";
import { buildMatchesPageView } from "@/lib/buildMatchesPageView";

export const dynamic = "force-static";

export async function GET() {
  return apiJson(buildMatchesPageView({}));
}
