import Link from "next/link";
import { awayFootprint, travelBySeason, travelCoverage, MANCHESTER } from "@/lib/spatial";
import { AreaChart } from "@/components/charts";
import { ChartPanel } from "@/components/ChartPanel";
import { CoverageNote } from "@/components/CoverageNote";
import { DataTable } from "@/components/DataTable";
import { GeoScatter } from "@/components/GeoScatter";
import { fmtNum, pct } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "The away map" };

const BRITAIN: [number, number, number, number] = [49.8, 56.3, -7.6, 2.3];
const EUROPE: [number, number, number, number] = [34, 61.5, -11, 36];

export default function TravelPage() {
  const footprint = awayFootprint();
  const seasons = travelBySeason();
  const coverage = travelCoverage();
  const domestic = footprint.filter((v) => v.european === 0);
  const european = footprint.filter((v) => v.european > 0);
  const farthest = [...footprint].sort((a, b) => b.km - a.km).slice(0, 12);
  const beyondEurope = european.filter(
    (v) => v.lat < EUROPE[0] || v.lat > EUROPE[1] || v.lng < EUROPE[2] || v.lng > EUROPE[3],
  );

  return (
    <div className="space-y-12">
      <header>
        <nav className="text-sm text-ink-faint mb-2">
          <Link href="/analytics" className="hover:text-ink">Analytics</Link>
          <span className="mx-1.5">/</span>
          <span className="text-ink-dim">Travel</span>
        </nav>
        <h1 className="display text-3xl">The away map</h1>
        <p className="text-sm text-ink-dim mt-1 max-w-2xl">
          Where {fmtNum(coverage.covered)} official away matches have taken the club, and how far a
          season&apos;s travel stretched as the league grew, Europe opened, and the fixture list
          globalized. Distances are one-way from Manchester to each opponent&apos;s home town, city
          level by design.
        </p>
      </header>

      <section>
        <ChartPanel
          title="Average away trip per season"
          slice={`mean one-way distance of each season's official away matches, ${seasons[0]?.season}–${seasons[seasons.length - 1]?.season}.`}
          coverage={`opponent home towns are mapped for ${fmtNum(coverage.covered)} of ${fmtNum(coverage.total)} official away matches.`}
          note={
            <>
              The flat early decades are the Football League&apos;s northern core; the step changes
              are the First Division&apos;s southern spread and then European competition from 1956.
              Spikes mark continental and intercontinental seasons.
            </>
          }
        >
          <AreaChart
            points={seasons.map((s) => ({ x: Number(s.season.slice(0, 4)), y: Math.round(s.avgKm) }))}
            height={220}
            labels={[1900, 1930, 1960, 1990, 2020].map((y) => ({ x: y, text: String(y) }))}
          />
        </ChartPanel>
      </section>

      <section className="grid lg:grid-cols-2 gap-8">
        <ChartPanel
          title="The league footprint"
          slice={`${fmtNum(domestic.reduce((a, v) => a + v.p, 0))} away matches at ${domestic.length} domestic grounds. Dot size is visit count.`}
          evidenceHref="/matches?venue=A&type=league"
          evidenceLabel="Away league matches →"
        >
          <GeoScatter
            points={domestic.map((v) => ({ lat: v.lat, lng: v.lng, label: v.name, value: v.p }))}
            origin={{ ...MANCHESTER, label: "Manchester" }}
            bounds={BRITAIN}
            labelTop={6}
          />
        </ChartPanel>
        <ChartPanel
          title="European nights"
          slice={`${fmtNum(european.reduce((a, v) => a + v.p, 0))} away matches at clubs met in Europe. Dot size is visit count.`}
          evidenceHref="/matches?venue=A&type=european"
          evidenceLabel="Away European matches →"
          note={
            beyondEurope.length > 0 ? (
              <>
                Beyond this frame:{" "}
                {beyondEurope.map((v) => `${v.name} (${Math.round(v.km).toLocaleString("en-GB")} km)`).join(", ")}.
              </>
            ) : undefined
          }
        >
          <GeoScatter
            points={european.map((v) => ({ lat: v.lat, lng: v.lng, label: v.name, value: v.p }))}
            origin={{ ...MANCHESTER, label: "Manchester" }}
            bounds={EUROPE}
            labelTop={8}
            dotColor="var(--color-gold)"
          />
        </ChartPanel>
      </section>

      <section>
        <h2 className="display text-xl mb-3">The longest trips</h2>
        <DataTable
          columns={[
            {
              label: "Opponent",
              render: (v: (typeof farthest)[number]) => (
                <Link href={`/opponent/${v.id}`} className="font-medium hover:text-devil-bright">
                  {v.name}
                </Link>
              ),
            },
            { label: "Country", hideBelow: "hidden sm:table-cell", render: (v) => v.country ?? "" },
            { label: "Distance", numeric: true, render: (v) => `${fmtNum(Math.round(v.km))} km` },
            { label: "Visits", numeric: true, render: (v) => v.p },
            { label: "W–D–L", numeric: true, render: (v) => `${v.w}–${v.d}–${v.l}` },
            { label: "Won", numeric: true, hideBelow: "hidden sm:table-cell", render: (v) => pct(v.w, v.p) },
            {
              label: "Visited",
              numeric: true,
              hideBelow: "hidden md:table-cell",
              render: (v) => (v.first.slice(0, 4) === v.last.slice(0, 4) ? v.first.slice(0, 4) : `${v.first.slice(0, 4)}–${v.last.slice(0, 4)}`),
            },
          ]}
          rows={farthest}
          rowKey={(v) => v.id}
        />
        <CoverageNote slice="official away matches ranked by one-way distance from Manchester; each opponent links to the full head-to-head." />
      </section>

      <section>
        <h2 className="display text-xl mb-3">Why there are no shot maps yet</h2>
        <div className="border border-line rounded-lg bg-panel p-4 max-w-3xl">
          <p className="text-sm text-ink-dim">
            The canonical record holds scorers, minutes, assists, cards, and lineups, but no source
            in the dataset records shot or goal coordinates for any era. Rather than draw an
            illustrative pitch from data that does not exist, this page stays with the spatial data
            that is real: geography. If a licensable source of shot locations appears for the modern
            era, the event model already has room for it as a new facet with its own coverage note.
          </p>
          <CoverageNote evidenceHref="/data" evidenceLabel="How the record is sourced →" />
        </div>
      </section>
    </div>
  );
}
