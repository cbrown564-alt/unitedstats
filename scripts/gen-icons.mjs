// Generates the Red Thread app icons from the Threadline mark:
//   app/icon.svg        — vector favicon for modern browsers (sharp at any size)
//   app/favicon.ico     — legacy fallback, a PNG-in-ICO container (16/32/48)
//   app/apple-icon.png  — iOS home-screen touch icon (solid bg, no transparency)
//
// The geometry mirrors components/Brand.tsx's ThreadlineMark; stroke weights are
// nudged up a touch so the two evidence ticks and the thread survive at 16px.
// Re-run after changing the mark:  node scripts/gen-icons.mjs
import sharp from "sharp";
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const APP = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "app");

const PITCH = "#0c0b0a";
const PANEL = "#161312";
const LINE = "#2c2522";
const INK = "#f3ede8";
const DEVIL = "#ff3b1f";

// The mark's interior (everything but the container square), in the 0..58 space
// Brand.tsx draws in. Thread first, then the pale ticks cross over it, then the
// proof dot resolves at the thread's end.
const markBody = `
  <path d="M12 31C18 22 25 39 31 29C36 21 41 22 46 27" stroke="${DEVIL}" stroke-width="5" stroke-linecap="round"/>
  <path d="M18 17v24M40 17v24" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>
  <circle cx="46" cy="27" r="4.5" fill="${DEVIL}"/>`;

// Favicon: the full mark including its rounded-square container (transparent
// outside the corners, as a favicon should be).
const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="58" height="58" viewBox="0 0 58 58" fill="none">
  <rect x="1" y="1" width="56" height="56" rx="14" fill="${PANEL}" stroke="${LINE}" stroke-width="1.5"/>${markBody}
</svg>`;

// Apple touch icon: iOS masks corners itself and dislikes transparency, so drop
// the rounded container, fill the whole square, and inset the mark with a margin.
// translate(32) scale(2) maps the 0..58 mark into a centred 116px box on 180px.
const appleSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180" viewBox="0 0 180 180" fill="none">
  <rect width="180" height="180" fill="${PITCH}"/>
  <g transform="translate(32 32) scale(2)">${markBody}
  </g>
</svg>`;

/** Pack PNG buffers into an ICO container (modern PNG-in-ICO, all browsers). */
function buildIco(entries) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(entries.length, 4);
  const dir = Buffer.alloc(16 * entries.length);
  let offset = header.length + dir.length;
  entries.forEach((e, i) => {
    const b = i * 16;
    dir.writeUInt8(e.size >= 256 ? 0 : e.size, b); // 0 => 256
    dir.writeUInt8(e.size >= 256 ? 0 : e.size, b + 1);
    dir.writeUInt16LE(1, b + 4); // colour planes
    dir.writeUInt16LE(32, b + 6); // bits per pixel
    dir.writeUInt32LE(e.png.length, b + 8);
    dir.writeUInt32LE(offset, b + 12);
    offset += e.png.length;
  });
  return Buffer.concat([header, dir, ...entries.map((e) => e.png)]);
}

const png = (svg, size, from) =>
  sharp(from ?? Buffer.from(svg))
    .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

// Rasterise the favicon once at high resolution, then downscale for crisp edges.
const faviconHi = await png(faviconSvg, 512);
const icoSizes = [16, 32, 48];
const ico = buildIco(await Promise.all(icoSizes.map(async (size) => ({ size, png: await png(null, size, faviconHi) }))));

writeFileSync(path.join(APP, "icon.svg"), faviconSvg + "\n", "utf8");
writeFileSync(path.join(APP, "favicon.ico"), ico);
writeFileSync(path.join(APP, "apple-icon.png"), await png(appleSvg, 180));

console.log(`wrote app/icon.svg, app/favicon.ico (${icoSizes.join("/")}), app/apple-icon.png`);
