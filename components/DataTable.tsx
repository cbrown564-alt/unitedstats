import Link from "next/link";

export type SortDirection = "asc" | "desc";

/** Mobile register slot — identity/figure for leaderboard rows; metric for stat grids. */
type CardRole = "identity" | "metric" | "figure" | "skip";

export interface Column<T> {
  label: string;
  key?: string;
  /** Numeric columns are right-aligned and set in mono. */
  numeric?: boolean;
  /** Tailwind responsive visibility, e.g. "hidden sm:table-cell". */
  hideBelow?: string;
  className?: string;
  headerClassName?: string;
  sortKey?: string;
  sortDefaultDirection?: SortDirection;
  sortLabel?: string;
  render: (row: T, index: number) => React.ReactNode;
  /** Mobile register slot. Requires `registerCards` on the table. */
  card?: CardRole;
  /** Shorter metric label on mobile stat grids. Defaults to `label`. */
  cardLabel?: string;
  /** Mobile-only render; falls back to `render`. */
  cardRender?: (row: T, index: number) => React.ReactNode;
}

function SortHeader<T>({
  column: c,
  sort,
}: {
  column: Column<T>;
  sort: NonNullable<Parameters<typeof DataTable<T>>[0]["sort"]>;
}) {
  const active = sort.key === c.sortKey;
  const nextDir: SortDirection = active
    ? sort.direction === "asc" ? "desc" : "asc"
    : c.sortDefaultDirection ?? (c.numeric ? "desc" : "asc");
  const cls = `data-table-sort ${active ? "data-table-sort--active" : ""}`;
  const title = `Sort by ${c.sortLabel ?? c.label}`;
  const inner = (
    <>
      <span>{c.label}</span>
      <span className="data-table-sort__mark" aria-hidden="true">
        {active ? (sort.direction === "asc" ? "↑" : "↓") : "↕"}
      </span>
    </>
  );
  if (sort.onSort) {
    return (
      <button
        type="button"
        onClick={() => sort.onSort!(c.sortKey!, nextDir)}
        className={`${cls} cursor-pointer appearance-none border-0 bg-transparent p-0`}
        title={title}
      >
        {inner}
      </button>
    );
  }
  return (
    <Link
      href={sort.hrefFor!(c.sortKey!, nextDir)}
      prefetch={false}
      scroll={false}
      className={cls}
      title={title}
    >
      {inner}
    </Link>
  );
}

function figureColumn<T>(columns: Column<T>[], sortKey: string): Column<T> | undefined {
  const active = columns.find((c) => c.sortKey === sortKey && c.card !== "identity");
  if (active) return active;
  return columns.find((c) => c.card === "figure");
}

/** Stat grid below sm — for timelines/registers where every field earns a row. */
function RegisterMetricList<T>({
  columns,
  rows,
  rowKey,
  emptyState,
  renderMobileCard,
}: {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  emptyState: React.ReactNode;
  renderMobileCard?: (row: T, index: number) => React.ReactNode;
}) {
  if (rows.length === 0) {
    return <div className="register-card-empty">{emptyState}</div>;
  }

  const identityCol = columns.find((c) => c.card === "identity");
  const metricCols = columns.filter((c) => c.card === "metric");

  return (
    <ol className="register-card-list divide-y divide-line/60">
      {rows.map((row, index) => {
        if (renderMobileCard) {
          return (
            <li key={rowKey(row)} className="register-card-item">
              {renderMobileCard(row, index)}
            </li>
          );
        }

        const cell = (col: Column<T>) => (col.cardRender ?? col.render)(row, index);

        return (
          <li key={rowKey(row)} className="register-card-item px-4 py-3">
            {identityCol && <div className="register-card__identity min-w-0">{cell(identityCol)}</div>}
            {metricCols.length > 0 && (
              <dl
                className={`register-card__metrics grid grid-cols-2 gap-x-4 gap-y-2 ${
                  identityCol ? "mt-2.5" : ""
                } ${metricCols.length >= 5 ? "sm:grid-cols-3" : ""}`}
              >
                {metricCols.map((col) => (
                  <div key={col.key ?? col.label} className="min-w-0">
                    <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-faint">
                      {col.cardLabel ?? col.label}
                    </dt>
                    <dd
                      className={`stat-num mt-0.5 text-sm tabular-nums leading-tight ${
                        col.numeric ? "" : "font-medium text-ink"
                      }`}
                    >
                      {cell(col)}
                    </dd>
                  </div>
                ))}
              </dl>
            )}
          </li>
        );
      })}
    </ol>
  );
}

/** Ranked scan column below sm — rank · identity · sort-key figure (Leaderboard rhythm). */
function RegisterLeaderboardList<T>({
  columns,
  rows,
  rowKey,
  emptyState,
  sort,
  subline,
  figureTone,
  hrefForRow,
  renderMobileCard,
}: {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  emptyState: React.ReactNode;
  sort: { key: string; direction: SortDirection };
  subline?: (row: T, index: number, sortKey: string) => React.ReactNode;
  figureTone?: (sortKey: string) => string;
  hrefForRow?: (row: T) => string | undefined;
  renderMobileCard?: (row: T, index: number) => React.ReactNode;
}) {
  if (rows.length === 0) {
    return <div className="register-card-empty">{emptyState}</div>;
  }

  const identityCol = columns.find((c) => c.card === "identity");
  const figureCol = figureColumn(columns, sort.key);
  const tone = figureTone?.(sort.key) ?? "text-ink";

  return (
    <ol className="register-card-list divide-y divide-line/50">
      {rows.map((row, index) => {
        if (renderMobileCard) {
          return (
            <li key={rowKey(row)} className="register-card-item">
              {renderMobileCard(row, index)}
            </li>
          );
        }

        const cell = (col: Column<T>) => (col.cardRender ?? col.render)(row, index);
        const href = hrefForRow?.(row);
        const quiet = subline?.(row, index, sort.key);
        const inner = (
          <>
            <span className="stat-num w-5 shrink-0 text-right text-xs text-ink-faint">{index + 1}</span>
            <span className="min-w-0 flex-1">
              <span className="flex flex-col gap-1.5">
                {identityCol ? cell(identityCol) : null}
                {quiet && (
                  <span className="stat-num block truncate pl-[2.375rem] text-[11px] leading-tight text-ink-faint">
                    {quiet}
                  </span>
                )}
              </span>
            </span>
            {figureCol && (
              <span className={`stat-num shrink-0 text-base font-semibold tabular-nums leading-none ${tone}`}>
                {cell(figureCol)}
              </span>
            )}
          </>
        );

        const rowClass =
          "register-leaderboard-row flex min-h-[3.25rem] items-center gap-2.5 px-3.5 py-2 transition-colors hover:bg-panel-2 focus-ring";

        return (
          <li key={rowKey(row)} className="register-card-item">
            {href ? (
              <Link href={href} className={rowClass}>
                {inner}
              </Link>
            ) : (
              <div className={rowClass}>{inner}</div>
            )}
          </li>
        );
      })}
    </ol>
  );
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  caption,
  summary,
  emptyState = "No rows match the current filters.",
  sort,
  density = "comfortable",
  className = "",
  registerCards = false,
  registerLayout = "metrics",
  registerSubline,
  registerFigureTone,
  registerHref,
  renderMobileCard,
}: {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  caption?: string;
  summary?: React.ReactNode;
  emptyState?: React.ReactNode;
  sort?: {
    key: string;
    direction: SortDirection;
    hrefFor?: (key: string, direction: SortDirection) => string;
    onSort?: (key: string, direction: SortDirection) => void;
  };
  density?: "comfortable" | "compact";
  className?: string;
  /** Below sm, render a register list instead of the horizontal table. */
  registerCards?: boolean;
  /** `leaderboard` — rank · name · sort-key figure; `metrics` — labelled stat grid. */
  registerLayout?: "leaderboard" | "metrics";
  /** Quiet line under the identity on leaderboard rows. */
  registerSubline?: (row: T, index: number, sortKey: string) => React.ReactNode;
  /** Figure colour class from the active sort key (e.g. goals → devil-red). */
  registerFigureTone?: (sortKey: string) => string;
  /** Row link for leaderboard mode. */
  registerHref?: (row: T) => string | undefined;
  renderMobileCard?: (row: T, index: number) => React.ReactNode;
}) {
  const densityClass = density === "compact" ? "data-table--compact" : "";

  return (
    <div className={`data-table-shell ${className}`}>
      {summary && <div className="data-table-summary">{summary}</div>}

      {registerCards && sort && registerLayout === "leaderboard" && (
        <div className="sm:hidden">
          <RegisterLeaderboardList
            columns={columns}
            rows={rows}
            rowKey={rowKey}
            emptyState={emptyState}
            sort={sort}
            subline={registerSubline}
            figureTone={registerFigureTone}
            hrefForRow={registerHref}
            renderMobileCard={renderMobileCard}
          />
        </div>
      )}

      {registerCards && (registerLayout === "metrics" || !sort) && (
        <div className="sm:hidden">
          <RegisterMetricList
            columns={columns}
            rows={rows}
            rowKey={rowKey}
            emptyState={emptyState}
            renderMobileCard={renderMobileCard}
          />
        </div>
      )}

      <div className={`data-table-scroll ${registerCards ? "hidden sm:block" : ""}`}>
        <table className={`data-table ${densityClass}`}>
          {caption && <caption className="sr-only">{caption}</caption>}
          <thead>
            <tr>
              {columns.map((c) => (
                <th
                  key={c.key ?? c.label}
                  scope="col"
                  aria-sort={
                    c.sortKey && sort?.key === c.sortKey
                      ? sort.direction === "asc" ? "ascending" : "descending"
                      : undefined
                  }
                  className={`${c.numeric ? "data-table__numeric" : ""} ${c.hideBelow ?? ""} ${c.headerClassName ?? ""}`}
                >
                  {c.sortKey && sort ? (
                    <SortHeader column={c} sort={sort} />
                  ) : (
                    c.label
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length > 0 ? rows.map((row, index) => (
              <tr key={rowKey(row)}>
                {columns.map((c) => (
                  <td
                    key={c.key ?? c.label}
                    className={`${c.numeric ? "data-table__numeric stat-num" : ""} ${c.hideBelow ?? ""} ${c.className ?? ""}`}
                  >
                    {c.render(row, index)}
                  </td>
                ))}
              </tr>
            )) : (
              <tr>
                <td colSpan={columns.length} className="data-table-empty">
                  {emptyState}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
