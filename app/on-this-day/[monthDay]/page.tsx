import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader, StatTile } from "@/components/PageHeader";
import { CompetitionChip } from "@/components/CompetitionChip";
import { ResultBadge } from "@/components/ResultBadge";
import { WdlBar } from "@/components/WdlBar";
import { venueLabel } from "@/lib/format";
import { monthDayKeys, monthDayLabel, onThisDay } from "@/lib/onThisDay";

export const dynamicParams = false;

const REST_CAP = 14;

export function generateStaticParams() {
  return monthDayKeys().map((monthDay) => ({ monthDay }));
}

export async function generateMetadata({ params }: { params: Promise<{ monthDay: string }> }): Promise<Metadata> {
  const { monthDay } = await params;
  if (!monthDayKeys().includes(monthDay)) return {};
  const entry = onThisDay(monthDay);
  const title = `On this day — ${entry.label}`;
  const description = entry.lead
    ? `${entry.lead.year}: ${entry.lead.scoreline}. ${entry.rhythm?.played ?? 0} United matches on ${entry.label} across the years.`
    : `No official United match is recorded on ${entry.label}.`;
  return { title, description, openGraph: { title: `${title} · Red Thread`, description } };
}

export default async function OnThisDayPage({ params }: { params: Promise<{ monthDay: string }> }) {
  const { monthDay } = await params;
  if (!monthDayKeys().includes(monthDay)) notFound();
  const entry = onThisDay(monthDay);
  const { lead, rest, rhythm } = entry;

  return (
    <div className="space-y-7">
      <PageHeader eyebrow="On this day" title={entry.label}>
        {entry.fallback
          ? "Nothing in the record fell on this date — step a day either way."
          : "United's matches on this date, across the years — the standout first."}
      </PageHeader>

      <nav className="flex items-center justify-between gap-3 text-sm" aria-label="Day navigation">
        <Link href={`/on-this-day/${entry.prev}`} className="text-ink-dim hover:text-devil-bright focus-ring">
          ‹ {monthDayLabel(entry.prev)}
        </Link>
        <Link
          href="/on-this-day"
          className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-faint hover:text-devil-bright focus-ring"
        >
          Today
        </Link>
        <Link href={`/on-this-day/${entry.next}`} className="text-ink-dim hover:text-devil-bright focus-ring">
          {monthDayLabel(entry.next)} ›
        </Link>
      </nav>

      {entry.fallback ? (
        <p className="rounded-xl border border-line bg-panel p-5 text-sm text-ink-dim">{entry.fallback}</p>
      ) : (
        <>
          {lead && (
            <section className="relative overflow-hidden rounded-xl border border-line bg-panel shadow-[0_22px_44px_rgb(0_0_0/0.22)]">
              <div className="hero-grid pointer-events-none absolute inset-0 opacity-50" aria-hidden />
              <div
                className="pointer-events-none absolute -right-20 -top-24 h-64 w-2/3 rounded-full opacity-[0.10] blur-3xl"
                style={{ backgroundColor: "var(--color-gold)" }}
                aria-hidden
              />
              <div className="relative space-y-4 p-5 sm:p-6">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                  <span className="stat-num text-2xl font-semibold text-gold">{lead.year}</span>
                  <CompetitionChip type={lead.competitionType} name={lead.competition} round={lead.round} />
                  {lead.note && (
                    <span className="text-xs font-semibold uppercase tracking-[0.14em] text-devil-bright">{lead.note}</span>
                  )}
                </div>
                <div className="flex items-start gap-3">
                  <ResultBadge result={lead.result} />
                  <h2 className="display text-2xl leading-tight sm:text-3xl">{lead.scoreline}</h2>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm text-ink-dim">
                    {venueLabel(lead.venue)} · {lead.season}
                  </p>
                  <Link href={lead.evidencePath} className="text-sm font-semibold text-devil-bright hover:underline focus-ring">
                    Match evidence →
                  </Link>
                </div>
              </div>
            </section>
          )}

          {rhythm && (
            <section className="rounded-xl border border-line bg-panel p-5">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-faint">The record on {entry.label}</h2>
                <span className="stat-num text-xs text-ink-faint">
                  {rhythm.played} played · {rhythm.firstYear}–{rhythm.lastYear}
                </span>
              </div>
              <div className="mt-3 flex items-center gap-4">
                <span className="stat-num shrink-0 text-sm text-ink-dim">{rhythm.winRate}% won</span>
                <WdlBar w={rhythm.w} d={rhythm.d} l={rhythm.l} size="md" showLabels className="flex-1" />
              </div>
              {(rhythm.biggestWin || rhythm.topOpponent) && (
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {rhythm.biggestWin && (
                    <StatTile
                      label="Biggest win"
                      tone="gold"
                      value={
                        <Link href={rhythm.biggestWin.evidencePath} className="hover:underline focus-ring">
                          {rhythm.biggestWin.gf}-{rhythm.biggestWin.ga} {rhythm.biggestWin.opponent}
                        </Link>
                      }
                      detail={rhythm.biggestWin.year}
                    />
                  )}
                  {rhythm.topOpponent && (
                    <StatTile
                      label="Most-faced on this date"
                      value={rhythm.topOpponent.name}
                      detail={`${rhythm.topOpponent.count} meetings`}
                    />
                  )}
                </div>
              )}
            </section>
          )}

          {rest.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-faint">
                Every {entry.label} in the record
              </h2>
              <ul className="divide-y divide-line/60 overflow-hidden rounded-xl border border-line bg-panel">
                {rest.slice(0, REST_CAP).map((m) => (
                  <li key={m.id}>
                    <Link href={m.evidencePath} className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-panel-2 focus-ring">
                      <span className="stat-num w-10 shrink-0 text-xs text-ink-faint">{m.year}</span>
                      <ResultBadge result={m.result} />
                      <span className="min-w-0 flex-1 truncate text-sm text-ink">
                        United {m.gf}-{m.ga} <span className="text-ink-dim">{m.opponent}</span>
                      </span>
                      <span className="hidden max-w-[38%] shrink-0 truncate text-xs text-ink-faint sm:block">{m.competition}</span>
                    </Link>
                  </li>
                ))}
              </ul>
              {rest.length > REST_CAP && (
                <p className="text-xs text-ink-faint">…and {rest.length - REST_CAP} more on this date.</p>
              )}
            </section>
          )}
        </>
      )}
    </div>
  );
}
