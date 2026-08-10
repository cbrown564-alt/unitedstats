import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { loadEnv, readManifest, sha256, upsertAssets } from "./media-sprint-lib.mjs";

loadEnv(resolve(".env.local"));
loadEnv(resolve(".env"));
const apiKey = process.env.ELEVENLABS_API_KEY;
if (!apiKey) throw new Error("ELEVENLABS_API_KEY is required.");
const force = process.argv.includes("--force");
const onlyArg = process.argv.find((arg) => arg.startsWith("--only="));
const onlyId = onlyArg?.slice("--only=".length);
const outputDir = resolve("output/media-sprint/audio");
mkdirSync(outputDir, { recursive: true });

const jobs = [
  { id: "aud-bed-01-archive-pulse", kind: "music-bed", title: "Archive pulse", duration: 30, loop: true, prompt: "Seamless 30-second instrumental loop at 92 BPM. Restrained tactile analogue electronica: dry prepared-piano ticks, muted warm bass pulse, fine bowed-wire texture, soft tape motion and spacious darkness. Curious, precise, nocturnal, quietly propulsive; no dominant melody. No voice, crowd, football audio, anthem, triumph, trailer percussion, brass, string swell, rock guitar or final cadence. Ending joins the opening invisibly." },
  { id: "aud-bed-02-rain-ledger", kind: "music-bed", title: "Rain ledger", duration: 30, loop: true, prompt: "Seamless 30-second instrumental loop: sparse British industrial dub at 98 BPM for reading historical records at night. Rounded restrained sub-bass, dry rim texture, tiny metallic room reflections, degraded tape air, narrow thread-like harmonic and generous negative space. Calm pressure, never ominous. No voice, crowd, stadium, chant, reggae skank, dub siren, drum fill, climax, whoosh or final chord. Exact loopable ending." },
  { id: "aud-cue-01-evidence-lock", kind: "short-cue", title: "Evidence lock", duration: 4, loop: false, prompt: "Four-second restrained editorial sound cue. One dry archive mark, a narrow fibre-like tone travels a short distance, then settles into a compact warm two-note proof interval with a clean tail. Precise and human, suitable for revealing a verified statistic. No voice, notification ping, logo jingle, crowd, sport sound, percussion beat, triumph, whoosh or sci-fi." },
  { id: "aud-cue-02-late-pressure", kind: "short-cue", title: "Late pressure", duration: 6, loop: false, prompt: "Six-second abstract tension cue for a match timeline without pretending to be match audio. Begin with near-silent tape pressure and a low restrained pulse; density tightens gradually; one small breath of space at five seconds, unresolved fine resonance. No heartbeat cliché, ticking clock, crowd, whistle, commentary, impact, horror, riser, braam, voice or music melody." },
  { id: "aud-transition-01-thread-crossing", kind: "transition", title: "Thread crossing", duration: 3, loop: false, prompt: "Three-second tactile transition: a continuous cotton-fibre whisper travels left to right, passes through a dry paper surface once, and leaves a faint warm resonant filament. One gesture, no separate clicks. Abstract, intimate and physically plausible. No voice, crowd, sport audio, whoosh, magic sparkle, notification, percussion, metal or branding jingle." },
  { id: "aud-identity-01-follow", kind: "identity-action", title: "Follow", duration: 12, loop: true, prompt: "Seamless 12-second abstract identity loop for following a factual line through time. One narrow warm filament tone moves steadily forward over sparse dry archive marks and a restrained low pulse; clear direction, patient momentum, no destination fanfare. Tactile analogue, intimate and exact. No voice, crowd, football audio, melody, notification, whoosh, anthem, trailer sound, triumph or final cadence. Ending joins opening invisibly." },
  { id: "aud-identity-02-loop", kind: "identity-action", title: "Loop", duration: 5, loop: false, prompt: "Five-second abstract identity cue for two distant factual moments touching. A fine warm filament leaves one dry mark, bends smoothly through stereo space, returns to a second related mark, and reveals one compact harmonic interval. The connection is the event. Human, restrained, analogue. No voice, crowd, football audio, notification, sci-fi, magic sparkle, whoosh, percussion beat, logo jingle, triumph or sentimental swell." },
  { id: "aud-identity-03-spin-off-return", kind: "identity-action", title: "Spin off and return", duration: 7, loop: false, prompt: "Seven-second abstract identity transition: one steady fine filament departs a restrained low pulse, circles into a denser pocket of paper, wire and tape texture, then rejoins the original pulse cleanly. The detour feels purposeful, not dramatic. Tactile, warm and precise. No voice, crowd, football audio, clock, notification, whoosh, riser, impact, anthem, trailer sound, triumph or final chord." },
];

upsertAssets(jobs.map((job) => ({
  ...job,
  provider: "ElevenLabs",
  model: "eleven_text_to_sound_v2",
  documentaryStatus: "synthetic-abstract",
  intendedUse: job.kind === "music-bed" ? "Reusable underscore under data-led stories; no depicted-match claim." : "Reusable editorial punctuation; no depicted-match claim.",
  durationSeconds: job.duration,
  loop: job.loop,
  reviewState: "queued",
})));

const assets = [];
const selectedJobs = onlyId ? jobs.filter((job) => job.id === onlyId) : jobs;
if (onlyId && selectedJobs.length !== 1) throw new Error(`Unknown audio job: ${onlyId}`);
for (const job of selectedJobs) {
  if (job.prompt.length > 450) throw new Error(`${job.id} prompt is ${job.prompt.length} characters; ElevenLabs allows 450.`);
}

async function generateWithRetry(job) {
  const attempts = 3;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    const response = await fetch("https://api.elevenlabs.io/v1/sound-generation?output_format=mp3_44100_192", {
      method: "POST",
      headers: { "xi-api-key": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({ text: job.prompt, duration_seconds: job.duration, prompt_influence: 0.78, loop: job.loop, model_id: "eleven_text_to_sound_v2" }),
    });
    if (response.ok) return response;
    const retryable = response.status === 429 || response.status >= 500;
    if (!retryable || attempt === attempts) throw new Error(`${job.id} failed (${response.status}): ${await response.text()}`);
    const retryAfter = Number(response.headers.get("retry-after"));
    const delayMs = Number.isFinite(retryAfter) ? retryAfter * 1000 : attempt * 1500;
    console.warn(`${job.id} received ${response.status}; retrying once the provider delay clears.`);
    await new Promise((resolveDelay) => setTimeout(resolveDelay, delayMs));
  }
  throw new Error(`${job.id} exhausted retries`);
}

for (const job of selectedJobs) {
  const raw = resolve(outputDir, `${job.id}.mp3`);
  const review = resolve(outputDir, `${job.id}-review.mp3`);
  const previous = readManifest().assets.find((asset) => asset.id === job.id);
  let requestId = previous?.requestId ?? null;
  let characterCost = previous?.characterCost ?? null;
  if (!existsSync(raw) || force) {
    console.log(`Generating ${job.id}…`);
    const response = await generateWithRetry(job);
    requestId = response.headers.get("request-id");
    characterCost = response.headers.get("character-cost");
    writeFileSync(raw, Buffer.from(await response.arrayBuffer()));
  }
  const normalized = spawnSync("ffmpeg", ["-y", "-hide_banner", "-loglevel", "error", "-i", raw, "-af", "loudnorm=I=-18:TP=-1.5:LRA=7", "-codec:a", "libmp3lame", "-b:a", "192k", review], { encoding: "utf8" });
  if (normalized.status !== 0) throw new Error(`Review normalization failed for ${job.id}: ${normalized.stderr}`);
  assets.push({
    ...job,
    provider: "ElevenLabs",
    model: "eleven_text_to_sound_v2",
    documentaryStatus: "synthetic-abstract",
    intendedUse: job.kind === "music-bed" ? "Reusable underscore under data-led stories; no depicted-match claim." : "Reusable editorial punctuation; no depicted-match claim.",
    masterFile: `output/media-sprint/audio/${job.id}.mp3`,
    reviewFile: `output/media-sprint/audio/${job.id}-review.mp3`,
    sha256: sha256(raw),
    reviewSha256: sha256(review),
    durationSeconds: job.duration,
    loop: job.loop,
    requestId,
    characterCost: characterCost == null ? null : Number(characterCost),
    reviewState: "unreviewed",
    generatedAt: new Date().toISOString(),
  });
  upsertAssets([assets.at(-1)]);
}
console.log(`Generated or confirmed ${assets.length} sprint audio assets.`);
