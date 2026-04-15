import { CopyButton } from '@/components/ui/CopyButton';

interface CodeComparisonProps {
  language: string;
  vulnerable: string;
  secure: string;
  vulnerabilityId?: string;
}

export function CodeComparison({
  language,
  vulnerable,
  secure,
  vulnerabilityId,
}: CodeComparisonProps) {
  return (
    <div className="mb-8 grid md:grid-cols-2 gap-4">
      {/* Vulnerable */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span
            className="text-xs font-semibold uppercase px-2 py-0.5 rounded"
            style={{
              color: 'var(--color-severity-critical)',
              backgroundColor: 'rgba(255, 59, 92, 0.15)',
              fontFamily: 'var(--font-jetbrains), monospace',
              letterSpacing: 'var(--tracking-wide)',
            }}
          >
            Vulnerable
          </span>
          {vulnerabilityId && (
            <span
              className="text-xs"
              style={{
                color: 'var(--color-text-tertiary)',
                fontFamily: 'var(--font-jetbrains), monospace',
              }}
            >
              {vulnerabilityId}
            </span>
          )}
        </div>
        <div
          className="rounded-lg overflow-hidden"
          style={{
            borderLeft: '3px solid var(--color-severity-critical)',
            backgroundColor: 'var(--color-bg-surface)',
            border: '1px solid var(--color-border-default)',
            borderLeftColor: 'var(--color-severity-critical)',
            borderLeftWidth: '3px',
          }}
        >
          <div className="flex items-center justify-between px-4 py-2" style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
            <span className="text-xs" style={{ color: 'var(--color-text-tertiary)', fontFamily: 'var(--font-jetbrains), monospace' }}>
              {language}
            </span>
            <CopyButton text={vulnerable} />
          </div>
          <pre className="p-4 text-sm overflow-x-auto" style={{ margin: 0, border: 'none', background: 'transparent' }}>
            <code style={{ fontFamily: 'var(--font-jetbrains), monospace', color: 'var(--color-text-primary)' }}>
              {vulnerable}
            </code>
          </pre>
        </div>
      </div>

      {/* Secure */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span
            className="text-xs font-semibold uppercase px-2 py-0.5 rounded"
            style={{
              color: 'var(--color-accent-primary)',
              backgroundColor: 'var(--color-accent-muted)',
              fontFamily: 'var(--font-jetbrains), monospace',
              letterSpacing: 'var(--tracking-wide)',
            }}
          >
            Secure
          </span>
        </div>
        <div
          className="rounded-lg overflow-hidden"
          style={{
            backgroundColor: 'var(--color-bg-surface)',
            border: '1px solid var(--color-border-default)',
            borderLeftColor: 'var(--color-accent-primary)',
            borderLeftWidth: '3px',
          }}
        >
          <div className="flex items-center justify-between px-4 py-2" style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
            <span className="text-xs" style={{ color: 'var(--color-text-tertiary)', fontFamily: 'var(--font-jetbrains), monospace' }}>
              {language}
            </span>
            <CopyButton text={secure} />
          </div>
          <pre className="p-4 text-sm overflow-x-auto" style={{ margin: 0, border: 'none', background: 'transparent' }}>
            <code style={{ fontFamily: 'var(--font-jetbrains), monospace', color: 'var(--color-text-primary)' }}>
              {secure}
            </code>
          </pre>
        </div>
      </div>
    </div>
  );
}
