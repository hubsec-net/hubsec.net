import Link from 'next/link';
import type { Metadata } from 'next';
import { getReports } from '@/lib/mdx';
import { formatDate } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { ResearchFilters } from './filters';

export const metadata: Metadata = {
  title: 'Research',
  description: 'Case studies, post-mortems, and vulnerability analysis produced with HubSec tooling.',
};

export default async function ResearchPage() {
  const reports = await getReports();

  return (
    <section className="py-12">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <h1
          className="text-3xl font-bold mb-2"
          style={{
            fontFamily: 'var(--font-jetbrains), monospace',
            color: 'var(--color-text-primary)',
          }}
        >
          Research
        </h1>
        <p className="text-sm mb-10" style={{ color: 'var(--color-text-tertiary)' }}>
          Case studies and vulnerability analysis produced with HubSec tooling.
        </p>

        <ResearchFilters />

        <div className="flex flex-col gap-6 mt-8">
          {reports.map((report) => (
            <Link
              key={report.slug}
              href={`/research/${report.slug}`}
              className="block rounded-lg p-6 transition-colors duration-150"
              style={{
                backgroundColor: 'var(--color-bg-secondary)',
                border: '1px solid var(--color-border-default)',
              }}
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                <span
                  className="text-xs"
                  style={{
                    color: 'var(--color-text-tertiary)',
                    fontFamily: 'var(--font-jetbrains), monospace',
                  }}
                >
                  {formatDate(report.date)}
                </span>
                <Badge level={report.classification} />
              </div>
              <h2
                className="text-lg font-semibold mb-1"
                style={{
                  fontFamily: 'var(--font-jetbrains), monospace',
                  color: 'var(--color-text-primary)',
                }}
              >
                {report.title}
              </h2>
              {report.subtitle && (
                <p
                  className="text-sm mb-2"
                  style={{
                    fontFamily: 'var(--font-jetbrains), monospace',
                    color: 'var(--color-text-secondary)',
                  }}
                >
                  {report.subtitle}
                </p>
              )}
              <p className="text-sm mb-4" style={{ color: 'var(--color-text-secondary)' }}>
                {report.summary}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                {report.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs px-2 py-0.5 rounded"
                    style={{
                      color: 'var(--color-text-tertiary)',
                      backgroundColor: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid var(--color-border-subtle)',
                    }}
                  >
                    {tag}
                  </span>
                ))}
                <span
                  className="text-xs ml-auto underline underline-offset-2"
                  style={{
                    color: 'var(--color-accent-primary)',
                    fontFamily: 'var(--font-jetbrains), monospace',
                    textDecorationColor: 'var(--color-accent-muted)',
                  }}
                >
                  Read analysis
                </span>
              </div>
            </Link>
          ))}

          {reports.length === 0 && (
            <p style={{ color: 'var(--color-text-tertiary)' }}>
              No research publications yet.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
