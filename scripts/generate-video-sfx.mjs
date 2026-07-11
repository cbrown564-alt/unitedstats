import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const SAMPLE_RATE = 48_000;
const DURATION = 18;
const CHANNELS = 2;
const samples = SAMPLE_RATE * DURATION;
const left = new Float64Array(samples);
const right = new Float64Array(samples);

const clamp = (value, min = -1, max = 1) => Math.max(min, Math.min(max, value));
const smooth = (value) => {
  const t = clamp(value, 0, 1);
  return t * t * (3 - 2 * t);
};

function panGains(pan) {
  const angle = ((clamp(pan, -1, 1) + 1) * Math.PI) / 4;
  return [Math.cos(angle), Math.sin(angle)];
}

function addTone({ start, duration, frequency, gain, pan = 0, attack = 0.01, release = 0.3, glide = 0, harmonics = [1] }) {
  const from = Math.max(0, Math.floor(start * SAMPLE_RATE));
  const to = Math.min(samples, Math.ceil((start + duration) * SAMPLE_RATE));
  const [gainL, gainR] = panGains(pan);
  let phase = 0;
  for (let index = from; index < to; index++) {
    const local = index / SAMPLE_RATE - start;
    const progress = clamp(local / duration, 0, 1);
    const attackEnv = smooth(local / attack);
    const releaseEnv = 1 - smooth((local - (duration - release)) / release);
    const envelope = Math.min(attackEnv, releaseEnv);
    phase += (Math.PI * 2 * frequency * (1 + glide * progress)) / SAMPLE_RATE;
    const wave = harmonics.reduce((sum, harmonic, harmonicIndex) => sum + Math.sin(phase * harmonic) / (harmonicIndex + 1), 0) / harmonics.length;
    left[index] += wave * envelope * gain * gainL;
    right[index] += wave * envelope * gain * gainR;
  }
}

let noiseState = 0x19990526;
function randomSigned() {
  noiseState ^= noiseState << 13;
  noiseState ^= noiseState >>> 17;
  noiseState ^= noiseState << 5;
  return ((noiseState >>> 0) / 0xffffffff) * 2 - 1;
}

function addPressureRise({ start, duration, gain }) {
  const from = Math.floor(start * SAMPLE_RATE);
  const to = Math.min(samples, Math.ceil((start + duration) * SAMPLE_RATE));
  let low = 0;
  for (let index = from; index < to; index++) {
    const progress = clamp((index / SAMPLE_RATE - start) / duration, 0, 1);
    low += (randomSigned() - low) * (0.006 + progress * 0.11);
    const envelope = smooth(progress) * (1 - smooth((progress - 0.88) / 0.12));
    const [gainL, gainR] = panGains(-0.32 + progress * 0.64);
    const value = low * envelope * gain;
    left[index] += value * gainL;
    right[index] += value * gainR;
  }
}

function addPulse(time, pan, gain = 0.19) {
  addTone({ start: time, duration: 0.52, frequency: 58, gain, pan, attack: 0.004, release: 0.48, glide: -0.34, harmonics: [1, 2] });
}

function addImpact(time, pan, gain = 0.28, pitch = 76) {
  addTone({ start: time, duration: 0.86, frequency: pitch, gain, pan, attack: 0.003, release: 0.82, glide: -0.46, harmonics: [1, 2, 3] });
  addTone({ start: time + 0.008, duration: 1.45, frequency: pitch * 4.1, gain: gain * 0.28, pan: -pan * 0.35, attack: 0.003, release: 1.4, glide: -0.12, harmonics: [1, 2] });
}

// The three nights tighten: restrained pulse, heavier release, shorter recovery.
[0.45, 1.35, 2.18, 3.02].forEach((time, index) => addPulse(time, -0.35 + index * 0.22, 0.12 + index * 0.018));
addPressureRise({ start: 3.3, duration: 1.9, gain: 0.12 });
addImpact(5.3, -0.34, 0.23, 84);

[6.35, 7.15, 7.88, 8.52].forEach((time, index) => addPulse(time, -0.22 + index * 0.15, 0.14 + index * 0.02));
addPressureRise({ start: 8.7, duration: 0.85, gain: 0.15 });
addImpact(9.5, 0.08, 0.27, 78);

// Barcelona: harmonic space drops away at 90:00, pressure narrows, two releases.
addTone({ start: 9.72, duration: 2.9, frequency: 46, gain: 0.12, attack: 0.4, release: 0.22, glide: 0.09, harmonics: [1, 2] });
[9.9, 10.55, 11.13, 11.63, 12.04].forEach((time, index) => addPulse(time, index % 2 ? 0.18 : -0.18, 0.13 + index * 0.018));
addPressureRise({ start: 9.65, duration: 2.88, gain: 0.23 });
addImpact(12.55, -0.42, 0.31, 92);
addImpact(13.3, 0.42, 0.38, 68);
addTone({ start: 13.3, duration: 2.7, frequency: 293.66, gain: 0.055, attack: 0.006, release: 2.55, harmonics: [1, 2, 3] });
addImpact(14.65, 0, 0.22, 54);

let peak = 0;
for (let index = 0; index < samples; index++) {
  left[index] = Math.tanh(left[index] * 1.18) * 0.9;
  right[index] = Math.tanh(right[index] * 1.18) * 0.9;
  peak = Math.max(peak, Math.abs(left[index]), Math.abs(right[index]));
}
const targetPeak = 0.34;
const normalization = peak > 0 ? targetPeak / peak : 1;

const bytesPerSample = 2;
const dataSize = samples * CHANNELS * bytesPerSample;
const buffer = Buffer.alloc(44 + dataSize);
buffer.write("RIFF", 0);
buffer.writeUInt32LE(36 + dataSize, 4);
buffer.write("WAVE", 8);
buffer.write("fmt ", 12);
buffer.writeUInt32LE(16, 16);
buffer.writeUInt16LE(1, 20);
buffer.writeUInt16LE(CHANNELS, 22);
buffer.writeUInt32LE(SAMPLE_RATE, 24);
buffer.writeUInt32LE(SAMPLE_RATE * CHANNELS * bytesPerSample, 28);
buffer.writeUInt16LE(CHANNELS * bytesPerSample, 32);
buffer.writeUInt16LE(bytesPerSample * 8, 34);
buffer.write("data", 36);
buffer.writeUInt32LE(dataSize, 40);
for (let index = 0; index < samples; index++) {
  buffer.writeInt16LE(Math.round(clamp(left[index] * normalization) * 32767), 44 + index * 4);
  buffer.writeInt16LE(Math.round(clamp(right[index] * normalization) * 32767), 46 + index * 4);
}

const output = resolve("public/video/audio/master-v5-sfx.wav");
mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, buffer);
writeFileSync(
  resolve("public/video/audio/master-v5-sfx.json"),
  `${JSON.stringify({ method: "deterministic procedural synthesis", sampleRate: SAMPLE_RATE, durationSeconds: DURATION, pictureStartSeconds: 36, cues: { leagueRelease: 41.3, cupRelease: 45.5, europeanEqualiser: 48.55, europeanWinner: 49.3, treblePayoff: 50.65 } }, null, 2)}\n`,
);
process.stdout.write(`Generated ${output} (${DURATION}s stereo, normalized peak ${targetPeak.toFixed(2)})\n`);
