/**
 * Shared helpers for Wikipedia wikitext ingesters: fetching (with cache and
 * 429 backoff) and the small deterministic wikitext-parsing primitives.
 */
import fs from "node:fs";
import path from "node:path";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Fetch the wikitext of the first existing title, caching to cacheFile.
 * Returns null when no candidate title resolves to an article.
 */
export async function fetchArticle(titles: string[], cacheFile: string): Promise<string | null> {
  if (fs.existsSync(cacheFile)) return fs.readFileSync(cacheFile, "utf8");
  for (const title of titles) {
    const url =
      "https://en.wikipedia.org/w/api.php?action=parse&prop=wikitext&format=json&formatversion=2&redirects=1&page=" +
      encodeURIComponent(title);
    for (let attempt = 0; attempt < 5; attempt++) {
      const res = await fetch(url, {
        headers: {
          "user-agent": "unitedstats/1.0 (open football data project; contact: github)",
          accept: "application/json",
        },
      });
      await sleep(600); // stay well within API etiquette, even on errors
      if (res.status === 429 || res.status >= 500) {
        const backoff = [2000, 5000, 15000, 30000][attempt] ?? 30000;
        console.error(`  ${res.status} on "${title}", backing off ${backoff}ms`);
        await sleep(backoff);
        continue;
      }
      if (!res.ok) break; // 4xx other than 429: try next title
      const json = (await res.json()) as { parse?: { wikitext?: string }; error?: unknown };
      const text = json.parse?.wikitext;
      if (!text) break; // missing page: try next title
      fs.mkdirSync(path.dirname(cacheFile), { recursive: true });
      fs.writeFileSync(cacheFile, text);
      return text;
    }
  }
  return null;
}

/** [[A|B]] -> B, [[A]] -> A, [http://url text] -> text, strip ''emphasis'' and refs. */
export function stripWiki(s: string): string {
  return s
    .replace(/<ref[^>]*\/>/g, "")
    .replace(/<ref[^>]*>[\s\S]*?<\/ref>/g, "")
    .replace(/\[(?:https?|ftp):[^\s\]]+\s+([^\]]*)\]/g, "$1")
    .replace(/\[(?:https?|ftp):[^\s\]]+\]/g, "")
    .replace(/\[\[(?:[^[\]|]*\|)?([^[\]]*)\]\]/g, "$1")
    .replace(/\{\{[^{}]*\}\}/g, "")
    .replace(/'{2,}/g, "")
    .replace(/<br\s*\/?\s*>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .trim();
}

/** First meaningful wikilink target in a cell, cleaned of disambiguators. */
export function linkTarget(s: string): string | null {
  for (const m of s.matchAll(/\[\[([^[\]|#]+)(?:#[^[\]|]*)?(?:\|[^[\]]*)?\]\]/g)) {
    const target = m[1].trim();
    if (/^(penalty|own goal|cap \(|file:|image:|captain \()/i.test(target)) continue;
    return target.replace(/\s*\([^)]*\)\s*$/, "").replace(/,\s*(Jr|Sr)\.?$/i, " $1").trim();
  }
  return null;
}

/** Split a table line into cells on | or !! respecting [[..]] and {{..}}. */
export function splitCells(line: string, sep: string): string[] {
  const cells: string[] = [];
  let depth = 0;
  let cur = "";
  for (let i = 0; i < line.length; i++) {
    if (line.startsWith("[[", i) || line.startsWith("{{", i)) { depth++; cur += line[i]; continue; }
    if (line.startsWith("]]", i) || line.startsWith("}}", i)) { depth = Math.max(0, depth - 1); cur += line[i]; continue; }
    if (depth === 0 && line.startsWith(sep, i)) { cells.push(cur); cur = ""; i += sep.length - 1; continue; }
    cur += line[i];
  }
  cells.push(cur);
  return cells;
}

const MONTHS: Record<string, number> = {
  january: 1, february: 2, march: 3, april: 4, may: 5, june: 6,
  july: 7, august: 8, september: 9, october: 10, november: 11, december: 12,
};

/** "24 April 1909" or "{{Start date|1999|5|26|df=y}}" -> "YYYY-MM-DD". */
export function parseWikiDate(cell: string): string | null {
  const sd = cell.match(/\{\{\s*start date\s*\|\s*(\d{4})\s*\|\s*(\d{1,2})\s*\|\s*(\d{1,2})/i);
  if (sd) return `${sd[1]}-${sd[2].padStart(2, "0")}-${sd[3].padStart(2, "0")}`;
  const t = stripWiki(cell).replace(/\[\[|\]\]/g, "");
  const m = t.match(/(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/);
  if (!m) return null;
  const mon = MONTHS[m[2].toLowerCase()];
  if (!mon) return null;
  return `${m[3]}-${String(mon).padStart(2, "0")}-${String(parseInt(m[1], 10)).padStart(2, "0")}`;
}
