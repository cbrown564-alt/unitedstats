/**
 * The body of "A thread of nights" (/stories/a-thread-of-nights): one `night`
 * block per station, edited in EmDash (the story's `body` field).
 *
 * A block names its match by ID and carries the copy around it. This module
 * parses the blocks; lib/nightCopy.ts reads their tokens against the record.
 * Copy never states a record fact by hand where a token can read it: an unknown
 * or unresolvable token throws, so a bad edit fails the build (and the publish
 * workflow's `npm test`) instead of printing a wrong fact.
 *
 *   {goal:Name}      the first goal by a scorer whose name contains Name, as "Turnbull 82′"
 *   {name:Name}      that scorer's family name alone
 *   {minute:Name}    that goal's minute, as "82′" or "90+3′"
 *   {goals:united}   every goal by that side, as "Shimwell 12′. Mortensen 35′" (or opponent)
 *   {count:united}   how many goals that side scored (or opponent)
 *   {score}          the match's scoreline; {score:<match-id>} another match's
 */
import { liveList, liveMemo, type StoryBlock } from "./editorial";

export const THREAD_STORY_SLUG = "a-thread-of-nights";

export const NIGHT_MOTIFS = ["single", "comeback", "torrent", "cut", "paired", "late", "shock", "reversal", "memory", "flare"] as const;
export type Motif = (typeof NIGHT_MOTIFS)[number];

/** A receipt shown before the night's own, e.g. the drawn final before a replay. */
export interface EarlierReceipt {
  match_id: string;
  caption: string;
  label: string;
  link_label: string;
}

export interface NightBlock {
  /** The anchor the thread knots to; stable, lowercase with hyphens. */
  key: string;
  match_id: string;
  side: "left" | "right";
  label: string;
  motif: Motif;
  /** The headline; `title_anchor` follows it, where the thread catches. */
  title: string;
  title_anchor: string;
  detail: string;
  /** The receipt's caption, e.g. "FA Cup final · Wembley". */
  caption: string;
  /** Scorers the flow highlights, comma-separated names as in {goal:Name}. */
  focus?: string;
  /** A photo under /media/ behind the station on wide screens. */
  memory_src?: string;
  /** Its CSS object-position, e.g. "50% 30%". */
  memory_position?: string;
  earlier?: EarlierReceipt[];
}

export function fail(block: object, message: string): never {
  throw new Error(`A thread of nights, night "${String((block as { key?: unknown }).key ?? "?")}": ${message}`);
}

const text = (value: unknown): value is string => typeof value === "string" && value.trim().length > 0;

/** Checks one stored block and returns it typed; throws on anything the page cannot render. */
function parseNight(raw: StoryBlock): NightBlock {
  if (raw._type !== "night") fail(raw, `unknown block type "${String(raw._type)}"`);
  const b = raw as unknown as Record<string, unknown>;
  for (const field of ["key", "match_id", "label", "title", "title_anchor", "detail", "caption"]) {
    if (!text(b[field])) fail(raw, `"${field}" is required`);
  }
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(b.key as string)) fail(raw, "key must be lowercase words joined by hyphens");
  if (b.side !== "left" && b.side !== "right") fail(raw, `side must be left or right`);
  if (!(NIGHT_MOTIFS as readonly unknown[]).includes(b.motif)) fail(raw, `unknown motif "${String(b.motif)}"`);
  if (b.memory_src !== undefined && b.memory_src !== null && b.memory_src !== "" && !/^\/media\/[\w./-]+$/.test(String(b.memory_src))) {
    fail(raw, "memory_src must be a path under /media/");
  }
  const earlier = Array.isArray(b.earlier) ? (b.earlier as Record<string, unknown>[]) : [];
  for (const receipt of earlier) {
    for (const field of ["match_id", "caption", "label", "link_label"]) {
      if (!text(receipt[field])) fail(raw, `an earlier receipt's "${field}" is required`);
    }
  }
  const optional = (value: unknown) => (text(value) ? value : undefined);
  return {
    key: b.key as string,
    match_id: b.match_id as string,
    side: b.side,
    label: b.label as string,
    motif: b.motif as Motif,
    title: b.title as string,
    title_anchor: b.title_anchor as string,
    detail: b.detail as string,
    caption: b.caption as string,
    focus: optional(b.focus),
    memory_src: optional(b.memory_src),
    memory_position: optional(b.memory_position),
    earlier: earlier.map((r) => ({
      match_id: r.match_id as string,
      caption: r.caption as string,
      label: r.label as string,
      link_label: r.link_label as string,
    })),
  };
}

const body = liveList("stories", (e) => e.data.body ?? [], (e) => e.slug === THREAD_STORY_SLUG);

/** The story's nights in order, from the current editorial source. */
export const threadNights = liveMemo("stories", (): NightBlock[] => {
  const nights = (body[0] ?? []).map(parseNight);
  const keys = new Set(nights.map((n) => n.key));
  if (keys.size !== nights.length) throw new Error("A thread of nights: two nights share a key");
  return nights;
});

/** The ten knots in thread order: their anchor key, match and side. Seed-only (module load). */
export const THREAD_OF_NIGHTS: readonly { key: string; id: string; side: "left" | "right" }[] = threadNights().map(
  ({ key, match_id, side }) => ({ key, id: match_id, side }),
);
