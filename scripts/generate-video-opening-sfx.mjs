import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

/** Lean opening stem: 1886 → 1954 → year-mark passes → 2008. */
const SAMPLE_RATE = 48_000;
const DURATION = 12;
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

// Travel between signature/year-mark starts: 18→90→165→210→255 (frames / 30).
const threadTravels = [42 / 30, 117 / 30, 162 / 30, 207 / 30];
const threadLandings = [76 / 30, 151 / 30, 196 / 30, 241 / 30];
for (const start of threadTravels) threadRush(start, 34 / 30);
for (const landing of threadLandings) impact(landing, -0.08, 0.055, 54);

// 1886: eleven quiet names assemble.
for (let index = 0; index < 11; index++) tick(0.7 + index * 0.1, -0.72 + index * 0.144, 0.055, 390 + index * 13);
impact(2.0, 0, 0.11, 66);

// 1954: eleven goals accelerate.
for (let index = 0; index < 11; index++) tick(3.1 + index * (0.14 - index * 0.003), -0.78 + index * 0.15, 0.06 + index * 0.003, index % 2 ? 520 : 410);
impact(4.7, 0.2, 0.14, 74);

// 1968 / 1999 year marks: one soft tick each — no trailer proof.
tick(5.55, -0.2, 0.05, 380);
tick(7.05, 0.2, 0.05, 400);

// 2008: shoot-out marks orbit, then resolve.
for (let index = 0; index < 11; index++) tick(8.55 + index * 0.18, index % 2 ? 0.55 : -0.55, 0.065 + index * 0.002, index < 6 ? 500 : 350);
impact(10.7, 0, 0.22, 58);
addTone({ start: 10.72, duration: 1.2, frequency: 293.66, gain: 0.035, release: 1.15, glide: 0.02 });

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
  cues: { firstXi: 0.7, threadTravels, threadLandings, scoreStorm: 3.1, yearMarks: [5.55, 7.05], shootoutResolve: 10.7 },
}, null, 2)}\n`);
process.stdout.write(`Generated ${output} (${DURATION}s stereo, normalized peak ${targetPeak.toFixed(2)})\n`);
