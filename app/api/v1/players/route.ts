import { apiJson, pagination } from "@/lib/api";
import { playersIndex } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const { limit, offset } = pagination(url, 100, 500);
  const all = playersIndex();
  return apiJson(all.slice(offset, offset + limit), { total: all.length, limit, offset });
}
