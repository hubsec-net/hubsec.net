import { Badge } from '@/components/ui/Badge';
import { formatDate } from '@/lib/utils';
import type { SeverityLevel, ReportCategory } from '@/lib/types';

interface ReportHeaderProps {
  title: string;
  date: string;
  classification: SeverityLevel;
  category: string;
  reportCategory?: ReportCategory;
  status: string;
  reportId: string;
}

const REPORT_TYPE_LABELS: Record<ReportCategory, string> = {
  'post-mortem': 'HubSec Post-Mortem Report',
  'vulnerability-research': 'HubSec Vulnerability Research',
  'advisory': 'HubSec Advisory',
  'investigation': 'HubSec Investigation Report',
};

export function ReportHeader({
  title,
  date,
  classification,
  category,
  reportCategory = 'post-mortem',
  status,
  reportId,
}: ReportHeaderProps) {
  const formattedDate = formatDate(date);
  const headerLabel = REPORT_TYPE_LABELS[reportCategory];

  return (
    <div
      className="report-header rounded-lg p-6 md:p-8 mb-10"
      style={{
        backgroundColor: 'var(--color-bg-surface)',
        border: '1px solid var(--color-border-default)',
      }}
    >
      <p
        className="text-xs font-semibold uppercase mb-4"
        style={{
          fontFamily: 'var(--font-jetbrains), monospace',
          color: 'var(--color-text-tertiary)',
          letterSpacing: 'var(--tracking-wide)',
        }}
      >
        {headerLabel}
      </p>
      <div
        className="mb-6"
        style={{ borderBottom: '1px solid var(--color-border-default)' }}
      />
      <h1
        className="text-2xl md:text-3xl font-bold mb-2"
        style={{
          fontFamily: 'var(--font-jetbrains), monospace',
          color: 'var(--color-text-primary)',
          lineHeight: 'var(--leading-tight)',
        }}
      >
        {title}
      </h1>
      <p
        className="text-sm mb-6"
        style={{
          color: 'var(--color-text-secondary)',
          fontFamily: 'var(--font-jetbrains), monospace',
        }}
      >
        {formattedDate}
      </p>
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <span
            className="text-xs uppercase"
            style={{
              color: 'var(--color-text-tertiary)',
              fontFamily: 'var(--font-jetbrains), monospace',
              letterSpacing: 'var(--tracking-wide)',
            }}
          >
            Classification:
          </span>
          <Badge level={classification} />
          <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            {category}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span
            className="text-xs uppercase"
            style={{
              color: 'var(--color-text-tertiary)',
              fontFamily: 'var(--font-jetbrains), monospace',
              letterSpacing: 'var(--tracking-wide)',
            }}
          >
            Status:
          </span>
          <span className="text-sm" style={{ color: 'var(--color-text-primary)' }}>
            {status}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span
            className="text-xs uppercase"
            style={{
              color: 'var(--color-text-tertiary)',
              fontFamily: 'var(--font-jetbrains), monospace',
              letterSpacing: 'var(--tracking-wide)',
            }}
          >
            Report ID:
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
      </div>
    </div>
  );
}
