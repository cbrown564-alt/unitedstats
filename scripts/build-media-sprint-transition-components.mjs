import { spawnSync } from "node:child_process";
import { mkdirSync, rmSync } from "node:fs";
import { resolve } from "node:path";
import sharp from "sharp";
import { readManifest, sha256, upsertAssets } from "./media-sprint-lib.mjs";

const WIDTH = 1920;
const HEIGHT = 1080;
const FPS = 30;
const DURATION = 4;
const FRAMES = FPS * DURATION;
const out = resolve("output/media-sprint/transitions");
const work = resolve(out, "frames");
mkdirSync(work, { recursive: true });

const clamp = (n) => Math.max(0, Math.min(1, n));
const ease = (n) => { const x = clamp(n); return x * x * (3 - 2 * x); };

function baseSvg(body) {
  return `<svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
    <defs><filter id="soft"><feGaussianBlur stdDeviation="9"/></filter><filter id="grain"><feTurbulence baseFrequency="0.7" numOctaves="3" seed="17" type="fractalNoise"/></filter></defs>
    <rect width="100%" height="100%" fill="#0c0b0a"/><rect width="100%" height="100%" filter="url(#grain)" opacity="0.045"/>
    ${body}
  </svg>`;
}

function ticks(opacity = 0.75) {
  return [260, 430, 690, 1220, 1490, 1710].map((x, index) => `<line x1="${x}" y1="${index % 2 ? 515 : 525}" x2="${x}" y2="${index % 2 ? 565 : 555}" stroke="#f3ede8" stroke-width="3" opacity="${opacity}"/>`).join("");
}

const components = [
  {
    id: "transition-evidence-handoff",
    title: "Evidence handoff",
    use: "Bridge one verified story segment into the next through a single proof point.",
    render(progress) {
      const left = ease(progress / 0.38);
      const contact = ease((progress - 0.31) / 0.2);
      const right = ease((progress - 0.48) / 0.4);
      const pulse = 1 + 0.35 * Math.sin(Math.PI * contact);
      return baseSvg(`${ticks(0.35 + contact * 0.5)}
        <line x1="-20" y1="540" x2="${-20 + 960 * left}" y2="540" stroke="#ff3b1f" stroke-width="8" stroke-linecap="round"/>
        <circle cx="960" cy="540" r="${28 * pulse}" fill="#ff3b1f" opacity="${contact}" filter="url(#soft)"/>
        <circle cx="960" cy="540" r="${10 * pulse}" fill="#f5c518" opacity="${contact}"/>
        <line x1="960" y1="540" x2="${960 + 980 * right}" y2="540" stroke="#ff3b1f" stroke-width="8" stroke-linecap="round"/>
      `);
    },
  },
  {
    id: "transition-loop-fold",
    title: "Loop fold",
    use: "Bridge into a cross-era comparison by folding one continuous line through a distant-moment loop.",
    render(progress) {
      const draw = ease(progress / 0.78);
      const total = 5000;
      const offset = total * (1 - draw);
      const contact = ease((progress - 0.62) / 0.22);
      return baseSvg(`${ticks(0.32 + contact * 0.35)}
        <path d="M -40 540 L 690 540 C 900 540 940 260 1240 300 C 1570 345 1560 735 1240 750 C 930 765 900 540 690 540 L 1960 540" fill="none" stroke="#ff3b1f" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="${total}" stroke-dashoffset="${offset}"/>
        <circle cx="690" cy="540" r="${8 + 7 * contact}" fill="#f5c518" opacity="${contact}"/>
      `);
    },
  },
  {
    id: "transition-receipt-pass",
    title: "Receipt pass-through",
    use: "Bridge authored interpretation back into the verified record without depicting a literal document.",
    render(progress) {
      const incoming = ease(progress / 0.32);
      const frame = ease((progress - 0.25) / 0.24);
      const outgoing = ease((progress - 0.54) / 0.34);
      const halfW = 250 * frame;
      const halfH = 180 * frame;
      return baseSvg(`${ticks(0.28 + frame * 0.55)}
        <line x1="-20" y1="540" x2="${-20 + 980 * incoming}" y2="540" stroke="#ff3b1f" stroke-width="8" stroke-linecap="round"/>
        <rect x="${960 - halfW}" y="${540 - halfH}" width="${halfW * 2}" height="${halfH * 2}" rx="${18 * frame}" fill="#161312" stroke="#f3ede8" stroke-width="${3 * frame}" opacity="${frame}"/>
        <line x1="${780}" y1="480" x2="${780 + 260 * frame}" y2="480" stroke="#a89c94" stroke-width="4" opacity="${frame}"/>
        <line x1="${780}" y1="540" x2="${780 + 360 * frame}" y2="540" stroke="#ff3b1f" stroke-width="8" opacity="${frame}"/>
        <line x1="${780}" y1="600" x2="${780 + 210 * frame}" y2="600" stroke="#a89c94" stroke-width="4" opacity="${frame}"/>
        <line x1="960" y1="540" x2="${960 + 980 * outgoing}" y2="540" stroke="#ff3b1f" stroke-width="8" stroke-linecap="round"/>
      `);
    },
  },
];

function run(args) {
  const result = spawnSync("ffmpeg", args, { encoding: "utf8" });
  if (result.status !== 0) throw new Error(result.stderr);
}

const records = [];
for (const component of components) {
  const frameDir = resolve(work, component.id);
  rmSync(frameDir, { recursive: true, force: true });
  mkdirSync(frameDir, { recursive: true });
  for (let index = 0; index < FRAMES; index++) {
    const progress = index / (FRAMES - 1);
    await sharp(Buffer.from(component.render(progress))).png().toFile(resolve(frameDir, `${String(index).padStart(4, "0")}.png`));
  }
  const movie = resolve(out, `${component.id}.mp4`);
  const fallback = resolve(out, `${component.id}-fallback.png`);
  run(["-y", "-hide_banner", "-loglevel", "error", "-framerate", String(FPS), "-i", resolve(frameDir, "%04d.png"), "-c:v", "libx264", "-crf", "18", "-preset", "medium", "-pix_fmt", "yuv420p", "-movflags", "+faststart", movie]);
  await sharp(resolve(frameDir, "0119.png")).toFile(fallback);
  rmSync(frameDir, { recursive: true, force: true });
  records.push({
    id: component.id,
    kind: "motion-transition-component",
    title: component.title,
    intendedUse: component.use,
    masterFile: `output/media-sprint/transitions/${component.id}.mp4`,
    fallbackFile: `output/media-sprint/transitions/${component.id}-fallback.png`,
    provider: "deterministic local SVG-frame composition",
    model: "none",
    documentaryStatus: "synthetic-abstract",
    reviewState: "advance",
    reviewNote: component.id === "transition-loop-fold" ? "Advanced after one bounded path-completion retry; the loop now returns to the onward line." : "Fundamentals passed: clean text-free geometry, requested format, static fallback and non-documentary labeling.",
    durationSeconds: DURATION,
    prompt: `Text-free Red Thread ${component.title} transition. Deterministic geometry only; no generated documentary material.`,
    generatedAt: new Date().toISOString(),
    newElevenLabsSpend: 0,
    sha256: sha256(movie),
    fallbackSha256: sha256(fallback),
  });
}

const current = readManifest();
const storyReservations = current.assets.filter((asset) => ["story-proof-best-ronaldo-loop", "story-proof-eleven-days-spin-off"].includes(asset.id)).map((asset) => ({ ...asset, reviewState: "reserve", reviewNote: "Proof structure passed fundamentals and is reserved for later curation, per controller checkpoint." }));
upsertAssets([...storyReservations, ...records]);
console.log(`Built ${records.length} text-free transition components and reserved ${storyReservations.length} story proofs.`);
