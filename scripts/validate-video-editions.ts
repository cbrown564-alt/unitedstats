import { AUDIO_PLANS } from "../video/audio/plans";
import { FILM_MATCH_LIBRARY } from "../video/data/match-library";
import { FILM_EDITIONS } from "../video/editions";

const libraryIds = new Set(FILM_MATCH_LIBRARY.map((entry) => entry.matchId));
const errors: string[] = [];

for (const edition of FILM_EDITIONS) {
  if (!(edition.audioPlanId in AUDIO_PLANS)) errors.push(`${edition.id}: missing audio plan ${edition.audioPlanId}`);
  if (edition.openingDurationInFrames > edition.durationInFrames) errors.push(`${edition.id}: opening exceeds edition duration`);
  let previousStart = -1;
  const seen = new Set<string>();
  for (const match of edition.openingMatches) {
    if (!libraryIds.has(match.matchId)) errors.push(`${edition.id}: ${match.matchId} is not in the factual match library`);
    if (seen.has(match.matchId)) errors.push(`${edition.id}: duplicate match ${match.matchId}`);
    if (match.start <= previousStart) errors.push(`${edition.id}: opening starts must increase (${match.matchId})`);
    if (match.start < 0 || match.start >= edition.openingDurationInFrames) errors.push(`${edition.id}: ${match.matchId} starts outside the opening`);
    previousStart = match.start;
    seen.add(match.matchId);
  }
  const plan = AUDIO_PLANS[edition.audioPlanId as keyof typeof AUDIO_PLANS];
  for (const clip of plan.clips) {
    if (clip.timelineFrom + clip.duration > edition.durationInFrames + 1) errors.push(`${edition.id}/${plan.id}: audio clip exceeds edition duration`);
    if ((clip.fadeIn ?? 0) + (clip.fadeOut ?? 0) > clip.duration) errors.push(`${edition.id}/${plan.id}: audio fades exceed clip duration`);
  }
}

if (errors.length) throw new Error(`Video edition validation failed:\n- ${errors.join("\n- ")}`);
console.log(`Validated ${FILM_EDITIONS.length} film editions and ${Object.keys(AUDIO_PLANS).length} audio plans.`);
