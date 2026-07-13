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
    "-af", "loudnorm=I=-16:TP=-1.5:LRA=7:print_format=json", "-f", "null", "-",
  ], { encoding: "utf8" });
  if (measurement.status !== 0) throw new Error(`Could not measure ${path}: ${measurement.stderr}`);
  const json = measurement.stderr.match(/\{\s*"input_i"[\s\S]*?\}/)?.[0];
  if (!json) throw new Error(`Could not read loudness measurement for ${path}`);
  return JSON.parse(json);
}

loadEnv(resolve(".env"));
loadEnv(resolve(".env.local"));

const apiKey = process.env.ELEVENLABS_API_KEY;
if (!apiKey) throw new Error("ELEVENLABS_API_KEY is required.");

const force = process.argv.includes("--force");
const root = resolve("public/video/audio/red-thread-mnemonic");
const outputDir = resolve(root, "refinement");
const manifestPath = resolve(outputDir, "manifest.json");
mkdirSync(outputDir, { recursive: true });

const previousManifest = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, "utf8")) : null;
const durationSeconds = 3;
const fixedGrammar = "Three-second tactile sonic logo. Dry close mark at 0.00; second distinct mark at 0.45; a narrow tensioned-string filament travels from 0.55–1.75; contact reveals a compact warm woody, low-reed interval at 1.75; one fine upper resonance continues to 3.00. Intimate, restrained. No voice, beat, anthem, notification, whoosh or triumph.";

const candidates = [
  {
    id: "a1-clearer-connection",
    label: "A1 · Clearer connection",
    variable: "Increase the perceptual separation of the two marks and make the contact at 1.75 seconds unmistakable.",
    instruction: "Make both marks clearly separate, the filament audible between them, and the joining contact crisp before it warms.",
  },
  {
    id: "a2-warmer-recognition",
    label: "A2 · Warmer recognition",
    variable: "Increase warmth at contact while preserving restraint and the same event timing.",
    instruction: "Keep the marks dry; at contact let the woody low-reed interval bloom warmly for recognition, never sentimental.",
  },
  {
    id: "a3-stronger-onward",
    label: "A3 · Stronger onward",
    variable: "Give the post-contact thread resonance more identity and forward continuation.",
    instruction: "After the compact contact, make one fine acoustic overtone continue clearly forward to the end without fading early.",
  },
];

const manifest = {
  purpose: "Second-round structural refinement within the selected Human / tactile mnemonic family.",
  provider: "ElevenLabs",
  model: "eleven_text_to_sound_v2",
  endpoint: "/v1/sound-generation",
  durationSeconds,
  outputFormat: "mp3_44100_192",
  promptInfluence: 0.78,
  generatedAt: new Date().toISOString(),
  control: {
    id: "a-human-tactile",
    reviewFile: "public/video/audio/red-thread-mnemonic/a-human-tactile-review.mp3",
  },
  fixedGrammar,
  candidates: [],
};

for (const candidate of candidates) {
  const audioPath = resolve(outputDir, `${candidate.id}.mp3`);
  const reviewPath = resolve(outputDir, `${candidate.id}-review.mp3`);
  const prompt = `${fixedGrammar} ${candidate.instruction}`;
  if (prompt.length > 450) throw new Error(`${candidate.id} prompt is ${prompt.length} characters; maximum is 450.`);
  const previous = previousManifest?.candidates?.find((item) => item.id === candidate.id);
  let requestId = previous?.requestId ?? null;
  let characterCost = previous?.characterCost ?? null;

  if (!existsSync(audioPath) || force) {
    process.stdout.write(`Generating ${candidate.id}…\n`);
    const response = await fetch("https://api.elevenlabs.io/v1/sound-generation?output_format=mp3_44100_192", {
      method: "POST",
      headers: { "xi-api-key": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        text: prompt,
        duration_seconds: durationSeconds,
        prompt_influence: 0.78,
        loop: false,
        model_id: "eleven_text_to_sound_v2",
      }),
    });
    if (!response.ok) throw new Error(`${candidate.id} failed (${response.status}): ${await response.text()}`);
    requestId = response.headers.get("request-id");
    characterCost = response.headers.get("character-cost");
    writeFileSync(audioPath, Buffer.from(await response.arrayBuffer()));
  } else {
    process.stdout.write(`Using cached ${candidate.id}\n`);
  }

  const rawLoudness = measureLoudness(audioPath);
  const reviewGainDb = -16 - Number(rawLoudness.input_i);
  const normalized = spawnSync("ffmpeg", [
    "-y", "-hide_banner", "-loglevel", "error", "-i", audioPath,
    "-af", `volume=${reviewGainDb.toFixed(2)}dB`, "-codec:a", "libmp3lame", "-b:a", "192k", reviewPath,
  ], { encoding: "utf8" });
  if (normalized.status !== 0) throw new Error(`Could not normalize ${candidate.id}: ${normalized.stderr}`);

  const audio = readFileSync(audioPath);
  const reviewAudio = readFileSync(reviewPath);
  const reviewLoudness = measureLoudness(reviewPath);
  manifest.candidates.push({
    ...candidate,
    prompt,
    promptCharacters: prompt.length,
    file: `public/video/audio/red-thread-mnemonic/refinement/${candidate.id}.mp3`,
    sha256: createHash("sha256").update(audio).digest("hex"),
    reviewFile: `public/video/audio/red-thread-mnemonic/refinement/${candidate.id}-review.mp3`,
    reviewSha256: createHash("sha256").update(reviewAudio).digest("hex"),
    reviewMastering: {
      method: "constant gain to -16 LUFS integrated; no dynamics processing",
      gainDb: Number(reviewGainDb.toFixed(2)),
      measuredIntegratedLufs: Number(reviewLoudness.input_i),
      measuredTruePeakDbtp: Number(reviewLoudness.input_tp),
    },
    requestId,
    characterCost,
  });
}

const rows = [
  { id: "A", src: "../a-human-tactile-review.mp3", detail: "Original selected Human / tactile candidate" },
  ...manifest.candidates.map((candidate) => ({
    id: candidate.label.split(" · ")[0],
    src: `${candidate.id}-review.mp3`,
    detail: `${candidate.label.split(" · ")[1]} — ${candidate.variable}`,
  })),
].map((item) => `<article><div><span class="id">${item.id}</span><h2>Candidate ${item.id}</h2></div><audio controls preload="metadata" src="${item.src}"></audio><details><summary>Reveal version</summary><p>${item.detail}</p></details></article>`).join("");

const index = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Red Thread · human/tactile refinement</title><style>:root{color-scheme:dark;--bg:#0c0b0a;--panel:#161312;--ink:#f3ede8;--dim:#a89c94;--line:#2c2522;--red:#ff3b1f}*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:15px/1.5 Arial,sans-serif}main{width:min(920px,calc(100% - 32px));margin:auto;padding:56px 0 80px}header{border-left:2px solid var(--red);padding-left:20px}h1{font-size:clamp(42px,8vw,76px);line-height:.92;letter-spacing:-.055em;font-weight:500;margin:0 0 18px}header p{max-width:670px;color:var(--dim);font-size:17px}.rows{margin-top:44px;border-top:1px solid var(--line)}article{display:grid;grid-template-columns:180px 1fr;gap:20px;align-items:center;padding:22px 0;border-bottom:1px solid var(--line)}article>div{display:flex;align-items:center;gap:14px}.id{display:grid;place-items:center;min-width:38px;height:34px;padding:0 8px;border:1px solid var(--red);border-radius:18px;color:var(--red);font:13px monospace}h2{font-size:16px;font-weight:500;margin:0}audio{width:100%;height:36px;filter:grayscale(1)}details{grid-column:2;color:var(--dim);font-size:13px}summary{cursor:pointer}details p{margin:8px 0 0}.questions{margin-top:38px;padding:24px;background:var(--panel)}h3{margin:0 0 12px;font-size:13px;letter-spacing:.11em;text-transform:uppercase;color:var(--red)}ol{margin:0;padding-left:20px;color:var(--dim)}li+li{margin-top:7px}@media(max-width:650px){main{padding-top:34px}article{grid-template-columns:1fr;gap:12px}details{grid-column:1}}</style></head><body><main><header><h1>Human touch.<br>Clearer thread.</h1><p>A is the original control. A1–A3 keep its material family and timing while changing one structural emphasis. Listen blind before revealing the versions.</p></header><section class="rows">${rows}</section><section class="questions"><h3>Refinement test</h3><ol><li>Does any refinement make the connection clearer than A?</li><li>Which contact feels most like recognition rather than a notification?</li><li>Which final resonance best says the thread continues?</li><li>If none improves on A, keep the control.</li></ol></section></main></body></html>\n`;

writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
writeFileSync(resolve(outputDir, "index.html"), index);
process.stdout.write(`Wrote ${candidates.length} refinements, manifest and audition page to ${outputDir}\n`);
