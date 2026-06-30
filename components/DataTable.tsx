import Link from "next/link";

export type SortDirection = "asc" | "desc";

/** Mobile card slot — identity is the row headline; metrics fill a compact grid. */
export type CardRole = "identity" | "metric" | "skip";

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
  /** Mobile register-card slot. Requires `registerCards` on the table. */
  card?: CardRole;
  /** Shorter metric label on mobile cards. Defaults to `label`. */
  cardLabel?: string;
  /** Card-only render; falls back to `render`. */
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

/** Card/list rhythm below sm — pairs with the table at sm+ inside `DataTable`. */
function RegisterCardList<T>({
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
    <ul className="register-card-list divide-y divide-line/60">
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
    </ul>
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
    /** Server mode: sortable headers are links to the next sort URL. */
    hrefFor?: (key: string, direction: SortDirection) => string;
    /** Client mode: sortable headers are buttons calling back with the next sort. */
    onSort?: (key: string, direction: SortDirection) => void;
  };
  density?: "comfortable" | "compact";
  className?: string;
  /** Below sm, render a card/list register instead of the horizontal table. */
  registerCards?: boolean;
  /** Full card override — when set, replaces the auto layout from column `card` roles. */
  renderMobileCard?: (row: T, index: number) => React.ReactNode;
}) {
  const densityClass = density === "compact" ? "data-table--compact" : "";

  return (
    <div className={`data-table-shell ${className}`}>
      {summary && <div className="data-table-summary">{summary}</div>}

      {registerCards && (
        <div className="sm:hidden">
          <RegisterCardList
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
