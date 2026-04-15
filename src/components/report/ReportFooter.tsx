import Link from 'next/link';
import { DISCLAIMER } from '@/lib/constants';

interface HashEntry {
  sha256: string;
  signed: boolean;
  date: string;
}

interface ReportFooterProps {
  reportId: string;
  confidence: 'high' | 'moderate' | 'low';
  hashEntry?: HashEntry;
}

const confidenceLabels: Record<string, { label: string; color: string }> = {
  high: { label: 'High', color: 'var(--color-accent-primary)' },
  moderate: { label: 'Moderate', color: 'var(--color-severity-medium)' },
  low: { label: 'Low', color: 'var(--color-severity-high)' },
};

export function ReportFooter({ reportId, confidence, hashEntry }: ReportFooterProps) {
  const conf = confidenceLabels[confidence] || confidenceLabels.moderate;

  return (
    <div
      className="mt-12 pt-8 border-t report-footer-print"
      style={{ borderColor: 'var(--color-border-default)' }}
    >
      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <div>
          <span
            className="text-xs uppercase block mb-1"
            style={{
              color: 'var(--color-text-tertiary)',
              fontFamily: 'var(--font-jetbrains), monospace',
              letterSpacing: 'var(--tracking-wide)',
            }}
          >
            Report ID
          </span>
          <span
            className="text-sm"
            style={{
              color: 'var(--color-text-secondary)',
              fontFamily: 'var(--font-jetbrains), monospace',
            }}
          >
            {reportId}
          </span>
        </div>
        <div>
          <span
            className="text-xs uppercase block mb-1"
            style={{
              color: 'var(--color-text-tertiary)',
              fontFamily: 'var(--font-jetbrains), monospace',
              letterSpacing: 'var(--tracking-wide)',
            }}
          >
            Confidence
          </span>
          <span
            className="text-sm"
            style={{
              color: conf.color,
              fontFamily: 'var(--font-jetbrains), monospace',
            }}
          >
            {conf.label}
          </span>
        </div>
        {hashEntry && (
          <div>
            <span
              className="text-xs uppercase block mb-1"
              style={{
                color: 'var(--color-text-tertiary)',
                fontFamily: 'var(--font-jetbrains), monospace',
                letterSpacing: 'var(--tracking-wide)',
              }}
            >
              Content Hash {hashEntry.signed && '(signed)'}
            </span>
            <span
              className="text-sm break-all"
              style={{
                color: 'var(--color-text-secondary)',
                fontFamily: 'var(--font-jetbrains), monospace',
              }}
            >
              sha256:{hashEntry.sha256}
            </span>
            <Link
              href="/verify"
              className="verify-link text-xs block mt-1.5"
              style={{ fontFamily: 'var(--font-jetbrains), monospace' }}
            >
              How to verify this report &rarr;
            </Link>
          </div>
        )}
      </div>

      <div
        className="pt-6 border-t"
        style={{ borderColor: 'var(--color-border-subtle)' }}
      >
        <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-tertiary)' }}>
          {DISCLAIMER}
        </p>
      </div>
    </div>
  );
}
