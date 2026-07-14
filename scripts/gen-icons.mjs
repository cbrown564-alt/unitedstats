// Generates the Red Thread app icons from the Threadline mark:
//   app/icon.svg        — vector favicon for modern browsers (sharp at any size)
//   app/favicon.ico     — legacy fallback, a PNG-in-ICO container (16/32/48)
//   app/apple-icon.png  — iOS home-screen touch icon (solid bg, no transparency)
//
// The geometry mirrors components/Brand.tsx's ThreadlineMark exactly.
// Re-run after changing the mark:  node scripts/gen-icons.mjs
import sharp from "sharp";
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const APP = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "app");

const PITCH = "#0c0b0a";
const PANEL = "#161312";
const LINE = "#2c2522";
const DEVIL = "#ff3b1f";
const GOLD = "#d2aa54";

// The mark's interior (everything but the container square), in the 0..58 space
// Brand.tsx draws in. The background argument lets the dark under-strokes erase
// cleanly on both the panel-coloured favicon and the pitch-coloured Apple icon.
const markBody = (background) => `
  <g stroke="${DEVIL}" stroke-width="2.35" stroke-linecap="round" stroke-linejoin="round">
    <path d="M29 8.6C24.1 11.3 18.1 13.3 11.4 14.5C11.6 25.3 12.7 32.7 17.2 38.7C20.3 42.8 24.4 46.1 29 48.7C33.6 46.1 37.7 42.8 40.8 38.7C45.3 32.7 46.4 25.3 46.6 14.5C39.9 13.3 33.9 11.3 29 8.6Z" stroke="${GOLD}"/>
    <path d="M15.2 23.9C20.4 22 25.3 21.9 29.7 23.8C35.2 26.1 38.8 30.9 40.4 36.8" stroke="${GOLD}" opacity=".58"/>
    <path d="M25.6 59.5C25.7 54.3 26.7 50.6 29 47.7C31.1 45 34.3 42.5 36.6 39.3C39.3 35.5 41.2 31.6 41 27.3C40.7 22 37.5 18.6 33 18.3C28.5 18.1 24.9 20.6 24.2 24.2C23.5 27.8 25.6 30.8 29.3 31.5C32.7 32.1 35.6 30 35.9 27.1C36.1 25 35 23.5 33.3 22.9" stroke="${background}" stroke-width="5.9"/>
    <path d="M25.6 59.5C25.7 54.3 26.7 50.6 29 47.7C31.1 45 34.3 42.5 36.6 39.3C39.3 35.5 41.2 31.6 41 27.3C40.7 22 37.5 18.6 33 18.3C28.5 18.1 24.9 20.6 24.2 24.2C23.5 27.8 25.6 30.8 29.3 31.5C32.7 32.1 35.6 30 35.9 27.1C36.1 25 35 23.5 33.3 22.9"/>
    <path d="M27.4 31C29.8 31.9 32.1 31.4 33.8 30" stroke="${background}" stroke-width="5.9"/>
    <path d="M27.4 31C29.8 31.9 32.1 31.4 33.8 30"/>
  </g>`;

// Favicon: the full mark including its rounded-square container (transparent
// outside the corners, as a favicon should be).
const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="58" height="58" viewBox="0 0 58 58" fill="none">
  <rect x="1" y="1" width="56" height="56" rx="14" fill="${PANEL}" stroke="${LINE}" stroke-width="1.5"/>${markBody(PANEL)}
</svg>`;

// Apple touch icon: iOS masks corners itself and dislikes transparency, so drop
// the rounded container, fill the whole square, and inset the mark with a margin.
// translate(32) scale(2) maps the 0..58 mark into a centred 116px box on 180px.
const appleSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180" viewBox="0 0 180 180" fill="none">
  <rect width="180" height="180" fill="${PITCH}"/>
  <g transform="translate(32 32) scale(2)">${markBody(PITCH)}
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
