import type { ImpactItem } from '@/lib/types';

interface ImpactTableProps {
  data: ImpactItem[];
}

export function ImpactTable({ data }: ImpactTableProps) {
  return (
    <div
      className="rounded-lg overflow-hidden mb-8"
      style={{
        backgroundColor: 'var(--color-bg-surface)',
        border: '1px solid var(--color-border-default)',
      }}
    >
      {data.map((item, i) => (
        <div
          key={i}
          className="flex flex-col sm:flex-row"
          style={{
            borderBottom: i < data.length - 1 ? '1px solid var(--color-border-subtle)' : undefined,
          }}
        >
          <div
            className="px-4 py-3 sm:w-56 shrink-0"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)' }}
          >
            <span
              className="text-xs uppercase"
              style={{
                color: 'var(--color-text-tertiary)',
                fontFamily: 'var(--font-jetbrains), monospace',
                letterSpacing: 'var(--tracking-wide)',
              }}
            >
              {item.category}
            </span>
          </div>
          <div className="px-4 py-3">
            <span
              className="text-sm font-medium"
              style={{
                color: 'var(--color-text-primary)',
                fontFamily: 'var(--font-jetbrains), monospace',
              }}
            >
              {item.value}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
