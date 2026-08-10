import { resolve } from "node:path";
import { sha256, upsertAssets } from "./media-sprint-lib.mjs";

const shared = {
  provider: "OpenAI built-in image generation",
  model: "built-in imagegen",
  documentaryStatus: "synthetic-abstract",
  reviewState: "unreviewed",
  generatedAt: "2026-08-09",
};

const visuals = [
  {
    id: "vis-plate-01-archive-awakening", kind: "visual-plate", title: "Archive awakening",
    intendedUse: "Wide atmosphere plate and parallax source; no historical or documentary claim.",
    masterFile: "output/media-sprint/visual/vis-plate-01-archive-awakening.png",
    prompt: "Use case: stylized-concept. Reusable abstract atmosphere plate for Red Thread: a fully non-representational archive awakening at night through warm near-black layered charcoal paper fibres, faint red filament traces, restrained amber dust and diffuse oblique light. Premium tactile analogue mixed-media texture, 16:9, balanced negative space, no icon, horizon, architecture, text, marks, people, football material, stadium, crowd, trophy, match, documentary photograph or identifiable event.",
  },
  {
    id: "vis-plate-02-thread-through-paper", kind: "visual-plate", title: "Thread through paper",
    intendedUse: "Macro transition plate, crop source and material detail; no historical or documentary claim.",
    masterFile: "output/media-sprint/visual/vis-plate-02-thread-through-paper.png",
    prompt: "Use case: stylized-concept. Entirely non-representational macro field of a single red fibre passing through layered dark paper and fine emulsion, tension visible through curvature and material deformation. Extreme macro material photography blended with analogue printmaking, 16:9, red fibre lower-left to upper-right without forming a symbol, quiet dark regions. No text, marks, people, football material, stadium, crowd, trophy, match, documentary scene, architecture, hands or sewing needle.",
  },
  {
    id: "vis-plate-03-compressed-time", kind: "visual-plate", title: "Compressed time",
    intendedUse: "Layered atmosphere plate and subtle loop source; no historical or documentary claim.",
    masterFile: "output/media-sprint/visual/vis-plate-03-compressed-time.png",
    prompt: "Use case: stylized-concept. Non-representational field suggesting time compressed into layered translucent emulsion, faint vertical registration marks and a dim red trace bending through depth. Experimental analogue film scan, photogram and paper fibre, 16:9, mostly dark with layers for parallax and quiet central safe area. No words, digits, text-like glyphs, people, football material, stadium, crowd, trophy, match, building or identifiable historic object.",
  },
];

const motion = [
  {
    id: "mot-loop-01-archive-drift", kind: "motion-loop", title: "Archive drift",
    intendedUse: "Six-second seamless parallax drift behind copy or data marks.",
    masterFile: "output/media-sprint/motion/mot-loop-01-archive-drift.mp4",
    prompt: "Deterministic derivative of vis-plate-01: a six-second closed sinusoidal crop path at 1920×1080 and 30 fps; no generative additions.",
    sourceAssetIds: ["vis-plate-01-archive-awakening"], durationSeconds: 6, loop: true,
    provider: "local ffmpeg derivative", model: "none",
  },
  {
    id: "mot-loop-02-emulsion-breathe", kind: "motion-loop", title: "Emulsion breathe",
    intendedUse: "Six-second seamless, nearly static atmosphere loop for restrained depth.",
    masterFile: "output/media-sprint/motion/mot-loop-02-emulsion-breathe.mp4",
    prompt: "Deterministic derivative of vis-plate-03: a six-second closed sinusoidal crop and ±0.012 brightness path at 1920×1080 and 30 fps; no generative additions.",
    sourceAssetIds: ["vis-plate-03-compressed-time"], durationSeconds: 6, loop: true,
    provider: "local ffmpeg derivative", model: "none",
  },
];

for (const asset of [...visuals, ...motion]) asset.sha256 = sha256(resolve(asset.masterFile));
upsertAssets([...visuals.map((asset) => ({ ...shared, ...asset })), ...motion.map((asset) => ({ ...shared, ...asset }))]);
console.log(`Registered ${visuals.length} visual plates and ${motion.length} motion loops.`);
