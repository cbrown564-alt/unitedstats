// Dev-only visual check for scroll-driven stages (e.g. /journey): screenshot a
// running page after scrolling to a given Y, so sticky-stage phases can be
// captured. Sibling of shot.mjs.
// Usage: node scripts/shot-scroll.mjs <url> <outfile> [width] [height] [scrollY]
import { chromium } from "playwright";

const [url = "http://localhost:3990/", out = "shot.png", w = "1280", h = "900", y = "0"] =
  process.argv.slice(2);

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: Number(w), height: Number(h) },
  deviceScaleFactor: 2,
});
await page.goto(url, { waitUntil: "networkidle" });
await page.evaluate((yy) => window.scrollTo(0, yy), Number(y));
await page.waitForTimeout(450);
await page.screenshot({ path: out });
await browser.close();
console.log(`shot -> ${out} (${w}x${h}, y=${y})`);
