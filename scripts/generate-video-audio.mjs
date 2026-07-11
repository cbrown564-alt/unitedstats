import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const SAMPLE_RATE = 48_000;
const DURATION = 14;
const CHANNELS = 2;
const samples = SAMPLE_RATE * DURATION;
const left = new Float64Array(samples);
const right = new Float64Array(samples);

function clamp(value, min = -1, max = 1) {
  return Math.max(min, Math.min(max, value));
}

function smooth(value) {
  const t = clamp(value, 0, 1);
  return t * t * (3 - 2 * t);
}

function envelope(t, start, attack, hold, release) {
  if (t < start || t >= start + attack + hold + release) return 0;
  if (t < start + attack) return smooth((t - start) / attack);
  if (t < start + attack + hold) return 1;
  return 1 - smooth((t - start - attack - hold) / release);
}

function panGains(pan) {
  const angle = ((clamp(pan, -1, 1) + 1) * Math.PI) / 4;
  return [Math.cos(angle), Math.sin(angle)];
}

function addTone({ start, duration, frequency, gain, pan = 0, attack = 0.02, release = 0.3, glide = 0, harmonics = [1] }) {
  const [gainL, gainR] = panGains(pan);
  const from = Math.max(0, Math.floor(start * SAMPLE_RATE));
  const to = Math.min(samples, Math.ceil((start + duration) * SAMPLE_RATE));
  let phase = 0;
  for (let i = from; i < to; i++) {
    const t = i / SAMPLE_RATE;
    const local = t - start;
    const progress = local / duration;
    const freq = frequency * (1 + glide * progress);
    phase += (Math.PI * 2 * freq) / SAMPLE_RATE;
    const env = envelope(t, start, attack, Math.max(0, duration - attack - release), release);
    let value = 0;
    harmonics.forEach((harmonic, index) => {
      value += Math.sin(phase * harmonic) / (index + 1);
    });
    value = (value / harmonics.length) * env * gain;
    left[i] += value * gainL;
    right[i] += value * gainR;
  }
}

let noiseState = 0x7151968;
function randomSigned() {
  noiseState ^= noiseState << 13;
  noiseState ^= noiseState >>> 17;
  noiseState ^= noiseState << 5;
  return ((noiseState >>> 0) / 0xffffffff) * 2 - 1;
}

function addWhoosh({ start, duration, gain, panFrom = -0.5, panTo = 0.5 }) {
  const from = Math.max(0, Math.floor(start * SAMPLE_RATE));
  const to = Math.min(samples, Math.ceil((start + duration) * SAMPLE_RATE));
  let low = 0;
  for (let i = from; i < to; i++) {
    const t = i / SAMPLE_RATE;
    const local = t - start;
    const progress = clamp(local / duration, 0, 1);
    const rise = smooth(progress / 0.72);
    const fall = 1 - smooth((progress - 0.72) / 0.28);
    const env = rise * fall;
    const cutoff = 0.012 + progress * 0.16;
    low += (randomSigned() - low) * cutoff;
    const value = low * env * gain;
    const [gainL, gainR] = panGains(panFrom + (panTo - panFrom) * progress);
    left[i] += value * gainL;
    right[i] += value * gainR;
  }
}

function addImpact(time, pan, pitch = 88, gain = 0.22) {
  addTone({ start: time, duration: 0.72, frequency: pitch, gain, pan, attack: 0.004, release: 0.68, glide: -0.43, harmonics: [1, 2, 3] });
  addTone({ start: time + 0.012, duration: 1.6, frequency: pitch * 4.02, gain: gain * 0.34, pan, attack: 0.003, release: 1.54, glide: -0.08, harmonics: [1, 2] });
}

// Continuous bowed-wire bed: intimate at the start, widening as the years fold.
addTone({ start: 0, duration: 14, frequency: 55, gain: 0.105, attack: 1.1, release: 1.2, harmonics: [1, 2, 3] });
addTone({ start: 0.4, duration: 13.2, frequency: 82.41, gain: 0.052, pan: -0.22, attack: 1.8, release: 1.5, harmonics: [1, 2] });
addTone({ start: 1.3, duration: 12.1, frequency: 110, gain: 0.038, pan: 0.28, attack: 2.2, release: 1.6, glide: 0.025, harmonics: [1] });

// Archive knots.
addImpact(1.35, -0.66, 104, 0.19);
addImpact(3.08, 0.12, 92, 0.22);
addWhoosh({ start: 3.35, duration: 2.4, gain: 0.2, panFrom: -0.7, panTo: 0.72 });

// The forty-year span stretches and begins to bend.
addTone({ start: 5.0, duration: 4.8, frequency: 164.81, gain: 0.035, pan: -0.46, attack: 0.7, release: 1.1, glide: 0.16, harmonics: [1, 2] });
addTone({ start: 5.35, duration: 4.6, frequency: 164.81, gain: 0.035, pan: 0.46, attack: 0.7, release: 1.1, glide: -0.08, harmonics: [1, 2] });
addImpact(5.62, -0.58, 120, 0.15);
addImpact(6.64, 0.58, 120, 0.15);
addWhoosh({ start: 7.0, duration: 3.1, gain: 0.17, panFrom: 0.55, panTo: -0.2 });

// Shared seven lands; two final-goal receipts answer it.
addImpact(10.78, 0, 62, 0.34);
addTone({ start: 10.76, duration: 3.0, frequency: 329.63, gain: 0.06, pan: 0, attack: 0.015, release: 2.65, harmonics: [1, 2, 3] });
addImpact(12.04, -0.5, 146, 0.18);
addImpact(12.46, 0.5, 146, 0.18);

// Gentle limiting and WAV interleave.
let peak = 0;
for (let i = 0; i < samples; i++) {
  left[i] = Math.tanh(left[i] * 1.22) * 0.92;
  right[i] = Math.tanh(right[i] * 1.22) * 0.92;
  peak = Math.max(peak, Math.abs(left[i]), Math.abs(right[i]));
}

// Leave roughly 4 dB of headroom after the composition's 0.88 volume, while
// bringing the designed bed into a useful web-playback range. The synthesis is
// deterministic, so this gain is stable across every render.
const targetPeak = 0.72;
const normalization = peak > 0 ? targetPeak / peak : 1;
for (let i = 0; i < samples; i++) {
  left[i] *= normalization;
  right[i] *= normalization;
}

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

for (let i = 0; i < samples; i++) {
  buffer.writeInt16LE(Math.round(clamp(left[i]) * 32767), 44 + i * 4);
  buffer.writeInt16LE(Math.round(clamp(right[i]) * 32767), 46 + i * 4);
}

const output = resolve("public/video/audio/loop-prototype.wav");
mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, buffer);
process.stdout.write(`Generated ${output} (${DURATION}s stereo, normalized peak ${targetPeak.toFixed(2)})\n`);
