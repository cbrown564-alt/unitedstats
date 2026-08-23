import { apiJson } from "@/lib/api";
import { managersIndex, managerTenures } from "@/lib/queries";

export const dynamic = "force-static";


export async function GET() {
  return apiJson(managersIndex().map((m) => ({ ...m, tenures: managerTenures(m.id) })));
}
