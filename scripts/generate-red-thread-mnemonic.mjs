import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
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

loadEnv(resolve(".env"));
loadEnv(resolve(".env.local"));

const apiKey = process.env.ELEVENLABS_API_KEY;
if (!apiKey) throw new Error("ELEVENLABS_API_KEY is required.");

const force = process.argv.includes("--force");
const outputDir = resolve("public/video/audio/red-thread-mnemonic");
mkdirSync(outputDir, { recursive: true });
const manifestPath = resolve(outputDir, "manifest.json");
const previousManifest = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, "utf8")) : null;

const durationSeconds = 3;
const fixedGrammar = `Three-second sonic logo. At 0.00 one dry close mark; at 0.45 a second distant mark; from 0.55–1.75 one narrow pitched filament travels between them; at 1.75 contact reveals a compact warm interval; one fine upper resonance continues to the end. Intimate and restrained. No voice, crowd, drums, beat, anthem, notification, sci-fi whoosh or triumph.`;

const candidates = [
  {
    id: "a-human-tactile",
    label: "A · Human / tactile",
    hypothesis: "The connection feels made by hand and emotionally warm without becoming nostalgic.",
    material: "Muted physical taps, a tensioned-string filament and warm woody, low-reed contact.",
  },
  {
    id: "b-forensic-precise",
    label: "B · Forensic / precise",
    hypothesis: "The evidence trail is clearest when the materials are dry, exact and nearly abstract.",
    material: "Dry archive-index ticks, a pure moving partial and compact tuned proof tone; near-silent background.",
  },
  {
    id: "c-temporal-uncanny",
    label: "C · Temporal / uncanny",
    hypothesis: "Distance between eras gives the connection more discovery and wonder.",
    material: "First mark narrow, aged and far; second immediate. Filament briefly reverses before warm contact.",
  },
];

const manifest = {
  purpose: "Initial matched audition of the Two Marks, One Thread sonic mnemonic grammar.",
  provider: "ElevenLabs",
  model: "eleven_text_to_sound_v2",
  endpoint: "/v1/sound-generation",
  durationSeconds,
  outputFormat: "mp3_44100_192",
  promptInfluence: 0.72,
  generatedAt: new Date().toISOString(),
  fixedGrammar,
  decision: {
    status: "selected for refinement",
    candidateId: "a-human-tactile",
    selectedAt: "2026-07-13",
    basis: "Principal blind listen; Candidate A preferred. No rationale inferred.",
    nextTest: "Human/tactile structural refinements holding the material family constant.",
  },
  candidates: [],
};

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

for (const candidate of candidates) {
  const audioPath = resolve(outputDir, `${candidate.id}.mp3`);
  const reviewPath = resolve(outputDir, `${candidate.id}-review.mp3`);
  const prompt = `${fixedGrammar} ${candidate.material}`;
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
        prompt_influence: 0.72,
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

  const audio = readFileSync(audioPath);
  const rawLoudness = measureLoudness(audioPath);
  const reviewGainDb = -16 - Number(rawLoudness.input_i);
  const normalized = spawnSync("ffmpeg", [
    "-y", "-hide_banner", "-loglevel", "error", "-i", audioPath,
    "-af", `volume=${reviewGainDb.toFixed(2)}dB`, "-codec:a", "libmp3lame", "-b:a", "192k", reviewPath,
  ], { encoding: "utf8" });
  if (normalized.status !== 0) throw new Error(`Could not normalize ${candidate.id}: ${normalized.stderr}`);
  const reviewAudio = readFileSync(reviewPath);
  const reviewLoudness = measureLoudness(reviewPath);
  manifest.candidates.push({
    ...candidate,
    prompt,
    file: `public/video/audio/red-thread-mnemonic/${candidate.id}.mp3`,
    sha256: createHash("sha256").update(audio).digest("hex"),
    reviewFile: `public/video/audio/red-thread-mnemonic/${candidate.id}-review.mp3`,
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

const rows = manifest.candidates.map((candidate) => `
      <article>
        <div><span class="id">${candidate.label.slice(0, 1)}</span><h2>Candidate ${candidate.label.slice(0, 1)}</h2></div>
        <audio controls preload="metadata" src="${candidate.id}-review.mp3"></audio>
        <details><summary>Reveal treatment</summary><p><strong>${candidate.label.slice(4)}</strong> — ${candidate.hypothesis}</p></details>
      </article>`).join("");

const index = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Red Thread · sonic mnemonic test</title>
<style>:root{color-scheme:dark;--bg:#0c0b0a;--panel:#161312;--ink:#f3ede8;--dim:#a89c94;--line:#2c2522;--red:#ff3b1f}*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:15px/1.5 Arial,sans-serif}main{width:min(920px,calc(100% - 32px));margin:auto;padding:56px 0 80px}header{border-left:2px solid var(--red);padding-left:20px}h1{font-size:clamp(42px,8vw,78px);line-height:.92;letter-spacing:-.055em;font-weight:500;margin:0 0 18px}header p{max-width:650px;color:var(--dim);font-size:17px}.rows{margin-top:44px;border-top:1px solid var(--line)}article{display:grid;grid-template-columns:180px 1fr;gap:20px;align-items:center;padding:24px 0;border-bottom:1px solid var(--line)}article>div{display:flex;align-items:center;gap:14px}.id{display:grid;place-items:center;width:34px;height:34px;border:1px solid var(--red);border-radius:50%;color:var(--red);font:14px monospace}h2{font-size:16px;font-weight:500;margin:0}audio{width:100%;height:36px;filter:grayscale(1)}details{grid-column:2;color:var(--dim);font-size:13px}summary{cursor:pointer;color:var(--dim)}details p{margin:8px 0 0}.questions{margin-top:38px;padding:24px;background:var(--panel)}h3{margin:0 0 12px;font-size:13px;letter-spacing:.11em;text-transform:uppercase;color:var(--red)}ol{margin:0;padding-left:20px;color:var(--dim)}li+li{margin-top:7px}@media(max-width:650px){main{padding-top:34px}article{grid-template-columns:1fr;gap:12px}details{grid-column:1}}</style>
</head><body><main><header><h1>Two marks.<br>One thread.</h1><p>Three matched executions of one sonic action. Listen once without revealing the treatment. Judge the event you hear before judging the material.</p></header><section class="rows">${rows}</section><section class="questions"><h3>Blind test</h3><ol><li>What happened?</li><li>Which candidate most clearly makes two separate things connect?</li><li>Which feels precise without becoming cold or corporate?</li><li>Which ending feels resolved but still points onward?</li><li>Replay the winner quietly through a phone speaker. Does the action survive?</li></ol></section></main></body></html>\n`;

writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
writeFileSync(resolve(outputDir, "index.html"), index);
process.stdout.write(`Wrote ${candidates.length} candidates, manifest and audition page to ${outputDir}\n`);
