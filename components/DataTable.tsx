import Link from "next/link";

export type SortDirection = "asc" | "desc";

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
    hrefFor: (key: string, direction: SortDirection) => string;
  };
  density?: "comfortable" | "compact";
  className?: string;
}) {
  const densityClass = density === "compact" ? "data-table--compact" : "";

  return (
    <div className={`data-table-shell ${className}`}>
      {summary && <div className="data-table-summary">{summary}</div>}
      <div className="data-table-scroll">
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
                    <Link
                      href={sort.hrefFor(
                        c.sortKey,
                        sort.key === c.sortKey
                          ? sort.direction === "asc" ? "desc" : "asc"
                          : c.sortDefaultDirection ?? (c.numeric ? "desc" : "asc"),
                      )}
                      prefetch={false}
                      scroll={false}
                      className={`data-table-sort ${sort.key === c.sortKey ? "data-table-sort--active" : ""}`}
                      title={`Sort by ${c.sortLabel ?? c.label}`}
                    >
                      <span>{c.label}</span>
                      <span className="data-table-sort__mark" aria-hidden="true">
                        {sort.key === c.sortKey ? (sort.direction === "asc" ? "↑" : "↓") : "↕"}
                      </span>
                    </Link>
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
