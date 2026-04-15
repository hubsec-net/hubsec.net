interface Column {
  header: string;
  accessor: string;
  mono?: boolean;
}

interface DataTableProps {
  columns: Column[];
  data: Record<string, string>[];
  className?: string;
}

export function DataTable({ columns, data, className = '' }: DataTableProps) {
  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--color-border-strong)' }}>
            {columns.map((col) => (
              <th
                key={col.accessor}
                className="text-left py-3 px-4 text-xs font-semibold uppercase"
                style={{
                  color: 'var(--color-text-tertiary)',
                  fontFamily: 'var(--font-jetbrains), monospace',
                  letterSpacing: 'var(--tracking-wide)',
                }}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr
              key={i}
              style={{
                borderBottom: '1px solid var(--color-border-subtle)',
              }}
            >
              {columns.map((col) => (
                <td
                  key={col.accessor}
                  className="py-3 px-4"
                  style={{
                    color: 'var(--color-text-primary)',
                    fontFamily: col.mono ? 'var(--font-jetbrains), monospace' : 'inherit',
                    fontSize: col.mono ? 'var(--font-size-sm)' : 'inherit',
                  }}
                >
                  {row[col.accessor]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
