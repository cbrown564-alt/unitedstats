import type { AudioPlan } from "../core/types";

export const AUDIO_PLANS = {
  "european-score-v3": {
    id: "european-score-v3",
    clips: [
      {
        asset: "video/audio/master-v3.mp3",
        timelineFrom: 0,
        duration: 83.4 * 30 + 24,
        gain: 0.82,
        fadeOut: 24,
      },
      {
        asset: "video/audio/master-v3.mp3",
        timelineFrom: 83.4 * 30,
        sourceFrom: 77.4 * 30,
        duration: 198,
        gain: 0.82,
        fadeIn: 24,
        fadeOut: 48,
      },
    ],
  },
  "timeline-low-key": {
    id: "timeline-low-key",
    clips: [
      {
        asset: "video/audio/master-v3.mp3",
        timelineFrom: 0,
        sourceFrom: 0,
        duration: 720,
        gain: 0.42,
        fadeIn: 24,
        fadeOut: 60,
      },
    ],
  },
  "post-punk-editorial": {
    id: "post-punk-editorial",
    clips: [{
      asset: "video/audio/elevenlabs-post-punk-finals/post-punk-editorial.mp3",
      timelineFrom: 0,
      duration: 2700,
      gain: 0.88,
      fadeIn: 12,
      fadeOut: 24,
    }],
  },
  "post-punk-song": {
    id: "post-punk-song",
    clips: [{
      asset: "video/audio/elevenlabs-manchester-bakeoff/01-factory-machine-funk.mp3",
      timelineFrom: 0,
      duration: 2700,
      gain: 0.88,
      fadeIn: 12,
      fadeOut: 24,
    }],
  },
  silent: { id: "silent", clips: [] },
} as const satisfies Record<string, AudioPlan>;

type AudioPlanId = keyof typeof AUDIO_PLANS;

export function getAudioPlan(id: string): AudioPlan {
  const plan = AUDIO_PLANS[id as AudioPlanId];
  if (!plan) throw new Error(`Unknown audio plan: ${id}`);
  return plan;
}
