import Link from "next/link";
import { opponentsIndex } from "@/lib/queries";
import { WdlBar } from "@/components/WdlBar";
import { fmtNum, pct } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Opponents" };

export default function OpponentsPage() {
  const opponents = opponentsIndex();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="display text-3xl">Opponents</h1>
        <p className="text-sm text-ink-dim mt-1">
          {fmtNum(opponents.length)} clubs faced since 1886, most-played first.
        </p>
      </header>
      <ul className="space-y-1.5">
        {opponents.map((o) => (
          <li key={o.id}>
            <Link
              href={`/opponent/${o.id}`}
              className="grid grid-cols-[1fr_auto] sm:grid-cols-[16rem_1fr_auto] items-center gap-x-6 gap-y-1.5 border border-line rounded-lg bg-panel hover:bg-panel-2 transition-colors px-4 py-2.5"
            >
              <span>
                <span className="font-medium">{o.name}</span>
                <span className="block text-xs text-ink-faint stat-num">
                  {o.first.slice(0, 4)}–{o.last.slice(0, 4)}
                </span>
              </span>
              <WdlBar w={o.w} d={o.d} l={o.l} className="hidden sm:flex" />
              <span className="stat-num text-xs text-ink-faint whitespace-nowrap">
                {fmtNum(o.p)} P · {pct(o.w, o.p)} W
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
