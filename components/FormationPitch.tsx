import Link from "next/link";
import { familyName } from "@/lib/names";
import type { LineupRow } from "@/lib/queries";
import { placeBand, pitchPlacement, PITCH_BAND_ORDER } from "@/lib/placement";
import { ShirtBadge } from "@/components/ShirtBadge";
import { GoalMark, AssistMark, CardMark } from "@/components/MatchMarkers";

export { placeBand } from "@/lib/placement";

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

/** Per-player event lookups, keyed by player id. */
export type MatchMarks = {
  goals: Map<string, number>;
  assists: Map<string, number>;
  cards: Map<string, "yellow" | "red">;
};

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
      <span className="mt-0.5 max-w-full break-words text-[11px] leading-tight text-ink group-hover:text-devil-bright">
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
      className="group flex w-[4.25rem] flex-col items-center gap-0.5 text-center"
    >
      {node}
    </Link>
  ) : (
    <span
      title={p.role ?? undefined}
      className="group flex w-[4.25rem] flex-col items-center gap-0.5 text-center"
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
  const placed = starters.map((p) => ({ p, at: pitchPlacement(p, year) }));

  const bands = PITCH_BAND_ORDER.map((band) => ({
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

        <div className="relative flex flex-col justify-between gap-2 px-3 py-4 sm:gap-2.5 sm:py-5" style={{ minHeight: 380 }}>
          {bands.map(({ band, players }) => (
            <div key={band} className="flex min-h-[4.5rem] items-end justify-around gap-0.5 sm:min-h-[5rem]">
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
