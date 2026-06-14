import Link from "next/link";
import { managersIndex } from "@/lib/queries";
import { WdlBar } from "@/components/WdlBar";
import { PageHeader } from "@/components/PageHeader";
import { fmtNum, pct } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Managers" };

export default function ManagersPage() {
  const managers = managersIndex().filter((m) => m.p > 0);

  return (
    <div className="space-y-6">
      <PageHeader title="Managers">
        Every man to pick the team since 1892: secretaries, caretakers, and knights of the realm.
      </PageHeader>
      <ul className="space-y-2">
        {managers.map((m) => (
          <li key={m.id}>
            <Link
              href={`/manager/${m.id}`}
              className="grid sm:grid-cols-[16rem_1fr_auto] items-center gap-x-6 gap-y-2 border border-line rounded-lg bg-panel hover:bg-panel-2 transition-colors px-4 py-3"
            >
              <span>
                <span className="font-semibold">{m.name}</span>
                <span className="block text-xs text-ink-faint">
                  {m.first?.slice(0, 4)}–{m.last?.slice(0, 4)} · {m.role}
                </span>
              </span>
              <WdlBar w={m.w} d={m.d} l={m.l} />
              <span className="stat-num text-xs text-ink-faint whitespace-nowrap">
                {fmtNum(m.p)} P · {pct(m.w, m.p)} W
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
