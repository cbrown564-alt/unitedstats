/**
 * `rt-client-refs`: the build half of src/rt/flight.ts.
 *
 * - On the server, every export of a `"use client"` module is tagged with
 *   `$$rtClient = "<file>#<export>"`, so the tree resolver knows where server
 *   components end and client components begin (Next's client boundary).
 * - `virtual:rt-client-modules` maps each such file to a lazy import for the
 *   browser runtime (src/rt/client.tsx).
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { init, parse } from "es-module-lexer";

const VIRTUAL = "virtual:rt-client-modules";
const RESOLVED = "\0" + VIRTUAL;
const SCAN_DIRS = ["app", "components", "lib", "src"];
const DIRECTIVE = /^(?:\s|\/\/[^\n]*\n|\/\*[\s\S]*?\*\/)*["']use client["']/;

function walk(dir, out) {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return;
  }
  for (const name of entries) {
    if (name === "node_modules" || name.startsWith(".")) continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(tsx?|jsx?|mjs)$/.test(name) && DIRECTIVE.test(readFileSync(p, "utf8"))) out.push(p);
  }
}

export function scanClientModules(root) {
  const files = [];
  for (const d of SCAN_DIRS) walk(join(root, d), files);
  return files.map((f) => relative(root, f).split(sep).join("/")).sort();
}

export function rtClientRefs() {
  let root = process.cwd();
  let clientFiles = [];
  return {
    name: "rt-client-refs",
    enforce: "post",
    configResolved(config) {
      root = config.root;
    },
    buildStart() {
      clientFiles = scanClientModules(root);
    },
    resolveId(id) {
      if (id === VIRTUAL) return RESOLVED;
    },
    load(id) {
      if (id !== RESOLVED) return;
      if (!clientFiles.length) clientFiles = scanClientModules(root);
      const entries = clientFiles.map((f) => `  ${JSON.stringify(f)}: () => import(${JSON.stringify("/" + f)}),`);
      return `export const clientModules = {\n${entries.join("\n")}\n};\n`;
    },
    async transform(code, id) {
      if (this.environment?.config?.consumer !== "server") return;
      const file = id.split("?")[0];
      if (!file.startsWith(root + "/") || file.includes("/node_modules/")) return;
      if (!/\.(tsx?|jsx?|mjs)$/.test(file)) return;
      const key = relative(root, file).split(sep).join("/");
      if (!DIRECTIVE.test(code) && !clientFiles.includes(key)) return;

      await init;
      let src = code;
      // `export default <expression>` has no local binding to tag; give it one.
      if (/\bexport default (?!function\b|class\b|async function\b)/.test(src)) {
        src = src.replace(/\bexport default (?!function\b|class\b|async function\b)/, "const __rt_default = ");
        src += "\nexport default __rt_default;\n";
      }
      const [, exports] = parse(src);
      const tags = [];
      for (const e of exports) {
        if (e.typeOnly) continue;
        const local = e.localName ?? (e.name === "default" ? "__rt_default" : undefined);
        if (!local) continue;
        const ref = JSON.stringify(`${key}#${e.name}`);
        tags.push(
          `try { if (typeof ${local} === "function" || (typeof ${local} === "object" && ${local} !== null && ${local}.$$typeof)) Object.defineProperty(${local}, "$$rtClient", { value: ${ref} }); } catch {}`,
        );
      }
      if (!tags.length) return src === code ? undefined : { code: src, map: null };
      return { code: `${src}\n${tags.join("\n")}\n`, map: null };
    },
  };
}
