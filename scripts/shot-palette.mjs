// Dev-only visual check: screenshot a page under an alternate result-colour
// palette, optionally through a deuteranopia simulation filter. Overrides the
// Tailwind @theme tokens at runtime (no source changes), so the real components
// render with swapped win/draw/loss colours.
//
// Usage: node scripts/shot-palette.mjs <url> <out> <palette> <deuter> [w] [h] [scrollY]
//   palette: current | A | C
//   deuter:  true | false
import { chromium } from "playwright";

const [
  url = "http://localhost:3000/",
  out = "shot.png",
  palette = "current",
  deuter = "false",
  w = "1280",
  h = "900",
  scrollY = "0",
] = process.argv.slice(2);

// A — "Red is United": win = bright United red, loss = cold recessive slate-blue,
//     draw = unchanged neutral. Red becomes consistently positive; green retired.
// C — "Lightness-first": near-monochrome warm ramp, win lightest, loss darkest;
//     hue carries nothing, so it survives greyscale and every CVD type.
const PALETTES = {
  current: {},
  A: { "--color-win": "#f4452a", "--color-loss": "#3f618c", "--color-draw": "#b9aa9f" },
  C: { "--color-win": "#ddd0c2", "--color-loss": "#52473f", "--color-draw": "#8a7d72" },
};

const vars = PALETTES[palette] ?? {};
const cssVars = Object.entries(vars)
  .map(([k, v]) => `${k}: ${v} !important;`)
  .join(" ");

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: Number(w), height: Number(h) },
  deviceScaleFactor: 2,
});
await page.goto(url, { waitUntil: "networkidle" });

if (cssVars) {
  await page.addStyleTag({ content: `:root, :host { ${cssVars} }` });
}

if (deuter === "true") {
  // Machado/Brettel deuteranopia colour-matrix, applied to the whole document.
  await page.evaluate(() => {
    const NS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(NS, "svg");
    svg.setAttribute("style", "position:absolute;width:0;height:0");
    svg.innerHTML =
      '<filter id="deut"><feColorMatrix type="matrix" values="' +
      "0.625 0.375 0 0 0  0.70 0.30 0 0 0  0 0.30 0.70 0 0  0 0 0 1 0" +
      '"/></filter>';
    document.body.appendChild(svg);
    document.documentElement.style.filter = "url(#deut)";
  });
}

if (Number(scrollY) > 0) {
  await page.evaluate((y) => window.scrollTo(0, y), Number(scrollY));
  await page.waitForTimeout(250);
}

await page.screenshot({ path: out });
await browser.close();
console.log(`shot -> ${out} (${palette}${deuter === "true" ? " +deuter" : ""})`);
