import Link from "next/link";
import { familyName } from "@/lib/names";
import type { LineupRow } from "@/lib/queries";
import { ShirtBadge } from "@/components/ShirtBadge";
import { GoalMark, AssistMark, CardMark } from "@/components/MatchMarkers";

/**
 * Banded teamsheet: the Starting XI laid out as GK/DEF/MID/FWD rows on a quiet
 * pitch, so the team's *shape* reads at a glance. The archive has no pitch
 * coordinates, so each starter is placed by the best evidence available, in
 * order:
 *   1. the recorded per-match *role* (e.g. "Left-Back") — also implies a side,
 *      so the band reads left→right; otherwise
 *   2. for the rigid 1–11 numbering era (pre-1993, where the shirt *is* the
 *      position), the *shirt number* mapped through the formation convention of
 *      the day (2-3-5 → WM → 4-4-2) — this also carries a side; otherwise
 *   3. the player's *career* band (GK/DEF/MID/FWD from Wikidata), which has no
 *      side, so those order by shirt within their band.
 * A starter we still can't place is shown in a small "position unknown" strip
 * beneath the pitch rather than blanking the graphic.
 *
 * Goals, bookings and the minute a player left the pitch are drawn onto the
 * shirt itself, so the teamsheet carries the match's events without a stack of
 * separate boxes. The bench sits alongside as a vertical column.
 *
 * Naming: the pitch uses {@link familyName} for compact shirt labels; bench and
 * list views keep the full display name — intentional, not a drift to fix.
 */

type Band = "GK" | "DEF" | "MID" | "FWD";
const BAND_ORDER: Band[] = ["FWD", "MID", "DEF", "GK"]; // top (attacking) → bottom
const BANDS: Band[] = ["GK", "DEF", "MID", "FWD"];

/** Per-player event lookups, keyed by player id. */
export type MatchMarks = {
  goals: Map<string, number>;
  assists: Map<string, number>;
  cards: Map<string, "yellow" | "red">;
};

/** Map a positional label to one of four bands; null if it cannot be placed. */
function roleBand(role: string | null | undefined): Band | null {
  if (!role) return null;
  const r = role.trim().toLowerCase();
  if (/goalkeep|^gk$/.test(r)) return "GK";
  if (/back|defender|^[crl]b$|^df$|^ch$/.test(r)) return "DEF";
  if (/forward|wing|strik|second|^cf$|^ss$|^fw$|^[rl]w$|^[rl]f$|^or$|^ol$|^ir$|^il$/.test(r)) return "FWD";
  if (/midfield|half|^[crl]m$|^mf$|^am$|^dm$|^[rl]h$/.test(r)) return "MID";
  return null;
}

/** Lateral hint so a band reads left → right: lower = further left. */
function lateral(role: string | null | undefined): number {
  const r = (role ?? "").toLowerCase();
  if (/left|^l[bmwfh]$|^ol$|^il$/.test(r)) return 0;
  if (/right|^r[bmwfh]$|^or$|^ir$/.test(r)) return 2;
  return 1;
}

/** Validate a career-position bucket string into a Band. */
function careerBand(bucket: string | null | undefined): Band | null {
  if (!bucket) return null;
  const b = bucket.trim().toUpperCase();
  return (BANDS as string[]).includes(b) ? (b as Band) : null;
}

/**
 * Shirt → pitch placement for the rigid 1–11 numbering era (every starter wore
 * a number that *was* their position until squad numbers arrived in 1993-94).
 * The convention shifted with the dominant formation, so the mapping is chosen
 * by year. `lat` is a left→right rank within the band (lower = further left).
 * Returns null for any number outside the convention (e.g. a numbered sub who
 * started), which then falls through to the career band.
 */
function shirtPlacement(shirt: number, year: number): { band: Band; lat: number } | null {
  // The five-forward front line (7–11) reads the same across all three eras:
  // outside-left 11 → inside-left 10 → centre 9 → inside-right 8 → outside-right 7.
  const FRONT: Record<number, { band: Band; lat: number }> = {
    11: { band: "FWD", lat: 0 },
    10: { band: "FWD", lat: 1 },
    9: { band: "FWD", lat: 2 },
    8: { band: "FWD", lat: 3 },
    7: { band: "FWD", lat: 4 },
  };
  if (year < 1925) {
    // 2-3-5 "pyramid": two backs, three half-backs, five forwards.
    const map: Record<number, { band: Band; lat: number }> = {
      1: { band: "GK", lat: 1 },
      3: { band: "DEF", lat: 0 }, 2: { band: "DEF", lat: 2 },
      6: { band: "MID", lat: 0 }, 5: { band: "MID", lat: 1 }, 4: { band: "MID", lat: 2 },
      ...FRONT,
    };
    return map[shirt] ?? null;
  }
  if (year < 1958) {
    // WM (3-2-5): the centre-half (#5) drops between the full-backs as a third
    // back; the half-backs (#4, #6) become the two-man midfield.
    const map: Record<number, { band: Band; lat: number }> = {
      1: { band: "GK", lat: 1 },
      3: { band: "DEF", lat: 0 }, 5: { band: "DEF", lat: 1 }, 2: { band: "DEF", lat: 2 },
      6: { band: "MID", lat: 0 }, 4: { band: "MID", lat: 2 },
      ...FRONT,
    };
    return map[shirt] ?? null;
  }
  // Back-four era (4-2-4 → 4-4-2): #5 and #6 are the centre-backs, the wingers
  // (#7, #11) tuck into a four-man midfield, #9 and #10 lead the line.
  const map: Record<number, { band: Band; lat: number }> = {
    1: { band: "GK", lat: 1 },
    3: { band: "DEF", lat: 0 }, 6: { band: "DEF", lat: 1 }, 5: { band: "DEF", lat: 2 }, 2: { band: "DEF", lat: 3 },
    11: { band: "MID", lat: 0 }, 8: { band: "MID", lat: 1 }, 4: { band: "MID", lat: 2 }, 7: { band: "MID", lat: 3 },
    10: { band: "FWD", lat: 0 }, 9: { band: "FWD", lat: 1 },
  };
  return map[shirt] ?? null;
}

/** How a starter was placed, and the evidence layer that placed them. */
type Placement = { band: Band; lat: number; via: "role" | "shirt" | "career" };

/**
 * Resolve a starter's pitch placement through the three evidence layers. `year`
 * (the match's calendar year) gates the shirt-number layer to the numbering era.
 */
function placement(
  p: { role: string | null; shirt: number | null; career_band?: string | null },
  year: number | null,
): Placement | null {
  const rb = roleBand(p.role);
  if (rb) return { band: rb, lat: lateral(p.role), via: "role" };
  if (year != null && year < 1993 && p.shirt != null) {
    const sp = shirtPlacement(p.shirt, year);
    if (sp) return { ...sp, via: "shirt" };
  }
  const cb = careerBand(p.career_band);
  if (cb) return { band: cb, lat: 1, via: "career" };
  return null;
}

/**
 * Band-only placement, shared with the match page so its pitch/list gate agrees
 * with what the pitch can actually draw.
 */
export function placeBand(
  p: { role: string | null; shirt: number | null; career_band?: string | null },
  year: number | null,
): Band | null {
  return placement(p, year)?.band ?? null;
}

const goalsFor = (marks: MatchMarks | undefined, id: string | null) =>
  id && marks ? marks.goals.get(id) ?? 0 : 0;
const assistsFor = (marks: MatchMarks | undefined, id: string | null) =>
  id && marks ? marks.assists.get(id) ?? 0 : 0;
const cardFor = (marks: MatchMarks | undefined, id: string | null) =>
  id && marks ? marks.cards.get(id) : undefined;

/** A single shirt + name + event marks, placed on the pitch. */
function PitchPlayer({ p, decade, marks }: { p: LineupRow; decade: string | null; marks?: MatchMarks }) {
  const name = p.player_display_name;
  const goals = goalsFor(marks, p.player_id);
  const assists = assistsFor(marks, p.player_id);
  const card = cardFor(marks, p.player_id);
  const node = (
    <>
      <span className="relative inline-block">
        <ShirtBadge number={p.shirt} decade={decade} compact />
        {card && <CardMark type={card} className="absolute -right-1.5 -top-1" />}
      </span>
      <span className="max-w-full break-words text-[11px] leading-tight text-ink group-hover:text-devil-bright">
        {familyName(name)}
      </span>
      {(goals > 0 || assists > 0 || p.sub_off != null) && (
        <span className="flex items-center gap-1 text-[9px] leading-none text-ink-faint">
          {goals > 0 && <GoalMark count={goals} />}
          {assists > 0 && <AssistMark count={assists} />}
          {p.sub_off != null && <span className="stat-num">&darr; {p.sub_off}&prime;</span>}
        </span>
      )}
    </>
  );
  return p.player_id ? (
    <Link
      href={`/player/${p.player_id}`}
      title={p.role ?? undefined}
      className="group flex w-[4.5rem] flex-col items-center gap-1 text-center"
    >
      {node}
    </Link>
  ) : (
    <span
      title={p.role ?? undefined}
      className="group flex w-[4.5rem] flex-col items-center gap-1 text-center"
    >
      {node}
    </span>
  );
}

export function FormationPitch({
  starters,
  decade,
  marks,
}: {
  starters: LineupRow[];
  decade: string | null;
  marks?: MatchMarks;
}) {
  const year = decade && /^\d{4}$/.test(decade) ? Number(decade) : null;
  const placed = starters.map((p) => ({ p, at: placement(p, year) }));

  const bands = BAND_ORDER.map((band) => ({
    band,
    players: placed
      .filter((x) => x.at?.band === band)
      .sort((a, b) => (a.at!.lat - b.at!.lat) || (a.p.shirt ?? 99) - (b.p.shirt ?? 99))
      .map((x) => x.p),
  })).filter((b) => b.players.length > 0);

  // Starters we can't place anywhere — shown apart rather than guessed.
  const unplaced = placed.filter((x) => x.at === null).map((x) => x.p);

  // The weakest evidence layer any placed player relied on, so the caption stays
  // honest: a recorded role is strongest, a career band the loosest.
  const usedShirt = placed.some((x) => x.at?.via === "shirt");
  const usedCareer = placed.some((x) => x.at?.via === "career");
  const caption = usedCareer
    ? "approximate shape; some positions inferred from career data, not this match"
    : usedShirt
    ? "approximate shape, inferred from classic shirt numbering"
    : "shape from recorded positions, not coordinates";

  // Formation shorthand, outfield only, back → front (e.g. 4-2-3-1).
  const shape = [...bands]
    .reverse()
    .filter((b) => b.band !== "GK")
    .map((b) => b.players.length)
    .join("-");

  return (
    <div className="w-full">
      <div
        className="relative overflow-hidden rounded-lg border border-line"
        style={{ background: "var(--color-pitch)" }}
      >
        {/* quiet pitch markings */}
        <svg
          viewBox="0 0 100 150"
          preserveAspectRatio="none"
          className="pointer-events-none absolute inset-0 h-full w-full opacity-60"
          aria-hidden
        >
          <g fill="none" stroke="var(--color-line)" vectorEffect="non-scaling-stroke">
            <line x1="0" y1="75" x2="100" y2="75" />
            <ellipse cx="50" cy="75" rx="13" ry="9" />
            <rect x="28" y="132" width="44" height="18" />
            <rect x="40" y="144" width="20" height="6" />
            <rect x="28" y="0" width="44" height="18" />
            <rect x="40" y="0" width="20" height="6" />
          </g>
        </svg>

        <div className="relative flex flex-col justify-between gap-3 px-3 py-5" style={{ minHeight: 440 }}>
          {bands.map(({ band, players }) => (
            <div key={band} className="flex items-start justify-around gap-1">
              {players.map((p) => (
                <PitchPlayer
                  key={p.player_id ?? `${p.provider_id}-${p.player_display_name}`}
                  p={p}
                  decade={decade}
                  marks={marks}
                />
              ))}
            </div>
          ))}
          {unplaced.length > 0 && (
            <div className="border-t border-line/60 pt-3">
              <p className="mb-2 text-[10px] uppercase tracking-wider text-ink-faint">Position unknown</p>
              <div className="flex flex-wrap items-start justify-around gap-1">
                {unplaced.map((p) => (
                  <PitchPlayer
                    key={p.player_id ?? `${p.provider_id}-${p.player_display_name}`}
                    p={p}
                    decade={decade}
                    marks={marks}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      {shape && (
        <p className="mt-2 stat-num text-xs text-ink-faint">
          {shape} <span className="font-sans normal-case tracking-normal">— {caption}</span>
        </p>
      )}
    </div>
  );
}

function BenchRow({
  player,
  decade,
  marks,
  meta,
  muted,
}: {
  player: LineupRow;
  decade: string | null;
  marks?: MatchMarks;
  meta: string;
  muted: boolean;
}) {
  const goals = goalsFor(marks, player.player_id);
  const assists = assistsFor(marks, player.player_id);
  const card = cardFor(marks, player.player_id);
  const name = player.player_display_name;
  const body = (
    <span className={`flex min-w-0 flex-1 items-center gap-1 ${muted ? "text-ink-faint" : "text-ink group-hover:text-devil-bright"}`}>
      <span className="truncate">{name}</span>
      {goals > 0 && <GoalMark count={goals} />}
      {assists > 0 && <AssistMark count={assists} />}
    </span>
  );
  return (
    <li className="flex items-center gap-2 rounded border border-line bg-panel px-2 py-1.5 text-sm">
      <span className="relative inline-block shrink-0">
        <ShirtBadge number={player.shirt} decade={decade} compact muted={muted} />
        {card && <CardMark type={card} className="absolute -right-1.5 -top-1" />}
      </span>
      {player.player_id ? (
        <Link href={`/player/${player.player_id}`} className="group flex min-w-0 flex-1 items-center">
          {body}
        </Link>
      ) : (
        body
      )}
      <span className="stat-num shrink-0 text-[10px] text-ink-faint">{meta}</span>
    </li>
  );
}

/**
 * Vertical bench beside the pitch: used substitutes first (with the minute they
 * came on), then unused names with their shirt colour drained so the two read
 * apart at a glance.
 */
export function Bench({
  used,
  unused,
  decade,
  marks,
}: {
  used: LineupRow[];
  unused: LineupRow[];
  decade: string | null;
  marks?: MatchMarks;
}) {
  return (
    <div>
      <h3 className="display mb-3 text-lg">Substitutes</h3>
      <ul className="space-y-1.5">
        {used.map((p) => (
          <BenchRow
            key={p.player_id ?? `${p.provider_id}-${p.player_display_name}`}
            player={p}
            decade={decade}
            marks={marks}
            meta={p.sub_on != null ? `on ${p.sub_on}'` : "on"}
            muted={false}
          />
        ))}
        {unused.map((p) => (
          <BenchRow
            key={p.player_id ?? `${p.provider_id}-${p.player_display_name}`}
            player={p}
            decade={decade}
            marks={marks}
            meta="unused"
            muted
          />
        ))}
      </ul>
      {unused.length > 0 && (
        <p className="mt-2 text-[11px] text-ink-faint">
          Unused bench is source evidence only — it does not count as an appearance.
        </p>
      )}
    </div>
  );
}
