import { apiJson } from "@/lib/api";
import { coverageOverview, getMeta } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET() {
  return apiJson({ meta: getMeta(), coverage: coverageOverview() });
}
