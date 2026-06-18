// Dev-only visual check: screenshot a running page with Playwright/Chromium.
// Usage: node scripts/shot.mjs <url> <outfile> [width] [height] [fullPage]
import { chromium } from "playwright";

const [url = "http://localhost:3990/", out = "shot.png", w = "1280", h = "1400", full = "false"] =
  process.argv.slice(2);

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: Number(w), height: Number(h) },
  deviceScaleFactor: 2,
});
await page.goto(url, { waitUntil: "networkidle" });
await page.screenshot({ path: out, fullPage: full === "true" });
await browser.close();
console.log(`shot -> ${out} (${w}x${h}, full=${full})`);
