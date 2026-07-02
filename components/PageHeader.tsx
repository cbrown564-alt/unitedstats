export function PageHeader({
  eyebrow,
  title,
  children,
  aside,
  /** On mobile, skip the title band when a hero plate follows — sr-only h1 remains. */
  deferOnMobile,
}: {
  eyebrow?: string;
  title: string;
  children?: React.ReactNode;
  aside?: React.ReactNode;
  deferOnMobile?: boolean;
}) {
  const header = (
    <header className="border-b border-line/80 pb-4 lg:pb-5">
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end lg:gap-4">
        <div>
          {eyebrow && (
            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-devil-bright lg:mb-2 lg:text-xs">
              {eyebrow}
            </p>
          )}
          <h1 className="display text-2xl sm:text-3xl">{title}</h1>
          {children && <div className="mt-1.5 max-w-2xl text-sm leading-6 text-ink-dim lg:mt-2">{children}</div>}
        </div>
        {aside}
      </div>
    </header>
  );

  if (!deferOnMobile) return header;

  return (
    <>
      <h1 className="sr-only lg:hidden">{title}</h1>
      <div className="hidden lg:block">{header}</div>
    </>
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