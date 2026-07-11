import { Composition } from "remotion";
import { LOOP_PROTOTYPE } from "./film-data";
import { MASTER_DURATION_SECONDS, RedThreadMasterV2 } from "./RedThreadMasterV2";
import { RedThreadLoopPrototype } from "./RedThreadLoopPrototype";

export function RemotionRoot() {
  return (
    <>
      <Composition
        id="red-thread-master-v5"
        component={RedThreadMasterV2}
        durationInFrames={MASTER_DURATION_SECONDS * 30}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="red-thread-master-v5-silent"
        component={RedThreadMasterV2}
        defaultProps={{ withAudio: false }}
        durationInFrames={MASTER_DURATION_SECONDS * 30}
        fps={30}
        width={1920}
        height={1080}
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
