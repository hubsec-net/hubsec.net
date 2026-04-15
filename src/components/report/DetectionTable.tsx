import type { Detection } from '@/lib/types';

interface DetectionTableProps {
  detections: Detection[];
}

export function DetectionTable({ detections }: DetectionTableProps) {
  const hasDescriptions = detections.some((d) => d.description);

  return (
    <div
      className="rounded-lg overflow-hidden mb-8 overflow-x-auto"
      style={{
        backgroundColor: 'var(--color-bg-surface)',
        border: '1px solid var(--color-border-default)',
      }}
    >
      <table className="w-full text-sm" style={{ minWidth: '500px' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--color-border-strong)' }}>
            <th
              className="text-left py-3 px-4 text-xs font-semibold uppercase"
              style={{
                color: 'var(--color-text-tertiary)',
                fontFamily: 'var(--font-jetbrains), monospace',
                letterSpacing: 'var(--tracking-wide)',
              }}
            >
              Module
            </th>
            <th
              className="text-left py-3 px-4 text-xs font-semibold uppercase"
              style={{
                color: 'var(--color-text-tertiary)',
                fontFamily: 'var(--font-jetbrains), monospace',
                letterSpacing: 'var(--tracking-wide)',
              }}
            >
              Rule
            </th>
            {hasDescriptions && (
              <th
                className="text-left py-3 px-4 text-xs font-semibold uppercase"
                style={{
                  color: 'var(--color-text-tertiary)',
                  fontFamily: 'var(--font-jetbrains), monospace',
                  letterSpacing: 'var(--tracking-wide)',
                }}
              >
                What It Catches
              </th>
            )}
            <th
              className="text-left py-3 px-4 text-xs font-semibold uppercase"
              style={{
                color: 'var(--color-text-tertiary)',
                fontFamily: 'var(--font-jetbrains), monospace',
                letterSpacing: 'var(--tracking-wide)',
              }}
            >
              Lead Time
            </th>
          </tr>
        </thead>
        <tbody>
          {detections.map((d, i) => (
            <tr
              key={i}
              style={{
                borderBottom: i < detections.length - 1 ? '1px solid var(--color-border-subtle)' : undefined,
              }}
            >
              <td
                className="py-3 px-4"
                style={{
                  color: 'var(--color-text-primary)',
                  fontFamily: 'var(--font-jetbrains), monospace',
                  fontSize: 'var(--font-size-xs)',
                }}
              >
                {d.module}
              </td>
              <td
                className="py-3 px-4"
                style={{
                  color: 'var(--color-accent-primary)',
                  fontFamily: 'var(--font-jetbrains), monospace',
                  fontSize: 'var(--font-size-xs)',
                }}
              >
                {d.rule}
              </td>
              {hasDescriptions && (
                <td
                  className="py-3 px-4"
                  style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-xs)' }}
                >
                  {d.description}
                </td>
              )}
              <td
                className="py-3 px-4 whitespace-nowrap"
                style={{
                  color: 'var(--color-text-secondary)',
                  fontFamily: 'var(--font-jetbrains), monospace',
                  fontSize: 'var(--font-size-xs)',
                }}
              >
                {d.leadTime}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
