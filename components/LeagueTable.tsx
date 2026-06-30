"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { TrophyIcon } from "@/components/CampaignIcons";
import { CoverageNote } from "@/components/CoverageNote";
import type { SeasonLeagueTable, LeagueStanding } from "@/lib/queries";
import { clubName } from "@/lib/format";

/**
 * The classic final league table for the division United played in that season —
 * every club, ranked, with United's row lit. The full standings are computed from
 * the complete engsoccerdata results (see scripts/ingest/league-positions.ts), so
 * this is the genuine table, not United's row in a ghosted frame.
 *
 * Long First Division tables open as a United-centred *neighbourhood* (the
 * champions, the clubs either side of United, and the foot) with the skipped runs
 * collapsed into a "+N clubs" link; `expanded` (the page's `?table=full`) renders
 * every row. Small early divisions render whole. This is the progressive-disclosure
 * contract the players register and match archive use — no client JS, a server
 * round-trip on an anchor.
 *
 * Encodings, kept honest: the champions' row is gold-capped and United's is lit
 * devil-red (gold when they *are* champions); the foot of a top-flight table and
 * the head of a second-tier one carry a faint zone tint, but the exact
 * relegation/promotion counts varied by era, so the tint is indicative and the
 * CoverageNote says so — the firm claims are only "champions" and "where United
 * finished", which the data states exactly.
 */

const ANCHOR = "league-table";

/** A signed goal difference, +0 collapsed to 0. */
function gd(n: number): string {
  return n > 0 ? `+${n}` : String(n);
}

/** Which positions to keep when collapsing a long table around United. */
function neighbourhood(rows: LeagueStanding[], unitedPos: number): Set<number> {
  const n = rows.length;
  const keep = new Set<number>();
  keep.add(1); // champions
  for (let p = unitedPos - 2; p <= unitedPos + 2; p++) if (p >= 1 && p <= n) keep.add(p);
  keep.add(n - 1);
  keep.add(n); // the foot
  return keep;
}

function HeadCell({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <th
      scope="col"
      className={`px-2 py-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-faint ${className}`}
    >
      {children}
    </th>
  );
}

export function LeagueTable({
  table,
  season,
}: {
  table: SeasonLeagueTable;
  season: string;
}) {
  // The page is statically prerendered, so the expand/collapse state lives here,
  // hydrated from `?table=full` for deep links and reflected back without a
  // server round-trip (the previous behaviour was an anchor link round-trip).
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("table") !== "full") return;
    const frame = window.requestAnimationFrame(() => setExpanded(true));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  function toggle(next: boolean) {
    setExpanded(next);
    const url = new URL(window.location.href);
    if (next) url.searchParams.set("table", "full");
    else url.searchParams.delete("table");
    url.hash = ANCHOR;
    window.history.replaceState(null, "", url);
  }

  const { rows, competition_name, competition_id } = table;
  const n = rows.length;
  const topFlight = competition_id === "first-division" || competition_id === "premier-league";
  const unitedRow = rows.find((r) => r.is_united === 1);
  const unitedPos = unitedRow?.position ?? null;
  const startYear = Number(season.slice(0, 4));

  // Collapse only when there's a clear win — a long table and a known United row.
  const collapsible = !expanded && unitedPos != null && n > 13;
  const keep = collapsible ? neighbourhood(rows, unitedPos) : null;

  // Build the render list, threading "+N clubs" elision rows through the gaps the
  // neighbourhood skips, each a link that expands the table in place.
  type Render = { kind: "row"; row: LeagueStanding } | { kind: "gap"; count: number; from: number };
  const list: Render[] = [];
  if (keep) {
    let prev = 0;
    for (const row of rows) {
      if (!keep.has(row.position)) continue;
      const gapCount = row.position - prev - 1;
      if (gapCount > 0) list.push({ kind: "gap", count: gapCount, from: prev + 1 });
      list.push({ kind: "row", row });
      prev = row.position;
    }
  } else {
    for (const row of rows) list.push({ kind: "row", row });
  }

  const num = "px-2 py-1.5 text-right stat-num tabular-nums";

  function rowMeta(r: LeagueStanding) {
    const united = r.is_united === 1;
    const champ = r.position === 1;
    const zone = topFlight ? r.position > n - 3 : r.position <= 3;
    const name = united ? clubName(`${startYear}-08-01`) : r.team;
    const accent = united
      ? champ
        ? "border-l-2 border-l-gold"
        : "border-l-2 border-l-devil-bright"
      : champ
        ? "border-l-2 border-l-gold/45"
        : "border-l-2 border-l-transparent";
    const rowTone = united ? (champ ? "bg-gold/10" : "bg-devil/12") : "";
    const posTone = champ
      ? "font-semibold text-gold"
      : zone
        ? topFlight
          ? "text-loss/80"
          : "text-win/80"
        : "text-ink-faint";
    const nameTone = united
      ? champ
        ? "font-semibold text-gold"
        : "font-semibold text-devil-bright"
      : "text-ink";
    const ptsTone = united ? (champ ? "text-gold" : "text-ink") : "text-ink";
    return { united, champ, name, accent, rowTone, posTone, nameTone, ptsTone };
  }

  function clubLabel(r: LeagueStanding, meta: ReturnType<typeof rowMeta>) {
    return (
      <span className="flex min-w-0 items-center gap-1.5">
        {meta.champ && <TrophyIcon className="h-3 w-3 shrink-0 text-gold" />}
        <span className={`truncate ${meta.nameTone}`}>{meta.name}</span>
      </span>
    );
  }

  return (
    <section id={ANCHOR} className="scroll-mt-24">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-x-4 gap-y-1">
        <div>
          <h2 className="display text-xl leading-none">The {competition_name} table</h2>
          <p className="mt-1.5 text-[11px] text-ink-faint">
            Final standings · {n} clubs
            {collapsible ? " · United and the clubs around them" : ""}
          </p>
        </div>
        {unitedPos != null && n > 13 && (
          <button
            type="button"
            onClick={() => toggle(!expanded)}
            className="rounded-md border border-line bg-panel px-2.5 py-1 text-xs text-ink-dim transition-colors hover:border-devil/50 hover:text-ink focus-ring"
          >
            {expanded ? "Collapse around United" : "Show the full table"}
          </button>
        )}
      </div>

      <div className="overflow-hidden rounded-xl border border-line bg-panel">
        {/* Mobile: leaderboard row — position · club · points (scan the table). */}
        <ol className="register-card-list divide-y divide-line/50 sm:hidden">
          {list.map((item) => {
            if (item.kind === "gap") {
              return (
                <li key={`gap-${item.from}`} className="register-card-item px-3.5 py-2 text-center">
                  <button
                    type="button"
                    onClick={() => toggle(true)}
                    className="text-[11px] text-ink-faint transition-colors hover:text-devil-bright focus-ring"
                  >
                    + {item.count} {item.count === 1 ? "club" : "clubs"}
                  </button>
                </li>
              );
            }
            const r = item.row;
            const meta = rowMeta(r);
            const href = !meta.united && r.opponent_id ? `/opponent/${r.opponent_id}` : undefined;
            const inner = (
              <>
                <span className={`stat-num w-6 shrink-0 text-right text-xs tabular-nums ${meta.posTone}`}>
                  {r.position}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-col gap-1.5">
                    {clubLabel(r, meta)}
                    <span className="stat-num truncate text-[11px] leading-tight text-ink-faint">
                      {r.p}P · {r.w}W {r.d}D {r.l}L · GD {gd(r.gf - r.ga)}
                    </span>
                  </span>
                </span>
                <span className={`stat-num shrink-0 text-base font-semibold tabular-nums leading-none ${meta.ptsTone}`}>
                  {r.pts}
                </span>
              </>
            );
            const rowClass = `register-leaderboard-row flex min-h-[3.25rem] items-center gap-2.5 px-3.5 py-2 transition-colors ${meta.accent} ${meta.rowTone} focus-ring`;
            return (
              <li key={r.position} className="register-card-item">
                {href ? (
                  <Link href={href} className={`${rowClass} hover:bg-panel-2`}>
                    {inner}
                  </Link>
                ) : (
                  <div className={rowClass}>{inner}</div>
                )}
              </li>
            );
          })}
        </ol>

        <div className="hidden overflow-x-auto sm:block">
        <table className="w-full min-w-[34rem] border-collapse text-sm">
          <thead>
            <tr className="border-b border-line bg-panel-2/40">
              <HeadCell className="w-10 text-center">#</HeadCell>
              <HeadCell className="text-left">Club</HeadCell>
              <HeadCell className="text-right">P</HeadCell>
              <HeadCell className="text-right">W</HeadCell>
              <HeadCell className="text-right">D</HeadCell>
              <HeadCell className="text-right">L</HeadCell>
              <HeadCell className="text-right">GF</HeadCell>
              <HeadCell className="text-right">GA</HeadCell>
              <HeadCell className="text-right">GD</HeadCell>
              <HeadCell className="text-right pr-3">Pts</HeadCell>
            </tr>
          </thead>
          <tbody>
            {list.map((item) => {
              if (item.kind === "gap") {
                return (
                  <tr key={`gap-${item.from}`} className="border-b border-line/60">
                    <td colSpan={10} className="px-2 py-1.5 text-center">
                      <button
                        type="button"
                        onClick={() => toggle(true)}
                        className="text-[11px] text-ink-faint transition-colors hover:text-devil-bright focus-ring"
                      >
                        + {item.count} {item.count === 1 ? "club" : "clubs"}
                      </button>
                    </td>
                  </tr>
                );
              }
              const r = item.row;
              const meta = rowMeta(r);

              return (
                <tr
                  key={r.position}
                  className={`border-b border-line/70 last:border-b-0 ${meta.accent} ${meta.rowTone} ${
                    meta.united ? "" : "hover:bg-panel-2/40"
                  }`}
                >
                  <td className="px-2 py-1.5 text-center">
                    <span className={`stat-num tabular-nums text-xs ${meta.posTone}`}>{r.position}</span>
                  </td>
                  <td className="px-2 py-1.5">
                    {!meta.united && r.opponent_id ? (
                      <Link
                        href={`/opponent/${r.opponent_id}`}
                        className="flex min-w-0 items-center gap-1.5 truncate text-ink transition-colors hover:text-devil-bright hover:underline focus-ring"
                      >
                        {meta.champ && <TrophyIcon className="h-3 w-3 shrink-0 text-gold" />}
                        {meta.name}
                      </Link>
                    ) : (
                      clubLabel(r, meta)
                    )}
                  </td>
                  <td className={`${num} text-ink-dim`}>{r.p}</td>
                  <td className={`${num} text-ink-dim`}>{r.w}</td>
                  <td className={`${num} text-ink-dim`}>{r.d}</td>
                  <td className={`${num} text-ink-dim`}>{r.l}</td>
                  <td className={`${num} text-ink-dim`}>{r.gf}</td>
                  <td className={`${num} text-ink-dim`}>{r.ga}</td>
                  <td
                    className={`${num} ${
                      r.gf - r.ga > 0 ? "text-win" : r.gf - r.ga < 0 ? "text-loss" : "text-ink-dim"
                    }`}
                  >
                    {gd(r.gf - r.ga)}
                  </td>
                  <td
                    className={`px-2 py-1.5 pr-3 text-right stat-num tabular-nums font-semibold ${meta.ptsTone}`}
                  >
                    {r.pts}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>
      </div>

      <CoverageNote
        slice={`the final ${competition_name} table for ${season}, every club computed from the full league results.`}
        coverage="complete — all results known."
      >
        Points follow the era’s rule (two then three for a win); the order uses goal
        average before 1976–77 and goal difference after.{" "}
        {topFlight
          ? "The faint foot marks the lower reaches — exact relegation places varied by era."
          : "The faint head marks the promotion places — exact counts varied by era."}
      </CoverageNote>
    </section>
  );
}
