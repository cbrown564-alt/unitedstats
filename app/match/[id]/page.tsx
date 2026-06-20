import Link from "next/link";
import { notFound } from "next/navigation";
import {
  matchById, eventsForMatch, lineupForMatch, eloForMatch, h2hBefore, formBefore,
  sourcesForMatch,
} from "@/lib/queries";
import { similarMatches } from "@/lib/trails";
import { fmtDateLong, fmtNum, venueLabel, clubName, pct, resultLabel, resultTone } from "@/lib/format";
import { clubNames, opponentNames, type ClubNames } from "@/lib/clubNames";
import { ResultBadge } from "@/components/ResultBadge";
import { CompetitionChip } from "@/components/CompetitionChip";
import { MatchList } from "@/components/MatchList";
import { MatchFlow } from "@/components/MatchFlow";
import { EloWinBar } from "@/components/EloWinBar";
import { WdlBar, WdlColumns } from "@/components/WdlBar";
import { FormationPitch, Bench, roleBand, type MatchMarks } from "@/components/FormationPitch";

export const dynamic = "force-dynamic";

/**
 * Hero team name that swaps tier by viewport: 3-letter code on phones, the
 * broadcast short name on tablet/half-laptop, the full name on wide screens.
 * `min-w-0` lets the grid track shrink so a long name can't force a sideways
 * scroll; the full name is always available via the title tooltip.
 */
function TeamName({ names, align, href }: { names: ClubNames; align: "left" | "right"; href?: string }) {
  const inner = (
    <>
      <span className="sm:hidden">{names.code}</span>
      <span className="hidden sm:inline lg:hidden">{names.short}</span>
      <span className="hidden lg:inline">{names.full}</span>
    </>
  );
  const className = `min-w-0 break-words ${align === "left" ? "text-left" : "text-right"}`;
  return href ? (
    <Link href={href} title={names.full} className={`${className} hover:text-devil-bright`}>
      {inner}
    </Link>
  ) : (
    <span title={names.full} className={className}>
      {inner}
    </span>
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

  const goals = events.filter((e) => ["goal", "pen-goal", "own-goal-for"].includes(e.type));
  const opponentGoals = events.filter((e) => ["opp-goal", "own-goal-against"].includes(e.type));
  const cards = events.filter((e) => e.type === "card-yellow" || e.type === "card-red");
  const starters = lineup.filter((p) => p.player_side === "united" && p.started && !p.bench);
  const usedSubs = lineup.filter((p) => p.player_side === "united" && !p.started && !p.bench);
  const bench = lineup.filter((p) => p.player_side === "united" && p.bench);
  const hasTimedGoals = goals.some((g) => g.minute != null) || opponentGoals.some((g) => g.minute != null);
  // Pitch needs a role for every starter (role data is per-match all-or-nothing).
  const canPitch = starters.length >= 7 && starters.every((p) => roleBand(p.role) !== null);

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
  const teamsheetParts = [
    starters.length > 0 ? "Starting XI" : null,
    usedSubs.length > 0 ? `${usedSubs.length} sub${usedSubs.length === 1 ? "" : "s"}` : null,
    bench.length > 0 ? "bench" : null,
    cards.length > 0 ? `${cards.length} card${cards.length === 1 ? "" : "s"}` : null,
  ].filter(Boolean) as string[];
  const contextParts = [
    h2h.p > 0 ? "head-to-head" : null,
    "form",
    similar.length > 0 ? "related matches" : null,
  ].filter(Boolean) as string[];

  return (
    <div className="space-y-8">
      {/* Result, then how the goals came — one tight lead unit, no hollow black. */}
      <div className="space-y-5">
        <header className="space-y-4">
          <nav className="flex items-center justify-center gap-2 text-sm text-ink-faint">
            <Link href={`/seasons/${m.season}`} className="hover:text-ink">{m.season}</Link>
            <span aria-hidden>·</span>
            <CompetitionChip type={m.competition_type} name={m.competition_name} round={m.round} />
          </nav>
          <div className="space-y-2 border-y border-line py-5 text-center">
            <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-devil-bright">
                {fmtDateLong(m.date)}
              </p>
              <span aria-hidden className="text-ink-faint">·</span>
              <span className={`stat-num text-xs font-semibold uppercase tracking-wider ${tone}`}>
                {word}
              </span>
            </div>
            <h1 className="display grid grid-cols-[1fr_auto_1fr] items-center gap-x-3 text-4xl leading-tight sm:gap-x-5 lg:text-5xl">
              {m.venue === "A" ? (
                <>
                  <TeamName names={oppN} align="right" href={`/opponent/${m.opponent_id}`} />
                  <span className={`stat-num whitespace-nowrap ${tone}`}>{m.ga}–{m.gf}</span>
                  <TeamName names={clubN} align="left" />
                </>
              ) : (
                <>
                  <TeamName names={clubN} align="right" />
                  <span className={`stat-num whitespace-nowrap ${tone}`}>{m.gf}–{m.ga}</span>
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

        {hasTimedGoals && (
          <section className="space-y-2">
            <MatchFlow unitedGoals={goals} opponentGoals={opponentGoals} aet={!!m.aet} />
            {!m.events_complete && (
              <p className="text-xs text-ink-faint">Scorer data for this match may be incomplete.</p>
            )}
          </section>
        )}

      {/* Untimed scorers: events exist but no minutes — keep a plain list. */}
      {!hasTimedGoals && (goals.length > 0 || opponentGoals.length > 0) && (
        <section className="grid sm:grid-cols-2 gap-x-8 gap-y-4 max-w-3xl">
          {goals.length > 0 && (
            <div>
              <h2 className="display text-xl mb-3">{club} goals</h2>
              <ul className="space-y-2">
                {goals.map((e) => (
                  <li key={e.seq} className="flex items-center gap-3 border border-line rounded-lg bg-panel px-4 py-2.5">
                    <span className="stat-num text-devil-bright font-semibold w-6">•</span>
                    <span className="flex-1">
                      {e.player_id ? (
                        <Link href={`/player/${e.player_id}`} className="font-medium hover:text-devil-bright">
                          {e.player_name}
                        </Link>
                      ) : (
                        <span className="font-medium">{e.player_display_name ?? "Goal"}</span>
                      )}
                      {e.type === "pen-goal" && <span className="text-xs text-ink-faint ml-1.5">(pen)</span>}
                      {e.type === "own-goal-for" && <span className="text-xs text-ink-faint ml-1.5">(og)</span>}
                      {e.assist_display_name && (
                        <span className="text-xs text-ink-faint ml-1.5">assist {e.assist_display_name}</span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {opponentGoals.length > 0 && (
            <div>
              <h2 className="display text-xl mb-3">{m.opponent_name} goals</h2>
              <ul className="space-y-2">
                {opponentGoals.map((e) => (
                  <li key={e.seq} className="flex items-center gap-3 border border-line rounded-lg bg-panel px-4 py-2.5">
                    <span className="stat-num text-loss font-semibold w-6">•</span>
                    <span className="flex-1 font-medium">{e.player_display_name ?? "Goal"}</span>
                    {e.type === "own-goal-against" && <span className="text-xs text-ink-faint">og</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {!m.events_complete && (
            <p className="text-xs text-ink-faint sm:col-span-2">Scorer data for this match may be incomplete.</p>
          )}
        </section>
      )}

      {goals.length === 0 && m.gf > 0 && (
        <section className="border border-line rounded-lg bg-panel px-4 py-3 max-w-2xl">
          <h2 className="display text-xl">Scorers</h2>
          <p className="text-sm text-ink-dim mt-1">
            United scored {m.gf}, but this match does not yet have scorer events in the canonical record.
          </p>
          <Link href="/data" className="text-xs text-devil-bright hover:underline mt-2 inline-block">
            How to add the missing scorers
          </Link>
        </section>
      )}
      {opponentGoals.length === 0 && m.ga > 0 && (
        <section className="border border-line rounded-lg bg-panel px-4 py-3 max-w-2xl">
          <h2 className="display text-xl">{m.opponent_name} goals</h2>
          <p className="text-sm text-ink-dim mt-1">
            {m.opponent_name} scored {m.ga}, but opposition scorer events are not recorded for this match yet.
          </p>
          <Link href="/data" className="text-xs text-devil-bright hover:underline mt-2 inline-block">
            How to add opposition goals
          </Link>
        </section>
      )}
      </div>

      {/* Teamsheet — the reason to visit a match: inline, expanded, the lead's payoff. */}
      {hasTeamsheet && (
        <section className="space-y-5">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="display text-xl">Teamsheet</h2>
            {teamsheetParts.length > 0 && (
              <span className="stat-num text-xs text-ink-faint">{teamsheetParts.join(" · ")}</span>
            )}
          </div>
          <div className="space-y-6">
              {canPitch ? (
                <>
                  {usedSubs.length > 0 || bench.length > 0 ? (
                    <div className="grid items-start gap-x-6 gap-y-5 lg:grid-cols-[minmax(0,26rem)_minmax(12rem,16rem)]">
                      <div>
                        <h3 className="display text-lg mb-3">Starting XI</h3>
                        <FormationPitch starters={starters} decade={m.date.slice(0, 4)} marks={marks} />
                      </div>
                      <Bench used={usedSubs} unused={bench} decade={m.date.slice(0, 4)} marks={marks} />
                    </div>
                  ) : (
                    <div className="max-w-md">
                      <h3 className="display text-lg mb-3">Starting XI</h3>
                      <FormationPitch starters={starters} decade={m.date.slice(0, 4)} marks={marks} />
                    </div>
                  )}
                </>
              ) : (
                <>
                  {starters.length > 0 && (
                    <div>
                      <h3 className="display text-lg mb-3">Starting XI</h3>
                      <ul className="grid sm:grid-cols-2 gap-1.5 max-w-2xl text-sm">
                        {starters.map((p) => (
                          <li key={p.player_id ?? `${p.provider_id}-${p.player_display_name}`} className="flex items-center gap-2 border border-line rounded bg-panel px-3 py-1.5">
                            <span className="stat-num text-ink-faint w-6">{p.shirt ?? ""}</span>
                            {p.player_id ? (
                              <Link href={`/player/${p.player_id}`} className="hover:text-devil-bright flex-1">
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
                      <h3 className="display text-lg mb-3">Used substitutes</h3>
                      <ul className="grid sm:grid-cols-2 gap-1.5 max-w-2xl text-sm">
                        {usedSubs.map((p) => (
                          <li key={p.player_id ?? `${p.provider_id}-${p.player_display_name}`} className="flex items-center gap-2 border border-line rounded bg-panel px-3 py-1.5">
                            <span className="stat-num text-ink-faint w-6">{p.shirt ?? ""}</span>
                            {p.player_id ? (
                              <Link href={`/player/${p.player_id}`} className="hover:text-devil-bright flex-1">
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
                      <h3 className="display text-lg mb-3">Bench</h3>
                      <ul className="grid sm:grid-cols-2 gap-1.5 max-w-2xl text-sm">
                        {bench.map((p) => (
                          <li key={p.player_id ?? `${p.provider_id}-${p.player_display_name}`} className="flex items-center gap-2 border border-line rounded bg-panel px-3 py-1.5">
                            <span className="stat-num text-ink-faint w-6">{p.shirt ?? ""}</span>
                            {p.player_id ? (
                              <Link href={`/player/${p.player_id}`} className="hover:text-devil-bright flex-1">
                                {p.player_display_name}
                              </Link>
                            ) : (
                              <span className="flex-1">{p.player_display_name}</span>
                            )}
                            <span className="text-xs text-ink-faint">unused</span>
                          </li>
                        ))}
                      </ul>
                      <p className="text-xs text-ink-faint mt-2">
                        Bench rows are source evidence only; they do not count as appearances unless the player entered the match.
                      </p>
                    </div>
                  )}
                  {cards.length > 0 && (
                    <div>
                      <h3 className="display text-lg mb-3">Cards</h3>
                      <ul className="grid sm:grid-cols-2 gap-1.5 max-w-2xl text-sm">
                        {cards.map((e) => (
                          <li key={e.seq} className="flex items-center gap-2 border border-line rounded bg-panel px-3 py-1.5">
                            <span className={`stat-num w-10 ${e.type === "card-red" ? "text-loss" : "text-gold"}`}>
                              {e.minute != null ? `${e.minute}'` : ""}
                            </span>
                            <span className="font-medium flex-1">{e.player_display_name ?? "Player"}</span>
                            <span className="text-xs text-ink-faint">{e.player_side === "united" ? club : m.opponent_name}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              )}
            </div>
        </section>
      )}

      {/* Match facts + pre-match expectancy — supporting context, below the payoff. */}
      <dl className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-line border border-line rounded-lg overflow-hidden text-sm">
        {[
          ["Venue", m.stadium_name ?? venueLabel(m.venue)],
          ["Attendance", m.attendance ? fmtNum(m.attendance) : "—"],
          ["Manager", m.manager_name ?? "—"],
          ["Competition", m.competition_name],
        ].map(([k, v]) => (
          <div key={k} className="bg-panel px-3 py-2.5">
            <dt className="text-[11px] text-ink-faint uppercase tracking-wider">{k}</dt>
            <dd className="mt-0.5 truncate" title={String(v)}>{v}</dd>
          </div>
        ))}
      </dl>
      {m.notes && <p className="max-w-3xl text-sm text-ink-dim italic">{m.notes}</p>}

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

      <section>
        <details className="group">
          <summary className="mb-4 flex cursor-pointer list-none items-baseline justify-between gap-3">
            <h2 className="display text-xl">Context</h2>
            <span className="stat-num text-xs text-ink-faint">
              {contextParts.join(" · ")} ·{" "}
              <span className="text-devil-bright group-open:hidden">show</span>
              <span className="hidden text-devil-bright group-open:inline">hide</span>
            </span>
          </summary>
          <div className="space-y-8">
            <div className="grid sm:grid-cols-2 gap-8 max-w-3xl">
              <div>
                <h3 className="display text-lg mb-3">Head-to-head before</h3>
                {h2h.p > 0 ? (
                  <div className="space-y-3">
                    <WdlColumns w={h2h.w} d={h2h.d} l={h2h.l} />
                    <WdlBar w={h2h.w} d={h2h.d} l={h2h.l} size="md" />
                    <p className="text-xs text-ink-faint">
                      {h2h.p} previous meeting{h2h.p === 1 ? "" : "s"} with {m.opponent_name} ·{" "}
                      {pct(h2h.w, h2h.p)} win rate
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-ink-faint">First recorded meeting with {m.opponent_name}.</p>
                )}
              </div>
              <div>
                <h3 className="display text-lg mb-3">Form before</h3>
                <div className="flex gap-1.5">
                  {form.map((f) => (
                    <Link key={f.id} href={`/match/${f.id}`} title={`${f.date} ${f.venue} ${f.opponent_name} ${f.gf}-${f.ga}`}>
                      <ResultBadge result={f.result} outcome={f.outcome} />
                    </Link>
                  ))}
                  {form.length === 0 && <span className="text-sm text-ink-faint">First recorded match</span>}
                </div>
              </div>
            </div>

            {similar.length > 0 && (
              <div>
                <h3 className="display text-lg mb-3">This exact result, before</h3>
                <MatchList matches={similar} showSeason />
                <p className="text-xs text-ink-faint mt-2">
                  Other {m.venue === "A" ? "away" : m.venue === "H" ? "home" : "neutral"} meetings with{" "}
                  {m.opponent_name} that finished {m.gf}–{m.ga}.{" "}
                  <Link href={`/opponent/${m.opponent_id}`} className="text-devil-bright hover:underline">
                    Full head-to-head →
                  </Link>
                </p>
              </div>
            )}
          </div>
        </details>
      </section>

      {sources.length > 0 && (
        <section>
          <details className="group">
            <summary className="mb-4 flex cursor-pointer list-none items-baseline justify-between gap-3">
              <h2 className="display text-xl">Provenance</h2>
              <span className="stat-num text-xs text-ink-faint">
                {sourceSummary.size} source{sourceSummary.size === 1 ? "" : "s"} ·{" "}
                <span className="text-devil-bright group-open:hidden">show</span>
                <span className="hidden text-devil-bright group-open:inline">hide</span>
              </span>
            </summary>
          <div className="grid sm:grid-cols-2 gap-2 max-w-3xl">
            {[...sourceSummary.entries()].map(([id, s]) => (
              <div key={id} className="border border-line rounded-lg bg-panel px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    {s.url ? (
                      <a href={s.url} className="font-medium hover:text-devil-bright">{s.label}</a>
                    ) : (
                      <span className="font-medium">{s.label}</span>
                    )}
                    <div className="text-xs uppercase tracking-wider text-ink-faint mt-0.5">{s.kind}</div>
                  </div>
                  <Link href="/data" className="text-xs text-devil-bright hover:underline">Data</Link>
                </div>
                <p className="text-xs text-ink-faint mt-2">
                  {s.facets.sort().join(", ")}
                </p>
              </div>
            ))}
          </div>
          </details>
        </section>
      )}
    </div>
  );
}
