/**
 * Screenshot deck for the launch copy gate.
 * Requires a running dev server (default http://localhost:3990).
 *
 * Usage:
 *   npm run copy:deck
 *   npm run copy:deck -- http://localhost:3990
 *   npm run copy:deck -- http://localhost:3990 1280 900
 */
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, "output", "copy-review");

const BASE = process.argv[2] ?? "http://localhost:3990";
const WIDTH = Number(process.argv[3] ?? "1280");
const HEIGHT = Number(process.argv[4] ?? "900");

/** Fixed launch-gate routes — human sign-off after Tier A rewrite. */
const ROUTES = [
  { id: "home", path: "/", title: "Home" },
  { id: "explore", path: "/explore", title: "Explore" },
  { id: "question-ferguson-era", path: "/questions/ferguson-era", title: "Question · Ferguson era" },
  { id: "question-treble", path: "/questions/treble", title: "Question · Treble" },
  { id: "question-fortress", path: "/questions/fortress", title: "Question · Fortress OT" },
  { id: "question-late-goals", path: "/questions/late-goals", title: "Question · Late goals" },
  { id: "compare", path: "/compare", title: "Compare" },
  {
    id: "cut-opponents",
    path: "/cut?subject=team&dimension=opponent&metric=winrate",
    title: "Cut · opponents by win rate",
  },
  { id: "data", path: "/data", title: "Data" },
  { id: "season-1998-99", path: "/seasons/1998-99", title: "Season · 1998-99" },
  { id: "match-treble-final", path: "/match/1999-05-26-bayern-munich-n", title: "Match · Barcelona 1999" },
];

function escapeHtml(s) {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

async function shotRoute(browser, route) {
  const page = await browser.newPage({
    viewport: { width: WIDTH, height: HEIGHT },
    deviceScaleFactor: 2,
  });
  const url = `${BASE.replace(/\/+$/, "")}${route.path}`;
  const file = `${route.id}.png`;
  const out = path.join(OUT_DIR, file);
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 90_000 });
    await page.waitForTimeout(800);
    await page.screenshot({ path: out });
    return { ...route, file, url, ok: true };
  } catch (err) {
    return {
      ...route,
      file,
      url,
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  } finally {
    await page.close();
  }
}

function writeGallery(results) {
  const cards = results
    .map((r) => {
      if (!r.ok) {
        return `<article class="card fail"><h2>${escapeHtml(r.title)}</h2><p class="err">${escapeHtml(r.error ?? "failed")}</p><p><a href="${escapeHtml(r.url)}">${escapeHtml(r.url)}</a></p></article>`;
      }
      return `<article class="card"><h2>${escapeHtml(r.title)}</h2><p><a href="${escapeHtml(r.url)}">${escapeHtml(r.path)}</a></p><a href="${escapeHtml(r.file)}"><img src="${escapeHtml(r.file)}" alt="${escapeHtml(r.title)}" width="${WIDTH}" /></a></article>`;
    })
    .join("\n");

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Copy review deck</title>
  <style>
    :root { color-scheme: dark; --bg:#0c0b0a; --panel:#161312; --line:#2c2522; --ink:#f3ede8; --dim:#a89c94; --red:#ff3b1f; }
    body { margin:0; font-family: ui-sans-serif, system-ui, sans-serif; background:var(--bg); color:var(--ink); }
    header { padding:1.5rem 1.25rem; border-bottom:1px solid var(--line); }
    header h1 { margin:0 0 .35rem; font-size:1.5rem; }
    header p { margin:0; color:var(--dim); font-size:.9rem; }
    main { display:grid; gap:1.25rem; padding:1.25rem; max-width:1100px; margin:0 auto; }
    .card { background:var(--panel); border:1px solid var(--line); border-radius:10px; padding:1rem; }
    .card h2 { margin:0 0 .35rem; font-size:1.05rem; }
    .card p { margin:0 0 .75rem; color:var(--dim); font-size:.85rem; }
    .card a { color:var(--red); }
    .card img { display:block; width:100%; height:auto; border-radius:6px; border:1px solid var(--line); }
    .fail { border-color:#a52218; }
    .err { color:#ffb4a8; }
  </style>
</head>
<body>
  <header>
    <h1>Copy review deck</h1>
    <p>${results.filter((r) => r.ok).length}/${results.length} captured · ${WIDTH}×${HEIGHT} · ${escapeHtml(BASE)}</p>
  </header>
  <main>
${cards}
  </main>
</body>
</html>
`;
  fs.writeFileSync(path.join(OUT_DIR, "index.html"), html);
}

fs.mkdirSync(OUT_DIR, { recursive: true });
const browser = await chromium.launch();
const results = [];
for (const route of ROUTES) {
  process.stdout.write(`copy:deck ${route.path} … `);
  const result = await shotRoute(browser, route);
  results.push(result);
  console.log(result.ok ? "ok" : `FAIL ${result.error}`);
}
await browser.close();
writeGallery(results);

const failed = results.filter((r) => !r.ok);
console.log(`copy:deck → ${path.relative(ROOT, OUT_DIR)}/index.html (${results.length - failed.length}/${results.length})`);
if (failed.length) process.exit(1);
