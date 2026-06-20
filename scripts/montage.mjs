// Dev-only: stitch palette variants into labeled side-by-side comparison strips.
import { chromium } from "playwright";
import { writeFileSync } from "node:fs";
import path from "node:path";

const dir = path.resolve("design-mocks");
// Relative src so the on-disk HTML loads images same-origin (file://).
const fileUrl = (f) => f;

const STRIPS = [
  {
    out: "compare_skyline.png",
    title: "HistorySkyline (home hero) — normal vision",
    cols: [
      ["Current (green / grey / red)", "home_current.png"],
      ["A — Red is United (red / grey / slate)", "home_A.png"],
      ["C — Lightness-first (mono ramp)", "home_C.png"],
    ],
  },
  {
    out: "compare_skyline_deuter.png",
    title: "HistorySkyline — deuteranopia simulation",
    cols: [
      ["Current", "home_current_d.png"],
      ["A — Red is United", "home_A_d.png"],
      ["C — Lightness-first", "home_C_d.png"],
    ],
  },
  {
    out: "compare_managers.png",
    title: "ManagerTimeline (managers hero) — normal vision",
    cols: [
      ["Current", "mgr_current.png"],
      ["A — Red is United", "mgr_A.png"],
      ["C — Lightness-first", "mgr_C.png"],
    ],
  },
  {
    out: "compare_spine.png",
    title: "ResultSpine (matches) — normal vision",
    cols: [
      ["Current", "spine_current.png"],
      ["A — Red is United", "spine_A.png"],
      ["C — Lightness-first", "spine_C.png"],
    ],
  },
];

const browser = await chromium.launch();
const page = await browser.newPage({ deviceScaleFactor: 1 });

for (const strip of STRIPS) {
  const cols = strip.cols
    .map(
      ([label, file]) =>
        `<figure><figcaption>${label}</figcaption><img src="${fileUrl(file)}"/></figure>`,
    )
    .join("");
  const html = `<!doctype html><html><head><style>
    body{margin:0;background:#000;font-family:Arial,sans-serif}
    h1{color:#f3ede8;font-size:22px;padding:16px 20px 4px;margin:0}
    .row{display:flex;gap:10px;padding:10px 20px 20px}
    figure{margin:0;flex:1}
    figcaption{color:#a89c94;font-size:15px;padding:6px 2px;font-weight:700}
    img{width:100%;display:block;border:1px solid #2c2522}
  </style></head><body>
    <h1>${strip.title}</h1>
    <div class="row">${cols}</div>
  </body></html>`;
  const htmlPath = path.join(dir, "_montage.html");
  writeFileSync(htmlPath, html);
  await page.setViewportSize({ width: 1700, height: 700 });
  await page.goto("file:///" + htmlPath.replace(/\\/g, "/"), { waitUntil: "networkidle" });
  const el = await page.$("body");
  await el.screenshot({ path: path.join(dir, strip.out) });
  console.log(`montage -> ${strip.out}`);
}

await browser.close();
