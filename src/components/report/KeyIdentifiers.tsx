import { CopyButton } from '@/components/ui/CopyButton';
import { ExternalLink } from '@/components/ui/ExternalLink';
import type { KeyIdentifier } from '@/lib/types';

interface KeyIdentifiersProps {
  data: KeyIdentifier[];
}

export function KeyIdentifiers({ data }: KeyIdentifiersProps) {
  return (
    <div
      className="data-panel rounded-lg overflow-hidden mb-8"
      style={{
        backgroundColor: 'var(--color-bg-surface)',
        border: '1px solid var(--color-border-default)',
      }}
    >
      {data.map((item, i) => (
        <div
          key={i}
          className="flex flex-col sm:flex-row sm:items-center"
          style={{
            borderBottom: i < data.length - 1 ? '1px solid var(--color-border-subtle)' : undefined,
          }}
        >
          <div
            className="px-4 py-3 sm:w-56 shrink-0"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.02)',
            }}
          >
            <span
              className="text-xs uppercase"
              style={{
                color: 'var(--color-text-tertiary)',
                fontFamily: 'var(--font-jetbrains), monospace',
                letterSpacing: 'var(--tracking-wide)',
              }}
            >
              {item.label}
            </span>
          </div>
          <div className="px-4 py-3 flex items-center gap-2 min-w-0">
            {item.link ? (
              <ExternalLink href={item.link}>
                <span
                  className="text-sm break-all"
                  style={{ fontFamily: 'var(--font-jetbrains), monospace' }}
                >
                  {item.value}
                </span>
              </ExternalLink>
            ) : (
              <span
                className="text-sm break-all"
                style={{
                  color: 'var(--color-text-primary)',
                  fontFamily: 'var(--font-jetbrains), monospace',
                }}
              >
                {item.value}
              </span>
            )}
            {item.copyable && <CopyButton text={item.value} />}
          </div>
        </div>
      ))}
    </div>
  );
}
