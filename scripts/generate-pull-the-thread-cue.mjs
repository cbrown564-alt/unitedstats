import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnv(path) {
  if (!existsSync(path)) return;
  for (const raw of readFileSync(path, "utf8").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const split = line.indexOf("=");
    if (split < 1) continue;
    const key = line.slice(0, split).trim();
    const value = line.slice(split + 1).trim().replace(/^['"]|['"]$/g, "");
    if (!(key in process.env)) process.env[key] = value;
  }
}

function measureLoudness(path) {
  const measurement = spawnSync("ffmpeg", [
    "-hide_banner", "-nostats", "-i", path,
    "-af", "loudnorm=I=-18:TP=-1.5:LRA=7:print_format=json", "-f", "null", "-",
  ], { encoding: "utf8" });
  if (measurement.status !== 0) throw new Error(`Could not measure ${path}: ${measurement.stderr}`);
  const json = measurement.stderr.match(/\{\s*"input_i"[\s\S]*?\}/)?.[0];
  if (!json) throw new Error(`Could not read loudness measurement for ${path}`);
  return JSON.parse(json);
}

const candidates = [
  {
    id: "01-wool-draw",
    title: "Wool draw",
    note: "Warmest and softest — brushed yarn sliding through fingertips, then one damped release.",
    prompt: "Four-second close-miked textile gesture. A single continuous, smooth sound of soft wool yarn being drawn steadily through warm fingertips. Friction and pitch rise gradually as the fibre tightens; no separate attacks. At 2.2 seconds the tension releases in one muted, soft fibre tug with a tiny damped rebound, then a faint wool resonance fades. Intimate, organic, warm. No clicks, shells, beads, wood, metal, mechanism, whoosh, percussion or music.",
  },
  {
    id: "02-woven-cloth",
    title: "Woven cloth under tension",
    note: "Broader and denser — a smooth fabric drag whose weave tightens before one restrained give.",
    prompt: "Four-second textile sound, one continuous gesture: dense woven cotton pulled slowly across cloth, a smooth low fabric hush with audible fibres, gradually tightening and rising without pulses or clicks. At 2.2 seconds the weave gives once with a restrained soft stretch and short damped recoil, then settles. Human, dry, close and warm. No shell texture, rattles, beads, wood, metal, machinery, clicks, whoosh, percussion or music.",
  },
  {
    id: "03-thread-through-felt",
    title: "Thread through felt",
    note: "Finest and most filament-like — continuous thread friction with a clear but soft tension point.",
    prompt: "Four-second recording of cotton thread pulled continuously through thick felt. Begin with a seamless fibre whisper; friction becomes denser and higher as tension accumulates, with no little clicks or repeated events. At 2.2 seconds one gentle taut-thread release bends into the felt, followed by a fine warm textile resonance. Supple, intimate, unmistakably fabric. No shells, beads, wood, metal, mechanism, instrument, whoosh, percussion or music.",
  },
];

loadEnv(resolve(".env"));
loadEnv(resolve(".env.local"));

const apiKey = process.env.ELEVENLABS_API_KEY;
if (!apiKey) throw new Error("ELEVENLABS_API_KEY is required.");

const force = process.argv.includes("--force");
const outputDir = resolve("public/video/audio/pull-the-thread/samples");
const manifestPath = resolve(outputDir, "manifest.json");
mkdirSync(outputDir, { recursive: true });

const previous = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, "utf8")) : null;
const results = [];

for (const candidate of candidates) {
  if (candidate.prompt.length > 450) {
    throw new Error(`${candidate.id} prompt is ${candidate.prompt.length} characters; maximum is 450.`);
  }

  const rawPath = resolve(outputDir, `${candidate.id}.mp3`);
  const reviewPath = resolve(outputDir, `${candidate.id}-review.mp3`);
  const prior = previous?.candidates?.find((item) => item.id === candidate.id);
  let requestId = prior?.requestId ?? null;
  let characterCost = prior?.characterCost ?? null;

  if (!existsSync(rawPath) || force) {
    process.stdout.write(`Generating ${candidate.title}…\n`);
    const response = await fetch("https://api.elevenlabs.io/v1/sound-generation?output_format=mp3_44100_192", {
      method: "POST",
      headers: { "xi-api-key": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        text: candidate.prompt,
        duration_seconds: 4,
        prompt_influence: 0.86,
        loop: false,
        model_id: "eleven_text_to_sound_v2",
      }),
    });
    if (!response.ok) throw new Error(`Generation failed (${response.status}): ${await response.text()}`);
    requestId = response.headers.get("request-id");
    characterCost = response.headers.get("character-cost");
    writeFileSync(rawPath, Buffer.from(await response.arrayBuffer()));
  } else {
    process.stdout.write(`Using cached ${candidate.title}\n`);
  }

  const rawLoudness = measureLoudness(rawPath);
  const reviewGainDb = -18 - Number(rawLoudness.input_i);
  const normalized = spawnSync("ffmpeg", [
    "-y", "-hide_banner", "-loglevel", "error", "-i", rawPath,
    "-af", `volume=${reviewGainDb.toFixed(2)}dB`, "-codec:a", "libmp3lame", "-b:a", "192k", reviewPath,
  ], { encoding: "utf8" });
  if (normalized.status !== 0) throw new Error(`Could not normalize ${candidate.id}: ${normalized.stderr}`);

  const rawAudio = readFileSync(rawPath);
  const reviewAudio = readFileSync(reviewPath);
  const reviewLoudness = measureLoudness(reviewPath);
  results.push({
    ...candidate,
    durationSeconds: 4,
    rawFile: `public/video/audio/pull-the-thread/samples/${candidate.id}.mp3`,
    rawSha256: createHash("sha256").update(rawAudio).digest("hex"),
    reviewFile: `public/video/audio/pull-the-thread/samples/${candidate.id}-review.mp3`,
    reviewSha256: createHash("sha256").update(reviewAudio).digest("hex"),
    reviewMastering: {
      method: "constant gain to -18 LUFS integrated; no dynamics processing",
      gainDb: Number(reviewGainDb.toFixed(2)),
      measuredIntegratedLufs: Number(reviewLoudness.input_i),
      measuredTruePeakDbtp: Number(reviewLoudness.input_tp),
    },
    requestId,
    characterCost,
  });
}

const manifest = {
  purpose: "Textile-first Pull the Thread end-card sound audition; no candidate is mixed into the film.",
  provider: "ElevenLabs",
  model: "eleven_text_to_sound_v2",
  generatedAt: new Date().toISOString(),
  candidates: results,
};
writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

const rows = results.map((candidate, index) => `
  <article>
    <span class="id">0${index + 1}</span>
    <div><h2>${candidate.title}</h2><p>${candidate.note}</p></div>
    <audio controls preload="metadata" src="${candidate.id}-review.mp3"></audio>
  </article>`).join("");
const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Pull the Thread · textile sound audition</title><style>
:root{color-scheme:dark;--bg:#0c0b0a;--fg:#f3ede8;--muted:#a89c94;--line:#2c2522;--red:#ff3b1f}*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--fg);font:15px/1.45 Arial,sans-serif}main{width:min(980px,calc(100% - 32px));margin:auto;padding:48px 0 72px}h1{max-width:720px;margin:0;font-size:clamp(36px,7vw,68px);font-weight:600;line-height:.98;letter-spacing:-.04em}header p,article p,footer{color:var(--muted)}header p{max-width:680px;margin:18px 0 0}.rows{margin-top:40px;border-top:1px solid var(--line)}article{display:grid;grid-template-columns:36px minmax(240px,.9fr) minmax(320px,1.1fr);gap:20px;align-items:center;padding:22px 0;border-bottom:1px solid var(--line)}.id{font:12px monospace;color:var(--red)}h2{margin:0;font-size:16px;font-weight:600}article p{margin:4px 0 0;font-size:13px}audio{width:100%;height:34px;filter:grayscale(1)}footer{margin-top:28px;font-size:13px}@media(max-width:700px){article{grid-template-columns:28px 1fr}article audio{grid-column:2}}
</style></head><body><main><header><h1>Thread, cloth, tension.</h1><p>Three isolated four-second auditions. Each stays smooth until one restrained point of tension; none is in the film mix.</p></header><section class="rows">${rows}</section><footer>Review masters are level-matched to −18 LUFS. Headphones first, then phone speakers.</footer></main></body></html>`;
writeFileSync(resolve(outputDir, "index.html"), html);
process.stdout.write(`Wrote ${results.length} candidates and audition page to ${outputDir}\n`);
