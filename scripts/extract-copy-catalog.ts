/**
 * Extract authored copy into content/copy-catalog.json and merge content/copy-queue.json.
 *
 * Source of truth stays in TS/TSX. Re-run after edits to refresh catalog text while
 * preserving queue status/notes.
 *
 * Usage: npm run copy:extract
 */
import fs from "node:fs";
import path from "node:path";

import { CURATED_DEBATES } from "../lib/compare";
import {
  COPY_CATALOG_PATH,
  COPY_CONTENT_DIR,
  COPY_QUEUE_PATH,
  countByStatus,
  emptyQueue,
  mergeQueue,
  type CopyCatalogFile,
  type CopyItem,
  type CopyKind,
  type CopyTier,
} from "../lib/copyCatalog";
import { CURATED_NIGHTS } from "../lib/curatedNights";
import { CURATED_CUTS } from "../lib/cut";
import { questionHeadlines } from "../lib/questionHeadlines";
import {
  QUESTIONS,
  isArchivedQuestion,
  questionBySlug,
  questionSlugs,
} from "../lib/questions";
import { SITE_TAGLINE } from "../lib/site";

const ROOT = process.cwd();

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}

function item(
  partial: Omit<CopyItem, "siblings"> & { siblings?: string[] },
): CopyItem {
  const out: CopyItem = {
    id: partial.id,
    group: partial.group,
    tier: partial.tier,
    file: partial.file,
    kind: partial.kind,
    text: partial.text.trim(),
  };
  if (partial.route) out.route = partial.route;
  if (partial.siblings?.length) out.siblings = partial.siblings;
  return out;
}

/** Unescape a double-quoted JS string literal body. */
function unquoteDouble(body: string): string {
  return body
    .replace(/\\n/g, "\n")
    .replace(/\\"/g, '"')
    .replace(/\\'/g, "'")
    .replace(/\\\\/g, "\\");
}

/** Approximate template-literal text for review (keep ${…} markers). */
function normalizeTemplate(body: string): string {
  return body.replace(/\s+/g, " ").trim();
}

/** Find closing backtick of a template literal starting at index 0 (`…`). */
function templateLiteralBody(src: string): { body: string; end: number } | null {
  if (!src.startsWith("`")) return null;
  let i = 1;
  while (i < src.length) {
    if (src[i] === "\\") {
      i += 2;
      continue;
    }
    if (src[i] === "`") return { body: src.slice(1, i), end: i + 1 };
    i += 1;
  }
  return null;
}

const MODULE_FN_TO_SLUG: Record<string, string> = {
  LateGoalsModule: "late-goals",
  ComebacksModule: "comebacks",
  RunsModule: "runs",
  FergusonEraModule: "ferguson-era",
  TrebleModule: "treble",
  EuropeModule: "europe",
  ManagerBounceModule: "manager-bounce",
  FortressModule: "fortress",
  CupSpecialistsModule: "cup-specialists",
  OwnGoalsModule: "own-goals",
  AwayDaysModule: "away-days",
};

/**
 * Pull prop="…" or prop={`…`} / ternary prop={ cond ? `a` : `b` } from a Module
 * JSX block. Ignores ternaries nested inside template literals.
 */
function extractJsxStringProps(block: string, prop: string): string[] {
  const out: string[] = [];
  const re = new RegExp(`\\b${prop}=`, "g");
  let m: RegExpExecArray | null;
  while ((m = re.exec(block))) {
    const rest = block.slice(m.index + m[0].length);
    if (rest.startsWith('"')) {
      const end = rest.indexOf('"', 1);
      if (end > 0) out.push(unquoteDouble(rest.slice(1, end)));
      continue;
    }
    if (!rest.startsWith("{")) continue;
    const inner = rest.slice(1).trimStart();
    if (inner.startsWith("`")) {
      const tpl = templateLiteralBody(inner);
      if (tpl) out.push(normalizeTemplate(tpl.body));
      continue;
    }
    // Branched string props: cond ? `a` : `b`
    const q1 = inner.indexOf("`");
    if (q1 < 0) continue;
    const first = templateLiteralBody(inner.slice(q1));
    if (!first) continue;
    const afterFirst = inner.slice(q1 + first.end);
    const q2 = afterFirst.indexOf("`");
    if (q2 < 0) continue;
    const second = templateLiteralBody(afterFirst.slice(q2));
    if (!second) continue;
    out.push(normalizeTemplate(first.body));
    out.push(normalizeTemplate(second.body));
  }
  return [...new Set(out.filter((t) => t.length > 0))];
}

function extractQuestionModules(): CopyItem[] {
  const file = "components/QuestionModules.tsx";
  const src = read(file);
  const items: CopyItem[] = [];

  for (const [fn, slug] of Object.entries(MODULE_FN_TO_SLUG)) {
    const start = src.indexOf(`function ${fn}`);
    if (start < 0) {
      console.warn(`copy:extract: missing ${fn}`);
      continue;
    }
    const nextFn = src.slice(start + 1).search(/\nfunction [A-Z]/);
    const end = nextFn < 0 ? src.length : start + 1 + nextFn;
    const block = src.slice(start, end);
    const group = `question:${slug}`;
    const route = `/questions/${slug}`;
    const kinds: { prop: string; kind: CopyKind }[] = [
      { prop: "finding", kind: "finding" },
      { prop: "slice", kind: "slice" },
      { prop: "coverage", kind: "coverage" },
    ];
    for (const { prop, kind } of kinds) {
      const texts = extractJsxStringProps(block, prop);
      texts.forEach((text, i) => {
        const suffix = texts.length > 1 ? `:${i + 1}` : "";
        items.push(
          item({
            id: `${group}:${kind}${suffix}`,
            group,
            tier: "A",
            route,
            file,
            kind,
            text,
          }),
        );
      });
    }
  }
  return items;
}

function extractQuestionHeadlines(): CopyItem[] {
  const file = "lib/questionHeadlines.ts";
  const headlines = questionHeadlines();
  const items: CopyItem[] = [];
  for (const [slug, h] of Object.entries(headlines)) {
    if (!h.gloss.trim()) continue;
    items.push(
      item({
        id: `question:${slug}:gloss`,
        group: `question:${slug}`,
        tier: isArchivedQuestion(slug) ? "B" : "A",
        route: `/questions/${slug}`,
        file,
        kind: "gloss",
        text: h.gloss,
      }),
    );
  }
  return items;
}

function extractPageHeaders(): CopyItem[] {
  const pages: { file: string; route: string; tier: CopyTier; group: string }[] = [
    { file: "app/page.tsx", route: "/", tier: "A", group: "home" },
    { file: "app/explore/page.tsx", route: "/explore", tier: "A", group: "explore" },
    { file: "app/compare/page.tsx", route: "/compare", tier: "A", group: "compare" },
    { file: "app/data/page.tsx", route: "/data", tier: "A", group: "data" },
    { file: "app/matches/page.tsx", route: "/matches", tier: "B", group: "matches" },
    { file: "app/seasons/page.tsx", route: "/seasons", tier: "B", group: "seasons" },
    { file: "app/players/page.tsx", route: "/players", tier: "B", group: "players" },
    { file: "app/managers/page.tsx", route: "/managers", tier: "B", group: "managers" },
    { file: "app/transfers/page.tsx", route: "/transfers", tier: "B", group: "transfers" },
    { file: "app/surprise/page.tsx", route: "/surprise", tier: "B", group: "surprise" },
    { file: "app/search/page.tsx", route: "/search", tier: "B", group: "search" },
    { file: "app/corrections/page.tsx", route: "/corrections", tier: "B", group: "corrections" },
    { file: "app/feedback/page.tsx", route: "/feedback", tier: "B", group: "feedback" },
    { file: "app/analytics/page.tsx", route: "/analytics", tier: "B", group: "analytics" },
  ];

  const items: CopyItem[] = [];
  for (const p of pages) {
    const src = read(p.file);
    const blocks = [...src.matchAll(/<PageHeader\b([^>]*)>([\s\S]*?)<\/PageHeader>/g)];
    let idx = 0;
    for (const block of blocks) {
      const attrs = block[1] ?? "";
      const body = block[2] ?? "";
      const title = attrs.match(/title="([^"]+)"/)?.[1];
      const eyebrow = attrs.match(/eyebrow="([^"]+)"/)?.[1];
      // Keep expression holes as ${…} so templated deks stay reviewable.
      const dek = body
        .replace(/<[^>]+>/g, " ")
        .replace(/\{([^{}]*)\}/g, "${…}")
        .replace(/\s+/g, " ")
        .trim();
      const n = idx++;
      const suffix = blocks.length > 1 ? `:${n}` : "";
      if (eyebrow) {
        items.push(
          item({
            id: `${p.group}:eyebrow${suffix}`,
            group: p.group,
            tier: p.tier,
            route: p.route,
            file: p.file,
            kind: "eyebrow",
            text: eyebrow,
          }),
        );
      }
      if (title) {
        items.push(
          item({
            id: `${p.group}:title${suffix}`,
            group: p.group,
            tier: p.tier,
            route: p.route,
            file: p.file,
            kind: "title",
            text: title,
          }),
        );
      }
      if (dek.length >= 12) {
        items.push(
          item({
            id: `${p.group}:dek${suffix}`,
            group: p.group,
            tier: p.tier,
            route: p.route,
            file: p.file,
            kind: "dek",
            text: dek,
          }),
        );
      }
    }
  }
  return items;
}

function extractRelated(): CopyItem[] {
  const file = "lib/related.ts";
  const src = read(file);
  const items: CopyItem[] = [];
  // RELATED entries: "slug": [ toX(..., "hook"), ... ]
  const slugBlocks = [...src.matchAll(/"([a-z0-9-]+)"\s*:\s*\[([\s\S]*?)\](?=\s*,?\s*(?:"|$))/g)];
  for (const sb of slugBlocks) {
    const slug = sb[1];
    if (!questionBySlug(slug)) continue;
    const body = sb[2] ?? "";
    const hooks = [...body.matchAll(/to(?:Question|Cut|Debate)\([^)]*?,\s*"([^"]+)"\)/g)];
    hooks.forEach((h, i) => {
      items.push(
        item({
          id: `question:${slug}:related:${i + 1}`,
          group: `question:${slug}`,
          tier: "B",
          route: `/questions/${slug}`,
          file,
          kind: "hook",
          text: unquoteDouble(h[1]),
        }),
      );
    });
  }
  return items;
}

function extractTransferEditorial(): CopyItem[] {
  const file = "lib/transferEditorial.ts";
  const src = read(file);
  const items: CopyItem[] = [];
  const curatedBlock = src.match(/const CURATED[^=]*=\s*\{([\s\S]*?)\n\};/);
  if (curatedBlock) {
    const re = /"([^"]+)":\s*\n\s*"([^"]+)"/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(curatedBlock[1]))) {
      items.push(
        item({
          id: `transfers:editorial:${m[1]}`,
          group: "transfers",
          tier: "B",
          route: "/transfers",
          file,
          kind: "editorial",
          text: unquoteDouble(m[2]),
        }),
      );
    }
  }
  const fallbacks = [...src.matchAll(/`((?:Signed|Sold)[^`]*)`/g)];
  fallbacks.forEach((t, i) => {
    items.push(
      item({
        id: `transfers:template:${i + 1}`,
        group: "transfers",
        tier: "C",
        route: "/transfers",
        file,
        kind: "template",
        text: normalizeTemplate(t[1]),
      }),
    );
  });
  return items;
}

function extractSearchCopy(): CopyItem[] {
  const file = "lib/search/examples.ts";
  // Import would pull the module; parse to avoid coupling to runtime shape churn.
  const src = read(file);
  const items: CopyItem[] = [];

  const placeholder = src.match(/SEARCH_PLACEHOLDER = "([^"]+)"/)?.[1];
  if (placeholder) {
    items.push(
      item({
        id: "search:placeholder",
        group: "search",
        tier: "B",
        route: "/search",
        file,
        kind: "placeholder",
        text: unquoteDouble(placeholder),
      }),
    );
  }
  const mobilePh = src.match(/MOBILE_SEARCH_PLACEHOLDER = "([^"]+)"/)?.[1];
  if (mobilePh) {
    items.push(
      item({
        id: "search:placeholder:mobile",
        group: "search",
        tier: "B",
        route: "/search",
        file,
        kind: "placeholder",
        text: unquoteDouble(mobilePh),
      }),
    );
  }

  const hints = [...src.matchAll(/hint:\s*"([^"]+)"/g)];
  hints.forEach((h, i) => {
    items.push(
      item({
        id: `search:hint:${i + 1}`,
        group: "search",
        tier: "B",
        route: "/search",
        file,
        kind: "hint",
        text: unquoteDouble(h[1]),
      }),
    );
  });

  const searchHints = src.match(/SEARCH_HINTS[^=]*=\s*\[([\s\S]*?)\]/);
  if (searchHints) {
    [...searchHints[1].matchAll(/"([^"]+)"/g)].forEach((h, i) => {
      items.push(
        item({
          id: `search:syntax:${i + 1}`,
          group: "search",
          tier: "B",
          route: "/search",
          file,
          kind: "hint",
          text: unquoteDouble(h[1]),
        }),
      );
    });
  }
  return items;
}

function extractSourceGroups(): CopyItem[] {
  const file = "lib/sourceGroups.ts";
  const src = read(file);
  const items: CopyItem[] = [];

  const summaries = [...src.matchAll(/summary:\s*"([^"]+)"/g)];
  summaries.forEach((s, i) => {
    items.push(
      item({
        id: `data:source-summary:${i + 1}`,
        group: "data",
        tier: "B",
        route: "/data",
        file,
        kind: "blurb",
        text: unquoteDouble(s[1]),
      }),
    );
  });

  // blurb: "…" or blurb:\n  "…"
  const blurbs = [...src.matchAll(/blurb:\s*(?:\n\s*)?"([^"]*)"/g)];
  blurbs.forEach((b, i) => {
    items.push(
      item({
        id: `data:source-blurb:${i + 1}`,
        group: "data",
        tier: "B",
        route: "/data",
        file,
        kind: "blurb",
        text: unquoteDouble(b[1]),
      }),
    );
  });
  return items;
}

function extractDataGaps(): CopyItem[] {
  const file = "lib/dataGaps.ts";
  const src = read(file);
  const items: CopyItem[] = [];
  const descs = [...src.matchAll(/description:\s*"([^"]+)"/g)];
  descs.forEach((d, i) => {
    items.push(
      item({
        id: `data:gap:${i + 1}`,
        group: "data",
        tier: "B",
        route: "/data",
        file,
        kind: "description",
        text: unquoteDouble(d[1]),
      }),
    );
  });
  return items;
}

function extractNarrativeTemplates(): CopyItem[] {
  const file = "lib/narrative.ts";
  const src = read(file);
  const items: CopyItem[] = [];
  // Template literals that look like sentence templates (contain ${ or fixed filler phrases)
  const tpls = [...src.matchAll(/`([^`]*\$\{[^`]+}[^`]*)`/g)];
  const seen = new Set<string>();
  let i = 0;
  for (const t of tpls) {
    const text = normalizeTemplate(t[1]);
    if (text.length < 20 || seen.has(text)) continue;
    // Skip SQL-ish
    if (/SELECT |FROM |WHERE /i.test(text)) continue;
    seen.add(text);
    i += 1;
    items.push(
      item({
        id: `narrative:template:${i}`,
        group: "narrative",
        tier: "C",
        route: "/seasons",
        file,
        kind: "template",
        text,
      }),
    );
  }
  return items;
}

function extractAnalyticsActs(): CopyItem[] {
  const file = "app/analytics/page.tsx";
  const src = read(file);
  const items: CopyItem[] = [];
  const desc = src.match(/ANALYTICS_DESCRIPTION\s*=\s*\n?\s*"([^"]+)"/)?.[1]
    ?? src.match(/ANALYTICS_DESCRIPTION\s*=\s*"([^"]+)"/)?.[1];
  if (desc) {
    items.push(
      item({
        id: "analytics:meta-description",
        group: "analytics",
        tier: "B",
        route: "/analytics",
        file,
        kind: "description",
        text: unquoteDouble(desc),
      }),
    );
  }
  // <Act … title="…"> children text
  const acts = [...src.matchAll(/<Act\b([^>]*)>([\s\S]*?)<\/Act>/g)];
  acts.forEach((a, i) => {
    const attrs = a[1] ?? "";
    const title = attrs.match(/title="([^"]+)"/)?.[1];
    const kicker = attrs.match(/kicker="([^"]+)"/)?.[1];
    const body = a[2]
      .replace(/<[^>]+>/g, " ")
      .replace(/\{[^}]*\}/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (kicker) {
      items.push(
        item({
          id: `analytics:act:${i + 1}:kicker`,
          group: "analytics",
          tier: "B",
          route: "/analytics",
          file,
          kind: "eyebrow",
          text: kicker,
        }),
      );
    }
    if (title) {
      items.push(
        item({
          id: `analytics:act:${i + 1}:title`,
          group: "analytics",
          tier: "B",
          route: "/analytics",
          file,
          kind: "title",
          text: title,
        }),
      );
    }
    if (body.length >= 12) {
      items.push(
        item({
          id: `analytics:act:${i + 1}:dek`,
          group: "analytics",
          tier: "B",
          route: "/analytics",
          file,
          kind: "dek",
          text: body,
        }),
      );
    }
  });
  return items;
}

function attachSiblings(items: CopyItem[]): void {
  const byGroup = new Map<string, string[]>();
  for (const it of items) {
    const list = byGroup.get(it.group) ?? [];
    list.push(it.id);
    byGroup.set(it.group, list);
  }
  for (const it of items) {
    const ids = byGroup.get(it.group) ?? [];
    const sibs = ids.filter((id) => id !== it.id);
    if (sibs.length) it.siblings = sibs;
  }
}

function buildCatalog(): CopyItem[] {
  const items: CopyItem[] = [];

  items.push(
    item({
      id: "site:tagline",
      group: "site",
      tier: "A",
      route: "/",
      file: "lib/site.ts",
      kind: "tagline",
      text: SITE_TAGLINE,
    }),
  );

  for (const slug of questionSlugs()) {
    const q = questionBySlug(slug);
    if (!q) continue;
    const tier: CopyTier = isArchivedQuestion(slug) ? "B" : "A";
    const group = `question:${slug}`;
    const route = `/questions/${slug}`;
    const file = "lib/questions.ts";
    items.push(
      item({ id: `${group}:label`, group, tier, route, file, kind: "label", text: q.label }),
      item({ id: `${group}:question`, group, tier, route, file, kind: "question", text: q.question }),
      item({ id: `${group}:summary`, group, tier, route, file, kind: "summary", text: q.summary }),
    );
  }

  // Active front-door set — referenced so extract stays coupled to QUESTIONS.
  if (QUESTIONS.length === 0) throw new Error("copy:extract: QUESTIONS is empty");

  items.push(...extractQuestionModules());
  items.push(...extractQuestionHeadlines());

  for (const night of CURATED_NIGHTS) {
    items.push(
      item({
        id: `night:${night.id}:stakes`,
        group: "home:nights",
        tier: "A",
        route: "/",
        file: "lib/curatedNights.ts",
        kind: "stakes",
        text: night.stakes,
      }),
    );
  }

  for (const mode of Object.keys(CURATED_DEBATES) as (keyof typeof CURATED_DEBATES)[]) {
    CURATED_DEBATES[mode].forEach((d, i) => {
      const group = `compare:${mode}`;
      items.push(
        item({
          id: `${group}:${i}:label`,
          group,
          tier: "A",
          route: "/compare",
          file: "lib/compare.ts",
          kind: "label",
          text: d.label,
        }),
        item({
          id: `${group}:${i}:hook`,
          group,
          tier: "A",
          route: "/compare",
          file: "lib/compare.ts",
          kind: "hook",
          text: d.hook,
        }),
      );
    });
  }

  for (const cut of CURATED_CUTS) {
    const group = `cut:${cut.slug}`;
    const route = `/cut?subject=team&dimension=${cut.dimension}&metric=${cut.metric}`;
    const file = "lib/cut.ts";
    items.push(
      item({ id: `${group}:eyebrow`, group, tier: "A", route, file, kind: "eyebrow", text: cut.eyebrow }),
      item({ id: `${group}:title`, group, tier: "A", route, file, kind: "title", text: cut.title }),
      item({ id: `${group}:blurb`, group, tier: "A", route, file, kind: "blurb", text: cut.blurb }),
    );
  }

  items.push(...extractPageHeaders());
  items.push(...extractRelated());
  items.push(...extractTransferEditorial());
  items.push(...extractSearchCopy());
  items.push(...extractSourceGroups());
  items.push(...extractDataGaps());
  items.push(...extractNarrativeTemplates());
  items.push(...extractAnalyticsActs());

  // Dedupe by id (last wins — prefer later richer extractors only if collision)
  const byId = new Map<string, CopyItem>();
  for (const it of items) {
    if (byId.has(it.id)) {
      console.warn(`copy:extract: duplicate id ${it.id} (keeping first)`);
      continue;
    }
    byId.set(it.id, it);
  }
  const unique = [...byId.values()];
  attachSiblings(unique);
  unique.sort((a, b) => a.id.localeCompare(b.id));
  return unique;
}

function main(): void {
  const items = buildCatalog();
  const byTier: CopyCatalogFile["byTier"] = { A: 0, B: 0, C: 0 };
  for (const it of items) byTier[it.tier] += 1;

  const now = new Date().toISOString();
  const catalog: CopyCatalogFile = {
    generatedAt: now,
    itemCount: items.length,
    byTier,
    items,
  };

  fs.mkdirSync(COPY_CONTENT_DIR, { recursive: true });
  fs.writeFileSync(COPY_CATALOG_PATH, `${JSON.stringify(catalog, null, 2)}\n`);

  const prevQueue = fs.existsSync(COPY_QUEUE_PATH)
    ? (JSON.parse(fs.readFileSync(COPY_QUEUE_PATH, "utf8")) as ReturnType<typeof emptyQueue>)
    : emptyQueue();
  const queue = mergeQueue(
    prevQueue,
    items.map((i) => i.id),
    now,
  );
  fs.writeFileSync(COPY_QUEUE_PATH, `${JSON.stringify(queue, null, 2)}\n`);

  const status = countByStatus(queue);
  console.log(
    `copy:extract → ${items.length} items (A:${byTier.A} B:${byTier.B} C:${byTier.C})`,
  );
  console.log(
    `copy:queue   → todo:${status.todo} rewritten:${status.rewritten} keep:${status.keep} skip:${status.skip}`,
  );
  console.log(`  ${path.relative(ROOT, COPY_CATALOG_PATH)}`);
  console.log(`  ${path.relative(ROOT, COPY_QUEUE_PATH)}`);
}

main();
