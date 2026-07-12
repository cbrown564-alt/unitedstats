import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

/**
 * Lean body stem: rhyme + Fergie + close.
 * Silent during 0–18s (opening) and ~28.7–47.3s (Treble; other stem owns that).
 */
const SAMPLE_RATE = 48_000;
const DURATION = 68;
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

let noiseState = 0x19682008;
function randomSigned() {
  noiseState ^= noiseState << 13;
  noiseState ^= noiseState >>> 17;
  noiseState ^= noiseState << 5;
  return ((noiseState >>> 0) / 0xffffffff) * 2 - 1;
}

function filament(start, duration, gain = 0.04, fromPan = -0.4, toPan = 0.4) {
  const from = Math.max(0, Math.floor(start * SAMPLE_RATE));
  const to = Math.min(samples, Math.ceil((start + duration) * SAMPLE_RATE));
  let low = 0;
  let mid = 0;
  for (let index = from; index < to; index++) {
    const progress = clamp((index / SAMPLE_RATE - start) / duration, 0, 1);
    low += (randomSigned() - low) * 0.008;
    mid += (randomSigned() - mid) * 0.04;
    const envelope = Math.sin(progress * Math.PI) ** 1.35;
    const [gainL, gainR] = panGains(fromPan + (toPan - fromPan) * progress);
    const value = (low * 0.7 + mid * 0.3) * envelope * gain;
    left[index] += value * gainL;
    right[index] += value * gainR;
  }
}

function pressure(start, duration, gain) {
  const from = Math.floor(start * SAMPLE_RATE);
  const to = Math.min(samples, Math.ceil((start + duration) * SAMPLE_RATE));
  let low = 0;
  for (let index = from; index < to; index++) {
    const progress = clamp((index / SAMPLE_RATE - start) / duration, 0, 1);
    low += (randomSigned() - low) * (0.005 + progress * 0.1);
    const envelope = smooth(progress) * (1 - smooth((progress - 0.86) / 0.14));
    const [gainL, gainR] = panGains(-0.28 + progress * 0.56);
    const value = low * envelope * gain;
    left[index] += value * gainL;
    right[index] += value * gainR;
  }
}

function tick(time, pan, gain = 0.07, pitch = 440) {
  addTone({ start: time, duration: 0.18, frequency: pitch, gain, pan, attack: 0.004, release: 0.16, glide: -0.3, harmonics: [1, 2] });
}

function impact(time, pan, gain = 0.22, pitch = 76) {
  addTone({ start: time, duration: 0.82, frequency: pitch, gain, pan, attack: 0.003, release: 0.78, glide: -0.46, harmonics: [1, 2, 3] });
  addTone({ start: time + 0.008, duration: 1.2, frequency: pitch * 4.2, gain: gain * 0.22, pan: -pan * 0.35, attack: 0.003, release: 1.15, glide: -0.14, harmonics: [1, 2] });
}

function clockTick(time, pan, gain = 0.05) {
  addTone({ start: time, duration: 0.09, frequency: 1180, gain, pan, attack: 0.001, release: 0.08, glide: -0.12, harmonics: [1] });
  addTone({ start: time, duration: 0.14, frequency: 210, gain: gain * 0.55, pan, attack: 0.001, release: 0.12, glide: -0.4, harmonics: [1] });
}

const cues = {
  rhymeEnter: 16.0,
  rhymeFacts: [21.67, 25.0],
  rhymeExit: 29.0,
  fergieClock: 45.67,
  fergieEchoes: [46.6, 48.1, 49.6],
  fergieBloom: 52.0,
  receiptLand: 61.3,
  ctaResolve: 62.7,
};

// --- Rhyme loop (~16–30s): filament circle, two landed facts, exit to 1999 ---
filament(cues.rhymeEnter, 4.2, 0.038, 0.55, -0.55);
addTone({ start: cues.rhymeEnter + 0.2, duration: 6.5, frequency: 73, gain: 0.035, attack: 0.8, release: 2.2, glide: 0.04, harmonics: [1, 2] });
cues.rhymeFacts.forEach((time, index) => {
  tick(time, index % 2 ? 0.42 : -0.42, 0.08, 360 + index * 28);
  impact(time + 0.08, index % 2 ? 0.2 : -0.2, 0.12 + index * 0.015, 88 - index * 6);
});
filament(cues.rhymeExit, 2.2, 0.045, -0.2, 0.15);
impact(cues.rhymeExit + 2.0, 0, 0.16, 62);

// --- Fergie clock (~46–59s): tape tension, three echoes, late-goal bloom ---
pressure(cues.fergieClock, 5.2, 0.18);
for (let index = 0; index < 14; index++) {
  const t = cues.fergieClock + 0.3 + index * 0.3;
  clockTick(t, index % 2 ? 0.22 : -0.22, 0.028 + Math.min(0.04, index * 0.002));
}
cues.fergieEchoes.forEach((time, index) => {
  impact(time, -0.4 + index * 0.4, 0.2 + index * 0.03, 96 - index * 10);
  tick(time + 0.12, 0.35 - index * 0.2, 0.07, 520 - index * 40);
});
filament(cues.fergieBloom, 3.2, 0.05, -0.5, 0.5);
impact(cues.fergieBloom + 0.15, 0, 0.18, 54);
for (let index = 0; index < 12; index++) tick(cues.fergieBloom + 0.35 + index * 0.16, -0.7 + index * 0.12, 0.035, 480 + (index % 5) * 35);

// --- Close (~57–68s): field settle, receipt land, CTA ---
filament(57.5, 2.8, 0.028, 0.4, -0.25);
pressure(59.2, 1.2, 0.1);
impact(cues.receiptLand, -0.15, 0.2, 64);
addTone({ start: cues.receiptLand, duration: 2.2, frequency: 196, gain: 0.04, attack: 0.02, release: 2.0, harmonics: [1, 2, 3] });
impact(cues.ctaResolve, 0.1, 0.15, 88);
addTone({ start: cues.ctaResolve, duration: 1.6, frequency: 392, gain: 0.03, attack: 0.01, release: 1.45, harmonics: [1, 2] });

let peak = 0;
for (let index = 0; index < samples; index++) {
  left[index] = Math.tanh(left[index] * 1.16) * 0.9;
  right[index] = Math.tanh(right[index] * 1.16) * 0.9;
  peak = Math.max(peak, Math.abs(left[index]), Math.abs(right[index]));
}
const targetPeak = 0.32;
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

const output = resolve("public/video/audio/master-v6-body-sfx.wav");
mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, buffer);
writeFileSync(
  resolve("public/video/audio/master-v6-body-sfx.json"),
  `${JSON.stringify({
    method: "deterministic procedural synthesis",
    sampleRate: SAMPLE_RATE,
    durationSeconds: DURATION,
    pictureStartSeconds: 0,
    silentRangesSeconds: [[0, 18], [28.7, 47.3]],
    cues,
  }, null, 2)}\n`,
);
process.stdout.write(`Generated ${output} (${DURATION}s stereo, normalized peak ${targetPeak.toFixed(2)})\n`);
