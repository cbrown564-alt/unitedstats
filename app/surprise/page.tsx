import { redirect } from "next/navigation";
import { pickSurprise } from "@/lib/surprise";

// The wanderer's door (Phase 18.3): every visit lands on a different real,
// curated-quality surface — a tested question, a curated Cut, a flagship debate —
// never random noise and never a dead end. Dynamic by design: the destination
// must change on each load, so it is never cached. The curated pool lives in
// `lib/surprise.ts`; this page only rolls the die and forwards. Entry points set
// `prefetch={false}` so a hover never spends the surprise before the click.
export const dynamic = "force-dynamic";

export default function SurprisePage() {
  redirect(pickSurprise().href);
}
