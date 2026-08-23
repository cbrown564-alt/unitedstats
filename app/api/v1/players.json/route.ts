import { apiJson } from "@/lib/api";
import { playersIndex } from "@/lib/queries";

export const dynamic = "force-static";

export async function GET() {
  const all = playersIndex();
  return apiJson(all, { total: all.length, limit: all.length, offset: 0 });
}
