import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnvFile(path) {
  if (!existsSync(path)) return;
  for (const rawLine of readFileSync(path, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const separator = line.indexOf("=");
    if (separator < 1) continue;
    const key = line.slice(0, separator).trim();
    const value = line.slice(separator + 1).trim().replace(/^['"]|['"]$/g, "");
    if (!(key in process.env)) process.env[key] = value;
  }
}

loadEnvFile(resolve(".env"));
loadEnvFile(resolve(".env.local"));

const force = process.argv.includes("--force");
const output = resolve("public/video/audio/master-v3.mp3");
const metadataOutput = resolve("public/video/audio/master-v3.json");
const rawOutput = resolve("public/video/audio/master-v3-raw.mp3");
const ffmpeg = resolve("node_modules/@remotion/compositor-win32-x64-msvc/ffmpeg.exe");
const ffprobe = resolve("node_modules/@remotion/compositor-win32-x64-msvc/ffprobe.exe");

if (existsSync(output) && !force) {
  console.log(`Using cached authored score: ${output}`);
  process.exit(0);
}
if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY is required to generate the authored score.");
}

const prompt = `
Create an exactly 60-second, instrumental-only score for a cinematic data film about 140 years of football history. Modern cinematic minimalism and tactile analogue electronica at 82 BPM in a dark, warm tonality. The moving red filament is the protagonist. Use restrained prepared-piano ticks, warm sub-bass pulse, subtle bowed-wire texture, soft frame-drum impacts, granular tape movement and detailed stereo depth. Premium documentary sound: intimate, curious and emotionally precise, never bombastic.

[0:00 - 0:12] Archive ignition. Begin almost silently with a tactile pulse and bowed-wire overtone. Add small material accents as a few historical knots pass. Patient forward movement; no conventional melody yet.
[0:12 - 0:26] Forty-year time loop. Widen the harmony gradually as the line circles from 2008 to 1968 and back. Make the completed circle feel inevitable and moving, not triumphant. Let a restrained prepared-piano motif emerge. Two fact landings only — do not overcrowd with fanfares.
[0:26 - 0:43] Eleven days in May. The analogue pulse becomes firmer. Land three increasingly weighty but controlled rhythmic accents while the motif develops. Build momentum without turning into an anthem.
[0:43 - 0:54] Late pressure. Remove most harmonic support around the match clock. Use negative space, a minimal heartbeat-like pulse and granular tape tension, then open into a field of late goals — one scale bloom, not a second architectural act.
[0:54 - 1:00] The line continues. Open into restrained wonder and forward motion as a receipt resolves. End with one warm harmonic opening and a clean resonant tail, not a grand finale or abrupt stop.

Strictly no vocals, speech, choir, crowd chants, stadium recordings, football commentary, rock guitars, EDM drops, trailer braams, heroic brass, bombastic orchestra, jump scares, cheesy victory music, marching band, sports anthem or sentimental string swell.
`;

console.log("Generating an authored 60-second Lyria 3 Pro score…");
const response = await fetch("https://generativelanguage.googleapis.com/v1beta/interactions", {
  method: "POST",
  headers: {
    "x-goog-api-key": process.env.GEMINI_API_KEY,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    model: "lyria-3-pro-preview",
    input: prompt,
  }),
});

if (!response.ok) {
  const detail = await response.text();
  throw new Error(`Lyria 3 Pro generation failed (${response.status}): ${detail}`);
}

const payload = await response.json();
const audioBlock = payload.steps
  ?.filter((step) => step.type === "model_output")
  .flatMap((step) => step.content ?? [])
  .find((block) => block.type === "audio");
if (!audioBlock?.data) {
  throw new Error("Lyria 3 Pro returned no audio block.");
}

mkdirSync(resolve("public/video/audio"), { recursive: true });
writeFileSync(rawOutput, Buffer.from(audioBlock.data, "base64"));
const sourceDuration = Number(execFileSync(ffprobe, [
  "-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", rawOutput,
], { encoding: "utf8" }).trim());
const targetDuration = 60;
const tempo = sourceDuration / targetDuration;
execFileSync(ffmpeg, [
  "-y", "-i", rawOutput,
  "-filter:a", `atempo=${tempo.toFixed(8)},apad=pad_dur=1`,
  "-t", String(targetDuration),
  "-codec:a", "libmp3lame", "-b:a", "192k",
  output,
], { stdio: "inherit" });
rmSync(rawOutput);
writeFileSync(metadataOutput, `${JSON.stringify({
  provider: "Google Gemini API",
  model: "lyria-3-pro-preview",
  method: "timestamped-structure-prompt",
  sourceDurationSeconds: sourceDuration,
  durationSeconds: targetDuration,
  tempoNormalization: tempo,
  prompt: prompt.trim(),
  synthIdWatermarked: true,
  generatedAt: new Date().toISOString(),
}, null, 2)}\n`);

console.log(`Wrote authored score: ${output}`);
