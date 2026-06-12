import Link from "next/link";
import { notFound } from "next/navigation";
import {
  matchById, eventsForMatch, lineupForMatch, eloForMatch, h2hBefore, formBefore,
} from "@/lib/queries";
import { fmtDateLong, fmtNum, venueLabel, clubName, pct } from "@/lib/format";
import { ResultBadge } from "@/components/ResultBadge";

export const dynamic = "force-dynamic";

export default async function MatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const m = matchById(id);
  if (!m) notFound();
  const events = eventsForMatch(id);
  const lineup = lineupForMatch(id);
  const elo = eloForMatch(id);
  const h2h = h2hBefore(m.opponent_id, m.date);
  const form = formBefore(m.date, 6);
  const club = clubName(m.date);

  const goals = events.filter((e) => ["goal", "pen-goal", "own-goal-for"].includes(e.type));

  return (
    <div className="space-y-10">
      <header className="space-y-4">
        <nav className="text-sm text-ink-faint">
          <Link href={`/seasons/${m.season}`} className="hover:text-ink">{m.season}</Link>
          {" · "}
          <span>{m.competition_name}</span>
          {m.round && <span> · {m.round}</span>}
        </nav>
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-devil-bright font-semibold mb-2">
            {fmtDateLong(m.date)}
          </p>
          <h1 className="display text-3xl sm:text-5xl leading-tight">
            {m.venue === "A" ? (
              <>
                <Link href={`/opponent/${m.opponent_id}`} className="hover:text-devil-bright">{m.opponent_name}</Link>
                {" "}
                <span className="stat-num text-devil-bright">{m.ga}–{m.gf}</span> {club}
              </>
            ) : (
              <>
                {club}{" "}
                <span className="stat-num text-devil-bright">{m.gf}–{m.ga}</span>{" "}
                <Link href={`/opponent/${m.opponent_id}`} className="hover:text-devil-bright">{m.opponent_name}</Link>
              </>
            )}
          </h1>
          <p className="mt-2 text-sm text-ink-dim">
            {m.aet ? "After extra time. " : ""}
            {m.pen_gf != null ? `${club} ${m.outcome === "W" ? "won" : "lost"} ${m.pen_gf}–${m.pen_ga} on penalties. ` : ""}
            {m.ht_gf != null ? `Half-time ${m.venue === "A" ? `${m.ht_ga}–${m.ht_gf}` : `${m.ht_gf}–${m.ht_ga}`}. ` : ""}
          </p>
        </div>

        <dl className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-line border border-line rounded-lg overflow-hidden max-w-3xl text-sm">
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
        {m.notes && <p className="text-sm text-ink-dim italic max-w-3xl">{m.notes}</p>}
      </header>

      {goals.length > 0 && (
        <section>
          <h2 className="display text-xl mb-3">{club} goals</h2>
          <ul className="space-y-2 max-w-xl">
            {goals.map((e) => (
              <li key={e.seq} className="flex items-center gap-3 border border-line rounded-lg bg-panel px-4 py-2.5">
                <span className="stat-num text-devil-bright font-semibold w-10">
                  {e.minute != null ? `${e.minute}'` : "•"}
                </span>
                <span className="flex-1">
                  {e.player_id ? (
                    <Link href={`/player/${e.player_id}`} className="font-medium hover:text-devil-bright">
                      {e.player_name}
                    </Link>
                  ) : (
                    <span className="font-medium">{e.detail ?? "Goal"}</span>
                  )}
                  {e.type === "pen-goal" && <span className="text-xs text-ink-faint ml-1.5">(pen)</span>}
                  {e.type === "own-goal-for" && <span className="text-xs text-ink-faint ml-1.5">(og)</span>}
                  {e.assist_name && (
                    <span className="text-xs text-ink-faint ml-1.5">assist {e.assist_name}</span>
                  )}
                </span>
              </li>
            ))}
          </ul>
          {!m.events_complete && (
            <p className="text-xs text-ink-faint mt-2">
              Scorer data for this match may be incomplete.
            </p>
          )}
        </section>
      )}

      {lineup.length > 0 && (
        <section>
          <h2 className="display text-xl mb-3">Lineup</h2>
          <ul className="grid sm:grid-cols-2 gap-1.5 max-w-2xl text-sm">
            {lineup.map((p) => (
              <li key={p.player_id} className="flex items-center gap-2 border border-line rounded bg-panel px-3 py-1.5">
                <span className="stat-num text-ink-faint w-6">{p.shirt ?? ""}</span>
                <Link href={`/player/${p.player_id}`} className="hover:text-devil-bright flex-1">
                  {p.player_name}
                </Link>
                {p.role && <span className="text-xs text-ink-faint">{p.role}</span>}
                {!p.started && <span className="text-xs text-ink-faint">sub {p.sub_on != null ? `${p.sub_on}'` : ""}</span>}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="grid sm:grid-cols-2 gap-8 max-w-3xl">
        <div>
          <h2 className="display text-xl mb-3">Going into the match</h2>
          <div className="space-y-2 text-sm">
            {elo && (
              <p className="text-ink-dim">
                Elo {Math.round(elo.elo_pre)} v {Math.round(elo.opp_elo_pre)} — {club} were{" "}
                <span className="stat-num text-ink">{Math.round(elo.expected * 100)}%</span> favourites
                {" "}→ rating {elo.elo_post > elo.elo_pre ? "rose" : elo.elo_post < elo.elo_pre ? "fell" : "held"} to{" "}
                <span className="stat-num text-ink">{Math.round(elo.elo_post)}</span>.
              </p>
            )}
            <p className="text-ink-dim">
              Previous meetings with {m.opponent_name}:{" "}
              <span className="stat-num text-ink">{h2h.p}</span> played,{" "}
              <span className="stat-num text-win">{h2h.w}W</span>{" "}
              <span className="stat-num text-draw">{h2h.d}D</span>{" "}
              <span className="stat-num text-loss">{h2h.l}L</span>
              {h2h.p > 0 && <> ({pct(h2h.w, h2h.p)} win rate)</>}.
            </p>
          </div>
        </div>
        <div>
          <h2 className="display text-xl mb-3">Form before</h2>
          <div className="flex gap-1.5">
            {form.map((f) => (
              <Link key={f.id} href={`/match/${f.id}`} title={`${f.date} ${f.venue} ${f.opponent_name} ${f.gf}-${f.ga}`}>
                <ResultBadge result={f.result} outcome={f.outcome} />
              </Link>
            ))}
            {form.length === 0 && <span className="text-sm text-ink-faint">First recorded match</span>}
          </div>
        </div>
      </section>
    </div>
  );
}
