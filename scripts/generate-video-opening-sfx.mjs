import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

/** Hybrid opening stem: 1886 → 1968 ET → 1999 bench → 2008 (18s; 1954 dropped). */
const SAMPLE_RATE = 48_000;
const DURATION = 18;
const CHANNELS = 2;
const samples = SAMPLE_RATE * DURATION;
const left = new Float64Array(samples);
const right = new Float64Array(samples);
const clamp = (value, min = -1, max = 1) => Math.max(min, Math.min(max, value));

function panGains(pan) {
  const angle = ((clamp(pan) + 1) * Math.PI) / 4;
  return [Math.cos(angle), Math.sin(angle)];
}

function addTone({ start, duration, frequency, gain, pan = 0, release = 0.3, glide = 0 }) {
  const from = Math.max(0, Math.floor(start * SAMPLE_RATE));
  const to = Math.min(samples, Math.ceil((start + duration) * SAMPLE_RATE));
  const [gainL, gainR] = panGains(pan);
  let phase = 0;
  for (let index = from; index < to; index++) {
    const local = index / SAMPLE_RATE - start;
    const progress = clamp(local / duration, 0, 1);
    const attack = clamp(local / 0.008, 0, 1);
    const tail = 1 - clamp((local - (duration - release)) / release, 0, 1);
    phase += (Math.PI * 2 * frequency * (1 + glide * progress)) / SAMPLE_RATE;
    const wave = Math.sin(phase) * 0.76 + Math.sin(phase * 2) * 0.18 + Math.sin(phase * 3) * 0.06;
    left[index] += wave * attack * tail * gain * gainL;
    right[index] += wave * attack * tail * gain * gainR;
  }
}

function tick(time, pan, gain = 0.08, pitch = 460) {
  addTone({ start: time, duration: 0.2, frequency: pitch, gain, pan, release: 0.18, glide: -0.34 });
}

function impact(time, pan, gain = 0.2, pitch = 82) {
  addTone({ start: time, duration: 0.82, frequency: pitch, gain, pan, release: 0.78, glide: -0.48 });
  addTone({ start: time + 0.01, duration: 1.1, frequency: pitch * 4.5, gain: gain * 0.18, pan: -pan * 0.3, release: 1.05, glide: -0.18 });
}

function threadRush(start, duration, fromPan = 0.5, toPan = -0.55, gain = 0.022) {
  const from = Math.max(0, Math.floor(start * SAMPLE_RATE));
  const to = Math.min(samples, Math.ceil((start + duration) * SAMPLE_RATE));
  let seed = Math.floor(start * 10_000) + 0x68;
  let smoothedNoise = 0;

  for (let index = from; index < to; index++) {
    const progress = clamp((index / SAMPLE_RATE - start) / duration, 0, 1);
    const envelope = Math.sin(progress * Math.PI) ** 1.7;
    seed = (Math.imul(seed, 1_664_525) + 1_013_904_223) >>> 0;
    const noise = (seed / 0xffffffff) * 2 - 1;
    smoothedNoise += (noise - smoothedNoise) * 0.055;
    const air = smoothedNoise * 0.72 + Math.sin(progress * Math.PI * 13) * 0.08;
    const [gainL, gainR] = panGains(fromPan + (toPan - fromPan) * progress);
    left[index] += air * envelope * gain * gainL;
    right[index] += air * envelope * gain * gainR;
  }
}

// Travel between signature starts: 24→150→285→415 (frames / 30).
const threadTravels = [102 / 30, 237 / 30, 367 / 30];
const threadLandings = [136 / 30, 271 / 30, 401 / 30];
for (const start of threadTravels) threadRush(start, 34 / 30);
for (const landing of threadLandings) impact(landing, -0.08, 0.055, 54);

// 1886: eleven quiet names assemble (start frame 24).
for (let index = 0; index < 11; index++) tick(0.9 + index * 0.14, -0.72 + index * 0.144, 0.055, 390 + index * 13);
impact(2.6, 0, 0.11, 66);

// 1968: level at ninety, then the three extra-time strikes (start frame 150).
addTone({ start: 5.05, duration: 1.45, frequency: 48, gain: 0.07, release: 0.4, glide: 0.08 });
impact(6.1, -0.48, 0.18, 92);
impact(6.38, 0.05, 0.2, 84);
impact(7.0, 0.48, 0.23, 70);

// 1999: two substitute releases (start frame 285).
tick(9.65, -0.35, 0.1, 330);
tick(10.28, 0.35, 0.1, 360);
impact(10.72, -0.4, 0.24, 88);
impact(11.38, 0.4, 0.29, 66);

// 2008: shoot-out marks orbit, then resolve (start frame 415).
for (let index = 0; index < 11; index++) tick(14.0 + index * 0.16, index % 2 ? 0.55 : -0.55, 0.065 + index * 0.002, index < 6 ? 500 : 350);
impact(15.9, 0, 0.22, 58);
addTone({ start: 15.92, duration: 1.2, frequency: 293.66, gain: 0.035, release: 1.15, glide: 0.02 });

let peak = 0;
for (let index = 0; index < samples; index++) {
  left[index] = Math.tanh(left[index] * 1.15) * 0.9;
  right[index] = Math.tanh(right[index] * 1.15) * 0.9;
  peak = Math.max(peak, Math.abs(left[index]), Math.abs(right[index]));
}
const targetPeak = 0.3;
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

const output = resolve("public/video/audio/master-v6-opening-sfx.wav");
mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, buffer);
writeFileSync(resolve("public/video/audio/master-v6-opening-sfx.json"), `${JSON.stringify({
  method: "deterministic procedural synthesis",
  sampleRate: SAMPLE_RATE,
  durationSeconds: DURATION,
  pictureStartSeconds: 0,
  cues: {
    firstXi: 0.9,
    threadTravels,
    threadLandings,
    extraTimeBurst: 6.1,
    benchReversal: 10.72,
    shootoutResolve: 15.9,
  },
}, null, 2)}\n`);
process.stdout.write(`Generated ${output} (${DURATION}s stereo, normalized peak ${targetPeak.toFixed(2)})\n`);
