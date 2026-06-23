import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { monthDayKeys, onThisDay } from "@/lib/onThisDay";

export const dynamicParams = false;

export function generateStaticParams() {
  return monthDayKeys().map((monthDay) => ({ monthDay }));
}

export default async function OnThisDayPage({ params }: { params: Promise<{ monthDay: string }> }) {
  const { monthDay } = await params;
  if (!monthDayKeys().includes(monthDay)) notFound();
  const entry = onThisDay(monthDay);
  return (
    <div className="space-y-8">
      <PageHeader eyebrow="On this day" title={monthDay}>
        A deterministic slice of the official match record for this UTC month/day.
      </PageHeader>
      <section className="space-y-3">
        {entry.fallback ? (
          <p className="border border-line bg-panel p-4 text-sm text-ink-dim">{entry.fallback}</p>
        ) : (
          entry.facts.map((fact) => (
            <article key={fact.id} className="border border-line bg-panel p-4">
              <p className="stat-num text-xs text-ink-faint">{fact.date} · {fact.competition}</p>
              <h2 className="mt-1 text-lg font-semibold text-ink">United {fact.score} {fact.opponent}</h2>
              <p className="mt-2 text-sm text-ink-dim">{fact.text}</p>
              <Link href={fact.evidencePath} className="mt-3 inline-block text-sm font-semibold text-devil-bright hover:underline">
                Match evidence
              </Link>
            </article>
          ))
        )}
      </section>
    </div>
  );
}
