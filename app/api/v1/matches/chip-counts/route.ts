import { apiJson } from "@/lib/api";

export const dynamic = "force-static";

export async function GET() {
  return apiJson({});
}
