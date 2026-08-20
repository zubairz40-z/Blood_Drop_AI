function Table({
  columns = [],
  data = [],
  rowKey = 'id',
  emptyMessage = 'No data available',
  className = '',
}) {
  return (
    <div className={`overflow-x-auto rounded-2xl border border-border ${className}`}>
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-neutral-50 border-b border-border">
            {columns.map((col) => (
              <th
                key={col.key}
                className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider whitespace-nowrap"
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border bg-white">
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-10 text-center text-text-muted"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, idx) => (
              <tr
                key={row[rowKey] || idx}
                className="hover:bg-neutral-50/50 transition-colors"
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className="px-4 py-3 text-text-charcoal whitespace-nowrap"
                  >
                    {col.render
                      ? col.render(row[col.key], row)
                      : row[col.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

export default Table
