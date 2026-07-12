import { Composition } from "remotion";
import { RedThreadFilm } from "./compositions/RedThreadFilm";
import { EUROPEAN_MASTER_90, EUROPEAN_POST_PUNK_EDITORIAL_90, EUROPEAN_POST_PUNK_SONG_90, MATCH_TIMELINE_24 } from "./editions";
import { LOOP_PROTOTYPE } from "./film-data";
import { RedThreadLoopPrototype } from "./RedThreadLoopPrototype";

export function RemotionRoot() {
  return (
    <>
      <Composition
        id="red-thread-european-master-90"
        component={RedThreadFilm}
        defaultProps={{ editionId: EUROPEAN_MASTER_90.id }}
        durationInFrames={EUROPEAN_MASTER_90.durationInFrames}
        {...EUROPEAN_MASTER_90.format}
      />
      <Composition
        id="red-thread-european-master-90-silent"
        component={RedThreadFilm}
        defaultProps={{ editionId: EUROPEAN_MASTER_90.id, withAudio: false, withCaptions: true }}
        durationInFrames={EUROPEAN_MASTER_90.durationInFrames}
        {...EUROPEAN_MASTER_90.format}
      />
      <Composition
        id="red-thread-european-post-punk-editorial-90"
        component={RedThreadFilm}
        defaultProps={{ editionId: EUROPEAN_POST_PUNK_EDITORIAL_90.id }}
        durationInFrames={EUROPEAN_POST_PUNK_EDITORIAL_90.durationInFrames}
        {...EUROPEAN_POST_PUNK_EDITORIAL_90.format}
      />
      <Composition
        id="red-thread-european-post-punk-song-90"
        component={RedThreadFilm}
        defaultProps={{ editionId: EUROPEAN_POST_PUNK_SONG_90.id }}
        durationInFrames={EUROPEAN_POST_PUNK_SONG_90.durationInFrames}
        {...EUROPEAN_POST_PUNK_SONG_90.format}
      />
      <Composition
        id="red-thread-european-master-90-captions"
        component={RedThreadFilm}
        defaultProps={{ editionId: EUROPEAN_MASTER_90.id, withAudio: true, withCaptions: true }}
        durationInFrames={EUROPEAN_MASTER_90.durationInFrames}
        {...EUROPEAN_MASTER_90.format}
      />
      <Composition
        id="red-thread-european-opening"
        component={RedThreadFilm}
        defaultProps={{ editionId: EUROPEAN_MASTER_90.id }}
        durationInFrames={EUROPEAN_MASTER_90.openingDurationInFrames}
        {...EUROPEAN_MASTER_90.format}
      />
      <Composition
        id="red-thread-match-timeline-24"
        component={RedThreadFilm}
        defaultProps={{ editionId: MATCH_TIMELINE_24.id }}
        durationInFrames={MATCH_TIMELINE_24.durationInFrames}
        {...MATCH_TIMELINE_24.format}
      />
      <Composition
        id="red-thread-loop-prototype"
        component={RedThreadLoopPrototype}
        durationInFrames={LOOP_PROTOTYPE.durationSeconds * 30}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
}
