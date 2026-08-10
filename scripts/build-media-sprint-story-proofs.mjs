import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import sharp from "sharp";
import { sha256, upsertAssets } from "./media-sprint-lib.mjs";

const out = resolve("output/media-sprint/story-proofs");
mkdirSync(out, { recursive: true });
const W = 1920;
const H = 1080;

function escapeXml(text) {
  return text.replace(/[&<>]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[char]);
}

function textSvg({ eyebrow, title, lines = [], footer = "NON-DOCUMENTARY IDENTITY · FACTS FROM THE CANONICAL RECORD" }) {
  return Buffer.from(`<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <style>.sans{font-family:Arial,sans-serif}.mono{font-family:monospace}.ey{font-size:24px;letter-spacing:5px;fill:#ff3b1f}.title{font-size:86px;font-weight:700;letter-spacing:-3px;fill:#f3ede8}.line{font-size:34px;fill:#f3ede8}.dim{font-size:23px;fill:#a89c94;letter-spacing:1px}</style>
    <text x="120" y="150" class="sans ey">${escapeXml(eyebrow)}</text>
    <text x="120" y="260" class="sans title">${escapeXml(title)}</text>
    ${lines.map((line, index) => `<text x="120" y="${355 + index * 58}" class="mono line">${escapeXml(line)}</text>`).join("")}
    <text x="120" y="1010" class="mono dim">${escapeXml(footer)}</text>
  </svg>`);
}

async function portrait(path, width = 540, opacity = 0.42) {
  return sharp(path).resize({ width, height: 760, fit: "cover", position: "top" }).grayscale().ensureAlpha(opacity).png().toBuffer();
}

async function frame({ background, output, eyebrow, title, lines, overlays = [] }) {
  const composites = [...overlays, { input: textSvg({ eyebrow, title, lines }), left: 0, top: 0 }];
  await sharp(background).resize(W, H, { fit: "cover" }).composite(composites).png().toFile(resolve(out, output));
}

function run(args) {
  const result = spawnSync("ffmpeg", args, { encoding: "utf8" });
  if (result.status !== 0) throw new Error(result.stderr);
}

function makeFilm({ frames, output, bed, cue, cueDelayMs }) {
  const args = ["-y", "-hide_banner", "-loglevel", "error"];
  for (const image of frames) args.push("-loop", "1", "-framerate", "30", "-t", "3", "-i", resolve(out, image));
  args.push("-i", bed, "-i", cue);
  const filter = [
    "[0:v][1:v]xfade=transition=fade:duration=0.5:offset=2.5[v1]",
    "[v1][2:v]xfade=transition=fade:duration=0.5:offset=5[v2]",
    "[v2][3:v]xfade=transition=fade:duration=0.5:offset=7.5,format=yuv420p[v]",
    `[5:a]adelay=${cueDelayMs}|${cueDelayMs},volume=0.62[cue]`,
    "[4:a]volume=0.72[bed]",
    "[bed][cue]amix=inputs=2:duration=longest:normalize=0,atrim=0:10.5,afade=t=out:st=10:d=0.5[a]",
  ].join(";");
  args.push("-filter_complex", filter, "-map", "[v]", "-map", "[a]", "-t", "10.5", "-r", "30", "-c:v", "libx264", "-crf", "18", "-preset", "medium", "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", resolve(out, output));
  run(args);
}

const followPlate = "output/media-sprint/visual/vis-identity-01-follow.png";
const loopPlate = "output/media-sprint/visual/vis-identity-02-loop.png";
const spinPlate = "output/media-sprint/visual/vis-identity-03-spin-off-return.png";
const best = await portrait("public/media/journey/george-best.webp");
const ronaldo = await portrait("public/media/journey/cristiano-ronaldo.webp");

await frame({ background: followPlate, output: "loop-01.png", eyebrow: "FOLLOW · 1968 → 2008", title: "Forty years apart.", lines: ["TWO NO. 7s", "ONE TRACEABLE RECORD"] });
await frame({ background: loopPlate, output: "loop-02.png", eyebrow: "LOOP · DISTANT MOMENTS TOUCH", title: "Best ↔ Ronaldo", lines: ["1968", "2008"], overlays: [{ input: best, left: 1050, top: 170 }, { input: ronaldo, left: 1370, top: 170 }] });
await frame({ background: loopPlate, output: "loop-03.png", eyebrow: "THE SAME CAREER BEAT", title: "Season five.", lines: ["BEST · 32 GOALS IN 53", "RONALDO · 42 GOALS IN 49"] });
await frame({ background: followPlate, output: "loop-04.png", eyebrow: "THE RECEIPTS", title: "Both scored in the final.", lines: ["BEST · 92′ · BENFICA 4–1", "RONALDO · 25′ · CHELSEA · WON ON PENALTIES"] });
makeFilm({ frames: ["loop-01.png", "loop-02.png", "loop-03.png", "loop-04.png"], output: "story-proof-best-ronaldo-loop.mp4", bed: "output/media-sprint/audio/aud-identity-01-follow-review.mp3", cue: "output/media-sprint/audio/aud-identity-02-loop-review.mp3", cueDelayMs: 3000 });

const pl = await portrait("public/media/journey/pl-celebration.webp", 500, 0.36);
const fa = await portrait("public/media/journey/fa-cup-lift.webp", 500, 0.36);
const parade = await portrait("public/media/journey/treble-parade.webp", 500, 0.36);
await frame({ background: followPlate, output: "treble-01.png", eyebrow: "FOLLOW · MAY 1999", title: "Eleven days.", lines: ["THREE MUST-WIN NIGHTS", "LOSE ONE AND THE TREBLE IS GONE"] });
await frame({ background: spinPlate, output: "treble-02.png", eyebrow: "SPIN OFF · THREE DECIDERS", title: "16 → 22 → 26 May", lines: ["TOTTENHAM 2–1", "NEWCASTLE 2–0", "BAYERN 2–1"], overlays: [{ input: pl, left: 1040, top: 230 }, { input: fa, left: 1320, top: 230 }] });
await frame({ background: spinPlate, output: "treble-03.png", eyebrow: "THE BENCH CHANGED EACH NIGHT", title: "All three from a substitute.", lines: ["COLE · SHERINGHAM", "SHERINGHAM + SOLSKJÆR"], overlays: [{ input: parade, left: 1260, top: 180 }] });
await frame({ background: followPlate, output: "treble-04.png", eyebrow: "RETURN · THE SEASON RECORD", title: "Three trophies.", lines: ["PREMIER LEAGUE · FA CUP", "CHAMPIONS LEAGUE"] });
makeFilm({ frames: ["treble-01.png", "treble-02.png", "treble-03.png", "treble-04.png"], output: "story-proof-eleven-days-spin-off.mp4", bed: "output/media-sprint/audio/aud-identity-01-follow-review.mp3", cue: "output/media-sprint/audio/aud-identity-03-spin-off-return-review.mp3", cueDelayMs: 2500 });

const provenance = {
  generatedAt: new Date().toISOString(),
  status: "review-proof-not-shipping",
  facts: {
    bestRonaldo: { owner: "docs/JOURNEY.md §4", frozenFixture: "video/generated-master-data.json", matchIds: ["1968-05-29-benfica-n", "2008-05-21-chelsea-n"] },
    treble: { owner: "docs/JOURNEY.md §4b", frozenFixture: "video/generated-master-data.json", matchIds: ["1999-05-16-tottenham-hotspur-h", "1999-05-22-newcastle-united-n", "1999-05-26-bayern-munich-n"] },
  },
  media: [
    { path: "public/media/journey/george-best.webp", status: "licensed local", source: "video/generated-master-data.json featured player media" },
    { path: "public/media/journey/cristiano-ronaldo.webp", status: "licensed local", source: "video/generated-master-data.json featured player media" },
    { path: "public/media/journey/pl-celebration.webp", status: "CC BY-SA 2.0", owner: "data/canonical/journey-place-media.json" },
    { path: "public/media/journey/fa-cup-lift.webp", status: "CC BY 2.0", owner: "data/canonical/journey-place-media.json" },
    { path: "public/media/journey/treble-parade.webp", status: "CC BY-SA 2.0", owner: "data/canonical/journey-place-media.json" },
  ],
  audio: { source: "phase-two identity-action review proxies", newElevenLabsSpend: 0, promotionStatus: "reserve pending listening" },
};
writeFileSync(resolve(out, "provenance.json"), `${JSON.stringify(provenance, null, 2)}\n`);

const records = [
  { id: "story-proof-best-ronaldo-loop", kind: "factual-story-proof", title: "Best ↔ Ronaldo · Follow and Loop", intendedUse: "Non-shipping proof of recurring identity across a canonical cross-era comparison.", masterFile: "output/media-sprint/story-proofs/story-proof-best-ronaldo-loop.mp4", provider: "deterministic local composition", model: "none", documentaryStatus: "licensed-media-plus-synthetic-abstract-identity", reviewState: "advance", reviewNote: "Fundamentals passed. Portrait overlap is a later composition refinement, not a factual or technical blocker.", sourceAssetIds: ["vis-identity-01-follow", "vis-identity-02-loop", "aud-identity-01-follow", "aud-identity-02-loop"], prompt: "Apply Follow then Loop to the canonical 1968↔2008 Best/Ronaldo comparison; use only documented facts and licensed local portraits.", generatedAt: provenance.generatedAt },
  { id: "story-proof-eleven-days-spin-off", kind: "factual-story-proof", title: "Eleven days · Follow, Spin off and return", intendedUse: "Non-shipping proof of recurring identity across the canonical Treble pocket.", masterFile: "output/media-sprint/story-proofs/story-proof-eleven-days-spin-off.mp4", provider: "deterministic local composition", model: "none", documentaryStatus: "licensed-media-plus-synthetic-abstract-identity", reviewState: "advance", reviewNote: "Fundamentals passed. The three-night detour and return remain legible; claims match the journey owner document.", sourceAssetIds: ["vis-identity-01-follow", "vis-identity-03-spin-off-return", "aud-identity-01-follow", "aud-identity-03-spin-off-return"], prompt: "Apply Follow then Spin off and return to the canonical eleven-days Treble structure; use only documented facts and licensed local trophy perspectives.", generatedAt: provenance.generatedAt },
];
for (const record of records) record.sha256 = sha256(resolve(record.masterFile));
upsertAssets(records);
console.log("Built and registered two factual story proofs.");
