import Link from 'next/link';
import type { Metadata } from 'next';
import { getReports } from '@/lib/mdx';
import { formatDate } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';

export const metadata: Metadata = {
  title: 'Research',
  description: 'On-chain forensic case studies and vulnerability analysis produced with HubSec tooling.',
};

export default async function ResearchPage() {
  const reports = await getReports();

  return (
    <section className="py-12">
      <div className="mx-auto max-w-3xl px-4 md:px-6">
        <h1
          className="text-3xl font-bold mb-2"
          style={{
            fontFamily: 'var(--font-jetbrains), monospace',
            color: 'var(--color-text-primary)',
          }}
        >
          Research
        </h1>
        <p
          className="text-sm mb-12"
          style={{ color: 'var(--color-text-tertiary)' }}
        >
          On-chain forensic case studies and vulnerability analysis.
        </p>

        {/* Standard */}
        <div className="mb-12">
          <h2
            className="text-lg font-semibold mb-4"
            style={{
              fontFamily: 'var(--font-jetbrains), monospace',
              color: 'var(--color-text-primary)',
            }}
          >
            Our Standard
          </h2>
          <div className="space-y-4">
            <p
              style={{
                color: 'var(--color-text-secondary)',
                lineHeight: 'var(--leading-relaxed)',
              }}
            >
              Every investigation published here is the product of
              HubSec&apos;s own forensic tools &mdash; not a synthesis of
              external sources, not a recap of public reporting. If we
              didn&apos;t trace it on-chain ourselves, we don&apos;t publish
              it.
            </p>
            <p
              style={{
                color: 'var(--color-text-secondary)',
                lineHeight: 'var(--leading-relaxed)',
              }}
            >
              This means fewer publications, but every one carries direct
              evidentiary weight: transaction-level tracing, fund flow
              reconstruction, and cluster attribution derived from our own
              analysis. Quality over volume.
            </p>
          </div>
        </div>

        {/* Published reports */}
        {reports.length > 0 && (
          <div className="mb-12">
            <h2
              className="text-lg font-semibold mb-4"
              style={{
                fontFamily: 'var(--font-jetbrains), monospace',
                color: 'var(--color-text-primary)',
              }}
            >
              Published
            </h2>
            <ul className="space-y-4">
              {reports.map((report) => (
                <li
                  key={report.slug}
                  className="rounded-lg p-5"
                  style={{
                    backgroundColor: 'var(--color-bg-surface)',
                    border: '1px solid var(--color-border-default)',
                  }}
                >
                  <Link
                    href={`/research/${report.slug}`}
                    className="block"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <Badge level={report.classification} />
                      <span
                        className="text-xs uppercase"
                        style={{
                          color: 'var(--color-text-tertiary)',
                          fontFamily: 'var(--font-jetbrains), monospace',
                          letterSpacing: 'var(--tracking-wide)',
                        }}
                      >
                        {report.categoryLabel}
                      </span>
                      <span
                        className="text-xs ml-auto"
                        style={{
                          color: 'var(--color-text-tertiary)',
                          fontFamily: 'var(--font-jetbrains), monospace',
                        }}
                      >
                        {formatDate(report.date)}
                      </span>
                    </div>
                    <h3
                      className="text-base font-semibold mb-2"
                      style={{
                        fontFamily: 'var(--font-jetbrains), monospace',
                        color: 'var(--color-text-primary)',
                        lineHeight: 'var(--leading-tight)',
                      }}
                    >
                      {report.title}
                    </h3>
                    <p
                      className="text-sm"
                      style={{
                        color: 'var(--color-text-secondary)',
                        lineHeight: 'var(--leading-relaxed)',
                      }}
                    >
                      {report.summary}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Verification link */}
        <div className="mt-12 pt-8" style={{ borderTop: '1px solid var(--color-border-subtle)' }}>
          <p className="text-sm" style={{ color: 'var(--color-text-tertiary)', lineHeight: 'var(--leading-relaxed)' }}>
            Each report includes a SHA-256 content hash and a detached PGP
            signature for independent verification.{' '}
            <Link
              href="/verify"
              style={{ color: 'var(--color-accent-primary)', fontFamily: 'var(--font-jetbrains), monospace' }}
            >
              Learn how verification works &rarr;
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
