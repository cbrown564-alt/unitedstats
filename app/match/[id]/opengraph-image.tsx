import { matchById, eventsForMatch } from "@/lib/queries";
import { immutableDataHeaders } from "@/lib/cache";
import { OG_CONTENT_TYPE, OG_SIZE, entityCard, matchCard, trustStrip, type MatchGoal } from "@/lib/og-card";

// On-demand + CDN-cached rather than 6,000+ images baked into every build.
export const dynamic = "force-dynamic";
export const alt = "Manchester United match — Red Thread";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

const GOAL_TYPES = new Set(["goal", "pen-goal", "opp-goal", "own-goal-for", "own-goal-against"]);
// An opponent goal or an own goal we conceded sits on the opponent's side; every
// other goal type (our goals, our penalties, own goals in our favour) is United's.
const OPP_SIDE = new Set(["opp-goal", "own-goal-against"]);

/** Cup rounds announce themselves on the eyebrow; league matchdays don't. */
function meaningfulRound(round: string | null): string | null {
  if (!round) return null;
  return /final|semi|quarter|round of|group|play-?off|replay/i.test(round) ? round : null;
}

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const m = matchById(id);
  if (!m) {
    return entityCard(
      { eyebrow: "MATCH", title: "Manchester United history, answered.", subtitle: "Ask a question, get a sourced answer.", strip: trustStrip() },
      immutableDataHeaders,
    );
  }

  const date = new Date(m.date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  const round = meaningfulRound(m.round);
  const eyebrow = (round ? `${m.competition_name} · ${round}` : m.competition_name).toUpperCase();

  const goals: MatchGoal[] = eventsForMatch(id)
    .filter((e) => GOAL_TYPES.has(e.type) && e.minute != null)
    .map((e) => ({ minute: e.minute as number, addedTime: e.added_time ?? 0, side: OPP_SIDE.has(e.type) ? "opponent" : "united" }));

  const footnote = m.aet
    ? m.pen_gf != null
      ? `(a.e.t) · United ${m.outcome === "W" ? "won" : "lost"} ${m.pen_gf}–${m.pen_ga} on penalties`
      : "(a.e.t)"
    : m.ht_gf != null && m.ht_ga != null
      ? `Half-time ${m.ht_gf}–${m.ht_ga}`
      : undefined;

  return matchCard(
    {
      eyebrow,
      home: "Manchester United",
      away: m.opponent_name,
      score: `${m.gf}–${m.ga}`,
      outcome: m.outcome,
      date,
      goals,
      footnote,
      strip: trustStrip(),
    },
    immutableDataHeaders,
  );
}
