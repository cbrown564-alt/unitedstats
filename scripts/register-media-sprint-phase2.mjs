import { resolve } from "node:path";
import { readManifest, sha256, upsertAssets } from "./media-sprint-lib.mjs";

const now = new Date().toISOString();
const visualPromptBase = "Built-in image generation; synthetic abstract Red Thread identity material. No people, football scenes, kits, grounds, crowds, trophies, documentary-looking history, marks or official-club mimicry.";
const assets = [
  {
    id: "vis-identity-01-follow-rejected-split", kind: "visual-identity-action", title: "Follow — split-strand first attempt",
    intendedUse: "Rejected first attempt retained as a decision record; do not place.", masterFile: "output/media-sprint/visual/vis-identity-01-follow-rejected-split.png",
    provider: "OpenAI built-in image generation", model: "built-in imagegen", documentaryStatus: "synthetic-abstract", reviewState: "reject",
    reviewNote: "The line splits into several strands near the exit, contradicting the single continuous identity line.",
    prompt: `${visualPromptBase} FOLLOW action: a continuous devil-red filament progresses through sparse pale evidence ticks from left to right.`, generatedAt: now,
  },
  {
    id: "vis-identity-01-follow", kind: "visual-identity-action", title: "Follow",
    intendedUse: "Reusable identity plate for chronology, evidence travel and left-to-right transitions.", masterFile: "output/media-sprint/visual/vis-identity-01-follow.png",
    provider: "OpenAI built-in image generation", model: "built-in imagegen", documentaryStatus: "synthetic-abstract", reviewState: "advance",
    reviewNote: "Retry resolves the split: one uniform line enters and exits once, with clean negative space.",
    prompt: `${visualPromptBase} Corrected FOLLOW action: exactly one uniform-width red screen-printed line enters left and exits right without splitting, braiding, branching or fraying.`, generatedAt: now,
  },
  {
    id: "vis-identity-02-loop", kind: "visual-identity-action", title: "Loop",
    intendedUse: "Reusable identity plate for bringing two distant factual moments into contact.", masterFile: "output/media-sprint/visual/vis-identity-02-loop.png",
    provider: "OpenAI built-in image generation", model: "built-in imagegen", documentaryStatus: "synthetic-abstract", reviewState: "advance",
    reviewNote: "Two evidence marks and one restrained loop read immediately without text or fabricated scene content.",
    prompt: `${visualPromptBase} LOOP action: exactly one thin red filament leaves one pale evidence mark, travels in a closed arc and touches a second distant mark.`, generatedAt: now,
  },
  {
    id: "vis-identity-03-spin-off-return", kind: "visual-identity-action", title: "Spin off and return",
    intendedUse: "Reusable identity plate for entering a dense campaign, place or night and returning to the main record.", masterFile: "output/media-sprint/visual/vis-identity-03-spin-off-return.png",
    provider: "OpenAI built-in image generation", model: "built-in imagegen", documentaryStatus: "synthetic-abstract", reviewState: "advance",
    reviewNote: "The detour, compact evidence pocket and return are legible as one continuous action.",
    prompt: `${visualPromptBase} SPIN OFF AND RETURN action: one red line departs into one compact paper-mark pocket and visibly rejoins its original path.`, generatedAt: now,
  },
  {
    id: "mot-identity-01-follow-reveal", kind: "motion-identity-action", title: "Follow reveal",
    intendedUse: "Four-second wipe that reveals the Follow plate in chronological direction.", masterFile: "output/media-sprint/motion/mot-identity-01-follow-reveal.mp4",
    provider: "local ffmpeg derivative", model: "none", documentaryStatus: "synthetic-abstract", reviewState: "advance", sourceAssetIds: ["vis-identity-01-follow"],
    durationSeconds: 4, prompt: "Deterministic 1920×1080, 30 fps left-to-right wipe reveal over warm black; no generative additions.", generatedAt: now,
  },
  {
    id: "mot-identity-02-loop-contact", kind: "motion-identity-action", title: "Loop contact",
    intendedUse: "Six-second closed drift around the two connected evidence marks.", masterFile: "output/media-sprint/motion/mot-identity-02-loop-contact.mp4",
    provider: "local ffmpeg derivative", model: "none", documentaryStatus: "synthetic-abstract", reviewState: "advance", sourceAssetIds: ["vis-identity-02-loop"],
    durationSeconds: 6, loop: true, prompt: "Deterministic 1920×1080, 30 fps closed sinusoidal crop and restrained exposure movement; no generative additions.", generatedAt: now,
  },
  {
    id: "mot-identity-03-spin-off-return", kind: "motion-identity-action", title: "Spin off and return drift",
    intendedUse: "Six-second closed drift that keeps the detour pocket and return point in view.", masterFile: "output/media-sprint/motion/mot-identity-03-spin-off-return.mp4",
    provider: "local ffmpeg derivative", model: "none", documentaryStatus: "synthetic-abstract", reviewState: "advance", sourceAssetIds: ["vis-identity-03-spin-off-return"],
    durationSeconds: 6, loop: true, prompt: "Deterministic 1920×1080, 30 fps closed sinusoidal crop movement; no generative additions.", generatedAt: now,
  },
];

for (const asset of assets) asset.sha256 = sha256(resolve(asset.masterFile));

const current = readManifest();
const stateUpdates = current.assets.map((asset) => {
  if (["vis-plate-01-archive-awakening", "vis-plate-03-compressed-time", "mot-loop-01-archive-drift", "mot-loop-02-emulsion-breathe"].includes(asset.id)) {
    return { ...asset, reviewState: "advance", reviewNote: "Phase-one fundamentals passed: technically clean, reusable, recognizable abstract Red Thread material." };
  }
  if (asset.id === "vis-plate-02-thread-through-paper") return { ...asset, reviewState: "reserve", reviewNote: "Technically usable but the literal fibre risks reading as sewing/craft rather than a factual identity action." };
  if (["music-bed", "short-cue", "transition", "identity-action"].includes(asset.kind) && asset.reviewState === "unreviewed") return { ...asset, reviewState: "reserve", reviewNote: "Technical checks passed; listening judgment remains required before placement." };
  return asset;
});

upsertAssets([...stateUpdates, ...assets]);
console.log(`Registered ${assets.length} phase-two visual and motion records and applied fundamentals states.`);
