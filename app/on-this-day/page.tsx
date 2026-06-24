import { redirect } from "next/navigation";

// The clean, shareable door: resolve "today" (UTC) at request time and send the
// reader to that date's page. Dynamic by design — the target changes daily.
export const dynamic = "force-dynamic";

export default function OnThisDayTodayPage() {
  const now = new Date();
  const monthDay = `${String(now.getUTCMonth() + 1).padStart(2, "0")}-${String(now.getUTCDate()).padStart(2, "0")}`;
  redirect(`/on-this-day/${monthDay}`);
}
