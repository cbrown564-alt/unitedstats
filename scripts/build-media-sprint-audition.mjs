import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { extname, resolve } from "node:path";
import { MANIFEST_PATH, ROOT, ensureDir } from "./media-sprint-lib.mjs";

if (!existsSync(MANIFEST_PATH)) throw new Error(`Missing sprint manifest: ${MANIFEST_PATH}`);
const manifest = JSON.parse(readFileSync(MANIFEST_PATH, "utf8"));

function escape(value = "") {
  return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
}

function media(asset) {
  const path = asset.reviewFile ?? asset.masterFile;
  if (!path) return "<p class=missing>No review file yet</p>";
  const relative = path.replace(/^output\/media-sprint\//, "");
  const ext = extname(path).toLowerCase();
  if ([".mp3", ".wav", ".m4a"].includes(ext)) return `<audio controls preload=metadata src="${escape(relative)}"></audio>`;
  if ([".mp4", ".mov", ".webm"].includes(ext)) return `<video controls muted loop preload=metadata src="${escape(relative)}"></video>`;
  return `<img loading=lazy src="${escape(relative)}" alt="${escape(asset.title)}">`;
}

const groups = Map.groupBy(manifest.assets, (asset) => asset.kind ?? "other");
const sections = [...groups.entries()].map(([kind, assets]) => `<section><h2>${escape(kind)}</h2><div class=grid>${assets.map((asset) => `<article data-state="${escape(asset.reviewState ?? "unreviewed")}">${media(asset)}<div class=copy><span>${escape(asset.id)}</span><h3>${escape(asset.title)}</h3><p>${escape(asset.intendedUse)}</p><dl><dt>State</dt><dd>${escape(asset.reviewState ?? "unreviewed")}</dd><dt>Origin</dt><dd>${escape(asset.provider)} · ${escape(asset.model)}</dd><dt>Label</dt><dd>${escape(asset.documentaryStatus)}</dd></dl><details><summary>Prompt</summary><pre>${escape(asset.prompt)}</pre></details></div></article>`).join("")}</div></section>`).join("");

const html = `<!doctype html><html lang=en><head><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1"><title>Red Thread media sprint</title><style>
:root{color-scheme:dark;--bg:#0c0b0a;--panel:#161312;--line:#2c2522;--ink:#f3ede8;--dim:#a89c94;--red:#ff3b1f}*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:15px/1.45 Arial,sans-serif}main{width:min(1280px,calc(100% - 32px));margin:auto;padding:48px 0 80px}header{max-width:760px;border-left:2px solid var(--red);padding-left:20px}h1{margin:0;font-size:clamp(40px,7vw,76px);line-height:.94;letter-spacing:-.05em}header p,p,dd{color:var(--dim)}section{margin-top:52px}h2{text-transform:uppercase;letter-spacing:.12em;font:12px monospace;color:var(--red);border-bottom:1px solid var(--line);padding-bottom:10px}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:18px}article{background:var(--panel);border:1px solid var(--line)}img,video{display:block;width:100%;aspect-ratio:16/9;object-fit:cover;background:#050505}audio{display:block;width:calc(100% - 28px);margin:20px 14px;filter:grayscale(1)}.copy{padding:16px}.copy>span{font:11px monospace;color:var(--red)}h3{margin:5px 0 8px;font-size:18px}dl{display:grid;grid-template-columns:58px 1fr;gap:4px 10px;font-size:12px}dt{color:var(--ink)}dd{margin:0}details{margin-top:12px;border-top:1px solid var(--line);padding-top:10px}summary{cursor:pointer;color:var(--dim)}pre{white-space:pre-wrap;font:11px/1.45 monospace;color:var(--dim)}.missing{padding:20px}footer{margin-top:50px;color:var(--dim);font-size:12px}</style></head><body><main><header><h1>First-wave audition.</h1><p>Non-shipping synthetic source material. Everything is explicitly abstract and non-documentary; unreviewed is the expected default.</p></header>${sections}<footer>${manifest.assets.length} assets · manifest updated ${escape(manifest.updatedAt)}</footer></main></body></html>`;
ensureDir(ROOT);
writeFileSync(resolve(ROOT, "index.html"), html);
console.log(`Wrote audition page for ${manifest.assets.length} assets.`);
