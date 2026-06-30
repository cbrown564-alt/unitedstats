import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  matchById, eventsForMatch, lineupForMatch, eloForMatch, h2hBefore, formBefore,
  sourcesForMatch, allMatchIds,
} from "@/lib/queries";
import { similarMatches } from "@/lib/trails";
import { fmtDateLong, fmtNum, venueLabel, clubName, pct, resultLabel, resultTone } from "@/lib/format";
import { clubNames, opponentNames, type ClubNames } from "@/lib/clubNames";
import { ResultBadge } from "@/components/ResultBadge";
import { CompetitionChip } from "@/components/CompetitionChip";
import type { ReactNode } from "react";
import { MatchList } from "@/components/MatchList";
import { MatchFlow } from "@/components/MatchFlow";
import { EloWinBar } from "@/components/EloWinBar";
import { WdlBar } from "@/components/WdlBar";
import { FormationPitch, Bench, placeBand, type MatchMarks } from "@/components/FormationPitch";
import { ShareCite } from "@/components/ShareCite";
import { DetailBreadcrumb } from "@/components/DetailBreadcrumb";
import { MatchSectionTabs } from "@/components/match/MatchSectionTabs";
import { jsonLdHtml, matchJsonLd } from "@/lib/structuredData";
import { sampleStaticIds } from "@/lib/static-build";

// Sampled SSG (see lib/static-build): preview builds prerender a subset, so
// non-sampled ids render on demand; full builds prerender every id, leaving only
// missing ids to fall through to notFound(). Must be a static literal for Next.
export const dynamicParams = true;

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const m = matchById(id);
  if (!m) return {};
  const dateStr = fmtDateLong(m.date);
  const resultStr = `${m.outcome === "W" ? "Won" : m.outcome === "L" ? "Lost" : "Drew"} ${m.gf}–${m.ga}`;
  const title = `United v ${m.opponent_name} (${m.date})`;
  const description = `${dateStr} — Manchester United ${resultStr} against ${m.opponent_name} at ${m.stadium_name ?? venueLabel(m.venue)} in the ${m.competition_name}.`;
  return {
    title,
    description,
    openGraph: {
      title: `${title} · Red Thread`,
      description,
    },
  };
}

export function generateStaticParams() {
  return sampleStaticIds(allMatchIds()).map((id) => ({ id }));
}

/**
 * Hero team name that swaps tier by viewport: broadcast short name on phones
 * and tablets, the full era-accurate name on wide screens. `min-w-0` and
 * `whitespace-nowrap` keep each side on one line; the h1 scales type down on
 * narrow viewports so names like "Liverpool" fit. Full name stays in title.
 */
function TeamName({ names, align, href }: { names: ClubNames; align: "left" | "right"; href?: string }) {
  const inner = (
    <>
      <span className="lg:hidden">{names.short}</span>
      <span className="hidden lg:inline">{names.full}</span>
    </>
  );
  const className = `min-w-0 whitespace-nowrap ${align === "left" ? "text-left" : "text-right"}`;
  return href ? (
    <Link href={href} title={names.full} className={`${className} hover:text-devil-bright focus-ring`}>
      {inner}
    </Link>
  ) : (
    <span title={names.full} className={className}>
      {inner}
    </span>
  );
}

/**
 * One fact in the match-details strip. Manager and competition carry an `href`,
 * which turns the card into a link with a hover arrow; numeric facts (attendance)
 * set `mono` for tabular figures. Text facts use the proportional UI font so the
 * strip reads like the rest of the page rather than a monospace data dump.
 */
function DetailCard({ label, value, href, mono = false }: { label: string; value: ReactNode; href?: string; mono?: boolean }) {
  const body = (
    <>
      <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-faint">{label}</div>
      <div className={`mt-1.5 break-words text-[15px] font-medium leading-snug text-ink ${mono ? "stat-num tabular-nums" : ""} ${href ? "group-hover/detail:text-devil-bright" : ""}`}>
        {value}
      </div>
    </>
  );
  const base = "min-w-0 rounded-lg border border-line bg-panel px-4 py-3";
  return href ? (
    <Link href={href} className={`group/detail relative block ${base} transition-colors hover:border-devil/50 focus-ring`}>
      {body}
      <span aria-hidden className="absolute right-3 top-3 text-xs text-ink-faint opacity-0 transition-opacity group-hover/detail:opacity-100">→</span>
    </Link>
  ) : (
    <div className={base}>{body}</div>
  );
}

export default async function MatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const m = matchById(id);
  if (!m) notFound();
  const events = eventsForMatch(id);
  const lineup = lineupForMatch(id);
  const elo = eloForMatch(id);
  const h2h = h2hBefore(m.opponent_id, m.date);
  const form = formBefore(m.date, 6);
  const sources = sourcesForMatch(id);
  const club = clubName(m.date);
  const clubN = clubNames(m.date);
  const oppN = opponentNames(m.opponent_id, m.opponent_name);
  const similar = similarMatches(m, 6);

  const tone = resultTone(m.outcome);
  const word = resultLabel(m.outcome);
  const jsonLd = matchJsonLd(m, sources);

  const goals = events.filter((e) => ["goal", "pen-goal", "own-goal-for"].includes(e.type));
  const opponentGoals = events.filter((e) => ["opp-goal", "own-goal-against"].includes(e.type));
  const cards = events.filter((e) => e.type === "card-yellow" || e.type === "card-red");
  const starters = lineup.filter((p) => p.player_side === "united" && p.started && !p.bench);
  const usedSubs = lineup.filter((p) => p.player_side === "united" && !p.started && !p.bench);
  const bench = lineup.filter((p) => p.player_side === "united" && p.bench);
  const hasTimedGoals = goals.some((g) => g.minute != null) || opponentGoals.some((g) => g.minute != null);
  // Pitch needs enough starters we can place — by recorded role, by shirt number
  // in the rigid 1–11 numbering era, or by career band. Players we still can't
  // place appear in a "position unknown" strip; we only fall back to the flat
  // list when too few can be placed for a shape to read.
  const matchYear = Number(m.date.slice(0, 4));
  const placeableStarters = starters.filter((p) => placeBand(p, matchYear) !== null).length;
  const canPitch = starters.length >= 7 && placeableStarters >= 7;

  // Per-player goals/bookings, drawn onto shirts on the pitch and bench. Goals
  // key off player id (own goals carry no United player id, so they drop out);
  // a second yellow promotes to red, the way a sending-off reads.
  const goalCount = new Map<string, number>();
  const assistCount = new Map<string, number>();
  for (const g of goals) {
    if (g.player_id) goalCount.set(g.player_id, (goalCount.get(g.player_id) ?? 0) + 1);
    if (g.assist_player_id && g.assist_side === "united") {
      assistCount.set(g.assist_player_id, (assistCount.get(g.assist_player_id) ?? 0) + 1);
    }
  }
  const cardByPlayer = new Map<string, "yellow" | "red">();
  for (const c of cards) {
    if (!c.player_id) continue;
    const cur = cardByPlayer.get(c.player_id);
    if (c.type === "card-red" || cur === "yellow") cardByPlayer.set(c.player_id, "red");
    else if (!cur) cardByPlayer.set(c.player_id, "yellow");
  }
  const marks: MatchMarks = { goals: goalCount, assists: assistCount, cards: cardByPlayer };
  const sourceSummary = sources.reduce((acc, source) => {
    const cur = acc.get(source.id) ?? {
      label: source.label,
      url: source.url,
      kind: source.kind,
      facets: [] as string[],
    };
    cur.facets.push(`${source.facet}${source.confidence === "complete" ? "" : `:${source.confidence}`}`);
    acc.set(source.id, cur);
    return acc;
  }, new Map<string, { label: string; url: string | null; kind: string; facets: string[] }>());

  // Disclosure summaries must advertise their contents (Primary-Answer rule).
  const hasTeamsheet = starters.length > 0 || usedSubs.length > 0 || bench.length > 0 || cards.length > 0;
  const contextParts = [
    h2h.p > 0 ? "head-to-head" : null,
    "form",
    similar.length > 0 ? "related matches" : null,
  ].filter(Boolean) as string[];

  const hasGoalsPanel =
    hasTimedGoals ||
    goals.length > 0 ||
    opponentGoals.length > 0 ||
    (goals.length === 0 && m.gf > 0) ||
    (opponentGoals.length === 0 && m.ga > 0);

  const defaultTab = hasGoalsPanel ? "goals" : hasTeamsheet ? "sheet" : "details";

  const goalsPanel = hasGoalsPanel ? (
    <div className="space-y-5">
      {hasTimedGoals && (
        // On wide screens, hold the timeline to the lineup block's width (26 + gap
        // + 16rem) and centre it, so the two read as one column rather than the bar
        // sprawling the full page.
        <section className="space-y-2 lg:mx-auto lg:max-w-[43.5rem]">
          <MatchFlow unitedGoals={goals} opponentGoals={opponentGoals} aet={!!m.aet} />
          {!m.events_complete && (
            <p className="text-xs text-ink-dim">Goalscorer data for this match may be incomplete.</p>
          )}
        </section>
      )}
      {!hasTimedGoals && (goals.length > 0 || opponentGoals.length > 0) && (
        <section className="mx-auto grid max-w-3xl gap-x-8 gap-y-4 sm:grid-cols-2">
          {goals.length > 0 && (
            <div>
              <h2 className="display mb-3 text-xl">{club} goals</h2>
              <ul className="space-y-2">
                {goals.map((e) => (
                  <li key={e.seq} className="flex items-center gap-3 rounded-lg border border-line bg-panel px-4 py-2.5">
                    <span className="stat-num w-6 font-semibold text-devil-bright">•</span>
                    <span className="flex-1">
                      {e.player_id ? (
                        <Link href={`/player/${e.player_id}`} className="font-medium hover:text-devil-bright focus-ring">
                          {e.player_display_name ?? "Goal"}
                        </Link>
                      ) : (
                        <span className="font-medium">{e.player_display_name ?? "Goal"}</span>
                      )}
                      {e.type === "pen-goal" && <span className="ml-1.5 text-xs text-ink-faint">(pen)</span>}
                      {e.type === "own-goal-for" && <span className="ml-1.5 text-xs text-ink-faint">(og)</span>}
                      {e.assist_display_name && (
                        <span className="ml-1.5 text-xs text-ink-faint">assist {e.assist_display_name}</span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {opponentGoals.length > 0 && (
            <div>
              <h2 className="display mb-3 text-xl">{m.opponent_name} goals</h2>
              <ul className="space-y-2">
                {opponentGoals.map((e) => (
                  <li key={e.seq} className="flex items-center gap-3 rounded-lg border border-line bg-panel px-4 py-2.5">
                    <span className="stat-num w-6 font-semibold text-loss">•</span>
                    <span className="flex-1 font-medium">{e.player_display_name ?? "Goal"}</span>
                    {e.type === "own-goal-against" && <span className="text-xs text-ink-faint">og</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {!m.events_complete && (
            <p className="text-xs text-ink-dim sm:col-span-2">Goalscorer data for this match may be incomplete.</p>
          )}
        </section>
      )}
      {goals.length === 0 && m.gf > 0 && (
        <section className="mx-auto max-w-2xl rounded-lg border border-line bg-panel px-4 py-3">
          <h2 className="display text-xl">Goalscorers</h2>
          <p className="mt-1 text-sm text-ink-dim">
            United scored {m.gf}, but this match does not yet have goalscorer events in the canonical record.
          </p>
          <Link href="/data" className="mt-2 inline-block text-xs text-devil-bright hover:underline focus-ring">
            How to add the missing goalscorers
          </Link>
        </section>
      )}
      {opponentGoals.length === 0 && m.ga > 0 && (
        <section className="mx-auto max-w-2xl rounded-lg border border-line bg-panel px-4 py-3">
          <h2 className="display text-xl">{m.opponent_name} goals</h2>
          <p className="mt-1 text-sm text-ink-dim">
            {m.opponent_name} scored {m.ga}, but opposition goalscorer events are not recorded for this match yet.
          </p>
          <Link href="/data" className="mt-2 inline-block text-xs text-devil-bright hover:underline focus-ring">
            How to add opposition goals
          </Link>
        </section>
      )}
    </div>
  ) : null;

  const teamsheetPanel = hasTeamsheet ? (
    canPitch ? (
      usedSubs.length > 0 || bench.length > 0 ? (
        // No card; the column group centres on wide screens (justify-content,
        // since the tracks are fixed-width) so it isn't marooned to the left.
        <div className="grid items-start gap-x-6 gap-y-6 lg:grid-cols-[minmax(0,26rem)_minmax(12rem,16rem)] lg:justify-center">
          <div>
            <h3 className="display mb-3 text-lg">Starting XI</h3>
            <FormationPitch starters={starters} decade={m.date.slice(0, 4)} marks={marks} />
          </div>
          <Bench used={usedSubs} unused={bench} decade={m.date.slice(0, 4)} marks={marks} />
        </div>
      ) : (
        <div className="max-w-md lg:mx-auto">
          <h3 className="display mb-3 text-lg">Starting XI</h3>
          <FormationPitch starters={starters} decade={m.date.slice(0, 4)} marks={marks} />
        </div>
      )
    ) : (
      <div className="space-y-6">
        {starters.length > 0 && (
              <div>
                <h3 className="display mb-3 text-lg">Starting XI</h3>
                <ul className="grid max-w-2xl gap-1.5 text-sm sm:grid-cols-2">
                  {starters.map((p) => (
                    <li key={p.player_id ?? `${p.provider_id}-${p.player_display_name}`} className="flex items-center gap-2 rounded border border-line bg-panel px-3 py-1.5">
                      <span className="stat-num w-6 text-ink-faint">{p.shirt ?? ""}</span>
                      {p.player_id ? (
                        <Link href={`/player/${p.player_id}`} className="flex-1 hover:text-devil-bright focus-ring">
                          {p.player_display_name}
                        </Link>
                      ) : (
                        <span className="flex-1">{p.player_display_name}</span>
                      )}
                      {p.role && <span className="text-xs text-ink-faint">{p.role}</span>}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {usedSubs.length > 0 && (
              <div>
                <h3 className="display mb-3 text-lg">Used substitutes</h3>
                <ul className="grid max-w-2xl gap-1.5 text-sm sm:grid-cols-2">
                  {usedSubs.map((p) => (
                    <li key={p.player_id ?? `${p.provider_id}-${p.player_display_name}`} className="flex items-center gap-2 rounded border border-line bg-panel px-3 py-1.5">
                      <span className="stat-num w-6 text-ink-faint">{p.shirt ?? ""}</span>
                      {p.player_id ? (
                        <Link href={`/player/${p.player_id}`} className="flex-1 hover:text-devil-bright focus-ring">
                          {p.player_display_name}
                        </Link>
                      ) : (
                        <span className="flex-1">{p.player_display_name}</span>
                      )}
                      <span className="text-xs text-ink-faint">on {p.sub_on != null ? `${p.sub_on}'` : "—"}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {bench.length > 0 && (
              <div>
                <h3 className="display mb-3 text-lg">Bench</h3>
                <ul className="grid max-w-2xl gap-1.5 text-sm sm:grid-cols-2">
                  {bench.map((p) => (
                    <li key={p.player_id ?? `${p.provider_id}-${p.player_display_name}`} className="flex items-center gap-2 rounded border border-line bg-panel px-3 py-1.5">
                      <span className="stat-num w-6 text-ink-faint">{p.shirt ?? ""}</span>
                      {p.player_id ? (
                        <Link href={`/player/${p.player_id}`} className="flex-1 hover:text-devil-bright focus-ring">
                          {p.player_display_name}
                        </Link>
                      ) : (
                        <span className="flex-1">{p.player_display_name}</span>
                      )}
                      <span className="text-xs text-ink-faint">unused</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-xs text-ink-dim">
                  Players listed on the bench only count as appearances if they came on.
                </p>
              </div>
            )}
            {cards.length > 0 && (
              <div>
                <h3 className="display mb-3 text-lg">Cards</h3>
                <ul className="grid max-w-2xl gap-1.5 text-sm sm:grid-cols-2">
                  {cards.map((e) => (
                    <li key={e.seq} className="flex items-center gap-2 rounded border border-line bg-panel px-3 py-1.5">
                      <span className={`stat-num w-10 ${e.type === "card-red" ? "text-loss" : "text-gold"}`}>
                        {e.minute != null ? `${e.minute}'` : ""}
                      </span>
                      <span className="flex-1 font-medium">{e.player_display_name ?? "Player"}</span>
                      <span className="text-xs text-ink-faint">{e.player_side === "united" ? club : m.opponent_name}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
      </div>
    )
  ) : null;

  const matchDetailsBody = (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <DetailCard label="Venue" value={m.stadium_name ?? venueLabel(m.venue)} />
        <DetailCard label="Attendance" value={m.attendance ? fmtNum(m.attendance) : "—"} mono />
        <DetailCard
          label="Manager"
          value={m.manager_name ?? "—"}
          href={m.manager_id && m.manager_name ? `/manager/${m.manager_id}` : undefined}
        />
        <DetailCard
          label="Competition"
          value={m.competition_name}
          href={`/matches?competition=${m.competition_id}`}
        />
      </div>
      <Link href={`/corrections?match=${id}`} className="inline-block text-xs font-semibold text-devil-bright hover:underline focus-ring">
        Suggest a correction →
      </Link>
      {m.notes && <p className="max-w-2xl text-sm italic text-ink-dim">{m.notes}</p>}
      {elo && (
        <EloWinBar
          club={club}
          opponentName={m.opponent_name}
          eloPre={elo.elo_pre}
          oppEloPre={elo.opp_elo_pre}
          expected={elo.expected}
          eloPost={elo.elo_post}
        />
      )}
    </div>
  );

  // Secondary sections share the central spine: centred and held to one column
  // so the page reads as a single thread from the floodlit score down, rather
  // than a tight centred lineup followed by a full-width detail strip snapping
  // left. The story column above (timeline/lineup) sits a touch tighter; both
  // centre on the same axis.
  const detailsPanel = (
    <div className="mx-auto max-w-3xl">
      {/* Mobile: no section title — the "Details" tab already names it. */}
      <div className="sm:hidden">{matchDetailsBody}</div>
      <details open className="group hidden sm:block">
        <summary className="mb-4 flex cursor-pointer list-none items-baseline justify-between gap-3">
          <h2 className="display text-xl">Match details</h2>
          <span className="stat-num text-xs text-ink-faint">
            venue · attendance · manager · competition ·{" "}
            <span className="text-devil-bright group-open:hidden">show</span>
            <span className="hidden text-devil-bright group-open:inline">hide</span>
          </span>
        </summary>
        {matchDetailsBody}
      </details>
    </div>
  );

  const contextBody = (
    <div className="space-y-8">
      {/* Mobile: everything on this tab centres on one axis — headings, bars,
          badges and captions. Desktop keeps the two-column split (head-to-head
          left, recent form packed right). */}
      <div className="grid gap-8 sm:grid-cols-2">
        <div>
          <h3 className="display mb-3 text-center text-lg sm:text-left">Previous head-to-head results</h3>
          {h2h.p > 0 ? (
            <div className="space-y-3">
              <WdlBar w={h2h.w} d={h2h.d} l={h2h.l} size="md" variant="stacked" showLabels />
              <p className="text-center text-xs text-ink-dim sm:text-left">
                {h2h.p} previous meeting{h2h.p === 1 ? "" : "s"} with {m.opponent_name} · {pct(h2h.w, h2h.p)} win rate
              </p>
            </div>
          ) : (
            <p className="text-center text-sm text-ink-dim sm:text-left">First recorded meeting with {m.opponent_name}.</p>
          )}
        </div>
        <div className="text-center sm:text-right">
          <h3 className="display mb-3 text-lg">United&rsquo;s last 6 matches</h3>
          {/* Mobile: the six badges sit tight and centred. Desktop: packed right,
              opposite the head-to-head column. */}
          <div className="flex justify-center gap-1.5 sm:justify-end">
            {form.map((f) => (
              <Link key={f.id} href={`/match/${f.id}`} title={`${f.date} ${f.venue} ${f.opponent_name} ${f.gf}-${f.ga}`} className="focus-ring">
                <ResultBadge result={f.result} outcome={f.outcome} />
              </Link>
            ))}
            {form.length === 0 && <span className="text-sm text-ink-dim">First recorded match</span>}
          </div>
        </div>
      </div>
      {similar.length > 0 && (
        <div>
          <h3 className="display mb-3 text-center text-lg sm:text-left">This exact result, before</h3>
          <MatchList matches={similar} showSeason />
          <p className="mt-2 text-center text-xs text-ink-dim sm:text-left">
            Other {m.venue === "A" ? "away" : m.venue === "H" ? "home" : "neutral"} meetings with{" "}
            {m.opponent_name} that finished {m.gf}–{m.ga}.{" "}
            <Link href={`/opponent/${m.opponent_id}`} className="text-devil-bright hover:underline focus-ring">
              Full head-to-head →
            </Link>
          </p>
        </div>
      )}
    </div>
  );

  const contextPanel = (
    <div className="mx-auto max-w-3xl">
      {/* Mobile: no section title — the "Previous" tab already names it. */}
      <div className="sm:hidden">{contextBody}</div>
      <details className="group hidden sm:block">
        <summary className="mb-4 flex cursor-pointer list-none items-baseline justify-between gap-3">
          <h2 className="display text-xl">Previous results</h2>
          <span className="stat-num text-xs text-ink-faint">
            {contextParts.join(" · ")} ·{" "}
            <span className="text-devil-bright group-open:hidden">show</span>
            <span className="hidden text-devil-bright group-open:inline">hide</span>
          </span>
        </summary>
        {contextBody}
      </details>
    </div>
  );

  const sourcesBody = (
    <div className="grid gap-2 sm:grid-cols-2">
      {[...sourceSummary.entries()].map(([sourceId, s]) => (
        <div key={sourceId} className="rounded-lg border border-line bg-panel px-4 py-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              {s.url ? (
                <a href={s.url} className="font-medium hover:text-devil-bright focus-ring">{s.label}</a>
              ) : (
                <span className="font-medium">{s.label}</span>
              )}
              <div className="mt-0.5 text-xs uppercase tracking-wider text-ink-dim">{s.kind}</div>
            </div>
            <Link href="/data" className="text-xs text-devil-bright hover:underline focus-ring">Data</Link>
          </div>
          <p className="mt-2 text-xs text-ink-dim">{s.facets.sort().join(", ")}</p>
        </div>
      ))}
    </div>
  );

  const sourcesPanel = sources.length > 0 ? (
    <div className="mx-auto max-w-3xl">
      {/* Mobile: no section title — the "Sources" tab already names it. */}
      <div className="sm:hidden">{sourcesBody}</div>
      <details className="group hidden sm:block">
        <summary className="mb-4 flex cursor-pointer list-none items-baseline justify-between gap-3">
          <h2 className="display text-xl">Data sources</h2>
          <span className="stat-num text-xs text-ink-faint">
            {sourceSummary.size} source{sourceSummary.size === 1 ? "" : "s"} ·{" "}
            <span className="text-devil-bright group-open:hidden">show</span>
            <span className="hidden text-devil-bright group-open:inline">hide</span>
          </span>
        </summary>
        {sourcesBody}
      </details>
    </div>
  ) : null;

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdHtml(jsonLd) }} />
      {/* Pull the full-bleed hero up under the sticky nav, cancelling the shell's
          main padding, so the floodlit colour runs to the very top with no black
          band between nav and headline. */}
      <section className="relative left-1/2 -mt-8 w-screen -translate-x-1/2 overflow-hidden border-b border-line sm:-mt-10">
        {/* Full-bleed broadcast band: twin devil-red floodlights bloom from the top
            corners (the same blurred-glow language as every other hero) over the
            faint pitch grid, the content held to the page gutter. No card — the
            result is the page's headline, not a boxed widget. */}
        <div
          className="pointer-events-none absolute -left-24 -top-24 h-72 w-1/2 rounded-full opacity-[0.16] blur-3xl"
          style={{ backgroundColor: "var(--color-devil)" }}
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -right-24 -top-24 h-72 w-1/2 rounded-full opacity-[0.16] blur-3xl"
          style={{ backgroundColor: "var(--color-devil)" }}
          aria-hidden
        />
        {/* Soft central wash so the floodlit colour reaches the top-centre — the
            dark valley between the two corner blooms — not only the corners. */}
        <div
          className="pointer-events-none absolute -top-28 left-1/2 h-64 w-2/3 -translate-x-1/2 rounded-full opacity-[0.10] blur-3xl"
          style={{ backgroundColor: "var(--color-devil)" }}
          aria-hidden
        />
        <div className="hero-grid pointer-events-none absolute inset-0 opacity-40" aria-hidden />
        <div className="relative mx-auto max-w-6xl space-y-5 px-4 py-7 sm:px-6 sm:py-12">
          <DetailBreadcrumb
            segments={[
              { label: "Seasons", href: "/seasons" },
              { label: m.season, href: `/seasons/${m.season}` },
              { label: "This match" },
            ]}
          />
          <div className="absolute right-4 top-4 z-10 sm:top-7">
            <ShareCite path={`/match/${id}`} title={`Manchester United v ${m.opponent_name} — ${fmtDateLong(m.date)}`} />
          </div>
          <header className="space-y-4">
            <nav className="flex items-center justify-center gap-2 text-sm text-ink-faint">
              <Link href={`/seasons/${m.season}`} className="hover:text-devil-bright focus-ring">{m.season}</Link>
              <span aria-hidden>·</span>
              <CompetitionChip type={m.competition_type} name={m.competition_name} round={m.round} bare />
            </nav>
            <div className="space-y-2 border-t border-line py-5 text-center">
              <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-devil-bright">
                  {fmtDateLong(m.date)}
                </p>
                <span aria-hidden className="text-ink-faint">·</span>
                <span className={`stat-num text-xs font-semibold uppercase tracking-wider ${tone}`}>
                  {word}
                </span>
              </div>
              <h1 className="display grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-x-2 text-xl leading-none sm:gap-x-5 sm:text-5xl sm:leading-tight lg:gap-x-8 lg:text-6xl">
                {m.venue === "A" ? (
                  <>
                    <TeamName names={oppN} align="right" href={`/opponent/${m.opponent_id}`} />
                    <span className={`stat-num shrink-0 whitespace-nowrap text-3xl leading-none sm:text-5xl lg:text-6xl ${tone}`}>{m.ga}–{m.gf}</span>
                    <TeamName names={clubN} align="left" />
                  </>
                ) : (
                  <>
                    <TeamName names={clubN} align="right" />
                    <span className={`stat-num shrink-0 whitespace-nowrap text-3xl leading-none sm:text-5xl lg:text-6xl ${tone}`}>{m.gf}–{m.ga}</span>
                    <TeamName names={oppN} align="left" href={`/opponent/${m.opponent_id}`} />
                  </>
                )}
              </h1>
              {(m.aet || m.pen_gf != null) && (
                <p className="text-sm text-ink-dim">
                  {m.aet ? "After extra time. " : ""}
                  {m.pen_gf != null ? `${club} ${m.outcome === "W" ? "won" : "lost"} ${m.pen_gf}–${m.pen_ga} on penalties.` : ""}
                </p>
              )}
            </div>
          </header>
        </div>
      </section>

      <div className="mt-2 sm:mt-8">
        <MatchSectionTabs
          defaultTab={defaultTab}
          tabs={[
            {
              id: "goals",
              // Mobile tab label: this panel carries the match story (timeline +
              // line-ups appended below), so it reads as "Match", not just "Goals".
              label: "Match",
              // On mobile the goals panel otherwise floats alone above a tall empty
              // tab; append the teamsheet so the result scrolls down into the
              // line-ups (FotMob-style). Hidden at sm+, where every panel already
              // stacks in document order and the sheet renders separately.
              content: goalsPanel && (
                <div className="space-y-5">
                  {goalsPanel}
                  {hasTeamsheet && <div className="sm:hidden">{teamsheetPanel}</div>}
                </div>
              ),
            },
            // On mobile the lineup is reached by scrolling the goals tab, so drop
            // its tab button there; it still stacks as its own section on desktop.
            { id: "sheet", label: "Lineup", content: teamsheetPanel, desktopOnly: hasGoalsPanel && hasTeamsheet },
            { id: "details", label: "Details", content: detailsPanel },
            { id: "context", label: "Previous", content: contextPanel },
            { id: "sources", label: "Sources", content: sourcesPanel },
          ]}
        />
      </div>
    </div>
  );
}
