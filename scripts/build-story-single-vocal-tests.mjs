import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
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

loadEnv(resolve(".env"));
loadEnv(resolve(".env.local"));

const apiKey = process.env.ELEVENLABS_API_KEY;
if (!apiKey) throw new Error("ELEVENLABS_API_KEY is required.");

const force = process.argv.includes("--force");
const root = resolve("public/video/audio/story-singles");
const outputDir = resolve(root, "vocal-tests");
const sourceDir = root;
const ffmpeg = process.env.FFMPEG_PATH || "ffmpeg";
const ffprobe = process.env.FFPROBE_PATH || "ffprobe";
const voice = {
  id: "onwK4e9ZLuTAKqWW03F9",
  name: "Daniel - Steady Broadcaster",
  model: "eleven_multilingual_v2",
  outputFormat: "mp3_44100_128",
};

const stories = [
  {
    id: "fergie-time",
    source: "mechanical-paranoia.mp3",
    mechanism: "The impossible clock",
    accountSong: "Mechanical Paranoia",
    story: "Fergie time",
    oneLine: "The clock says late. The record says wait.",
    hook: "The record says wait.",
    oneLineAt: 18,
    hookAt: [7, 18, 25],
  },
  {
    id: "ronaldo-best",
    source: "the-alignment-pattern.mp3",
    mechanism: "Bass-clarinet pursuit",
    accountSong: "The Alignment Pattern",
    story: "Ronaldo / Best",
    oneLine: "Same number. Same final. Forty years.",
    hook: "Seven again.",
    oneLineAt: 18,
    hookAt: [7, 17, 25],
  },
  {
    id: "eleven-days-in-may",
    source: "missing-beat-minimalist-cue.mp3",
    mechanism: "Dangerous minimalism",
    accountSong: "Missing Beat Minimalist Cue",
    story: "Eleven days in May",
    oneLine: "Eleven days. Three turns. No margin.",
    hook: "No margin.",
    oneLineAt: 18,
    hookAt: [7, 17, 25],
  },
];

mkdirSync(outputDir, { recursive: true });

function run(args) {
  execFileSync(ffmpeg, ["-hide_banner", "-loglevel", "error", ...args], { stdio: "inherit" });
}

function duration(path) {
  return Number(execFileSync(ffprobe, [
    "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path,
  ], { encoding: "utf8" }).trim());
}

function sha256(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

async function generateVoice(text, output) {
  if (existsSync(output) && !force) return;
  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice.id}?output_format=${voice.outputFormat}`, {
    method: "POST",
    headers: { "xi-api-key": apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({
      text,
      model_id: voice.model,
      voice_settings: { stability: 0.66, similarity_boost: 0.78, style: 0.12, use_speaker_boost: true },
    }),
  });
  if (!response.ok) throw new Error(`TTS failed (${response.status}): ${await response.text()}`);
  writeFileSync(output, Buffer.from(await response.arrayBuffer()));
}

function renderMix(source, voiceFile, output, starts) {
  const filter = starts.length === 1
    ? `[1:a]adelay=${Math.round(starts[0] * 1000)}|${Math.round(starts[0] * 1000)}[v];[0:a][v]amix=inputs=2:duration=first:dropout_transition=0:normalize=0,loudnorm=I=-16:TP=-1.5:LRA=11[out]`
    : `${starts.map((start, index) => `[1:a]adelay=${Math.round(start * 1000)}|${Math.round(start * 1000)}[v${index}]`).join(";")};${starts.map((_, index) => `[v${index}]`).join("")}amix=inputs=${starts.length}:duration=longest:dropout_transition=0:normalize=0[voice];[0:a][voice]amix=inputs=2:duration=first:dropout_transition=0:normalize=0,loudnorm=I=-16:TP=-1.5:LRA=11[out]`;
  run(["-y", "-i", source, "-i", voiceFile, "-filter_complex", filter, "-map", "[out]", "-t", "30", "-codec:a", "libmp3lame", "-b:a", "192k", output]);
}

const manifest = {
  purpose: "30-second Red Thread story-single vocal-load bake-off",
  decision: "Instrumental version preferred for all three story singles; voice-load mixes retained as comparison records.",
  generatedAt: new Date().toISOString(),
  durationSeconds: 30,
  voice,
  policy: "The instrumental, one-line and repeated-hook files are explicit user-triggered audition assets; none is site autoplay audio.",
  stories: [],
};

for (const story of stories) {
  const source = resolve(sourceDir, story.source);
  if (!existsSync(source)) throw new Error(`Missing source: ${source}`);
  if (duration(source) < 29.9) throw new Error(`Source is shorter than 30 seconds: ${source}`);

  const oneLineVoice = resolve(outputDir, `${story.id}-one-line-voice.mp3`);
  const hookVoice = resolve(outputDir, `${story.id}-repeated-hook-voice.mp3`);
  await generateVoice(story.oneLine, oneLineVoice);
  await generateVoice(story.hook, hookVoice);

  const instrumental = resolve(outputDir, `${story.id}-instrumental.mp3`);
  const oneLineMix = resolve(outputDir, `${story.id}-one-line.mp3`);
  const hookMix = resolve(outputDir, `${story.id}-repeated-hook.mp3`);
  if (!existsSync(instrumental) || force) run(["-y", "-i", source, "-t", "30", "-codec:a", "libmp3lame", "-b:a", "192k", instrumental]);
  if (!existsSync(oneLineMix) || force) renderMix(instrumental, oneLineVoice, oneLineMix, [story.oneLineAt]);
  if (!existsSync(hookMix) || force) renderMix(instrumental, hookVoice, hookMix, story.hookAt);

  manifest.stories.push({
    id: story.id,
    story: story.story,
    mechanism: story.mechanism,
    accountSong: story.accountSong,
    source: `public/video/audio/story-singles/${story.source}`,
    sourceDurationSeconds: duration(source),
    sourceSha256: sha256(source),
    voiceText: { oneLine: story.oneLine, repeatedHook: story.hook },
    timingsSeconds: { oneLine: [story.oneLineAt], repeatedHook: story.hookAt },
    files: {
      instrumental: `public/video/audio/story-singles/vocal-tests/${story.id}-instrumental.mp3`,
      oneLine: `public/video/audio/story-singles/vocal-tests/${story.id}-one-line.mp3`,
      repeatedHook: `public/video/audio/story-singles/vocal-tests/${story.id}-repeated-hook.mp3`,
    },
    fileSha256: {
      instrumental: sha256(instrumental),
      oneLine: sha256(oneLineMix),
      repeatedHook: sha256(hookMix),
    },
  });
}

const rows = manifest.stories.flatMap((story) => [
  { label: `${story.story} · instrumental`, src: `${story.id}-instrumental.mp3` },
  { label: `${story.story} · one line — “${story.voiceText.oneLine}”`, src: `${story.id}-one-line.mp3` },
  { label: `${story.story} · repeated hook — “${story.voiceText.repeatedHook}”`, src: `${story.id}-repeated-hook.mp3` },
]);
const index = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Red Thread · story-single vocal tests</title><style>:root{color-scheme:dark;--bg:#090909;--fg:#f2efe9;--muted:#9d9992;--line:#292825;--red:#d92c2c}*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--fg);font:15px/1.45 Arial,sans-serif}main{width:min(1040px,calc(100% - 32px));margin:auto;padding:48px 0 76px}h1{font-size:clamp(38px,7vw,74px);line-height:.94;letter-spacing:-.05em;font-weight:500;margin:0 0 12px}p{color:var(--muted);max-width:720px}.rows{margin-top:36px;border-top:1px solid var(--line)}article{display:grid;grid-template-columns:minmax(290px,1fr) minmax(320px,1.1fr);gap:22px;align-items:center;padding:22px 0;border-bottom:1px solid var(--line)}h2{font-size:16px;font-weight:500;margin:0}.kind{color:var(--red);font:12px monospace;text-transform:uppercase;letter-spacing:.08em}audio{width:100%;height:34px;filter:grayscale(1)}footer{margin-top:28px;color:var(--muted);font-size:13px}@media(max-width:700px){article{grid-template-columns:1fr;gap:10px}}</style></head><body><main><h1>Three stories.<br>Three voice loads.</h1><p>Listen in groups: instrumental, one dry line, then the repeated hook. The source songs are the named ElevenLabs account exports. Voice tests use Daniel, a British steady-broadcaster voice, and are editorial auditions—not final dialogue.</p><section class="rows">${rows.map((row) => `<article><div><span class="kind">${row.src.includes("instrumental") ? "No voice" : row.src.includes("one-line") ? "One line" : "Repeated hook"}</span><h2>${row.label}</h2></div><audio controls preload="metadata" src="${row.src}"></audio></article>`).join("")}</section><footer>Mute the page between passes. No file is a site default or autoplay surface.</footer></main></body></html>\n`;
writeFileSync(resolve(outputDir, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
writeFileSync(resolve(outputDir, "index.html"), index);
console.log(`Wrote ${manifest.stories.length * 3} story-single vocal tests.`);
