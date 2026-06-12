/**
 * Dense table with the house conventions: bordered, compact rows, uppercase
 * header, numeric columns right-aligned in mono. Keeps record tables
 * consistent without hand-rolling thead/tbody on every page.
 */
export interface Column<T> {
  label: string;
  /** Numeric columns are right-aligned and set in mono. */
  numeric?: boolean;
  /** Tailwind responsive visibility, e.g. "hidden sm:table-cell". */
  hideBelow?: string;
  render: (row: T) => React.ReactNode;
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  stickyHeader = false,
}: {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  stickyHeader?: boolean;
}) {
  return (
    <div className="overflow-x-auto border border-line rounded-lg">
      <table className="w-full text-sm">
        <thead>
          <tr className={`bg-panel-2 text-left text-xs uppercase tracking-wider text-ink-dim ${stickyHeader ? "sticky top-14 z-10" : ""}`}>
            {columns.map((c) => (
              <th
                key={c.label}
                className={`px-3 py-2 ${c.numeric ? "text-right" : ""} ${c.hideBelow ?? ""}`}
              >
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {rows.map((row) => (
            <tr key={rowKey(row)} className="bg-pitch/35 transition-colors hover:bg-panel/80">
              {columns.map((c) => (
                <td
                  key={c.label}
                  className={`px-3 py-2 ${c.numeric ? "text-right stat-num" : ""} ${c.hideBelow ?? ""}`}
                >
                  {c.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
