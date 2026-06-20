export function PageHeader({
  eyebrow,
  title,
  children,
  aside,
}: {
  eyebrow?: string;
  title: string;
  children?: React.ReactNode;
  aside?: React.ReactNode;
}) {
  return (
    <header className="border-b border-line/80 pb-5">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <div>
          {eyebrow && (
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-devil-bright">
              {eyebrow}
            </p>
          )}
          <h1 className="display text-3xl">{title}</h1>
          {children && <div className="mt-2 max-w-3xl text-sm leading-6 text-ink-dim">{children}</div>}
        </div>
        {aside}
      </div>
    </header>
  );
}

export function StatTile({
  label,
  value,
  detail,
  tone = "default",
}: {
  label: string;
  value: React.ReactNode;
  detail?: React.ReactNode;
  tone?: "default" | "red" | "gold";
}) {
  const toneClass =
    tone === "red" ? "text-devil-bright"
    : tone === "gold" ? "text-gold"
    : "text-ink";

  return (
    <div className="min-w-0 border border-line bg-panel px-3 py-2">
      <div className={`stat-num text-lg font-semibold ${toneClass}`}>{value}</div>
      <div className="mt-0.5 text-[11px] font-medium uppercase tracking-[0.14em] text-ink-faint">
        {label}
        {detail && (
          <span className="normal-case tracking-normal text-ink-dim">
            {" - "}
            {detail}
          </span>
        )}
      </div>
    </div>
  );
}

export function TrailLink({
  href,
  title,
  children,
}: {
  href: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="group block border border-line bg-panel px-4 py-3 transition-colors hover:border-devil/60 hover:bg-panel-2/70 focus-ring"
    >
      <span className="flex items-center justify-between gap-3">
        <span className="font-semibold text-ink group-hover:text-devil-bright">{title}</span>
        <span className="stat-num text-devil-bright" aria-hidden>
          →
        </span>
      </span>
      <span className="mt-1 block text-sm leading-5 text-ink-dim">{children}</span>
    </Link>
  );
}
import Link from "next/link";
