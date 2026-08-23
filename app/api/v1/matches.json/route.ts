import { apiJson } from "@/lib/api";
import { findMatches } from "@/lib/queries";

export const dynamic = "force-static";

export async function GET() {
  const limit = 50;
  const offset = 0;
  const { rows, total } = findMatches({ limit, offset });
  return apiJson(rows, { total, limit, offset });
}
