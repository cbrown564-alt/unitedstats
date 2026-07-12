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
const outputDir = resolve("public/video/audio/elevenlabs-bakeoff");
mkdirSync(outputDir, { recursive: true });

const common = `Instrumental underscore for a premium cinematic data documentary about Manchester United history. This is a 30-second audition spanning an eleven-day Treble run into tense late-goal match clocks. The moving red data filament is the protagonist. Preserve space for on-screen facts. Begin with controlled forward motion, make three increasingly weighty fact landings, then strip back into late-pressure negative space and a precise release. End unresolved so it can continue into the next act. No vocals, speech, choir, crowd, chants, commentary, whistles, football anthem, rock guitar, heroic brass, trailer braams, EDM drop, sentimental strings, or victory fanfare.`;

const candidates = [
  {
    id: "a-analogue-forensic",
    label: "Analogue forensic",
    hypothesis: "Best brand fit: tactile, precise, archival and contemporary without becoming nostalgic.",
    prompt: `${common} 82 BPM, dark warm tonality. Restrained prepared-piano ticks, muted frame drum, warm sub pulse, bowed-wire harmonics, granular tape movement, dry close detail and deep stereo air. Minimal motif, asymmetric accents, emotionally exact, never grand.`,
  },
  {
    id: "b-data-pulse",
    label: "Data pulse",
    hypothesis: "Best motion fit: makes charts and the red thread feel computational and propulsive.",
    prompt: `${common} 96 BPM. Minimal modular synth pulses, soft clock-divided percussion, rounded electronic bass, tiny glitch articulations and filtered noise. Clean editorial technology aesthetic, crisp transients, restrained harmony, no cyberpunk aggression and no dance groove.`,
  },
  {
    id: "c-archive-mechanical",
    label: "Archive mechanical",
    hypothesis: "Best sound-world fit: blurs score and sound design using material, historical textures.",
    prompt: `${common} 76 BPM. Music made from subtle paper movement, projector mechanics, pencil taps, distant metal resonance, low room tone and sparse felt piano. Musique-concrete documentary texture with a quiet tonal spine. Intimate museum-installation quality, tactile and human, never spooky.`,
  },
  {
    id: "d-human-momentum",
    label: "Human momentum",
    hypothesis: "Best emotional fit: adds warmth and sporting stakes while testing the cliché boundary.",
    prompt: `${common} 88 BPM. Hand-played low toms with brushes, muted upright bass pulse, felt piano and restrained tremolo strings used as texture only. Human microtiming, grounded physical momentum, quiet confidence, documentary realism, no anthem and no triumphal cadence.`,
  },
];

const manifest = {
  provider: "ElevenLabs",
  model: "music_v2",
  durationSeconds: 30,
  auditionWindow: "00:38-01:08",
  generatedAt: new Date().toISOString(),
  candidates: [],
};

for (const candidate of candidates) {
  const audioPath = resolve(outputDir, `${candidate.id}.mp3`);
  if (!existsSync(audioPath) || force) {
    console.log(`Generating ${candidate.id}…`);
    const response = await fetch("https://api.elevenlabs.io/v1/music?output_format=mp3_48000_192", {
      method: "POST",
      headers: { "xi-api-key": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: candidate.prompt,
        music_length_ms: 30000,
        model_id: "music_v2",
        force_instrumental: true,
        sign_with_c2pa: true,
      }),
    });
    if (!response.ok) throw new Error(`${candidate.id} failed (${response.status}): ${await response.text()}`);
    writeFileSync(audioPath, Buffer.from(await response.arrayBuffer()));
  } else {
    console.log(`Using cached ${candidate.id}`);
  }
  manifest.candidates.push({ ...candidate, file: `public/video/audio/elevenlabs-bakeoff/${candidate.id}.mp3` });
}

writeFileSync(resolve(outputDir, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Wrote ${candidates.length} candidates and manifest to ${outputDir}`);
