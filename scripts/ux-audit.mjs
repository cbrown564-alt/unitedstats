/**
 * Pre-launch UX audit: visit routes at phone/tablet/desktop viewports,
 * capture screenshots, and collect automated friction signals.
 *
 * Usage:
 *   node scripts/ux-audit.mjs [baseUrl] [outDir]
 *
 * Defaults: http://localhost:3990  /opt/cursor/artifacts/ux-audit
 */
import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const BASE = process.argv[2] ?? "http://localhost:3990";
const OUT = process.argv[3] ?? "/opt/cursor/artifacts/ux-audit";

const VIEWPORTS = [
  { id: "phone", width: 390, height: 844 },
  { id: "tablet", width: 768, height: 1024 },
  { id: "desktop", width: 1280, height: 1400 },
];

/** Routes to sweep — static pages + representative dynamic samples. */
const ROUTES = [
  "/",
  "/explore",
  "/matches",
  "/matches?season=1998-99",
  "/seasons",
  "/players",
  "/managers",
  "/analytics",
  "/transfers",
  "/data",
  "/search",
  "/search?q=rooney",
  "/surprise",
  "/compare",
  "/compare?mode=players&a=wayne-rooney&b=bobby-charlton",
  "/cut?by=opponent&metric=winrate",
  "/corrections",
  "/on-this-day/07-02",
  "/match/1999-05-26-bayern-munich-n",
  "/player/wayne-rooney",
  "/player/own-goal",
  "/manager/alex-ferguson",
  "/opponent/liverpool",
  "/seasons/1998-99",
  "/questions/treble",
  "/questions/ferguson-era",
];

function slug(route) {
  return route.replace(/^\//, "").replace(/[/?=&]/g, "-").replace(/-+/g, "-").slice(0, 80) || "home";
}

async function auditPage(page, route, viewport) {
  const url = `${BASE}${route}`;
  const issues = [];
  const consoleErrors = [];
  const failedRequests = [];

  page.removeAllListeners("console");
  page.removeAllListeners("requestfailed");
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  page.on("requestfailed", (req) => {
    failedRequests.push(`${req.method()} ${req.url()} — ${req.failure()?.errorText ?? "failed"}`);
  });

  let status = 0;
  try {
    const res = await page.goto(url, { waitUntil: "networkidle", timeout: 45_000 });
    status = res?.status() ?? 0;
  } catch (e) {
    issues.push({ severity: "critical", kind: "navigation", detail: String(e.message ?? e) });
    return { url, status, issues, consoleErrors, failedRequests, metrics: null };
  }

  if (status >= 400) {
    issues.push({ severity: "critical", kind: "http", detail: `HTTP ${status}` });
  }

  const metrics = await page.evaluate(() => {
    const doc = document.documentElement;
    const body = document.body;
    const scrollW = Math.max(doc.scrollWidth, body?.scrollWidth ?? 0);
    const clientW = doc.clientWidth;
    const overflowX = scrollW > clientW + 2;

    const h1 = document.querySelectorAll("h1").length;
    const title = document.title;
    const main = document.querySelector("main");
    const focusables = [...document.querySelectorAll("a, button, input, select, textarea, [tabindex]")];
    const tinyTargets = focusables.filter((el) => {
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0 && (r.width < 40 || r.height < 40);
    }).length;

    const textNodes = [...document.querySelectorAll("p, span, li, td, th, h1, h2, h3, h4, a")];
    const clipped = textNodes.filter((el) => {
      const s = getComputedStyle(el);
      if (s.overflow !== "hidden" && s.textOverflow !== "ellipsis") return false;
      return el.scrollWidth > el.clientWidth + 2;
    }).length;

    const imgs = [...document.querySelectorAll("img")];
    const brokenImgs = imgs.filter((img) => !img.complete || img.naturalWidth === 0).length;
    const missingAlt = imgs.filter((img) => !img.getAttribute("alt")).length;

    return {
      overflowX,
      scrollWidth: scrollW,
      clientWidth: clientW,
      h1Count: h1,
      title,
      hasMain: !!main,
      tinyTargets,
      clippedText: clipped,
      brokenImgs,
      missingAlt,
      bodyTextLen: (body?.innerText ?? "").trim().length,
    };
  });

  if (metrics.overflowX) {
    issues.push({
      severity: "high",
      kind: "layout",
      detail: `Horizontal overflow (${metrics.scrollWidth}px > ${metrics.clientWidth}px viewport)`,
    });
  }
  if (metrics.h1Count === 0) {
    issues.push({ severity: "medium", kind: "a11y", detail: "No h1 on page" });
  }
  if (metrics.h1Count > 1) {
    issues.push({ severity: "low", kind: "a11y", detail: `Multiple h1 elements (${metrics.h1Count})` });
  }
  if (!metrics.hasMain) {
    issues.push({ severity: "medium", kind: "a11y", detail: "Missing <main> landmark" });
  }
  if (metrics.tinyTargets > 0) {
    issues.push({ severity: "medium", kind: "touch", detail: `${metrics.tinyTargets} tap targets under 40×40px` });
  }
  if (metrics.clippedText > 8) {
    issues.push({ severity: "low", kind: "typography", detail: `${metrics.clippedText} elements with clipped/ellipsis text` });
  }
  if (metrics.brokenImgs > 0) {
    issues.push({ severity: "high", kind: "media", detail: `${metrics.brokenImgs} broken images` });
  }
  if (metrics.bodyTextLen < 40 && status < 400) {
    issues.push({ severity: "medium", kind: "content", detail: "Very little visible text — possible empty/error state" });
  }

  for (const err of consoleErrors) {
    if (/favicon|hydration|devtools|404.*\.(png|jpg|webp)/i.test(err)) continue;
    issues.push({ severity: "high", kind: "console", detail: err.slice(0, 300) });
  }
  for (const req of failedRequests) {
    if (/favicon|analytics|vercel|_next\/static/i.test(req)) continue;
    issues.push({ severity: "high", kind: "network", detail: req.slice(0, 300) });
  }

  const shotDir = path.join(OUT, viewport.id);
  mkdirSync(shotDir, { recursive: true });
  const shotPath = path.join(shotDir, `${slug(route)}.png`);
  await page.screenshot({ path: shotPath, fullPage: true });

  return { url, status, issues, consoleErrors, failedRequests, metrics, screenshot: shotPath };
}

mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const report = { base: BASE, generatedAt: new Date().toISOString(), viewports: VIEWPORTS, results: [] };

for (const viewport of VIEWPORTS) {
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();

  for (const route of ROUTES) {
    process.stdout.write(`[${viewport.id}] ${route} … `);
    const result = await auditPage(page, route, viewport);
    report.results.push({ route, viewport: viewport.id, ...result });
    const n = result.issues.length;
    console.log(n ? `${n} issue(s)` : "ok");
  }

  await context.close();
}

await browser.close();

const summary = {
  totalChecks: report.results.length,
  withIssues: report.results.filter((r) => r.issues.length > 0).length,
  critical: report.results.flatMap((r) => r.issues.filter((i) => i.severity === "critical")),
  high: report.results.flatMap((r) => r.issues.filter((i) => i.severity === "high")),
};

report.summary = summary;
writeFileSync(path.join(OUT, "report.json"), JSON.stringify(report, null, 2));

console.log("\n=== UX audit summary ===");
console.log(`Checks: ${summary.totalChecks}, with issues: ${summary.withIssues}`);
console.log(`Critical: ${summary.critical.length}, High: ${summary.high.length}`);
console.log(`Report → ${path.join(OUT, "report.json")}`);
