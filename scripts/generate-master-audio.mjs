import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const SAMPLE_RATE = 48_000;
const DURATION = 84;
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

function env(t, start, duration, attack = 0.03, release = 0.4) {
  if (t < start || t > start + duration) return 0;
  const local = t - start;
  const up = smooth(local / Math.max(attack, 0.001));
  const down = 1 - smooth((local - (duration - release)) / Math.max(release, 0.001));
  return Math.min(up, down);
}

function pan(p) {
  const angle = ((clamp(p, -1, 1) + 1) * Math.PI) / 4;
  return [Math.cos(angle), Math.sin(angle)];
}

function tone({ start, duration, frequency, gain, position = 0, attack = 0.03, release = 0.4, glide = 0, harmonics = [1] }) {
  const [gainL, gainR] = pan(position);
  const from = Math.max(0, Math.floor(start * SAMPLE_RATE));
  const to = Math.min(samples, Math.ceil((start + duration) * SAMPLE_RATE));
  let phase = 0;
  for (let i = from; i < to; i++) {
    const t = i / SAMPLE_RATE;
    const progress = (t - start) / duration;
    phase += (Math.PI * 2 * frequency * (1 + glide * progress)) / SAMPLE_RATE;
    let wave = 0;
    harmonics.forEach((harmonic, index) => {
      wave += Math.sin(phase * harmonic) / (index + 1);
    });
    const value = (wave / harmonics.length) * env(t, start, duration, attack, release) * gain;
    left[i] += value * gainL;
    right[i] += value * gainR;
  }
}

let noiseState = 0x18862008;
function random() {
  noiseState ^= noiseState << 13;
  noiseState ^= noiseState >>> 17;
  noiseState ^= noiseState << 5;
  return ((noiseState >>> 0) / 0xffffffff) * 2 - 1;
}

function sweep({ start, duration, gain, fromPan = -0.7, toPan = 0.7, reverse = false }) {
  const from = Math.floor(start * SAMPLE_RATE);
  const to = Math.min(samples, Math.ceil((start + duration) * SAMPLE_RATE));
  let low = 0;
  for (let i = from; i < to; i++) {
    const t = i / SAMPLE_RATE;
    const progress = clamp((t - start) / duration, 0, 1);
    const shaped = reverse ? 1 - progress : progress;
    const envelope = smooth(progress / 0.68) * (1 - smooth((progress - 0.78) / 0.22));
    low += (random() - low) * (0.008 + shaped * 0.17);
    const value = low * envelope * gain;
    const [gainL, gainR] = pan(fromPan + (toPan - fromPan) * progress);
    left[i] += value * gainL;
    right[i] += value * gainR;
  }
}

function impact(time, position = 0, pitch = 82, gain = 0.2) {
  tone({ start: time, duration: 0.8, frequency: pitch, gain, position, attack: 0.003, release: 0.76, glide: -0.42, harmonics: [1, 2, 3] });
  tone({ start: time + 0.01, duration: 1.8, frequency: pitch * 4.01, gain: gain * 0.25, position, attack: 0.004, release: 1.72, glide: -0.08, harmonics: [1, 2] });
}

// One bowed-wire bed across the whole film. New acts alter its overtones rather
// than introducing unrelated music systems.
tone({ start: 0, duration: 84, frequency: 41.2, gain: 0.075, attack: 1.8, release: 3.2, harmonics: [1, 2, 3] });
tone({ start: 0.4, duration: 83, frequency: 61.74, gain: 0.047, position: -0.26, attack: 2.4, release: 3, glide: 0.02, harmonics: [1, 2] });
tone({ start: 1.2, duration: 81.8, frequency: 82.41, gain: 0.037, position: 0.28, attack: 3.5, release: 3.4, glide: -0.014, harmonics: [1, 2] });

// 1886 → 2008: the line gathers speed and the three European knots ring warmer.
impact(1.3, -0.68, 108, 0.18);
impact(4.5, -0.38, 99, 0.17);
impact(7.8, -0.08, 92, 0.18);
sweep({ start: 7.9, duration: 8.7, gain: 0.13, fromPan: -0.78, toPan: 0.74 });
impact(11.0, 0.12, 74, 0.22);
impact(13.8, 0.42, 69, 0.24);
impact(16.4, 0.68, 65, 0.28);

// 2008 loops backwards to 1968. The reverse-pan sweep makes the chronology
// audible before the four rhyme facts land.
sweep({ start: 17.2, duration: 6.0, gain: 0.2, fromPan: 0.78, toPan: -0.78, reverse: true });
impact(22.6, -0.62, 61, 0.3);
[25.2, 28.2, 31.2, 34.0].forEach((time, index) => {
  impact(time, index % 2 === 0 ? -0.22 : 0.22, 116 + index * 9, 0.15 + index * 0.015);
});
tone({ start: 22.5, duration: 13.8, frequency: 164.81, gain: 0.045, attack: 1.2, release: 2.4, harmonics: [1, 2, 3] });

// 1999 pocket: three must-wins. The pulse tightens but remains made from the
// same wire/impact palette.
sweep({ start: 35.2, duration: 3.2, gain: 0.18, fromPan: -0.1, toPan: 0.1 });
impact(37.0, 0, 58, 0.3);
[39.4, 43.2, 47.0].forEach((time, index) => {
  impact(time, [-0.55, 0, 0.55][index], 86 + index * 8, 0.24);
  tone({ start: time + 0.05, duration: 2.4, frequency: 220 + index * 27.5, gain: 0.035, position: [-0.55, 0, 0.55][index], release: 2.2, harmonics: [1, 2] });
});
impact(50.8, 0, 54, 0.34);

// Fergie time: dry clock ticks resolve into three impacts, then dissolve into a
// high constellation shimmer.
for (let time = 53.0; time < 58.5; time += 0.5) {
  tone({ start: time, duration: 0.08, frequency: 1320, gain: 0.045, position: time % 1 === 0 ? -0.2 : 0.2, attack: 0.001, release: 0.065, harmonics: [1, 2] });
}
[54.2, 57.1, 60.2].forEach((time, index) => impact(time, [-0.5, 0, 0.5][index], 72, 0.24));
sweep({ start: 60.0, duration: 7.3, gain: 0.16, fromPan: 0.52, toPan: -0.52 });
for (let i = 0; i < 24; i++) {
  const time = 62.1 + i * 0.19;
  tone({ start: time, duration: 1.3, frequency: 310 + ((i * 47) % 520), gain: 0.012, position: ((i * 37) % 100) / 50 - 1, attack: 0.01, release: 1.2, harmonics: [1] });
}

// Fortress: the constellation becomes mass and place.
impact(68.0, 0, 43, 0.36);
tone({ start: 68.0, duration: 10.0, frequency: 55, gain: 0.06, attack: 0.8, release: 2.4, harmonics: [1, 2, 3, 4] });
[70.3, 72.8, 75.2].forEach((time, index) => impact(time, [-0.45, 0, 0.45][index], 96, 0.17));

// The record opens. Harmonics widen, then leave an unresolved tail beyond now.
sweep({ start: 76.4, duration: 4.0, gain: 0.18, fromPan: -0.65, toPan: 0.65 });
impact(79.2, 0, 49, 0.34);
tone({ start: 78.5, duration: 5.4, frequency: 123.47, gain: 0.06, position: -0.25, attack: 0.8, release: 2.5, harmonics: [1, 2, 3] });
tone({ start: 78.8, duration: 5.1, frequency: 185, gain: 0.045, position: 0.25, attack: 0.9, release: 2.5, harmonics: [1, 2] });

let peak = 0;
for (let i = 0; i < samples; i++) {
  left[i] = Math.tanh(left[i] * 1.24) * 0.92;
  right[i] = Math.tanh(right[i] * 1.24) * 0.92;
  peak = Math.max(peak, Math.abs(left[i]), Math.abs(right[i]));
}

// The longer master has more quiet connective tissue than the 14-second study.
// Normalise its authored mix higher so the final 0.88 composition gain lands
// around -19 LUFS with roughly 1.5 dB of true-peak headroom.
const targetPeak = 0.95;
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

const output = resolve("public/video/audio/master-v2.wav");
mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, buffer);
process.stdout.write(`Generated ${output} (${DURATION}s stereo, normalized peak ${targetPeak.toFixed(2)})\n`);
