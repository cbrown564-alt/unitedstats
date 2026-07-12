import { Audio } from "@remotion/media";
import { Sequence, interpolate, staticFile } from "remotion";
import type { AudioPlan } from "./types";

function clipVolume(frame: number, duration: number, gain: number, fadeIn = 0, fadeOut = 0): number {
  const entering = fadeIn > 0
    ? interpolate(frame, [0, fadeIn], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
    : 1;
  const leaving = fadeOut > 0
    ? interpolate(frame, [duration - fadeOut, duration], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
    : 1;
  return gain * entering * leaving;
}

export function AudioTimeline({ plan }: { plan: AudioPlan }) {
  return <>{plan.clips.map((clip, index) => (
    <Sequence key={`${clip.asset}-${clip.timelineFrom}-${index}`} from={clip.timelineFrom} durationInFrames={clip.duration} layout="none">
      <Audio
        src={staticFile(clip.asset)}
        trimBefore={clip.sourceFrom}
        volume={(frame) => clipVolume(frame, clip.duration, clip.gain ?? 1, clip.fadeIn, clip.fadeOut)}
      />
    </Sequence>
  ))}</>;
}
