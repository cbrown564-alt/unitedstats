import { playerById, opponentById, managerById, allSeasons } from "./queries";
import { fmtYearRange } from "./format";
import type { CarouselCard } from "@/components/CuratedCarousel";

/**
 * Orientation and personal entry points (Phase 18.4). The cold homepage offers a
 * blank search field; the wanderer and the nostalgic don't arrive with a query,
 * they arrive with a *name* — a player, a rivalry, an era. This module turns that
 * instinct into a door: a small, day-rotated strip of subject chips, each landing
 * on an entity page that already opens its own trails (the Phase 5/9 pattern
 * trails), so "enter through what you love" branches into the record rather than
 * dead-ending.
 *
 * Two static-guardrail commitments hold here, mirroring `lib/now.ts`:
 *
 *   - The rotation is **deterministic by day-of-year**, never behavioural — a
 *     returning visitor sees fresh faces without any per-user state.
 *   - Every chip resolves against the live record at request time, so a chip can
 *     never 404; the resolvers throw on an unknown id and a golden test
 *     (`tests/phase18-discovery.test.ts`) walks the whole registry.
 */
type EntryKind = "player" | "rivalry" | "era";

export interface EntryPoint {
  kind: EntryKind;
  /** The chip label — a short form the reader recognises ("Rooney", "Liverpool"). */
  label: string;
  href: string;
  /** A tiny, factual orientation note read straight from the record — a career
   *  span, a meetings count, a season — never an editorial epithet (guide, don't
   *  pundit). */
  hint: string;
  /** Player chips: the photo src and the full name for the portrait's alt/initials. */
  photo?: { src: string | null; name: string };
  /** Rivalry chips: the opponent id + name for the generated crest. */
  crest?: { id: string; name: string };
}

interface PlayerSpec { id: string; label: string }
interface RivalSpec { id: string; label: string }
type EraSpec =
  | { kind: "season"; id: string; label: string }
  | { kind: "manager"; id: string; label: string };

// Eight icons across the eras — the names a fan reaches for first. The strip
// shows two at a time, rotated, so the set stays fresh without enumerating.
const PLAYERS: PlayerSpec[] = [
  { id: "wayne-rooney", label: "Rooney" },
  { id: "eric-cantona", label: "Cantona" },
  { id: "george-best", label: "Best" },
  { id: "bobby-charlton", label: "Charlton" },
  { id: "ryan-giggs", label: "Giggs" },
  { id: "cristiano-ronaldo", label: "Ronaldo" },
  { id: "bryan-robson", label: "Robson" },
  { id: "denis-law", label: "Law" },
];

// The rivalries a United fan argues about — each an opponent head-to-head.
const RIVALRIES: RivalSpec[] = [
  { id: "liverpool", label: "Liverpool" },
  { id: "manchester-city", label: "Man City" },
  { id: "arsenal", label: "Arsenal" },
  { id: "leeds-united", label: "Leeds" },
  { id: "chelsea", label: "Chelsea" },
];

// The defining eras, each landing on a rich page that opens its own trails — a
// title campaign (a season) or a managerial reign (a manager page).
const ERAS: EraSpec[] = [
  { kind: "season", id: "1998-99", label: "The Treble" },
  { kind: "season", id: "1967-68", label: "European Cup, ’68" },
  { kind: "manager", id: "matt-busby", label: "The Busby era" },
  { kind: "manager", id: "alex-ferguson", label: "The Ferguson era" },
];

function resolvePlayer(s: PlayerSpec): EntryPoint {
  const p = playerById(s.id);
  if (!p) throw new Error(`entryPoints: unknown player "${s.id}"`);
  const hint = p.first_year ? fmtYearRange(p.first_year, p.last_year) : (p.position_label ?? "United");
  return {
    kind: "player", label: s.label, href: `/player/${s.id}`, hint,
    photo: { src: p.player_thumb_url ?? p.player_image_url, name: p.name },
  };
}

function resolveRival(s: RivalSpec): EntryPoint {
  const o = opponentById(s.id);
  if (!o) throw new Error(`entryPoints: unknown opponent "${s.id}"`);
  return {
    kind: "rivalry", label: s.label, href: `/opponent/${s.id}`, hint: `${o.p} meetings`,
    crest: { id: o.id, name: o.name },
  };
}

function resolveEra(s: EraSpec): EntryPoint {
  if (s.kind === "season") {
    if (!allSeasons().includes(s.id)) throw new Error(`entryPoints: unknown season "${s.id}"`);
    return { kind: "era", label: s.label, href: `/seasons/${s.id}`, hint: s.id };
  }
  const m = managerById(s.id);
  if (!m) throw new Error(`entryPoints: unknown manager "${s.id}"`);
  const hint = m.first && m.last ? `${m.first.slice(0, 4)}–${m.last.slice(0, 4)}` : "United";
  return { kind: "era", label: s.label, href: `/manager/${s.id}`, hint };
}

/** Every registered entry point, resolved — the full set the golden test walks. */
export function allEntryPoints(): EntryPoint[] {
  return [
    ...PLAYERS.map(resolvePlayer),
    ...RIVALRIES.map(resolveRival),
    ...ERAS.map(resolveEra),
  ];
}

/** Zero-based day index within the UTC year — the deterministic rotation seed,
 *  matching `lib/now.ts` so the homepage's two living surfaces turn in step. */
function dayOfYear(d: Date): number {
  const start = Date.UTC(d.getUTCFullYear(), 0, 0);
  const today = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  return Math.floor((today - start) / 86_400_000);
}

/**
 * The day's strip: two players, a rivalry, and an era, rotated by day-of-year.
 * The two players are drawn half the pool apart so they are always distinct and
 * span different generations. Deterministic — the static guardrail — so a shared
 * link or a no-JS visit shows the same chips the server picked.
 */
export function entryStrip(now = new Date()): EntryPoint[] {
  const o = dayOfYear(now);
  const players = [
    PLAYERS[o % PLAYERS.length],
    PLAYERS[(o + Math.floor(PLAYERS.length / 2)) % PLAYERS.length],
  ];
  return [
    ...players.map(resolvePlayer),
    resolveRival(RIVALRIES[o % RIVALRIES.length]),
    resolveEra(ERAS[o % ERAS.length]),
  ];
}

/**
 * The breadth tease (Phase 18.4): show the newcomer the *range* of moves the
 * product makes without a directory grid — the Phase 11 peek-carousel lesson,
 * "tease breadth, don't enumerate it". Six cards, each a different kind of move
 * with a concrete example, rendered as a scroll-snap strip so the partial peek
 * cues "there's more" rather than laying the whole map flat. Every href is a
 * stable top-level surface; the strip replaces the old flat "Routes" grid.
 */
export function breadthWays(): CarouselCard[] {
  return [
    {
      href: "/compare",
      eyebrow: "Settle a debate",
      title: "Put two greats side by side",
      blurb: "Rooney against Charlton, Busby against Ferguson, the 90s against the 60s — on shared, coverage-aware metrics.",
      cta: "Compare →",
    },
    {
      href: "/cut",
      eyebrow: "Slice the record",
      title: "Group every match your way",
      blurb: "Rank all 6,000+ fixtures by decade, opponent, venue or result — then fork any parameter into a new cut.",
      cta: "Open the cut →",
    },
    {
      href: "/seasons",
      eyebrow: "Walk the timeline",
      title: "Every season since 1886",
      blurb: "From the first Newton Heath campaign to today, each with its table, its story, and the matches behind it.",
      cta: "Browse seasons →",
    },
    {
      href: "/analytics",
      eyebrow: "The long arc",
      title: "140 years, measured",
      blurb: "The Elo timeline, the travel map, attendance and goal-minute patterns — the record read as trends.",
      cta: "Open analytics →",
    },
    {
      href: "/transfers",
      eyebrow: "The ledger",
      title: "Who came and went",
      blurb: "Net spend by manager, the record signings, and the whole transfer history in one place.",
      cta: "See transfers →",
    },
    {
      href: "/on-this-day",
      eyebrow: "Today in history",
      title: "What happened on this date",
      blurb: "Every match United have played on today's date, across all 140 years — a fresh memory-jog each morning.",
      cta: "On this day →",
    },
  ];
}
